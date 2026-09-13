from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from app.enums.transaction_status import TransactionStatus
from app.enums.withdrawal_status import WithdrawalStatus
from app.models.account import Account
from app.models.transaction import Transaction
from app.services.reconciliation_service import ReconciliationService
from app.services.withdrawal_service import WithdrawalService
from tests.integration.helpers import make_user


def _create(db, user, amount: str = "40.00"):
    return WithdrawalService.create_request(
        db,
        user=user,
        amount=Decimal(amount),
        destination_bank_name="Test Bank",
        destination_account_number="0001234567",
        destination_account_name="Integration Recipient",
        idempotency_key=str(uuid4()),
    )


def _mark_fee_verified(db, withdrawal) -> None:
    """
    Payment-provider verification owns this transition in production.

    These withdrawal integration tests focus on reservation / release /
    completion accounting, while payment-verification behavior is covered
    separately. Move the withdrawal to the state produced by successful
    fee verification before testing admin approval.
    """
    withdrawal.status = WithdrawalStatus.PENDING_REVIEW.value
    db.flush()


def test_withdrawal_reserves_available_funds_and_reconciliation_sees_hold(
    db,
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        WithdrawalService,
        "calculate_fee",
        classmethod(
            lambda cls, db, amount: Decimal("6.00")
        ),
    )
    user = make_user(
        db,
        email="withdraw@example.test",
        account_number="4000000001",
        balance=Decimal("100.00"),
    )

    withdrawal = _create(db, user, "40.00")
    db.commit()
    db.expire_all()

    account = db.get(Account, user.account.id)

    assert withdrawal.status == WithdrawalStatus.AWAITING_FEE.value
    assert withdrawal.fee_amount == Decimal("6.00")
    assert account.available_balance == Decimal("60.00")
    assert account.held_balance == Decimal("40.00")

    result = ReconciliationService.account(db, account)
    assert result["available_matches"] is True
    assert result["held_matches"] is True


def test_cancelling_awaiting_fee_withdrawal_releases_hold_and_reverses_original_transaction(
    db,
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        WithdrawalService,
        "calculate_fee",
        classmethod(
            lambda cls, db, amount: Decimal("6.00")
        ),
    )
    user = make_user(
        db,
        email="withdraw-cancel@example.test",
        account_number="4100000001",
        balance=Decimal("100.00"),
    )

    withdrawal = _create(db, user, "40.00")
    original_transaction_id = withdrawal.transaction_id
    db.commit()

    withdrawal = WithdrawalService.cancel_by_user(
        db,
        user=user,
        withdrawal_id=withdrawal.id,
    )
    db.commit()
    db.expire_all()

    account = db.get(Account, user.account.id)
    original = db.get(
        Transaction,
        original_transaction_id,
    )

    assert withdrawal.status == WithdrawalStatus.CANCELLED.value
    assert account.available_balance == Decimal("100.00")
    assert account.held_balance == Decimal("0.00")
    assert original.status == TransactionStatus.REVERSED.value
    assert (
        ReconciliationService.account(db, account)[
            "held_matches"
        ]
        is True
    )


def test_completed_fee_verified_withdrawal_consumes_hold_without_refunding_available_balance(
    db,
    monkeypatch,
) -> None:
    monkeypatch.setattr(
        WithdrawalService,
        "calculate_fee",
        classmethod(
            lambda cls, db, amount: Decimal("6.00")
        ),
    )
    user = make_user(
        db,
        email="withdraw-complete@example.test",
        account_number="4200000001",
        balance=Decimal("100.00"),
    )
    admin = make_user(
        db,
        email="admin@example.test",
        account_number="4200000002",
        is_admin=True,
    )

    withdrawal = _create(db, user, "40.00")

    assert withdrawal.status == WithdrawalStatus.AWAITING_FEE.value
    assert withdrawal.fee_amount == Decimal("6.00")

    _mark_fee_verified(db, withdrawal)
    db.commit()

    WithdrawalService.approve(
        db,
        admin=admin,
        withdrawal_id=withdrawal.id,
    )
    db.commit()

    WithdrawalService.complete(
        db,
        admin=admin,
        withdrawal_id=withdrawal.id,
    )
    db.commit()
    db.expire_all()

    account = db.get(Account, user.account.id)
    original = db.get(
        Transaction,
        withdrawal.transaction_id,
    )

    assert withdrawal.status == WithdrawalStatus.COMPLETED.value
    assert account.available_balance == Decimal("60.00")
    assert account.held_balance == Decimal("0.00")
    assert original.status == TransactionStatus.COMPLETED.value
    assert (
        ReconciliationService.account(db, account)[
            "held_matches"
        ]
        is True
    )
