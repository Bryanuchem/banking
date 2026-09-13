from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.enums.payment_channel import PaymentChannel
from app.enums.payment_provider import PaymentProvider


class PaymentCheckoutResponse(BaseModel):
    id: UUID
    reference: str
    amount: Decimal
    currency: str
    status: str
    provider: PaymentProvider
    channel: PaymentChannel | None = None
    provider_channel: str | None = None
    authorization_url: str = ""
    access_code: str | None = None
    checkout_data: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class PaymentClientApprovalRequest(BaseModel):
    grant_id: str = Field(min_length=1, max_length=512)


class PaymentStatusResponse(BaseModel):
    id: UUID
    reference: str
    amount: Decimal
    currency: str
    status: str
    provider: PaymentProvider
    channel: PaymentChannel | None = None
    provider_channel: str | None = None
    paid_at: datetime | None


class PaymentHistoryResponse(BaseModel):
    id: UUID
    reference: str
    amount: Decimal
    currency: str
    status: str
    provider: PaymentProvider
    channel: PaymentChannel | None = None
    provider_channel: str | None = None
    purpose: str
    deposit_id: UUID | None = None
    withdrawal_id: UUID | None = None
    paid_at: datetime | None = None
    created_at: datetime
