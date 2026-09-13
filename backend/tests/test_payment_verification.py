from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.domain.payment import PaymentVerificationResult
from app.enums.payment_channel import PaymentChannel
from app.enums.payment_provider import PaymentProvider
from app.enums.payment_status import PaymentStatus
from app.enums.withdrawal_status import WithdrawalStatus
from app.models.payment import Payment
from app.models.withdrawal import Withdrawal
from app.services.payment_service import PaymentService


class FakeDB:
    def __init__(self) -> None:
        self.flush_count = 0

    def flush(self) -> None:
        self.flush_count += 1


def make_payment(*, withdrawal: Withdrawal | None = None) -> Payment:
    payment = Payment(
        id=uuid4(),
        user_id=uuid4(),
        withdrawal_id=withdrawal.id if withdrawal else None,
        provider=PaymentProvider.STRIPE,
        internal_reference="PAY-ABC123",
        provider_reference="cs_test_123",
        amount=Decimal("10.00"),
        currency="USD",
        status=PaymentStatus.INITIALIZED.value,
    )
    payment.withdrawal = withdrawal
    return payment


def make_withdrawal() -> Withdrawal:
    return Withdrawal(
        id=uuid4(),
        user_id=uuid4(),
        account_id=uuid4(),
        amount=Decimal("100.00"),
        fee_amount=Decimal("10.00"),
        currency="USD",
        destination_bank_name="Test Bank",
        destination_account_number="1234567890",
        destination_account_name="Test User",
        status=WithdrawalStatus.AWAITING_FEE.value,
    )


def test_verified_payment_marks_payment_paid_and_advances_withdrawal() -> None:
    db = FakeDB()
    withdrawal = make_withdrawal()
    payment = make_payment(withdrawal=withdrawal)
    result = PaymentVerificationResult(
        verified=True,
        paid=True,
        provider_reference="cs_test_123",
        provider_status="paid",
        amount=Decimal("10.00"),
        currency="usd",
        channel=PaymentChannel.CARD,
        provider_channel="card",
        raw_data={"id": "cs_test_123"},
    )

    PaymentService._apply_verification(db, payment, result)

    assert payment.status == PaymentStatus.PAID.value
    assert payment.paid_at is not None
    assert payment.channel is PaymentChannel.CARD
    assert payment.provider_channel == "card"
    assert withdrawal.status == WithdrawalStatus.PENDING_REVIEW.value
    assert db.flush_count == 1


@pytest.mark.parametrize(
    "result",
    [
        PaymentVerificationResult(
            verified=True,
            paid=True,
            provider_reference="wrong-reference",
            amount=Decimal("10.00"),
            currency="USD",
        ),
        PaymentVerificationResult(
            verified=True,
            paid=True,
            provider_reference="cs_test_123",
            amount=Decimal("9.99"),
            currency="USD",
        ),
        PaymentVerificationResult(
            verified=True,
            paid=True,
            provider_reference="cs_test_123",
            amount=Decimal("10.00"),
            currency="EUR",
        ),
    ],
)
def test_paid_provider_response_must_match_reference_amount_and_currency(result) -> None:
    db = FakeDB()
    payment = make_payment()

    with pytest.raises(HTTPException) as exc:
        PaymentService._apply_verification(db, payment, result)

    assert exc.value.status_code == 409
    assert payment.status == PaymentStatus.INITIALIZED.value
    assert db.flush_count == 0


def test_failed_provider_verification_marks_payment_failed() -> None:
    db = FakeDB()
    payment = make_payment()
    result = PaymentVerificationResult(
        verified=True,
        failed=True,
        paid=False,
        provider_reference="cs_test_123",
        provider_status="failed",
        amount=Decimal("10.00"),
        currency="USD",
    )

    PaymentService._apply_verification(db, payment, result)

    assert payment.status == PaymentStatus.FAILED.value
    assert payment.paid_at is None
    assert db.flush_count == 1


def test_unverified_pending_result_does_not_promote_payment() -> None:
    db = FakeDB()
    payment = make_payment()
    result = PaymentVerificationResult(
        verified=False,
        paid=False,
        failed=False,
        provider_reference="cs_test_123",
        provider_status="pending",
        amount=Decimal("10.00"),
        currency="USD",
    )

    PaymentService._apply_verification(db, payment, result)

    assert payment.status == PaymentStatus.INITIALIZED.value
    assert payment.paid_at is None
