from decimal import Decimal
from types import SimpleNamespace
from uuid import uuid4

from app.services.account_deletion_service import (
    AccountDeletionService,
)


class ScalarDB:
    def __init__(self, values):
        self.values = iter(values)

    def scalar(self, statement):
        return next(self.values)


def test_zero_balance_account_without_pending_work_can_delete() -> None:
    db = ScalarDB([0, 0])
    account = SimpleNamespace(
        id=uuid4(),
        account_number="1000000001",
        currency="USD",
        available_balance=Decimal("0.00"),
        held_balance=Decimal("0.00"),
        deleted_at=None,
    )

    status = AccountDeletionService.status(
        db,
        account=account,
    )

    assert status["can_delete"] is True
    assert status["clear_route"] is None


def test_nonzero_available_balance_routes_customer_to_withdraw() -> None:
    db = ScalarDB([0, 0])
    account = SimpleNamespace(
        id=uuid4(),
        account_number="1000000001",
        currency="USD",
        available_balance=Decimal("25.00"),
        held_balance=Decimal("0.00"),
        deleted_at=None,
    )

    status = AccountDeletionService.status(
        db,
        account=account,
    )

    assert status["can_delete"] is False
    assert status["clear_route"] == "/withdraw"
