from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class PageMeta(BaseModel):
    total: int
    limit: int
    offset: int


class AdminUserItem(BaseModel):
    id: UUID
    email: str
    phone: str | None
    first_name: str
    last_name: str
    is_active: bool
    is_verified: bool
    is_admin: bool
    created_at: datetime
    last_login_at: datetime | None


class AdminUserListResponse(BaseModel):
    items: list[AdminUserItem]
    page: PageMeta


class AdminAccountItem(BaseModel):
    id: UUID
    user_id: UUID
    account_number: str
    currency: str
    available_balance: Decimal
    held_balance: Decimal
    status: str
    created_at: datetime


class AdminAccountListResponse(BaseModel):
    items: list[AdminAccountItem]
    page: PageMeta


class AdminTransactionItem(BaseModel):
    id: UUID
    reference: str
    type: str
    status: str
    amount: Decimal
    currency: str
    description: str | None
    created_at: datetime


class AdminTransactionListResponse(BaseModel):
    items: list[AdminTransactionItem]
    page: PageMeta


class AdminWithdrawalItem(BaseModel):
    id: UUID
    user_id: UUID
    account_id: UUID
    amount: Decimal
    fee_amount: Decimal
    currency: str
    status: str
    destination_bank_name: str
    destination_account_number: str
    destination_account_name: str
    created_at: datetime


class AdminWithdrawalListResponse(BaseModel):
    items: list[AdminWithdrawalItem]
    page: PageMeta


class AdminPaymentItem(BaseModel):
    id: UUID
    user_id: UUID
    withdrawal_id: UUID | None
    provider: str
    channel: str | None
    provider_channel: str | None
    internal_reference: str
    provider_reference: str | None
    amount: Decimal
    currency: str
    status: str
    paid_at: datetime | None
    created_at: datetime


class AdminPaymentListResponse(BaseModel):
    items: list[AdminPaymentItem]
    page: PageMeta


class AdminAuditLogItem(BaseModel):
    id: UUID
    user_id: UUID | None
    action: str
    entity_type: str | None
    entity_id: UUID | None
    ip_address: str | None
    details: dict[str, Any] | None
    created_at: datetime


class AdminAuditLogListResponse(BaseModel):
    items: list[AdminAuditLogItem]
    page: PageMeta


class AdminUserStateRequest(BaseModel):
    is_active: bool
    reason: str | None = Field(default=None, max_length=500)


class AdminAccountStateRequest(BaseModel):
    status: str = Field(pattern="^(active|frozen|closed)$")
    reason: str | None = Field(default=None, max_length=500)
