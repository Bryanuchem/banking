from __future__ import annotations

import hashlib
import hmac
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
from app.enums.payment_channel import normalize_payment_channel
from app.models.payment import Payment
from app.providers.payment.base import PaymentProvider
from app.services.setting_service import SettingService


class PaystackProvider(PaymentProvider):
    BASE_URL = "https://api.paystack.co"
    SIGNATURE_HEADER = "x-paystack-signature"

    def __init__(self, db: Session) -> None:
        self.db = db
        self.secret_key = SettingService.get_string(
            db,
            SettingKeys.PAYSTACK_SECRET_KEY,
            "",
        ).strip()
        if not self.secret_key:
            raise HTTPException(status_code=503, detail="Paystack is not configured.")

        self.callback_url = SettingService.get_string(
            db,
            SettingKeys.PAYSTACK_CALLBACK_URL,
            "",
        ).strip()

        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    def initialize_payment(
        self,
        *,
        payment: Payment,
        email: str,
        metadata: dict[str, Any],
    ) -> PaymentInitializationResult:
        amount_subunit = int((payment.amount * Decimal("100")).to_integral_exact())
        payload: dict[str, Any] = {
            "email": email,
            "amount": str(amount_subunit),
            "currency": payment.currency,
            "reference": payment.internal_reference,
            "metadata": metadata,
        }
        if self.callback_url:
            payload["callback_url"] = self.callback_url

        try:
            response = httpx.post(
                f"{self.BASE_URL}/transaction/initialize",
                headers=self.headers,
                json=payload,
                timeout=20.0,
            )
            response.raise_for_status()
            result = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                status_code=502,
                detail="Unable to initialize Paystack checkout.",
            ) from exc

        data = result.get("data") if isinstance(result, dict) else None
        if not isinstance(data, dict) or not result.get("status"):
            detail = result.get("message") if isinstance(result, dict) else None
            raise HTTPException(
                status_code=502,
                detail=detail or "Paystack rejected the checkout request.",
            )

        authorization_url = str(data.get("authorization_url", ""))
        provider_reference = str(data.get("reference") or payment.internal_reference)
        access_code = str(data.get("access_code", "")) or None
        if not authorization_url:
            raise HTTPException(
                status_code=502,
                detail="Paystack returned an incomplete checkout response.",
            )

        return PaymentInitializationResult(
            authorization_url=authorization_url,
            access_code=access_code,
            provider_reference=provider_reference,
            provider_status="initialized",
            provider_response=str(result.get("message") or "") or None,
            metadata={
                "authorization_url": authorization_url,
                "access_code": access_code,
            },
        )

    def verify_payment(self, *, reference: str) -> PaymentVerificationResult:
        try:
            response = httpx.get(
                f"{self.BASE_URL}/transaction/verify/{reference}",
                headers=self.headers,
                timeout=20.0,
            )
            response.raise_for_status()
            result = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise HTTPException(
                status_code=502,
                detail="Unable to verify payment with Paystack.",
            ) from exc

        data = result.get("data") if isinstance(result, dict) else None
        if not isinstance(data, dict):
            raise HTTPException(
                status_code=502,
                detail="Paystack returned an invalid verification response.",
            )

        amount: Decimal | None = None
        try:
            amount = Decimal(str(data.get("amount"))) / Decimal("100")
        except (TypeError, ValueError, ArithmeticError):
            pass

        provider_status = str(data.get("status", "")).lower()
        provider_reference = str(data.get("reference", "")) or None
        currency = str(data.get("currency", "")).upper() or None
        provider_channel = str(data.get("channel", "")).strip().lower() or None

        return PaymentVerificationResult(
            verified=bool(provider_reference),
            provider_reference=provider_reference,
            provider_status=provider_status or None,
            amount=amount,
            currency=currency,
            paid=provider_status == "success",
            failed=provider_status in {"failed", "abandoned", "reversed"},
            channel=normalize_payment_channel(provider_channel),
            provider_channel=provider_channel,
            raw_data=data,
        )

    def validate_webhook(
        self,
        *,
        headers: Mapping[str, str],
        body: bytes,
    ) -> PaymentValidationResult:
        signature = headers.get(self.SIGNATURE_HEADER)
        expected = hmac.new(
            self.secret_key.encode("utf-8"),
            body,
            hashlib.sha512,
        ).hexdigest()
        return PaymentValidationResult(
            valid=bool(signature) and hmac.compare_digest(expected, signature)
        )

    def parse_webhook(self, *, payload: dict[str, Any]) -> PaymentWebhookResult:
        event = str(payload.get("event", ""))
        data = payload.get("data")
        if event != "charge.success" or not isinstance(data, dict):
            return PaymentWebhookResult(valid=False, event=event or None)

        reference = str(data.get("reference", ""))
        if not reference:
            return PaymentWebhookResult(valid=False, event=event)

        return PaymentWebhookResult(
            valid=True,
            event=event,
            provider_reference=reference,
        )
