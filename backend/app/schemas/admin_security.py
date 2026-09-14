from datetime import datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class AdminSecuritySummary(BaseModel):
    administrators: int
    active_admin_sessions: int
    admins_without_2fa: int
    failed_admin_attempts: int
    reconciliation_status: Literal["healthy", "warning", "critical"]
    reconciliation_checked: int
    reconciliation_mismatched: int


class AdminSecurityPolicy(BaseModel):
    password_min_length: int
    require_uppercase: bool
    require_numbers: bool
    require_special_characters: bool
    two_factor_policy: str


class AdminSecurityOverview(BaseModel):
    summary: AdminSecuritySummary
    policy: AdminSecurityPolicy


class AdminAdministratorItem(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str
    is_active: bool
    two_factor_enabled: bool
    active_sessions: int
    last_login_at: datetime | None
    created_at: datetime
    has_customer_account: bool


class AdminAdministratorListResponse(BaseModel):
    items: list[AdminAdministratorItem]
    total: int


class AdminCreateAdministratorRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=255)
    temporary_password: str = Field(min_length=1)
    is_active: bool = True


class AdminPromoteCustomerRequest(BaseModel):
    user_id: UUID


class AdminAdministratorStateRequest(BaseModel):
    is_active: bool
    reason: str | None = Field(default=None, max_length=500)


class AdminSessionItem(BaseModel):
    id: UUID
    user_id: UUID
    user_name: str
    email: str
    user_type: Literal["administrator", "customer"]
    ip_address: str | None
    user_agent: str | None
    created_at: datetime
    last_seen_at: datetime | None
    expires_at: datetime
    revoked_at: datetime | None
    status: Literal["active", "revoked", "expired"]
    current: bool = False


class AdminSessionListResponse(BaseModel):
    items: list[AdminSessionItem]
    total: int


class AdminRevokeSessionsResponse(BaseModel):
    count: int


class AdminAuditLogItemV2(BaseModel):
    id: UUID
    actor_id: UUID | None
    actor_name: str | None
    actor_email: str | None
    action: str
    entity_type: str | None
    entity_id: UUID | None
    ip_address: str | None
    user_agent: str | None
    details: dict[str, Any] | None
    created_at: datetime


class AdminAuditLogListResponseV2(BaseModel):
    items: list[AdminAuditLogItemV2]
    total: int


class AdminReconciliationAccount(BaseModel):
    account_id: UUID
    account_number: str
    customer_name: str
    actual_available_balance: Decimal
    expected_available_balance: Decimal
    actual_held_balance: Decimal
    expected_held_balance: Decimal
    available_difference: Decimal
    held_difference: Decimal
    status: Literal["healthy", "warning", "critical"]


class AdminReconciliationSummary(BaseModel):
    checked: int
    mismatched: int
    account_balance_total: Decimal
    ledger_balance_total: Decimal
    held_balance_total: Decimal
    expected_held_total: Decimal
    unmatched_transactions: int
    status: Literal["healthy", "warning", "critical"]


class AdminReconciliationReport(BaseModel):
    summary: AdminReconciliationSummary
    accounts: list[AdminReconciliationAccount]


class AdminReconciliationRunResponse(BaseModel):
    report: AdminReconciliationReport
    completed_at: datetime
