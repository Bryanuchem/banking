from __future__ import annotations

import secrets
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any, Mapping
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.constants.setting_key import SettingKeys
from app.domain.payment import PaymentInitializationResult, PaymentVerificationResult
from app.enums.payment_provider import PaymentProvider
from app.enums.payment_status import PaymentStatus
from app.enums.withdrawal_status import WithdrawalStatus
from app.models.payment import Payment
from app.models.user import User
from app.models.withdrawal import Withdrawal
from app.providers.payment.factory import PaymentProviderFactory
from app.services.setting_service import SettingService


class PaymentService:
    @staticmethod
    def _reference() -> str:
        return f"PAY-{secrets.token_hex(12).upper()}"

    @staticmethod
    def _configured_provider(db: Session) -> PaymentProvider:
        raw = SettingService.get_string(
            db,
            SettingKeys.PAYMENT_PROVIDER,
            PaymentProvider.STRIPE.value,
        ).strip().lower()
        try:
            return PaymentProvider(raw)
        except ValueError as exc:
            raise HTTPException(
                status_code=503,
                detail="Configured payment provider is unsupported.",
            ) from exc

    @classmethod
    def initialize_withdrawal_fee(
        cls,
        db: Session,
        *,
        user: User,
        withdrawal_id: UUID,
    ) -> tuple[Payment, PaymentInitializationResult]:
        withdrawal = db.scalar(
            select(Withdrawal).where(
                Withdrawal.id == withdrawal_id,
                Withdrawal.user_id == user.id,
            )
        )
        if withdrawal is None:
            raise HTTPException(status_code=404, detail="Withdrawal not found.")
        if withdrawal.fee_amount <= Decimal("0.00"):
            raise HTTPException(status_code=409, detail="This withdrawal has no processing fee.")
        if withdrawal.status in {
            WithdrawalStatus.FEE_PAID.value,
            WithdrawalStatus.PENDING_REVIEW.value,
            WithdrawalStatus.PROCESSING.value,
            WithdrawalStatus.COMPLETED.value,
        }:
            raise HTTPException(status_code=409, detail="The processing fee has already been paid.")
        if withdrawal.status != WithdrawalStatus.AWAITING_FEE.value:
            raise HTTPException(status_code=409, detail="This withdrawal is not awaiting a processing fee.")

        existing = db.scalar(
            select(Payment)
            .where(
                Payment.withdrawal_id == withdrawal.id,
                Payment.status.in_([
                    PaymentStatus.PENDING.value,
                    PaymentStatus.INITIALIZED.value,
                ]),
            )
            .order_by(Payment.created_at.desc())
        )
        if existing and existing.provider_data:
            authorization_url = str(
                existing.provider_data.get("authorization_url", "")
            ) or None
            if authorization_url:
                return existing, PaymentInitializationResult(
                    authorization_url=authorization_url,
                    access_code=(
                        str(existing.provider_data.get("access_code"))
                        if existing.provider_data.get("access_code")
                        else None
                    ),
                    provider_reference=(
                        existing.provider_reference or existing.internal_reference
                    ),
                    provider_status=existing.status,
                    metadata=existing.provider_data,
                )

        provider_name = cls._configured_provider(db)
        provider = PaymentProviderFactory.get_provider(provider=provider_name, db=db)
        reference = cls._reference()

        payment = Payment(
            user_id=user.id,
            withdrawal_id=withdrawal.id,
            provider=provider_name,
            provider_reference=None,
            internal_reference=reference,
            amount=withdrawal.fee_amount,
            currency=withdrawal.currency,
            status=PaymentStatus.PENDING.value,
        )
        db.add(payment)
        db.flush()

        result = provider.initialize_payment(
            payment=payment,
            email=user.email,
            metadata={
                "purpose": "withdrawal_processing_fee",
                "withdrawal_id": str(withdrawal.id),
                "user_id": str(user.id),
                "internal_reference": payment.internal_reference,
            },
        )

        payment.provider_reference = result.provider_reference or payment.internal_reference
        payment.channel = result.channel
        payment.provider_channel = result.provider_channel
        payment.status = PaymentStatus.INITIALIZED.value
        payment.provider_data = {
            **result.metadata,
            "provider_status": result.provider_status,
            "provider_response": result.provider_response,
        }
        db.flush()
        return payment, result

    @classmethod
    def complete_customer_approval(
        cls,
        db: Session,
        *,
        user: User,
        payment_id: UUID,
        approval_data: dict[str, Any],
    ) -> Payment:
        payment = db.scalar(
            select(Payment).where(
                Payment.id == payment_id,
                Payment.user_id == user.id,
            )
        )
        if payment is None:
            raise HTTPException(status_code=404, detail="Payment not found.")
        if payment.status == PaymentStatus.PAID.value:
            return payment

        provider = PaymentProviderFactory.get_provider(provider=payment.provider, db=db)
        result = provider.complete_customer_approval(
            payment=payment,
            approval_data=approval_data,
        )
        if result.provider_reference:
            payment.provider_reference = result.provider_reference
        cls._apply_verification(db, payment, result)
        return payment

    @classmethod
    def verify_payment(cls, db: Session, reference: str) -> Payment:
        payment = db.scalar(
            select(Payment).where(
                (Payment.provider_reference == reference)
                | (Payment.internal_reference == reference)
            )
        )
        if payment is None:
            raise HTTPException(status_code=404, detail="Payment not found.")
        if payment.status == PaymentStatus.PAID.value:
            return payment

        provider = PaymentProviderFactory.get_provider(provider=payment.provider, db=db)
        result = provider.verify_payment(
            reference=payment.provider_reference or payment.internal_reference
        )
        cls._apply_verification(db, payment, result)
        return payment

    @staticmethod
    def _apply_verification(
        db: Session,
        payment: Payment,
        result: PaymentVerificationResult,
    ) -> None:
        reference_matches = result.provider_reference in {
            payment.provider_reference,
            payment.internal_reference,
        }
        amount_matches = result.amount == payment.amount
        currency_matches = (result.currency or "").upper() == payment.currency.upper()

        payment.provider_data = {
            **(payment.provider_data or {}),
            "verification": result.raw_data,
            "provider_status": result.provider_status,
        }
        if result.channel is not None:
            payment.channel = result.channel
        if result.provider_channel:
            payment.provider_channel = result.provider_channel

        if (
            result.verified
            and result.paid
            and reference_matches
            and amount_matches
            and currency_matches
        ):
            payment.status = PaymentStatus.PAID.value
            payment.paid_at = datetime.now(UTC)
            if (
                payment.withdrawal is not None
                and payment.withdrawal.status == WithdrawalStatus.AWAITING_FEE.value
            ):
                payment.withdrawal.status = WithdrawalStatus.PENDING_REVIEW.value
        elif result.failed:
            payment.status = PaymentStatus.FAILED.value
        elif result.paid and not (
            reference_matches and amount_matches and currency_matches
        ):
            raise HTTPException(
                status_code=409,
                detail="Payment verification data did not match the expected payment.",
            )
        db.flush()

    @classmethod
    def process_webhook(
        cls,
        db: Session,
        *,
        provider_name: str,
        raw_body: bytes,
        headers: Mapping[str, str],
        event: dict[str, Any],
    ) -> None:
        provider = PaymentProviderFactory.get_provider(
            provider=provider_name,
            db=db,
        )
        validation = provider.validate_webhook(headers=headers, body=raw_body)
        if not validation.valid:
            raise HTTPException(status_code=401, detail="Invalid payment webhook signature.")

        webhook = provider.parse_webhook(payload=event)
        if not webhook.valid or not webhook.provider_reference:
            return

        payment = db.scalar(
            select(Payment).where(
                Payment.provider == PaymentProvider(provider_name.lower()),
                (
                    (Payment.provider_reference == webhook.provider_reference)
                    | (Payment.internal_reference == webhook.provider_reference)
                ),
            )
        )
        if payment is None or payment.status == PaymentStatus.PAID.value:
            return

        # The webhook is a trigger only. Re-verify with the provider API before
        # changing our payment/withdrawal state.
        result = provider.verify_payment(
            reference=payment.provider_reference or payment.internal_reference
        )
        cls._apply_verification(db, payment, result)
