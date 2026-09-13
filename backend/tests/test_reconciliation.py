from decimal import Decimal
from uuid import uuid4

from app.enums.account_status import AccountStatus
from app.models.account import Account
from app.services.reconciliation_service import ReconciliationService


class ScalarSequenceDB:
    def __init__(self, values) -> None:
        self.values = iter(values)

    def scalar(self, statement):
        return next(self.values)


def make_account(*, available: str, held: str) -> Account:
    return Account(
        id=uuid4(),
        user_id=uuid4(),
        account_number="1000000001",
        currency="USD",
        available_balance=Decimal(available),
        held_balance=Decimal(held),
        status=AccountStatus.ACTIVE.value,
    )


def test_reconciliation_reports_matching_cached_balances() -> None:
    account = make_account(available="250.00", held="50.00")
    db = ScalarSequenceDB([Decimal("250.00"), Decimal("50.00")])

    result = ReconciliationService.account(db, account)

    assert result["available_matches"] is True
    assert result["held_matches"] is True
    assert result["expected_available_balance"] == Decimal("250.00")
    assert result["expected_held_balance"] == Decimal("50.00")


def test_reconciliation_detects_both_available_and_held_drift() -> None:
    account = make_account(available="200.00", held="25.00")
    db = ScalarSequenceDB([Decimal("199.99"), Decimal("20.00")])

    result = ReconciliationService.account(db, account)

    assert result["available_matches"] is False
    assert result["held_matches"] is False
