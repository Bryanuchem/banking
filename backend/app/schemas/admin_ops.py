from datetime import date, datetime
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


class AdminLinkedAccount(BaseModel):
    id: UUID
    account_number: str
    currency: str
    available_balance: Decimal
    held_balance: Decimal
    status: str
    created_at: datetime


class AdminUserDetail(AdminUserItem):
    account: AdminLinkedAccount | None = None


class AdminUserListResponse(BaseModel):
    items: list[AdminUserItem]
    page: PageMeta


class AdminAccountOwner(BaseModel):
    id: UUID
    email: str
    phone: str | None
    first_name: str
    last_name: str
    is_active: bool
    is_verified: bool
    is_admin: bool


class AdminAccountItem(BaseModel):
    id: UUID
    user_id: UUID
    account_number: str
    currency: str
    available_balance: Decimal
    held_balance: Decimal
    status: str
    created_at: datetime
    owner: AdminAccountOwner


class AdminAccountDetail(AdminAccountItem):
    pass


class AdminAccountListResponse(BaseModel):
    items: list[AdminAccountItem]
    page: PageMeta


class AdminDashboardUserSummary(BaseModel):
    total: int
    active: int
    inactive: int


class AdminDashboardAccountSummary(BaseModel):
    total: int
    active: int
    frozen: int
    closed: int


class AdminDashboardFinancialSummary(BaseModel):
    period_start: date
    period_end: date
    transactions_count: int
    payments_count: int
    transfers_count: int
    deposits_count: int


class AdminDashboardWithdrawalSummary(BaseModel):
    pending_review: int
    processing: int


class AdminDashboardSummary(BaseModel):
    customers: AdminDashboardUserSummary
    accounts: AdminDashboardAccountSummary
    financial: AdminDashboardFinancialSummary
    withdrawals: AdminDashboardWithdrawalSummary


class AdminFinancialParty(BaseModel):
    user_id: UUID
    name: str
    email: str
    phone: str | None = None


class AdminFinancialAccount(BaseModel):
    account_id: UUID
    account_number: str
    currency: str


class AdminLedgerEntryItem(BaseModel):
    id: UUID
    entry_type: str
    amount: Decimal
    balance_after: Decimal
    created_at: datetime
    account: AdminFinancialAccount
    customer: AdminFinancialParty


class AdminTransactionItem(BaseModel):
    id: UUID
    reference: str
    type: str
    status: str
    amount: Decimal
    currency: str
    description: str | None
    created_at: datetime
    customer: AdminFinancialParty | None = None
    account: AdminFinancialAccount | None = None


class AdminTransactionDetail(AdminTransactionItem):
    ledger_entries: list[AdminLedgerEntryItem]


class AdminTransactionListResponse(BaseModel):
    items: list[AdminTransactionItem]
    page: PageMeta


class AdminTransferItem(BaseModel):
    id: UUID
    transaction_id: UUID
    reference: str
    status: str
    amount: Decimal
    currency: str
    narration: str | None
    created_at: datetime
    sender: AdminFinancialParty
    sender_account: AdminFinancialAccount
    recipient: AdminFinancialParty
    recipient_account: AdminFinancialAccount


class AdminTransferDetail(AdminTransferItem):
    ledger_entries: list[AdminLedgerEntryItem]


class AdminTransferListResponse(BaseModel):
    items: list[AdminTransferItem]
    page: PageMeta


class AdminDepositPaymentAttempt(BaseModel):
    id: UUID
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


class AdminDepositItem(BaseModel):
    id: UUID
    user_id: UUID
    account_id: UUID
    transaction_id: UUID | None
    amount: Decimal
    currency: str
    status: str
    completed_at: datetime | None
    created_at: datetime
    customer: AdminFinancialParty
    account: AdminFinancialAccount
    provider: str | None = None


class AdminDepositDetail(AdminDepositItem):
    payment_attempts: list[AdminDepositPaymentAttempt]
    transaction_reference: str | None = None
    ledger_entries: list[AdminLedgerEntryItem] = Field(default_factory=list)


class AdminDepositListResponse(BaseModel):
    items: list[AdminDepositItem]
    page: PageMeta


class AdminPaymentItem(BaseModel):
    id: UUID
    user_id: UUID
    withdrawal_id: UUID | None
    deposit_id: UUID | None
    provider: str
    channel: str | None
    provider_channel: str | None
    internal_reference: str
    provider_reference: str | None
    amount: Decimal
    currency: str
    status: str
    purpose: str
    paid_at: datetime | None
    created_at: datetime
    customer: AdminFinancialParty


class AdminPaymentDetail(AdminPaymentItem):
    linked_reference: str | None = None


class AdminPaymentListResponse(BaseModel):
    items: list[AdminPaymentItem]
    page: PageMeta


class AdminWithdrawalFeePayment(BaseModel):
    id: UUID
    provider: str
    internal_reference: str
    provider_reference: str | None
    amount: Decimal
    currency: str
    status: str
    paid_at: datetime | None
    created_at: datetime


class AdminWithdrawalActivity(BaseModel):
    key: str
    label: str
    created_at: datetime
    actor_email: str | None = None
    reason: str | None = None
    external_reference: str | None = None


class AdminWithdrawalItem(BaseModel):
    id: UUID
    user_id: UUID
    account_id: UUID
    transaction_id: UUID | None
    amount: Decimal
    fee_amount: Decimal
    currency: str
    status: str
    destination_bank_name: str
    destination_account_number: str
    destination_account_name: str
    external_reference: str | None = None
    admin_note: str | None = None
    created_at: datetime
    updated_at: datetime
    customer: AdminFinancialParty
    account: AdminFinancialAccount


class AdminWithdrawalDetail(AdminWithdrawalItem):
    fee_payment: AdminWithdrawalFeePayment | None = None
    activity: list[AdminWithdrawalActivity]


class AdminWithdrawalListResponse(BaseModel):
    items: list[AdminWithdrawalItem]
    page: PageMeta


class AdminWithdrawalApproveRequest(BaseModel):
    admin_note: str | None = Field(default=None, max_length=1000)


class AdminWithdrawalRejectRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


class AdminWithdrawalCompleteRequest(BaseModel):
    external_reference: str = Field(min_length=1, max_length=120)
    admin_note: str | None = Field(default=None, max_length=1000)


class AdminWithdrawalFailRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


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


class AdminDeleteCustomerAccountRequest(BaseModel):
    confirmation: str = Field(min_length=1, max_length=20)
    reason: str | None = Field(default=None, max_length=500)


class AdminDeleteCustomerAccountResponse(BaseModel):
    account_id: UUID
    account_number: str
    deleted_at: datetime
    user_deactivated: bool
    history_preserved: bool = True
