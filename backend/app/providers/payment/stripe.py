from __future__ import annotations

from decimal import Decimal
from typing import Any, Mapping

import stripe
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.domain.payment import (
    PaymentInitializationResult,
    PaymentValidationResult,
    PaymentVerificationResult,
    PaymentWebhookResult,
)
from app.enums.payment_channel import normalize_payment_channel
from app.models.payment import Payment
from app.providers.payment.base import PaymentProvider
from app.services.setting_service import SettingService


class StripeProvider(PaymentProvider):
    SIGNATURE_HEADER = "stripe-signature"

    SUCCESS_EVENTS = {
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
    }
    TERMINAL_EVENTS = SUCCESS_EVENTS | {
        "checkout.session.async_payment_failed",
        "checkout.session.expired",
    }

    def __init__(self, db: Session) -> None:
        self.db = db
        self.secret_key = SettingService.get_string(
            db,
            SettingKeys.STRIPE_SECRET_KEY,
            "",
        ).strip()
        if not self.secret_key:
            raise HTTPException(status_code=503, detail="Stripe is not configured.")

        self.webhook_secret = SettingService.get_string(
            db,
            SettingKeys.STRIPE_WEBHOOK_SECRET,
            "",
        ).strip()

        self.success_url = SettingService.get_string(
            db,
            SettingKeys.STRIPE_SUCCESS_URL,
            "",
        ).strip()
        # Backwards compatibility with the earlier single callback setting.
        if not self.success_url:
            self.success_url = SettingService.get_string(
                db,
                SettingKeys.STRIPE_CALLBACK_URL,
                "",
            ).strip()

        self.cancel_url = SettingService.get_string(
            db,
            SettingKeys.STRIPE_CANCEL_URL,
            "",
        ).strip()

        if not self.success_url:
            raise HTTPException(
                status_code=503,
                detail="Stripe success URL is not configured.",
            )

        stripe.api_key = self.secret_key

    @staticmethod
    def _minor_units(amount: Decimal) -> int:
        # Banking is USD-first. Extend this helper if/when zero-decimal
        # currencies are enabled for Stripe deployments.
        return int((amount * Decimal("100")).to_integral_exact())

    @staticmethod
    def _serializable(obj: Any) -> dict[str, Any]:
        to_dict = getattr(obj, "to_dict", None)
        if callable(to_dict):
            try:
                value = to_dict(for_json=True)
            except TypeError:
                value = to_dict()
            if isinstance(value, dict):
                return value
        if isinstance(obj, dict):
            return obj
        return {}

    def initialize_payment(
        self,
        *,
        payment: Payment,
        email: str,
        metadata: dict[str, Any],
    ) -> PaymentInitializationResult:
        stripe_metadata = {key: str(value) for key, value in metadata.items()}
        stripe_metadata["internal_reference"] = payment.internal_reference

        params: dict[str, Any] = {
            "mode": "payment",
            "success_url": self.success_url,
            "client_reference_id": payment.internal_reference,
            "customer_email": email,
            "metadata": stripe_metadata,
            "line_items": [
                {
                    "quantity": 1,
                    "price_data": {
                        "currency": payment.currency.lower(),
                        "unit_amount": self._minor_units(payment.amount),
                        "product_data": {
                            "name": "Withdrawal processing fee",
                            "description": f"Reference {payment.internal_reference}",
                        },
                    },
                }
            ],
        }
        if self.cancel_url:
            params["cancel_url"] = self.cancel_url

        try:
            session = stripe.checkout.Session.create(**params)
        except stripe.error.StripeError as exc:
            message = getattr(exc, "user_message", None) or str(exc)
            raise HTTPException(
                status_code=502,
                detail=message or "Unable to initialize Stripe Checkout.",
            ) from exc

        session_id = str(getattr(session, "id", "") or "")
        checkout_url = str(getattr(session, "url", "") or "")
        status = str(getattr(session, "status", "") or "")
        if not session_id or not checkout_url:
            raise HTTPException(
                status_code=502,
                detail="Stripe returned an incomplete Checkout Session.",
            )

        return PaymentInitializationResult(
            authorization_url=checkout_url,
            access_code=None,
            provider_reference=session_id,
            provider_status=status or "open",
            metadata={
                "authorization_url": checkout_url,
                "checkout_session_id": session_id,
            },
        )

    def verify_payment(self, *, reference: str) -> PaymentVerificationResult:
        try:
            session = stripe.checkout.Session.retrieve(reference)
        except stripe.error.StripeError as exc:
            raise HTTPException(
                status_code=502,
                detail="Unable to verify payment with Stripe.",
            ) from exc

        provider_reference = str(getattr(session, "id", "") or "") or None
        payment_status = str(getattr(session, "payment_status", "") or "").lower()
        session_status = str(getattr(session, "status", "") or "").lower()
        currency = str(getattr(session, "currency", "") or "").upper() or None

        amount: Decimal | None = None
        raw_amount = getattr(session, "amount_total", None)
        if raw_amount is not None:
            try:
                amount = Decimal(str(raw_amount)) / Decimal("100")
            except (TypeError, ValueError, ArithmeticError):
                pass

        raw_data = self._serializable(session)
        provider_channel = None
        payment_method_types = raw_data.get("payment_method_types") if isinstance(raw_data, dict) else None
        if isinstance(payment_method_types, list) and payment_method_types:
            provider_channel = str(payment_method_types[0])

        return PaymentVerificationResult(
            verified=bool(provider_reference),
            provider_reference=provider_reference,
            provider_status=payment_status or session_status or None,
            amount=amount,
            currency=currency,
            paid=payment_status == "paid",
            failed=session_status == "expired",
            channel=normalize_payment_channel(provider_channel),
            provider_channel=provider_channel,
            raw_data=raw_data,
        )

    def validate_webhook(
        self,
        *,
        headers: Mapping[str, str],
        body: bytes,
    ) -> PaymentValidationResult:
        if not self.webhook_secret:
            raise HTTPException(
                status_code=503,
                detail="Stripe webhook secret is not configured.",
            )

        signature = headers.get(self.SIGNATURE_HEADER)
        if not signature:
            return PaymentValidationResult(valid=False)

        try:
            stripe.Webhook.construct_event(
                payload=body.decode("utf-8"),
                sig_header=signature,
                secret=self.webhook_secret,
            )
        except (ValueError, stripe.error.SignatureVerificationError):
            return PaymentValidationResult(valid=False)

        return PaymentValidationResult(valid=True)

    def parse_webhook(self, *, payload: dict[str, Any]) -> PaymentWebhookResult:
        event_type = str(payload.get("type", ""))
        if event_type not in self.TERMINAL_EVENTS:
            return PaymentWebhookResult(valid=False, event=event_type or None)

        data = payload.get("data")
        if not isinstance(data, dict):
            return PaymentWebhookResult(valid=False, event=event_type)

        obj = data.get("object")
        if not isinstance(obj, dict):
            return PaymentWebhookResult(valid=False, event=event_type)

        session_id = str(obj.get("id", ""))
        if not session_id:
            return PaymentWebhookResult(valid=False, event=event_type)

        return PaymentWebhookResult(
            valid=True,
            event=event_type,
            provider_reference=session_id,
        )
