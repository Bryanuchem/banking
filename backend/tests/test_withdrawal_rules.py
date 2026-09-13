from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi import HTTPException

import app.services.withdrawal_service as withdrawal_module
from app.enums.account_status import AccountStatus
from app.enums.withdrawal_status import WithdrawalStatus
from app.models.account import Account
from app.models.user import User
from app.models.withdrawal import Withdrawal
from app.services.withdrawal_service import WithdrawalService


class FakeDB:
    def __init__(self) -> None:
        self.added = []
        self.flush_count = 0

    def add(self, value) -> None:
        self.added.append(value)

    def get(self, model, identity):
        return None

    def flush(self) -> None:
        self.flush_count += 1


def make_account(*, available: str = "900.00", held: str = "100.00") -> Account:
    return Account(
        id=uuid4(),
        user_id=uuid4(),
        account_number="1000000001",
        currency="USD",
        available_balance=Decimal(available),
        held_balance=Decimal(held),
        status=AccountStatus.ACTIVE.value,
    )


def make_withdrawal(account: Account, *, status: str) -> Withdrawal:
    return Withdrawal(
        id=uuid4(),
        user_id=account.user_id,
        account_id=account.id,
        transaction_id=None,
        amount=Decimal("100.00"),
        fee_amount=Decimal("0.00"),
        currency="USD",
        destination_bank_name="Test Bank",
        destination_account_number="1234567890",
        destination_account_name="Test User",
        status=status,
    )


def make_user(*, user_id, admin: bool = False) -> User:
    return User(
        id=user_id,
        email="admin@example.com" if admin else "user@example.com",
        password_hash="hash",
        first_name="Test",
        last_name="User",
        is_active=True,
        is_verified=True,
        is_admin=admin,
        failed_login_attempts=0,
    )


def test_withdrawal_fee_combines_flat_and_percentage(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        withdrawal_module.SettingService,
        "get_boolean",
        staticmethod(lambda db, key, default=False: True),
    )
    values = {
        str(withdrawal_module.SettingKeys.WITHDRAWAL_FEE_FLAT): "2.50",
        str(withdrawal_module.SettingKeys.WITHDRAWAL_FEE_PERCENT): "1.25",
    }
    monkeypatch.setattr(
        withdrawal_module.SettingService,
        "get_string",
        staticmethod(lambda db, key, default="0.00": values[str(key)]),
    )

    assert WithdrawalService.calculate_fee(object(), Decimal("100.00")) == Decimal("3.75")


def test_withdrawal_fee_can_be_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        withdrawal_module.SettingService,
        "get_boolean",
        staticmethod(lambda db, key, default=False: False),
    )

    assert WithdrawalService.calculate_fee(object(), Decimal("100.00")) == Decimal("0.00")


def test_user_cancel_releases_held_money(monkeypatch: pytest.MonkeyPatch) -> None:
    db = FakeDB()
    account = make_account()
    withdrawal = make_withdrawal(account, status=WithdrawalStatus.PENDING_REVIEW.value)
    user = make_user(user_id=withdrawal.user_id)

    monkeypatch.setattr(WithdrawalService, "_locked", classmethod(lambda cls, db, withdrawal_id: (withdrawal, account)))
    monkeypatch.setattr(WithdrawalService, "_audit", classmethod(lambda cls, *args, **kwargs: None))
    monkeypatch.setattr(
        withdrawal_module.TransactionService,
        "create",
        classmethod(lambda cls, db, **kwargs: type("Txn", (), {"id": uuid4()})()),
    )

    result = WithdrawalService.cancel_by_user(db, user=user, withdrawal_id=withdrawal.id)

    assert result.status == WithdrawalStatus.CANCELLED.value
    assert account.available_balance == Decimal("1000.00")
    assert account.held_balance == Decimal("0.00")
    assert db.flush_count == 1


def test_completed_withdrawal_consumes_hold_without_recrediting_available(monkeypatch: pytest.MonkeyPatch) -> None:
    db = FakeDB()
    account = make_account()
    withdrawal = make_withdrawal(account, status=WithdrawalStatus.PROCESSING.value)
    admin = make_user(user_id=uuid4(), admin=True)

    monkeypatch.setattr(WithdrawalService, "_locked", classmethod(lambda cls, db, withdrawal_id: (withdrawal, account)))
    monkeypatch.setattr(WithdrawalService, "_audit", classmethod(lambda cls, *args, **kwargs: None))

    WithdrawalService.complete(db, admin=admin, withdrawal_id=withdrawal.id)

    assert withdrawal.status == WithdrawalStatus.COMPLETED.value
    assert account.available_balance == Decimal("900.00")
    assert account.held_balance == Decimal("0.00")


def test_non_admin_cannot_approve_withdrawal() -> None:
    user = make_user(user_id=uuid4(), admin=False)

    with pytest.raises(HTTPException) as exc:
        WithdrawalService.approve(FakeDB(), admin=user, withdrawal_id=uuid4())

    assert exc.value.status_code == 403


def test_user_cannot_cancel_processing_withdrawal(monkeypatch: pytest.MonkeyPatch) -> None:
    account = make_account()
    withdrawal = make_withdrawal(account, status=WithdrawalStatus.PROCESSING.value)
    user = make_user(user_id=withdrawal.user_id)

    monkeypatch.setattr(WithdrawalService, "_locked", classmethod(lambda cls, db, withdrawal_id: (withdrawal, account)))

    with pytest.raises(HTTPException) as exc:
        WithdrawalService.cancel_by_user(FakeDB(), user=user, withdrawal_id=withdrawal.id)

    assert exc.value.status_code == 409
