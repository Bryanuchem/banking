from __future__ import annotations

from decimal import Decimal

from app.models.account import Account
from app.services.reconciliation_service import ReconciliationService
from tests.integration.helpers import make_user


def test_reconciliation_detects_manual_balance_drift(db) -> None:
    user = make_user(
        db,
        email="reconcile@example.test",
        account_number="6000000001",
        balance=Decimal("100.00"),
    )
    account = db.get(Account, user.account.id)
    account.available_balance = Decimal("999.00")
    db.commit()

    result = ReconciliationService.account(db, account)
    assert result["actual_available_balance"] == Decimal("999.00")
    assert result["expected_available_balance"] == Decimal("100.00")
    assert result["available_matches"] is False
