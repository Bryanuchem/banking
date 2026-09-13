from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class AccountSummaryResponse(BaseModel):
    id: UUID
    account_number: str
    currency: str
    available_balance: Decimal
    held_balance: Decimal
    status: str


class AccountLookupResponse(BaseModel):
    account_number: str
    account_name: str
    currency: str


class TransferRequest(BaseModel):
    recipient_account_number: str = Field(min_length=6, max_length=20)
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    narration: str | None = Field(default=None, max_length=255)

    @field_validator("amount")
    @classmethod
    def normalize_amount(cls, value: Decimal) -> Decimal:
        return value.quantize(Decimal("0.01"))


class TransferResponse(BaseModel):
    id: UUID
    reference: str
    sender_account_number: str
    recipient_account_number: str
    recipient_name: str
    amount: Decimal
    currency: str
    narration: str | None
    status: str
    created_at: datetime


class TransactionHistoryItem(BaseModel):
    id: UUID
    reference: str
    type: str
    direction: str
    amount: Decimal
    currency: str
    status: str
    description: str | None
    balance_after: Decimal
    created_at: datetime


class WithdrawalRequest(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    destination_bank_name: str = Field(min_length=1, max_length=120)
    destination_account_number: str = Field(min_length=3, max_length=30)
    destination_account_name: str = Field(min_length=1, max_length=150)

    @field_validator("amount")
    @classmethod
    def normalize_amount(cls, value: Decimal) -> Decimal:
        return value.quantize(Decimal("0.01"))


class WithdrawalResponse(BaseModel):
    id: UUID
    amount: Decimal
    fee_amount: Decimal
    currency: str
    destination_bank_name: str
    destination_account_number: str
    destination_account_name: str
    status: str
    created_at: datetime


class WithdrawalQuoteResponse(BaseModel):
    amount: Decimal
    fee_amount: Decimal
    currency: str
    recipient_receives: Decimal
