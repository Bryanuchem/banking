from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class AccountReconciliationResult(BaseModel):
    account_id: UUID
    account_number: str
    actual_available_balance: Decimal
    expected_available_balance: Decimal
    actual_held_balance: Decimal
    expected_held_balance: Decimal
    available_matches: bool
    held_matches: bool


class ReconciliationSummary(BaseModel):
    checked: int
    mismatched: int
    results: list[AccountReconciliationResult]
