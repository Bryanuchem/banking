from __future__ import annotations

import hashlib
import hmac
import json
from decimal import Decimal
from typing import Any, Mapping
from urllib.parse import urlparse

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


class CashAppProvider(PaymentProvider):
    """Cash App Pay provider using Pay Kit + Network API.

    Initialization returns the public Pay Kit data needed by the frontend.
    After the customer approves the request, the frontend sends the resulting
    grant_id back to Banking. The backend then creates and immediately captures
    the Network API payment using the private API credentials.
    """

    SANDBOX_BASE_URL = "https://sandbox.api.cash.app"
    LIVE_BASE_URL = "https://api.cash.app"
    SANDBOX_PAYKIT_URL = "https://sandbox.kit.cash.app/v1/pay.js"
    LIVE_PAYKIT_URL = "https://kit.cash.app/v1/pay.js"

    def __init__(self, db: Session) -> None:
        self.db = db
        self.environment = SettingService.get_string(
            db, SettingKeys.CASHAPP_ENVIRONMENT, "sandbox"
        ).strip().lower()
        if self.environment not in {"sandbox", "live"}:
            raise HTTPException(
                status_code=503,
                detail="Cash App environment must be 'sandbox' or 'live'.",
            )

        self.client_id = SettingService.get_string(
            db, SettingKeys.CASHAPP_CLIENT_ID, ""
        ).strip()
        self.api_key_id = SettingService.get_string(
            db, SettingKeys.CASHAPP_API_KEY_ID, ""
        ).strip()
        self.api_secret = SettingService.get_string(
            db, SettingKeys.CASHAPP_API_SECRET, ""
        ).strip()
        self.merchant_id = SettingService.get_string(
            db, SettingKeys.CASHAPP_MERCHANT_ID, ""
        ).strip()
        self.region = SettingService.get_string(
            db, SettingKeys.CASHAPP_REGION, "PDX"
        ).strip() or "PDX"
        self.redirect_url = SettingService.get_string(
            db, SettingKeys.CASHAPP_REDIRECT_URL, ""
        ).strip()

        if not self.client_id or not self.merchant_id:
            raise HTTPException(status_code=503, detail="Cash App Pay is not configured.")

        self.base_url = (
            self.SANDBOX_BASE_URL
            if self.environment == "sandbox"
            else self.LIVE_BASE_URL
        )
        self.paykit_url = (
            self.SANDBOX_PAYKIT_URL
            if self.environment == "sandbox"
            else self.LIVE_PAYKIT_URL
        )

    @staticmethod
    def _minor_units(amount: Decimal) -> int:
        return int((amount * Decimal("100")).quantize(Decimal("1")))

    @staticmethod
    def _major_units(amount: int | str | None) -> Decimal | None:
        if amount is None:
            return None
        try:
            return (Decimal(str(amount)) / Decimal("100")).quantize(Decimal("0.01"))
        except Exception:
            return None

    def _network_credentials_ready(self) -> None:
        if not self.api_key_id or not self.api_secret:
            raise HTTPException(
                status_code=503,
                detail="Cash App Network API credentials are not configured.",
            )

    def _authorization(self) -> str:
        return f"Client {self.client_id} {self.api_key_id}"

    def _signature(
        self,
        *,
        method: str,
        path: str,
        host: str,
        body: bytes,
        accept: str,
        authorization: str,
        content_type: str,
    ) -> str:
        if self.environment == "sandbox":
            return "sandbox:skip-signature-check"

        self._network_credentials_ready()
        canonical_headers = "\n".join(
            [
                f"accept:{accept.strip()}",
                f"authorization:{authorization.strip()}",
                f"content-type:{content_type.strip()}",
                f"host:{host.strip()}",
            ]
        )
        digest = hashlib.sha256(body).hexdigest().lower()
        canonical = f"{method.upper()}\n{path}\n{canonical_headers}\n{digest}"
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            canonical.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest().lower()
        return f"V1 {signature}"

    def _request_json(
        self,
        method: str,
        path: str,
        *,
        payload: dict[str, Any] | None = None,
        action: str,
    ) -> dict[str, Any]:
        self._network_credentials_ready()
        body = (
            json.dumps(payload, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
            if payload is not None
            else b""
        )
        parsed = urlparse(self.base_url)
        host = parsed.netloc
        accept = "application/json"
        content_type = "application/json"
        authorization = self._authorization()
        signature = self._signature(
            method=method,
            path=path,
            host=host,
            body=body,
            accept=accept,
            authorization=authorization,
            content_type=content_type,
        )
        headers = {
            "Accept": accept,
            "Authorization": authorization,
            "Content-Type": content_type,
            "Host": host,
            "X-Region": self.region,
            "X-Signature": signature,
        }
        try:
            response = httpx.request(
                method,
                f"{self.base_url}{path}",
                headers=headers,
                content=body if payload is not None else None,
                timeout=25.0,
            )
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Unable to {action} with Cash App Pay.",
            ) from exc

        if response.status_code >= 400:
            try:
                error_payload = response.json()
                message = str(error_payload.get("message", "")).strip()
            except Exception:
                message = ""
            raise HTTPException(
                status_code=502,
                detail=message or f"Cash App Pay could not {action}.",
            )
        try:
            data = response.json()
        except ValueError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Cash App Pay returned an invalid response while trying to {action}.",
            ) from exc
        if not isinstance(data, dict):
            raise HTTPException(status_code=502, detail="Invalid Cash App Pay response.")
        return data

    def initialize_payment(
        self,
        *,
        payment: Payment,
        email: str,
        metadata: dict[str, Any],
    ) -> PaymentInitializationResult:
        if payment.currency.upper() != "USD":
            raise HTTPException(
                status_code=409,
                detail="Cash App Pay currently requires USD for this integration.",
            )
        if not self.redirect_url:
            raise HTTPException(
                status_code=503,
                detail="Cash App Pay redirect URL is not configured.",
            )

        checkout = {
            "flow": "paykit",
            "paykit_script_url": self.paykit_url,
            "client_id": self.client_id,
            "merchant_id": self.merchant_id,
            "redirect_url": self.redirect_url,
            "reference_id": payment.internal_reference,
            "amount": {
                "currency": "USD",
                "value": self._minor_units(payment.amount),
            },
        }
        return PaymentInitializationResult(
            provider_reference=payment.internal_reference,
            provider_status="awaiting_customer_approval",
            channel=PaymentChannel.CASH_APP,
            provider_channel="cash_app_pay",
            metadata=checkout,
        )

    def complete_customer_approval(
        self,
        *,
        payment: Payment,
        approval_data: dict[str, Any],
    ) -> PaymentVerificationResult:
        grant_id = str(approval_data.get("grant_id", "")).strip()
        if not grant_id:
            raise HTTPException(status_code=422, detail="Cash App grant_id is required.")
        if payment.currency.upper() != "USD":
            raise HTTPException(status_code=409, detail="Cash App Pay requires USD.")

        payload = {
            "idempotency_key": payment.internal_reference,
            "payment": {
                "amount": self._minor_units(payment.amount),
                "currency": "USD",
                "merchant_id": self.merchant_id,
                "grant_id": grant_id,
                "reference_id": payment.internal_reference,
                "capture": True,
                "metadata": {
                    "banking_payment_id": str(payment.id),
                    "purpose": "withdrawal_processing_fee",
                },
            },
        }
        data = self._request_json(
            "POST",
            "/network/v1/payments",
            payload=payload,
            action="create the payment",
        )
        return self._verification_from_payload(data)

    def verify_payment(self, *, reference: str) -> PaymentVerificationResult:
        # Once the Pay Kit grant has been exchanged, provider_reference is the
        # Cash App payment id (PWC_*). Before then there is nothing server-side
        # to retrieve from the Network API.
        if not reference.startswith("PWC_"):
            return PaymentVerificationResult(
                verified=True,
                provider_reference=reference,
                provider_status="awaiting_customer_approval",
                paid=False,
                failed=False,
                raw_data={},
            )
        data = self._request_json(
            "GET",
            f"/network/v1/payments/{reference}",
            action="verify the payment",
        )
        return self._verification_from_payload(data)

    def _verification_from_payload(self, payload: dict[str, Any]) -> PaymentVerificationResult:
        payment = payload.get("payment")
        if not isinstance(payment, dict):
            return PaymentVerificationResult(verified=False, raw_data=payload)
        status = str(payment.get("status", "")).upper()
        reference = str(payment.get("id", "")).strip() or None
        return PaymentVerificationResult(
            verified=bool(reference),
            provider_reference=reference,
            provider_status=status or None,
            amount=self._major_units(payment.get("amount")),
            currency=str(payment.get("currency", "")).upper() or None,
            paid=status == "CAPTURED",
            failed=status in {"DECLINED", "VOIDED", "FAILED"},
            channel=PaymentChannel.CASH_APP,
            provider_channel="cash_app_pay",
            raw_data=payload,
        )

    def validate_webhook(
        self,
        *,
        headers: Mapping[str, str],
        body: bytes,
    ) -> PaymentValidationResult:
        signature_header = str(headers.get("x-signature", "")).strip()
        if not signature_header:
            return PaymentValidationResult(valid=False)

        if self.environment == "sandbox" and signature_header == "sandbox:skip-signature-check":
            return PaymentValidationResult(valid=True)

        self._network_credentials_ready()
        if not signature_header.startswith("V1 "):
            return PaymentValidationResult(valid=False)

        host = str(headers.get("host", "")).strip()
        accept = str(headers.get("accept", "*/*")).strip()
        authorization = str(headers.get("authorization", self._authorization())).strip()
        content_type = str(headers.get("content-type", "application/json; charset=utf-8")).strip()
        # Banking's route is fixed and provider-neutral.
        path = "/api/v1/payments/cashapp/webhook"
        expected = self._signature(
            method="POST",
            path=path,
            host=host,
            body=body,
            accept=accept,
            authorization=authorization,
            content_type=content_type,
        )
        return PaymentValidationResult(valid=hmac.compare_digest(expected, signature_header))

    def parse_webhook(self, *, payload: dict[str, Any]) -> PaymentWebhookResult:
        event = str(payload.get("type", "")).strip()
        if event != "payment.status.updated":
            return PaymentWebhookResult(valid=False, event=event or None)

        data = payload.get("data")
        if not isinstance(data, dict):
            return PaymentWebhookResult(valid=False, event=event)
        obj = data.get("object")
        payment = obj.get("payment") if isinstance(obj, dict) else None
        if not isinstance(payment, dict):
            return PaymentWebhookResult(valid=False, event=event)
        reference = str(payment.get("id", "")).strip()
        return PaymentWebhookResult(
            valid=bool(reference),
            event=event,
            provider_reference=reference or None,
        )
