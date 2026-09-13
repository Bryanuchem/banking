from uuid import UUID

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.constants.setting_key import SettingKeys
from app.database.dependencies import get_db
from app.models.user import User
from app.schemas.admin import AdminCreditRequest, AdminCreditResponse, WithdrawalDecisionRequest
from app.schemas.money import WithdrawalResponse
from app.services.admin_account_service import AdminAccountService
from app.services.idempotency_service import IdempotencyService
from app.services.rate_limit_service import RateLimitService
from app.services.withdrawal_service import WithdrawalService

router = APIRouter(prefix="/admin", tags=["admin"])


def _limit_admin(db: Session, admin: User) -> None:
    RateLimitService.check(
        db, bucket="admin", subject=str(admin.id),
        setting_key=SettingKeys.RATE_LIMIT_ADMIN_PER_MINUTE,
        default_limit=60, window_seconds=60,
    )


def _withdrawal_response(item) -> WithdrawalResponse:
    return WithdrawalResponse(
        id=item.id,
        amount=item.amount,
        fee_amount=item.fee_amount,
        currency=item.currency,
        destination_bank_name=item.destination_bank_name,
        destination_account_number=item.destination_account_number,
        destination_account_name=item.destination_account_name,
        status=item.status,
        created_at=item.created_at,
    )


@router.post("/accounts/{account_id}/credit", response_model=AdminCreditResponse, status_code=201)
def credit_virtual_account(
    account_id: UUID,
    payload: AdminCreditRequest,
    request: Request,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminCreditResponse:
    _limit_admin(db, admin)
    key = IdempotencyService.require_key(idempotency_key)
    account, transaction = AdminAccountService.credit_account(
        db,
        admin=admin,
        account_id=account_id,
        amount=payload.amount,
        description=payload.description,
        idempotency_key=key,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.commit()
    db.refresh(account)
    db.refresh(transaction)
    return AdminCreditResponse(
        transaction_id=transaction.id,
        reference=transaction.reference,
        account_id=account.id,
        account_number=account.account_number,
        amount=transaction.amount,
        currency=transaction.currency,
        balance_after=account.available_balance,
        description=transaction.description,
        created_at=transaction.created_at,
    )


@router.post("/withdrawals/{withdrawal_id}/approve", response_model=WithdrawalResponse)
def approve_withdrawal(
    withdrawal_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> WithdrawalResponse:
    _limit_admin(db, admin)
    item = WithdrawalService.approve(db, admin=admin, withdrawal_id=withdrawal_id)
    db.commit()
    db.refresh(item)
    return _withdrawal_response(item)


@router.post("/withdrawals/{withdrawal_id}/complete", response_model=WithdrawalResponse)
def complete_withdrawal(
    withdrawal_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> WithdrawalResponse:
    _limit_admin(db, admin)
    item = WithdrawalService.complete(db, admin=admin, withdrawal_id=withdrawal_id)
    db.commit()
    db.refresh(item)
    return _withdrawal_response(item)


@router.post("/withdrawals/{withdrawal_id}/reject", response_model=WithdrawalResponse)
def reject_withdrawal(
    withdrawal_id: UUID,
    payload: WithdrawalDecisionRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> WithdrawalResponse:
    _limit_admin(db, admin)
    item = WithdrawalService.reject(
        db, admin=admin, withdrawal_id=withdrawal_id, reason=payload.reason
    )
    db.commit()
    db.refresh(item)
    return _withdrawal_response(item)


@router.post("/withdrawals/{withdrawal_id}/fail", response_model=WithdrawalResponse)
def fail_withdrawal(
    withdrawal_id: UUID,
    payload: WithdrawalDecisionRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> WithdrawalResponse:
    _limit_admin(db, admin)
    item = WithdrawalService.fail(
        db, admin=admin, withdrawal_id=withdrawal_id, reason=payload.reason
    )
    db.commit()
    db.refresh(item)
    return _withdrawal_response(item)
