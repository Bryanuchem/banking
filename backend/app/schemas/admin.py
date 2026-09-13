from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class AdminCreditRequest(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    description: str = Field(default="Admin virtual credit", min_length=1, max_length=255)

    @field_validator("amount")
    @classmethod
    def normalize_amount(cls, value: Decimal) -> Decimal:
        return value.quantize(Decimal("0.01"))

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str) -> str:
        return value.strip()


class AdminCreditResponse(BaseModel):
    transaction_id: UUID
    reference: str
    account_id: UUID
    account_number: str
    amount: Decimal
    currency: str
    balance_after: Decimal
    description: str | None
    created_at: datetime


class WithdrawalDecisionRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)

    @field_validator("reason")
    @classmethod
    def normalize_reason(cls, value: str) -> str:
        return value.strip()
