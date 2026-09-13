from __future__ import annotations

import json
from decimal import Decimal
from typing import Any, Mapping

import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.domain.payment import (
    PaymentInitializationResult,
    PaymentValidationResult,
    PaymentVerificationResult,
    PaymentWebhookResult,
)
from app.enums.payment_channel import PaymentChannel
from app.models.payment import Payment
from app.providers.payment.base import PaymentProvider
from app.services.setting_service import SettingService


class PayPalProvider(PaymentProvider):
    """PayPal Orders v2 provider.

    The banking domain only sees normalized payment results. PayPal-specific
    OAuth, Orders v2 create/capture/show calls, HATEOAS links, and webhook
    verification stay inside this provider.
    """

    SANDBOX_BASE_URL = "https://api-m.sandbox.paypal.com"
    LIVE_BASE_URL = "https://api-m.paypal.com"

    APPROVAL_EVENTS = {
        "CHECKOUT.ORDER.APPROVED",
    }
    CAPTURE_EVENTS = {
        "PAYMENT.CAPTURE.PENDING",
        "PAYMENT.CAPTURE.COMPLETED",
        "PAYMENT.CAPTURE.DENIED",
    }
    FAILURE_EVENTS = {
        "CHECKOUT.ORDER.DECLINED",
        "CHECKOUT.PAYMENT-APPROVAL.REVERSED",
        "PAYMENT.CAPTURE.DENIED",
    }
    RELEVANT_EVENTS = APPROVAL_EVENTS | CAPTURE_EVENTS | FAILURE_EVENTS

    def __init__(self, db: Session) -> None:
        self.db = db
        self.client_id = SettingService.get_string(
            db,
            SettingKeys.PAYPAL_CLIENT_ID,
            "",
        ).strip()
        self.client_secret = SettingService.get_string(
            db,
            SettingKeys.PAYPAL_CLIENT_SECRET,
            "",
        ).strip()
        if not self.client_id or not self.client_secret:
            raise HTTPException(status_code=503, detail="PayPal is not configured.")

        self.webhook_id = SettingService.get_string(
            db,
            SettingKeys.PAYPAL_WEBHOOK_ID,
            "",
        ).strip()
        self.return_url = SettingService.get_string(
            db,
            SettingKeys.PAYPAL_RETURN_URL,
            "",
        ).strip()
        self.cancel_url = SettingService.get_string(
            db,
            SettingKeys.PAYPAL_CANCEL_URL,
            "",
        ).strip()
        environment = SettingService.get_string(
            db,
            SettingKeys.PAYPAL_ENVIRONMENT,
            "sandbox",
        ).strip().lower()
        if environment not in {"sandbox", "live"}:
            raise HTTPException(
                status_code=503,
                detail="PayPal environment must be 'sandbox' or 'live'.",
            )
        self.environment = environment
        self.base_url = (
            self.SANDBOX_BASE_URL if environment == "sandbox" else self.LIVE_BASE_URL
        )
        self._access_token: str | None = None

    @staticmethod
    def _money_value(amount: Decimal) -> str:
        return f"{amount.quantize(Decimal('0.01')):.2f}"

    @staticmethod
    def _approval_url(payload: dict[str, Any]) -> str | None:
        links = payload.get("links")
        if not isinstance(links, list):
            return None

        # Current Orders v2 responses commonly use payer-action. Older
        # integrations can return approve, so accept both.
        for wanted_rel in ("payer-action", "approve"):
            for item in links:
                if not isinstance(item, dict):
                    continue
                if str(item.get("rel", "")).lower() == wanted_rel:
                    href = str(item.get("href", "")).strip()
                    if href:
                        return href
        return None

    @staticmethod
    def _paypal_error(response: httpx.Response, fallback: str) -> str:
        try:
            payload = response.json()
        except ValueError:
            return fallback
        if not isinstance(payload, dict):
            return fallback

        message = str(payload.get("message", "")).strip()
        details = payload.get("details")
        if isinstance(details, list):
            descriptions = [
                str(item.get("description", "")).strip()
                for item in details
                if isinstance(item, dict) and item.get("description")
            ]
            if descriptions:
                return descriptions[0]
        return message or fallback

    def _get_access_token(self) -> str:
        if self._access_token:
            return self._access_token

        try:
            response = httpx.post(
                f"{self.base_url}/v1/oauth2/token",
                auth=(self.client_id, self.client_secret),
                data={"grant_type": "client_credentials"},
                headers={
                    "Accept": "application/json",
                    "Accept-Language": "en_US",
                },
                timeout=20.0,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502,
                detail="Unable to authenticate with PayPal.",
            ) from exc

        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=self._paypal_error(response, "PayPal authentication failed."),
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise HTTPException(
                status_code=502,
                detail="PayPal returned an invalid authentication response.",
            ) from exc

        token = str(payload.get("access_token", "")).strip() if isinstance(payload, dict) else ""
        if not token:
            raise HTTPException(
                status_code=502,
                detail="PayPal did not return an access token.",
            )

        self._access_token = token
        return token

    def _headers(self, *, request_id: str | None = None) -> dict[str, str]:
        headers = {
            "Authorization": f"Bearer {self._get_access_token()}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Prefer": "return=representation",
        }
        if request_id:
            headers["PayPal-Request-Id"] = request_id
        return headers

    def _request_json(
        self,
        method: str,
        path: str,
        *,
        json_body: dict[str, Any] | None = None,
        request_id: str | None = None,
        action: str,
    ) -> dict[str, Any]:
        try:
            response = httpx.request(
                method,
                f"{self.base_url}{path}",
                headers=self._headers(request_id=request_id),
                json=json_body,
                timeout=25.0,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Unable to {action} with PayPal.",
            ) from exc

        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=self._paypal_error(response, f"PayPal could not {action}."),
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"PayPal returned an invalid response while trying to {action}.",
            ) from exc

        if not isinstance(payload, dict):
            raise HTTPException(
                status_code=502,
                detail=f"PayPal returned an invalid response while trying to {action}.",
            )
        return payload

    def initialize_payment(
        self,
        *,
        payment: Payment,
        email: str,
        metadata: dict[str, Any],
    ) -> PaymentInitializationResult:
        if not self.return_url or not self.cancel_url:
            raise HTTPException(
                status_code=503,
                detail="PayPal return and cancel URLs are not configured.",
            )

        currency = payment.currency.upper()
        value = self._money_value(payment.amount)

        payload: dict[str, Any] = {
            "intent": "CAPTURE",
            "payment_source": {
                "paypal": {
                    "experience_context": {
                        "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
                        "shipping_preference": "NO_SHIPPING",
                        "user_action": "PAY_NOW",
                        "return_url": self.return_url,
                        "cancel_url": self.cancel_url,
                    }
                }
            },
            "purchase_units": [
                {
                    "reference_id": payment.internal_reference,
                    "custom_id": payment.internal_reference,
                    "invoice_id": payment.internal_reference,
                    "description": "Withdrawal processing fee",
                    "amount": {
                        "currency_code": currency,
                        "value": value,
                    },
                }
            ],
        }

        order = self._request_json(
            "POST",
            "/v2/checkout/orders",
            json_body=payload,
            request_id=payment.internal_reference,
            action="create a PayPal order",
        )

        order_id = str(order.get("id", "")).strip()
        authorization_url = self._approval_url(order)
        status = str(order.get("status", "")).strip().upper()
        if not order_id or not authorization_url:
            raise HTTPException(
                status_code=502,
                detail="PayPal returned an incomplete order response.",
            )

        return PaymentInitializationResult(
            authorization_url=authorization_url,
            access_code=None,
            provider_reference=order_id,
            provider_status=status or "CREATED",
            channel=PaymentChannel.PAYPAL,
            provider_channel="paypal",
            metadata={
                "authorization_url": authorization_url,
                "paypal_order_id": order_id,
                "environment": self.environment,
                "customer_email": email,
                "request_metadata": metadata,
            },
        )

    @staticmethod
    def _capture_rows(order: dict[str, Any]) -> list[dict[str, Any]]:
        captures: list[dict[str, Any]] = []
        purchase_units = order.get("purchase_units")
        if not isinstance(purchase_units, list):
            return captures
        for unit in purchase_units:
            if not isinstance(unit, dict):
                continue
            payments = unit.get("payments")
            if not isinstance(payments, dict):
                continue
            unit_captures = payments.get("captures")
            if not isinstance(unit_captures, list):
                continue
            captures.extend(item for item in unit_captures if isinstance(item, dict))
        return captures

    @staticmethod
    def _order_amount(order: dict[str, Any]) -> tuple[Decimal | None, str | None]:
        purchase_units = order.get("purchase_units")
        if not isinstance(purchase_units, list) or not purchase_units:
            return None, None
        first = purchase_units[0]
        if not isinstance(first, dict):
            return None, None
        amount_data = first.get("amount")
        if not isinstance(amount_data, dict):
            return None, None

        currency = str(amount_data.get("currency_code", "")).upper() or None
        try:
            amount = Decimal(str(amount_data.get("value")))
        except (TypeError, ValueError, ArithmeticError):
            amount = None
        return amount, currency

    def _show_order(self, reference: str) -> dict[str, Any]:
        return self._request_json(
            "GET",
            f"/v2/checkout/orders/{reference}",
            action="retrieve the PayPal order",
        )

    def _capture_order(self, reference: str) -> dict[str, Any]:
        # A deterministic request ID makes repeated capture attempts idempotent.
        capture_request_id = f"cap-{reference}"[:38]
        return self._request_json(
            "POST",
            f"/v2/checkout/orders/{reference}/capture",
            json_body={},
            request_id=capture_request_id,
            action="capture the PayPal order",
        )

    def verify_payment(self, *, reference: str) -> PaymentVerificationResult:
        order = self._show_order(reference)
        order_id = str(order.get("id", "")).strip() or None
        status = str(order.get("status", "")).strip().upper()

        # For the redirect flow and CHECKOUT.ORDER.APPROVED webhook, approval
        # means PayPal is ready for the merchant to capture. Capture here so
        # PaymentService can continue to use one provider-neutral verify call.
        if order_id and status == "APPROVED":
            order = self._capture_order(order_id)
            order_id = str(order.get("id", "")).strip() or order_id
            status = str(order.get("status", "")).strip().upper()

        amount, currency = self._order_amount(order)
        captures = self._capture_rows(order)
        capture_statuses = {
            str(item.get("status", "")).strip().upper()
            for item in captures
            if item.get("status")
        }

        paid = status == "COMPLETED" and "COMPLETED" in capture_statuses
        failed = (
            status == "VOIDED"
            or bool(capture_statuses & {"DECLINED", "DENIED", "FAILED"})
        )

        return PaymentVerificationResult(
            verified=bool(order_id),
            provider_reference=order_id,
            provider_status=status or None,
            amount=amount,
            currency=currency,
            paid=paid,
            channel=PaymentChannel.PAYPAL,
            provider_channel="paypal",
            failed=failed,
            raw_data=order,
        )

    def validate_webhook(
        self,
        *,
        headers: Mapping[str, str],
        body: bytes,
    ) -> PaymentValidationResult:
        if not self.webhook_id:
            raise HTTPException(
                status_code=503,
                detail="PayPal webhook ID is not configured.",
            )

        transmission_id = headers.get("paypal-transmission-id")
        transmission_time = headers.get("paypal-transmission-time")
        cert_url = headers.get("paypal-cert-url")
        auth_algo = headers.get("paypal-auth-algo")
        transmission_sig = headers.get("paypal-transmission-sig")

        if not all(
            [
                transmission_id,
                transmission_time,
                cert_url,
                auth_algo,
                transmission_sig,
            ]
        ):
            return PaymentValidationResult(valid=False)

        try:
            webhook_event = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return PaymentValidationResult(valid=False)
        if not isinstance(webhook_event, dict):
            return PaymentValidationResult(valid=False)

        verification_payload = {
            "transmission_id": transmission_id,
            "transmission_time": transmission_time,
            "cert_url": cert_url,
            "auth_algo": auth_algo,
            "transmission_sig": transmission_sig,
            "webhook_id": self.webhook_id,
            "webhook_event": webhook_event,
        }

        try:
            response = httpx.post(
                f"{self.base_url}/v1/notifications/verify-webhook-signature",
                headers=self._headers(),
                json=verification_payload,
                timeout=20.0,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502,
                detail="Unable to verify the PayPal webhook.",
            ) from exc

        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=self._paypal_error(response, "PayPal webhook verification failed."),
            )

        try:
            result = response.json()
        except ValueError as exc:
            raise HTTPException(
                status_code=502,
                detail="PayPal returned an invalid webhook verification response.",
            ) from exc

        return PaymentValidationResult(
            valid=(
                isinstance(result, dict)
                and str(result.get("verification_status", "")).upper() == "SUCCESS"
            )
        )

    @staticmethod
    def _related_order_id(resource: dict[str, Any]) -> str | None:
        supplementary_data = resource.get("supplementary_data")
        if isinstance(supplementary_data, dict):
            related_ids = supplementary_data.get("related_ids")
            if isinstance(related_ids, dict):
                order_id = str(related_ids.get("order_id", "")).strip()
                if order_id:
                    return order_id

        links = resource.get("links")
        if isinstance(links, list):
            for item in links:
                if not isinstance(item, dict):
                    continue
                if str(item.get("rel", "")).lower() not in {"up", "order"}:
                    continue
                href = str(item.get("href", "")).rstrip("/")
                if href:
                    return href.rsplit("/", 1)[-1] or None
        return None

    def parse_webhook(self, *, payload: dict[str, Any]) -> PaymentWebhookResult:
        event_type = str(payload.get("event_type", "")).strip().upper()
        if event_type not in self.RELEVANT_EVENTS:
            return PaymentWebhookResult(valid=False, event=event_type or None)

        resource = payload.get("resource")
        if not isinstance(resource, dict):
            return PaymentWebhookResult(valid=False, event=event_type)

        order_id: str | None = None
        if event_type.startswith("CHECKOUT.ORDER."):
            order_id = str(resource.get("id", "")).strip() or None
        elif event_type == "CHECKOUT.PAYMENT-APPROVAL.REVERSED":
            order_id = str(resource.get("id", "")).strip() or self._related_order_id(resource)
        elif event_type.startswith("PAYMENT.CAPTURE."):
            order_id = self._related_order_id(resource)

        if not order_id:
            return PaymentWebhookResult(valid=False, event=event_type)

        return PaymentWebhookResult(
            valid=True,
            event=event_type,
            provider_reference=order_id,
        )
