from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field, field_validator

class DepositRequest(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    @field_validator("amount")
    @classmethod
    def normalize_amount(cls, value: Decimal) -> Decimal:
        return value.quantize(Decimal("0.01"))

class DepositResponse(BaseModel):
    id: UUID
    amount: Decimal
    currency: str
    status: str
    transaction_id: UUID | None
    completed_at: datetime | None
    created_at: datetime
