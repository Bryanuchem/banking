from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.database.dependencies import get_db
from app.models.user import User
from app.schemas.admin_ops import (
    AdminAccountItem, AdminAccountListResponse, AdminAccountStateRequest,
    AdminAuditLogItem, AdminAuditLogListResponse, AdminPaymentItem,
    AdminPaymentListResponse, AdminTransactionItem, AdminTransactionListResponse,
    AdminUserItem, AdminUserListResponse, AdminUserStateRequest,
    AdminWithdrawalItem, AdminWithdrawalListResponse, PageMeta,
)
from app.schemas.reconciliation import AccountReconciliationResult
from app.schemas.settings_admin import AdminSettingItem, AdminSettingUpdateRequest
from app.services.admin_control_service import AdminControlService
from app.services.admin_query_service import AdminQueryService
from app.services.admin_settings_service import AdminSettingsService
from app.services.reconciliation_service import ReconciliationService

router = APIRouter(prefix="/admin", tags=["admin-operations"])


def _page(total: int, limit: int, offset: int) -> PageMeta:
    return PageMeta(total=total, limit=limit, offset=offset)


@router.get("/users", response_model=AdminUserListResponse)
def users(q: str | None = None, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, total = AdminQueryService.users(db, q=q, limit=limit, offset=offset)
    return AdminUserListResponse(items=[AdminUserItem.model_validate(item, from_attributes=True) for item in items], page=_page(total, limit, offset))


@router.patch("/users/{user_id}/state", response_model=AdminUserItem)
def set_user_state(user_id: UUID, payload: AdminUserStateRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = AdminControlService.set_user_active(db, admin=admin, user_id=user_id, is_active=payload.is_active, reason=payload.reason)
    db.commit(); db.refresh(user)
    return AdminUserItem.model_validate(user, from_attributes=True)


@router.get("/accounts", response_model=AdminAccountListResponse)
def accounts(status: str | None = None, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, total = AdminQueryService.accounts(db, status=status, limit=limit, offset=offset)
    return AdminAccountListResponse(items=[AdminAccountItem.model_validate(item, from_attributes=True) for item in items], page=_page(total, limit, offset))


@router.patch("/accounts/{account_id}/state", response_model=AdminAccountItem)
def set_account_state(account_id: UUID, payload: AdminAccountStateRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    account = AdminControlService.set_account_status(db, admin=admin, account_id=account_id, status=payload.status, reason=payload.reason)
    db.commit(); db.refresh(account)
    return AdminAccountItem.model_validate(account, from_attributes=True)


@router.get("/transactions", response_model=AdminTransactionListResponse)
def transactions(status: str | None = None, tx_type: str | None = None, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, total = AdminQueryService.transactions(db, status=status, tx_type=tx_type, limit=limit, offset=offset)
    return AdminTransactionListResponse(items=[AdminTransactionItem.model_validate(item, from_attributes=True) for item in items], page=_page(total, limit, offset))


@router.get("/withdrawals", response_model=AdminWithdrawalListResponse)
def withdrawals(status: str | None = None, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, total = AdminQueryService.withdrawals(db, status=status, limit=limit, offset=offset)
    return AdminWithdrawalListResponse(items=[AdminWithdrawalItem.model_validate(item, from_attributes=True) for item in items], page=_page(total, limit, offset))


@router.get("/payments", response_model=AdminPaymentListResponse)
def payments(status: str | None = None, provider: str | None = None, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, total = AdminQueryService.payments(db, status=status, provider=provider, limit=limit, offset=offset)
    return AdminPaymentListResponse(items=[AdminPaymentItem.model_validate(item, from_attributes=True) for item in items], page=_page(total, limit, offset))


@router.get("/audit-logs", response_model=AdminAuditLogListResponse)
def audit_logs(action: str | None = None, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, total = AdminQueryService.audit_logs(db, action=action, limit=limit, offset=offset)
    return AdminAuditLogListResponse(items=[AdminAuditLogItem.model_validate(item, from_attributes=True) for item in items], page=_page(total, limit, offset))


@router.get("/settings", response_model=list[AdminSettingItem])
def settings(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [AdminSettingItem(**item) for item in AdminSettingsService.list(db)]


@router.patch("/settings/{key}", response_model=AdminSettingItem)
def update_setting(key: str, payload: AdminSettingUpdateRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return AdminSettingItem(**AdminSettingsService.update(db, key=key, value=payload.value))


@router.get("/accounts/{account_id}/reconcile", response_model=AccountReconciliationResult)
def reconcile_account(account_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    from app.models.account import Account
    account = db.get(Account, account_id)
    if account is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Account not found.")
    return AccountReconciliationResult(**ReconciliationService.account(db, account))
