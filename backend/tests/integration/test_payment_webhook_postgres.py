from __future__ import annotations

from decimal import Decimal
from sqlalchemy import func, select

from app.domain.payment import PaymentValidationResult, PaymentVerificationResult, PaymentWebhookResult
from app.enums.payment_provider import PaymentProvider
from app.enums.payment_status import PaymentStatus
from app.enums.withdrawal_status import WithdrawalStatus
from app.models.payment import Payment
from app.models.withdrawal import Withdrawal
from app.services.payment_service import PaymentService
from app.providers.payment.factory import PaymentProviderFactory
from tests.integration.helpers import make_user


class FakeProvider:
    def __init__(self):
        self.verify_calls = 0

    def validate_webhook(self, *, headers, body):
        return PaymentValidationResult(valid=True)

    def parse_webhook(self, *, payload):
        return PaymentWebhookResult(
            valid=True,
            provider_reference=payload["reference"],
            event="payment.completed",
        )

    def verify_payment(self, *, reference):
        self.verify_calls += 1
        return PaymentVerificationResult(
            verified=True,
            paid=True,
            failed=False,
            provider_reference=reference,
            amount=Decimal("5.00"),
            currency="USD",
            provider_status="paid",
            raw_data={"verified": True},
        )


def test_duplicate_success_webhook_is_idempotent_at_persistence_layer(db, monkeypatch) -> None:
    user = make_user(db, email="webhook@example.test", account_number="5000000001")
    withdrawal = Withdrawal(
        user_id=user.id,
        account_id=user.account.id,
        amount=Decimal("50.00"),
        fee_amount=Decimal("5.00"),
        currency="USD",
        destination_bank_name="Test Bank",
        destination_account_number="1234567890",
        destination_account_name="Test User",
        status=WithdrawalStatus.AWAITING_FEE.value,
    )
    db.add(withdrawal)
    db.flush()
    payment = Payment(
        user_id=user.id,
        withdrawal_id=withdrawal.id,
        provider=PaymentProvider.STRIPE,
        provider_reference="provider-ref-1",
        internal_reference="PAY-INTERNAL-1",
        amount=Decimal("5.00"),
        currency="USD",
        status=PaymentStatus.INITIALIZED.value,
    )
    db.add(payment)
    db.commit()

    provider = FakeProvider()
    fake_provider = provider
    monkeypatch.setattr(
        PaymentProviderFactory,
        "get_provider",
        classmethod(lambda cls, *, provider, db: fake_provider),
    )

    event = {"reference": "provider-ref-1"}
    PaymentService.process_webhook(
        db,
        provider_name="stripe",
        raw_body=b"{}",
        headers={},
        event=event,
    )
    db.commit()
    assert payment.status == PaymentStatus.PAID.value
    assert withdrawal.status == WithdrawalStatus.PENDING_REVIEW.value
    assert provider.verify_calls == 1

    PaymentService.process_webhook(
        db,
        provider_name="stripe",
        raw_body=b"{}",
        headers={},
        event=event,
    )
    db.commit()
    assert payment.status == PaymentStatus.PAID.value
    assert provider.verify_calls == 1
