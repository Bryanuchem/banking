from datetime import date
from io import StringIO
import csv
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.utils.step_up import require_step_up_if_enabled
from app.utils.tokens import decode_token
from app.database.dependencies import get_db
from app.models.account import Account
from app.enums.payment_status import PaymentStatus
from app.models.deposit import Deposit
from app.models.ledger_entry import LedgerEntry
from app.models.payment import Payment
from app.models.transaction import Transaction
from app.models.transfer import Transfer
from app.models.user import User
from app.schemas.admin_ops import (
    AdminAccountDetail, AdminAccountItem, AdminAccountListResponse, AdminAccountOwner,
    AdminAccountStateRequest, AdminAuditLogItem, AdminAuditLogListResponse,
    AdminDashboardAccountSummary, AdminDashboardFinancialSummary, AdminDashboardSummary,
    AdminDashboardUserSummary, AdminDashboardWithdrawalSummary,
    AdminDeleteCustomerAccountRequest,
    AdminDeleteCustomerAccountResponse, AdminDepositDetail, AdminDepositItem,
    AdminDepositListResponse, AdminDepositPaymentAttempt, AdminFinancialAccount,
    AdminFinancialParty, AdminLedgerEntryItem, AdminLinkedAccount, AdminPaymentDetail,
    AdminPaymentItem, AdminPaymentListResponse, AdminTransactionDetail,
    AdminTransactionItem, AdminTransactionListResponse, AdminTransferDetail,
    AdminTransferItem, AdminTransferListResponse, AdminUserDetail, AdminUserItem,
    AdminUserListResponse, AdminUserStateRequest,
    AdminWithdrawalActivity, AdminWithdrawalApproveRequest,
    AdminWithdrawalCompleteRequest, AdminWithdrawalDetail,
    AdminWithdrawalFailRequest, AdminWithdrawalFeePayment,
    AdminWithdrawalItem, AdminWithdrawalListResponse,
    AdminWithdrawalRejectRequest, PageMeta,
)
from app.schemas.reconciliation import AccountReconciliationResult
from app.schemas.settings_admin import (
    AdminProviderDetail,
    AdminProviderSummary,
    AdminProviderUpdateRequest,
    AdminSettingBatchUpdateRequest,
    AdminSettingBatchUpdateResponse,
    AdminSettingItem,
    AdminSettingUpdateRequest,
    AdminTestEmailRequest,
    AdminTestEmailResponse,
)
from app.services.account_deletion_service import AccountDeletionService
from app.services.admin_control_service import AdminControlService
from app.services.admin_query_service import AdminQueryService
from app.services.admin_settings_service import AdminSettingsService
from app.services.admin_security_service import AdminSecurityService
from app.services.email_service import EmailService
from app.services.reconciliation_service import ReconciliationService
from app.services.notification_service import NotificationService
from app.services.withdrawal_service import WithdrawalService
from app.schemas.admin_security import (
    AdminAdministratorItem,
    AdminAdministratorListResponse,
    AdminAdministratorStateRequest,
    AdminAuditLogItemV2,
    AdminAuditLogListResponseV2,
    AdminCreateAdministratorRequest,
    AdminPromoteCustomerRequest,
    AdminReconciliationReport,
    AdminReconciliationRunResponse,
    AdminRevokeSessionsResponse,
    AdminSecurityOverview,
    AdminSessionItem,
    AdminSessionListResponse,
)

router = APIRouter(prefix="/admin", tags=["admin-operations"])


def _current_session_id(request: Request) -> UUID | None:
    authorization = request.headers.get("authorization", "")
    token = authorization.split(" ", 1)[1] if " " in authorization else ""
    payload = decode_token(token, "access")
    if not payload:
        return None
    try:
        return UUID(str(payload["sid"]))
    except (KeyError, ValueError):
        return None


def _require_admin_step_up(
    db: Session,
    *,
    admin: User,
    authorization_token: str | None,
    scope: str,
) -> None:
    require_step_up_if_enabled(
        db,
        user=admin,
        authorization_token=authorization_token,
        required_scope=scope,
    )


def _administrator_view(db: Session, user: User) -> AdminAdministratorItem:
    overview, _ = AdminSecurityService.administrators(
        db,
        q=user.email,
        status=None,
        two_factor=None,
        limit=5,
        offset=0,
    )
    item = next(
        (row for row in overview if row["id"] == user.id),
        None,
    )
    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Administrator not found.",
        )
    return AdminAdministratorItem(**item)


def _session_view(
    item,
    user,
    current_session_id: UUID | None,
) -> AdminSessionItem:
    return AdminSessionItem(
        id=item.id,
        user_id=user.id,
        user_name=f"{user.first_name} {user.last_name}".strip(),
        email=user.email,
        user_type="administrator" if user.is_admin else "customer",
        ip_address=item.ip_address,
        user_agent=item.user_agent,
        created_at=item.created_at,
        last_seen_at=item.last_seen_at,
        expires_at=item.expires_at,
        revoked_at=item.revoked_at,
        status=AdminSecurityService.session_status(item),
        current=item.id == current_session_id,
    )


def _audit_view(item) -> AdminAuditLogItemV2:
    return AdminAuditLogItemV2(
        id=item.id,
        actor_id=item.user_id,
        actor_name=(
            f"{item.user.first_name} {item.user.last_name}".strip()
            if item.user
            else None
        ),
        actor_email=item.user.email if item.user else None,
        action=item.action,
        entity_type=item.entity_type,
        entity_id=item.entity_id,
        ip_address=item.ip_address,
        user_agent=item.user_agent,
        details=item.details,
        created_at=item.created_at,
    )


def _page(total: int, limit: int, offset: int) -> PageMeta:
    return PageMeta(total=total, limit=limit, offset=offset)


def _party(user: User) -> AdminFinancialParty:
    return AdminFinancialParty(
        user_id=user.id,
        name=f"{user.first_name} {user.last_name}".strip(),
        email=user.email,
        phone=user.phone,
    )


def _account(account: Account) -> AdminFinancialAccount:
    return AdminFinancialAccount(
        account_id=account.id,
        account_number=account.account_number,
        currency=account.currency,
    )


def _ledger(entry: LedgerEntry) -> AdminLedgerEntryItem:
    return AdminLedgerEntryItem(
        id=entry.id,
        entry_type=entry.entry_type,
        amount=entry.amount,
        balance_after=entry.balance_after,
        created_at=entry.created_at,
        account=_account(entry.account),
        customer=_party(entry.account.user),
    )


def _transaction_item(tx: Transaction) -> AdminTransactionItem:
    primary = None
    if tx.ledger_entries:
        primary = next((e for e in tx.ledger_entries if e.entry_type.lower() == "debit"), tx.ledger_entries[0])
    return AdminTransactionItem(
        id=tx.id, reference=tx.reference, type=tx.type, status=tx.status,
        amount=tx.amount, currency=tx.currency, description=tx.description,
        created_at=tx.created_at,
        customer=_party(primary.account.user) if primary else None,
        account=_account(primary.account) if primary else None,
    )


def _transfer_item(item: Transfer) -> AdminTransferItem:
    return AdminTransferItem(
        id=item.id, transaction_id=item.transaction_id, reference=item.transaction.reference,
        status=item.transaction.status, amount=item.amount, currency=item.transaction.currency,
        narration=item.narration, created_at=item.created_at,
        sender=_party(item.sender_account.user), sender_account=_account(item.sender_account),
        recipient=_party(item.recipient_account.user), recipient_account=_account(item.recipient_account),
    )


def _deposit_provider(item: Deposit) -> str | None:
    paid = next((p for p in item.payments if p.status == "paid"), None)
    chosen = paid or (item.payments[-1] if item.payments else None)
    return chosen.provider.value if chosen and hasattr(chosen.provider, "value") else (str(chosen.provider) if chosen else None)


def _deposit_item(item: Deposit) -> AdminDepositItem:
    return AdminDepositItem(
        id=item.id, user_id=item.user_id, account_id=item.account_id,
        transaction_id=item.transaction_id, amount=item.amount, currency=item.currency,
        status=item.status, completed_at=item.completed_at, created_at=item.created_at,
        customer=_party(item.user), account=_account(item.account), provider=_deposit_provider(item),
    )


def _payment_purpose(item: Payment) -> str:
    if item.deposit_id is not None:
        return "deposit"
    if item.withdrawal_id is not None:
        return "withdrawal_fee"
    return "other"


def _payment_item(item: Payment) -> AdminPaymentItem:
    provider = item.provider.value if hasattr(item.provider, "value") else str(item.provider)
    channel = item.channel.value if item.channel is not None and hasattr(item.channel, "value") else (str(item.channel) if item.channel else None)
    return AdminPaymentItem(
        id=item.id, user_id=item.user_id, withdrawal_id=item.withdrawal_id, deposit_id=item.deposit_id,
        provider=provider, channel=channel, provider_channel=item.provider_channel,
        internal_reference=item.internal_reference, provider_reference=item.provider_reference,
        amount=item.amount, currency=item.currency, status=item.status, purpose=_payment_purpose(item),
        paid_at=item.paid_at, created_at=item.created_at, customer=_party(item.user),
    )


@router.get("/users", response_model=AdminUserListResponse)
def users(q: str | None = None, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, total = AdminQueryService.users(db, q=q, limit=limit, offset=offset)
    return AdminUserListResponse(items=[AdminUserItem.model_validate(item, from_attributes=True) for item in items], page=_page(total, limit, offset))


@router.get("/users/{user_id}", response_model=AdminUserDetail)
def user_detail(user_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    item = AdminQueryService.user_detail(db, user_id=user_id)
    if item is None:
        raise HTTPException(status_code=404, detail="User not found.")
    linked = AdminLinkedAccount.model_validate(item.account, from_attributes=True) if item.account else None
    return AdminUserDetail(**AdminUserItem.model_validate(item, from_attributes=True).model_dump(), account=linked)


@router.get("/dashboard/summary", response_model=AdminDashboardSummary)
def dashboard_summary(
    start_date: date | None = None,
    end_date: date | None = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if start_date and end_date and end_date < start_date:
        raise HTTPException(status_code=422, detail="end_date must be on or after start_date.")
    summary = AdminQueryService.dashboard_summary(
        db,
        start_date=start_date,
        end_date=end_date,
    )
    return AdminDashboardSummary(
        customers=AdminDashboardUserSummary(**summary["customers"]),
        accounts=AdminDashboardAccountSummary(**summary["accounts"]),
        financial=AdminDashboardFinancialSummary(**summary["financial"]),
        withdrawals=AdminDashboardWithdrawalSummary(**summary["withdrawals"]),
    )


@router.get("/dashboard/recent-financial", response_model=list[AdminTransactionItem])
def dashboard_recent_financial(
    limit: int = Query(6, ge=1, le=10),
    start_date: date | None = None,
    end_date: date | None = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if start_date and end_date and end_date < start_date:
        raise HTTPException(status_code=422, detail="end_date must be on or after start_date.")
    return [
        _transaction_item(item)
        for item in AdminQueryService.recent_transactions(
            db,
            limit=limit,
            start_date=start_date,
            end_date=end_date,
        )
    ]


@router.patch("/users/{user_id}/state", response_model=AdminUserItem)
def set_user_state(user_id: UUID, payload: AdminUserStateRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = AdminControlService.set_user_active(db, admin=admin, user_id=user_id, is_active=payload.is_active, reason=payload.reason)
    db.commit(); db.refresh(user)
    return AdminUserItem.model_validate(user, from_attributes=True)


@router.delete("/users/{user_id}/account", response_model=AdminDeleteCustomerAccountResponse)
def delete_customer_account_as_admin(user_id: UUID, payload: AdminDeleteCustomerAccountRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    account = db.scalar(select(Account).where(Account.user_id == user_id, Account.deleted_at.is_(None)))
    if account is None:
        raise HTTPException(status_code=404, detail="Active customer account not found.")
    item, user_deactivated = AccountDeletionService.delete(db, account_id=account.id, actor=admin, confirmation=payload.confirmation, reason=payload.reason)
    deleted_at = item.deleted_at; db.commit()
    return AdminDeleteCustomerAccountResponse(account_id=item.id, account_number=item.account_number, deleted_at=deleted_at, user_deactivated=user_deactivated, history_preserved=True)


@router.get("/accounts", response_model=AdminAccountListResponse)
def accounts(q: str | None = None, status: str | None = None, limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, total = AdminQueryService.accounts(db, q=q, status=status, limit=limit, offset=offset)
    return AdminAccountListResponse(items=[AdminAccountItem(
        id=item.id, user_id=item.user_id, account_number=item.account_number, currency=item.currency,
        available_balance=item.available_balance, held_balance=item.held_balance, status=item.status,
        created_at=item.created_at, owner=AdminAccountOwner.model_validate(item.user, from_attributes=True),
    ) for item in items], page=_page(total, limit, offset))


@router.get("/accounts/{account_id}", response_model=AdminAccountDetail)
def account_detail(account_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    item = AdminQueryService.account_detail(db, account_id=account_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Account not found.")
    return AdminAccountDetail(
        id=item.id, user_id=item.user_id, account_number=item.account_number, currency=item.currency,
        available_balance=item.available_balance, held_balance=item.held_balance, status=item.status,
        created_at=item.created_at, owner=AdminAccountOwner.model_validate(item.user, from_attributes=True),
    )


@router.patch("/accounts/{account_id}/state", response_model=AdminAccountItem)
def set_account_state(account_id: UUID, payload: AdminAccountStateRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    account = AdminControlService.set_account_status(db, admin=admin, account_id=account_id, status=payload.status, reason=payload.reason)
    db.commit(); db.refresh(account); db.refresh(account.user)
    return AdminAccountItem(
        id=account.id, user_id=account.user_id, account_number=account.account_number, currency=account.currency,
        available_balance=account.available_balance, held_balance=account.held_balance, status=account.status,
        created_at=account.created_at, owner=AdminAccountOwner.model_validate(account.user, from_attributes=True),
    )


@router.get("/transactions", response_model=AdminTransactionListResponse)
def transactions(q: str | None = None, status: str | None = None, tx_type: str | None = None, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, total = AdminQueryService.transactions(db, q=q, status=status, tx_type=tx_type, limit=limit, offset=offset)
    return AdminTransactionListResponse(items=[_transaction_item(item) for item in items], page=_page(total, limit, offset))


@router.get("/transactions/{transaction_id}", response_model=AdminTransactionDetail)
def transaction_detail(transaction_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    item = AdminQueryService.transaction_detail(db, transaction_id=transaction_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    base = _transaction_item(item)
    return AdminTransactionDetail(**base.model_dump(), ledger_entries=[_ledger(entry) for entry in item.ledger_entries])


@router.get("/transfers", response_model=AdminTransferListResponse)
def transfers(q: str | None = None, status: str | None = None, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, total = AdminQueryService.transfers(db, q=q, status=status, limit=limit, offset=offset)
    return AdminTransferListResponse(items=[_transfer_item(item) for item in items], page=_page(total, limit, offset))


@router.get("/transfers/{transfer_id}", response_model=AdminTransferDetail)
def transfer_detail(transfer_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    item = AdminQueryService.transfer_detail(db, transfer_id=transfer_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Transfer not found.")
    base = _transfer_item(item)
    return AdminTransferDetail(**base.model_dump(), ledger_entries=[_ledger(entry) for entry in item.transaction.ledger_entries])


@router.get("/deposits", response_model=AdminDepositListResponse)
def deposits(q: str | None = None, status: str | None = None, provider: str | None = None, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, total = AdminQueryService.deposits(db, q=q, status=status, provider=provider, limit=limit, offset=offset)
    return AdminDepositListResponse(items=[_deposit_item(item) for item in items], page=_page(total, limit, offset))


@router.get("/deposits/{deposit_id}", response_model=AdminDepositDetail)
def deposit_detail(deposit_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    item = AdminQueryService.deposit_detail(db, deposit_id=deposit_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Deposit not found.")
    base = _deposit_item(item)
    attempts = [AdminDepositPaymentAttempt(
        id=p.id, provider=p.provider.value if hasattr(p.provider, "value") else str(p.provider),
        channel=p.channel.value if p.channel is not None and hasattr(p.channel, "value") else (str(p.channel) if p.channel else None),
        provider_channel=p.provider_channel, internal_reference=p.internal_reference, provider_reference=p.provider_reference,
        amount=p.amount, currency=p.currency, status=p.status, paid_at=p.paid_at, created_at=p.created_at,
    ) for p in sorted(item.payments, key=lambda value: value.created_at, reverse=True)]
    ledger_entries = [_ledger(entry) for entry in item.transaction.ledger_entries] if item.transaction else []
    return AdminDepositDetail(
        **base.model_dump(), payment_attempts=attempts,
        transaction_reference=item.transaction.reference if item.transaction else None,
        ledger_entries=ledger_entries,
    )


@router.get("/payments", response_model=AdminPaymentListResponse)
def payments(q: str | None = None, purpose: str | None = None, status: str | None = None, provider: str | None = None, limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, total = AdminQueryService.payments(db, q=q, purpose=purpose, status=status, provider=provider, limit=limit, offset=offset)
    return AdminPaymentListResponse(items=[_payment_item(item) for item in items], page=_page(total, limit, offset))


@router.get("/payments/{payment_id}", response_model=AdminPaymentDetail)
def payment_detail(payment_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    item = AdminQueryService.payment_detail(db, payment_id=payment_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Payment not found.")
    base = _payment_item(item)
    linked_reference = None
    if item.deposit is not None and item.deposit.transaction is not None:
        linked_reference = item.deposit.transaction.reference
    elif item.withdrawal is not None and item.withdrawal.transaction is not None:
        linked_reference = item.withdrawal.transaction.reference
    return AdminPaymentDetail(**base.model_dump(), linked_reference=linked_reference)



def _withdrawal_item(item) -> AdminWithdrawalItem:
    return AdminWithdrawalItem(
        id=item.id,
        user_id=item.user_id,
        account_id=item.account_id,
        transaction_id=item.transaction_id,
        amount=item.amount,
        fee_amount=item.fee_amount,
        currency=item.currency,
        status=item.status,
        destination_bank_name=item.destination_bank_name,
        destination_account_number=item.destination_account_number,
        destination_account_name=item.destination_account_name,
        external_reference=item.external_reference,
        admin_note=item.admin_note,
        created_at=item.created_at,
        updated_at=item.updated_at,
        customer=AdminFinancialParty(
            user_id=item.user.id,
            name=f"{item.user.first_name} {item.user.last_name}".strip(),
            email=item.user.email,
            phone=item.user.phone,
        ),
        account=AdminFinancialAccount(
            account_id=item.account.id,
            account_number=item.account.account_number,
            currency=item.account.currency,
        ),
    )


def _withdrawal_detail(db: Session, item) -> AdminWithdrawalDetail:
    paid = [
        payment
        for payment in item.payments
        if payment.status == PaymentStatus.PAID.value
        and payment.amount == item.fee_amount
        and payment.currency == item.currency
    ]
    paid.sort(
        key=lambda value: value.paid_at or value.created_at,
        reverse=True,
    )
    fee = paid[0] if paid else None

    activity = [
        AdminWithdrawalActivity(
            key="created",
            label="Withdrawal created",
            created_at=item.created_at,
        )
    ]

    if fee is not None:
        activity.append(
            AdminWithdrawalActivity(
                key="fee_paid",
                label="Withdrawal fee verified",
                created_at=fee.paid_at or fee.updated_at,
            )
        )
        activity.append(
            AdminWithdrawalActivity(
                key="review_queue",
                label="Entered review queue",
                created_at=fee.paid_at or fee.updated_at,
            )
        )

    for audit in AdminQueryService.withdrawal_activity(
        db,
        withdrawal_id=item.id,
    ):
        labels = {
            "withdrawal.approved": "Approved and moved to processing",
            "withdrawal.rejected": "Withdrawal rejected",
            "withdrawal.completed": "Withdrawal completed",
            "withdrawal.failed": "Withdrawal marked failed",
            "withdrawal.cancelled_by_user": "Cancelled by customer",
        }
        if audit.action not in labels:
            continue
        details = audit.details or {}
        activity.append(
            AdminWithdrawalActivity(
                key=str(audit.id),
                label=labels[audit.action],
                created_at=audit.created_at,
                actor_email=audit.user.email if audit.user else None,
                reason=details.get("reason"),
                external_reference=details.get("external_reference"),
            )
        )

    activity.sort(key=lambda entry: entry.created_at)

    base = _withdrawal_item(item)

    fee_response = None
    if fee is not None:
        fee_response = AdminWithdrawalFeePayment(
            id=fee.id,
            provider=fee.provider.value
            if hasattr(fee.provider, "value")
            else str(fee.provider),
            internal_reference=fee.internal_reference,
            provider_reference=fee.provider_reference,
            amount=fee.amount,
            currency=fee.currency,
            status=fee.status,
            paid_at=fee.paid_at,
            created_at=fee.created_at,
        )

    return AdminWithdrawalDetail(
        **base.model_dump(),
        fee_payment=fee_response,
        activity=activity,
    )


@router.get("/withdrawals", response_model=AdminWithdrawalListResponse)
def withdrawals(
    q: str | None = None,
    status: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if start_date and end_date and end_date < start_date:
        raise HTTPException(
            status_code=422,
            detail="end_date must be on or after start_date.",
        )

    items, total = AdminQueryService.withdrawals(
        db,
        q=q,
        status=status,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )
    return AdminWithdrawalListResponse(
        items=[_withdrawal_item(item) for item in items],
        page=_page(total, limit, offset),
    )


@router.get(
    "/withdrawals/{withdrawal_id}",
    response_model=AdminWithdrawalDetail,
)
def withdrawal_detail(
    withdrawal_id: UUID,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    item = AdminQueryService.withdrawal_detail(
        db,
        withdrawal_id=withdrawal_id,
    )
    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Withdrawal not found.",
        )
    return _withdrawal_detail(db, item)


@router.post(
    "/withdrawals/{withdrawal_id}/approve",
    response_model=AdminWithdrawalDetail,
)
def approve_withdrawal(
    withdrawal_id: UUID,
    payload: AdminWithdrawalApproveRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    WithdrawalService.approve(
        db,
        admin=admin,
        withdrawal_id=withdrawal_id,
        admin_note=payload.admin_note,
    )
    db.commit()

    item = AdminQueryService.withdrawal_detail(
        db,
        withdrawal_id=withdrawal_id,
    )
    return _withdrawal_detail(db, item)


@router.post(
    "/withdrawals/{withdrawal_id}/reject",
    response_model=AdminWithdrawalDetail,
)
def reject_withdrawal(
    withdrawal_id: UUID,
    payload: AdminWithdrawalRejectRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    WithdrawalService.reject(
        db,
        admin=admin,
        withdrawal_id=withdrawal_id,
        reason=payload.reason.strip(),
    )
    db.commit()

    item = AdminQueryService.withdrawal_detail(
        db,
        withdrawal_id=withdrawal_id,
    )
    return _withdrawal_detail(db, item)


@router.post(
    "/withdrawals/{withdrawal_id}/complete",
    response_model=AdminWithdrawalDetail,
)
def complete_withdrawal(
    withdrawal_id: UUID,
    payload: AdminWithdrawalCompleteRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    WithdrawalService.complete(
        db,
        admin=admin,
        withdrawal_id=withdrawal_id,
        external_reference=payload.external_reference,
        admin_note=payload.admin_note,
    )
    db.commit()

    item = AdminQueryService.withdrawal_detail(
        db,
        withdrawal_id=withdrawal_id,
    )
    return _withdrawal_detail(db, item)


@router.post(
    "/withdrawals/{withdrawal_id}/fail",
    response_model=AdminWithdrawalDetail,
)
def fail_withdrawal(
    withdrawal_id: UUID,
    payload: AdminWithdrawalFailRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    WithdrawalService.fail(
        db,
        admin=admin,
        withdrawal_id=withdrawal_id,
        reason=payload.reason.strip(),
    )
    db.commit()

    item = AdminQueryService.withdrawal_detail(
        db,
        withdrawal_id=withdrawal_id,
    )
    return _withdrawal_detail(db, item)


@router.get(
    "/audit-logs",
    response_model=AdminAuditLogListResponseV2,
)
def audit_logs(
    q: str | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    items, total = AdminSecurityService.audit_logs(
        db,
        q=q,
        action=action,
        entity_type=entity_type,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )
    return AdminAuditLogListResponseV2(
        items=[_audit_view(item) for item in items],
        total=total,
    )



@router.get(
    "/security/overview",
    response_model=AdminSecurityOverview,
)
def security_overview(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminSecurityOverview(
        **AdminSecurityService.overview(db)
    )


@router.get(
    "/administrators",
    response_model=AdminAdministratorListResponse,
)
def administrators(
    q: str | None = None,
    status: str | None = None,
    two_factor: str | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    items, total = AdminSecurityService.administrators(
        db,
        q=q,
        status=status,
        two_factor=two_factor,
        limit=limit,
        offset=offset,
    )
    return AdminAdministratorListResponse(
        items=[
            AdminAdministratorItem(**item)
            for item in items
        ],
        total=total,
    )


@router.post(
    "/administrators",
    response_model=AdminAdministratorItem,
)
def create_administrator(
    payload: AdminCreateAdministratorRequest,
    x_step_up_authorization: str | None = Header(
        default=None,
        alias="X-Step-Up-Authorization",
    ),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _require_admin_step_up(
        db,
        admin=admin,
        authorization_token=x_step_up_authorization,
        scope="admin:create",
    )
    created = AdminSecurityService.create_administrator(
        db,
        actor=admin,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        temporary_password=payload.temporary_password,
        is_active=payload.is_active,
    )
    return _administrator_view(db, created)


@router.post(
    "/administrators/promote",
    response_model=AdminAdministratorItem,
)
def promote_customer_to_administrator(
    payload: AdminPromoteCustomerRequest,
    x_step_up_authorization: str | None = Header(
        default=None,
        alias="X-Step-Up-Authorization",
    ),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _require_admin_step_up(
        db,
        admin=admin,
        authorization_token=x_step_up_authorization,
        scope="admin:promote",
    )
    promoted = AdminSecurityService.promote_customer(
        db,
        actor=admin,
        user_id=payload.user_id,
    )
    return _administrator_view(db, promoted)


@router.patch(
    "/administrators/{administrator_id}/state",
    response_model=AdminAdministratorItem,
)
def set_administrator_state(
    administrator_id: UUID,
    payload: AdminAdministratorStateRequest,
    x_step_up_authorization: str | None = Header(
        default=None,
        alias="X-Step-Up-Authorization",
    ),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _require_admin_step_up(
        db,
        admin=admin,
        authorization_token=x_step_up_authorization,
        scope="admin:state",
    )
    updated = AdminSecurityService.set_administrator_active(
        db,
        actor=admin,
        administrator_id=administrator_id,
        is_active=payload.is_active,
        reason=payload.reason,
    )
    return _administrator_view(db, updated)


@router.get(
    "/sessions",
    response_model=AdminSessionListResponse,
)
def admin_sessions(
    request: Request,
    q: str | None = None,
    user_type: str | None = None,
    status: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    rows, total = AdminSecurityService.sessions(
        db,
        q=q,
        user_type=user_type,
        status=status,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset,
    )
    current_session_id = _current_session_id(request)
    return AdminSessionListResponse(
        items=[
            _session_view(item, user, current_session_id)
            for item, user in rows
        ],
        total=total,
    )


@router.delete("/sessions/{session_id}")
def revoke_admin_session(
    session_id: UUID,
    request: Request,
    x_step_up_authorization: str | None = Header(
        default=None,
        alias="X-Step-Up-Authorization",
    ),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _require_admin_step_up(
        db,
        admin=admin,
        authorization_token=x_step_up_authorization,
        scope="admin:sessions",
    )
    AdminSecurityService.revoke_session(
        db,
        actor=admin,
        session_id=session_id,
        current_session_id=_current_session_id(request),
    )
    return {"message": "Session revoked."}


@router.delete(
    "/users/{user_id}/sessions",
    response_model=AdminRevokeSessionsResponse,
)
def revoke_all_user_sessions(
    user_id: UUID,
    request: Request,
    x_step_up_authorization: str | None = Header(
        default=None,
        alias="X-Step-Up-Authorization",
    ),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _require_admin_step_up(
        db,
        admin=admin,
        authorization_token=x_step_up_authorization,
        scope="admin:sessions",
    )
    count = AdminSecurityService.revoke_user_sessions(
        db,
        actor=admin,
        user_id=user_id,
        current_session_id=_current_session_id(request),
    )
    return AdminRevokeSessionsResponse(count=count)


@router.get(
    "/reconciliation",
    response_model=AdminReconciliationReport,
)
def admin_reconciliation(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminReconciliationReport(
        **AdminSecurityService.reconciliation_report(db)
    )


@router.post(
    "/reconciliation/run",
    response_model=AdminReconciliationRunResponse,
)
def run_admin_reconciliation(
    x_step_up_authorization: str | None = Header(
        default=None,
        alias="X-Step-Up-Authorization",
    ),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    _require_admin_step_up(
        db,
        admin=admin,
        authorization_token=x_step_up_authorization,
        scope="admin:reconciliation",
    )
    report, completed_at = (
        AdminSecurityService.run_reconciliation(
            db,
            actor=admin,
        )
    )
    if int(report["summary"]["mismatched"]) > 0:
        NotificationService.safe_notify_admins(
            db, title="Reconciliation needs attention",
            message=f"Reconciliation found {report['summary']['mismatched']} account discrepancy(ies).",
            event_type="admin.reconciliation_discrepancy", category="system", severity="danger",
            action_url="/admin/reconciliation",
        )
        db.commit()
    return AdminReconciliationRunResponse(
        report=AdminReconciliationReport(**report),
        completed_at=completed_at,
    )


@router.get("/settings", response_model=list[AdminSettingItem])
def settings(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return [
        AdminSettingItem(**item)
        for item in AdminSettingsService.list(db)
    ]


@router.patch(
    "/settings",
    response_model=AdminSettingBatchUpdateResponse,
)
def update_settings(
    payload: AdminSettingBatchUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    items = AdminSettingsService.update_many(
        db,
        updates=[
            item.model_dump()
            for item in payload.updates
        ],
        actor=admin,
    )
    return AdminSettingBatchUpdateResponse(
        items=[
            AdminSettingItem(**item)
            for item in items
        ]
    )


@router.get(
    "/settings/providers",
    response_model=list[AdminProviderSummary],
)
def payment_provider_settings(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return [
        AdminProviderSummary(**item)
        for item in AdminSettingsService.list_providers(db)
    ]


@router.get(
    "/settings/providers/{provider}",
    response_model=AdminProviderDetail,
)
def payment_provider_setting(
    provider: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminProviderDetail(
        **AdminSettingsService.provider_detail(
            db,
            provider,
        )
    )


@router.patch(
    "/settings/providers/{provider}",
    response_model=AdminProviderDetail,
)
def update_payment_provider_setting(
    provider: str,
    payload: AdminProviderUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminProviderDetail(
        **AdminSettingsService.update_provider(
            db,
            provider=provider,
            values=payload.values,
            actor=admin,
        )
    )


@router.post(
    "/settings/test-email",
    response_model=AdminTestEmailResponse,
)
def test_email_setting(
    payload: AdminTestEmailRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    EmailService.send(
        db,
        to_email=str(payload.recipient),
        subject="Banking SMTP test",
        text_body=(
            "This test email confirms that the saved "
            "Banking SMTP configuration is working."
        ),
    )
    return AdminTestEmailResponse(sent=True)


@router.patch("/settings/{key}", response_model=AdminSettingItem)
def update_setting(
    key: str,
    payload: AdminSettingUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return AdminSettingItem(
        **AdminSettingsService.update(
            db,
            key=key,
            value=payload.value,
            actor=admin,
        )
    )



@router.get("/exports/withdrawals.csv")
def export_withdrawals_csv(
    q: str | None = None,
    status: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if start_date and end_date and end_date < start_date:
        raise HTTPException(
            status_code=422,
            detail="end_date must be on or after start_date.",
        )

    items, _ = AdminQueryService.withdrawals(
        db,
        q=q,
        status=status,
        start_date=start_date,
        end_date=end_date,
        limit=EXPORT_LIMIT,
        offset=0,
    )

    return _csv_response(
        "withdrawals.csv",
        [
            "withdrawal_id",
            "customer_name",
            "customer_email",
            "account_number",
            "amount",
            "fee_amount",
            "currency",
            "destination_bank",
            "destination_account_name",
            "destination_account_number",
            "status",
            "external_reference",
            "created_at",
            "updated_at",
        ],
        (
            (
                item.id,
                f"{item.user.first_name} {item.user.last_name}".strip(),
                item.user.email,
                item.account.account_number,
                item.amount,
                item.fee_amount,
                item.currency,
                item.destination_bank_name,
                item.destination_account_name,
                item.destination_account_number,
                item.status,
                item.external_reference or "",
                item.created_at.isoformat(),
                item.updated_at.isoformat(),
            )
            for item in items
        ),
    )


@router.get("/accounts/{account_id}/reconcile", response_model=AccountReconciliationResult)
def reconcile_account(account_id: UUID, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    account = db.get(Account, account_id)
    if account is None:
        raise HTTPException(status_code=404, detail="Account not found.")
    return AccountReconciliationResult(**ReconciliationService.account(db, account))


EXPORT_LIMIT = 50_000


def _csv_response(filename: str, headers: list[str], rows) -> Response:
    buffer = StringIO(newline="")
    writer = csv.writer(buffer)
    writer.writerow(headers)
    writer.writerows(rows)
    return Response(
        content="\ufeff" + buffer.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/exports/customers.csv")
def export_customers_csv(q: str | None = None, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, _ = AdminQueryService.users(db, q=q, limit=EXPORT_LIMIT, offset=0)
    return _csv_response(
        "customers.csv",
        ["customer_id","first_name","last_name","email","phone","active","verified","administrator","created_at","last_login_at"],
        (
            (i.id,i.first_name,i.last_name,i.email,i.phone or "",i.is_active,i.is_verified,i.is_admin,i.created_at.isoformat(),i.last_login_at.isoformat() if i.last_login_at else "")
            for i in items
        ),
    )


@router.get("/exports/accounts.csv")
def export_accounts_csv(q: str | None = None, status: str | None = None, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, _ = AdminQueryService.accounts(db, q=q, status=status, limit=EXPORT_LIMIT, offset=0)
    return _csv_response(
        "accounts.csv",
        ["account_id","account_number","customer_name","customer_email","currency","available_balance","held_balance","status","created_at"],
        (
            (i.id,i.account_number,f"{i.user.first_name} {i.user.last_name}".strip(),i.user.email,i.currency,i.available_balance,i.held_balance,i.status,i.created_at.isoformat())
            for i in items
        ),
    )


@router.get("/exports/transactions.csv")
def export_transactions_csv(q: str | None = None, status: str | None = None, tx_type: str | None = None, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, _ = AdminQueryService.transactions(db, q=q, status=status, tx_type=tx_type, limit=EXPORT_LIMIT, offset=0)
    rows = []
    for item in items:
        view = _transaction_item(item)
        rows.append((
            view.id, view.reference, view.type,
            view.customer.name if view.customer else "",
            view.customer.email if view.customer else "",
            view.account.account_number if view.account else "",
            view.amount, view.currency, view.status, view.description or "",
            view.created_at.isoformat(),
        ))
    return _csv_response(
        "transactions.csv",
        ["transaction_id","reference","type","customer_name","customer_email","account_number","amount","currency","status","description","created_at"],
        rows,
    )


@router.get("/exports/transfers.csv")
def export_transfers_csv(q: str | None = None, status: str | None = None, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, _ = AdminQueryService.transfers(db, q=q, status=status, limit=EXPORT_LIMIT, offset=0)
    return _csv_response(
        "transfers.csv",
        ["transfer_id","reference","sender_name","sender_email","sender_account","recipient_name","recipient_email","recipient_account","amount","currency","status","narration","created_at"],
        (
            (
                i.id, i.transaction.reference,
                f"{i.sender_account.user.first_name} {i.sender_account.user.last_name}".strip(),
                i.sender_account.user.email, i.sender_account.account_number,
                f"{i.recipient_account.user.first_name} {i.recipient_account.user.last_name}".strip(),
                i.recipient_account.user.email, i.recipient_account.account_number,
                i.amount, i.transaction.currency, i.transaction.status, i.narration or "",
                i.created_at.isoformat(),
            )
            for i in items
        ),
    )


@router.get("/exports/deposits.csv")
def export_deposits_csv(q: str | None = None, status: str | None = None, provider: str | None = None, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, _ = AdminQueryService.deposits(db, q=q, status=status, provider=provider, limit=EXPORT_LIMIT, offset=0)
    return _csv_response(
        "deposits.csv",
        ["deposit_id","customer_name","customer_email","account_number","amount","currency","provider","status","transaction_reference","created_at","completed_at"],
        (
            (
                i.id, f"{i.user.first_name} {i.user.last_name}".strip(), i.user.email,
                i.account.account_number, i.amount, i.currency, _deposit_provider(i) or "",
                i.status, i.transaction.reference if i.transaction else "",
                i.created_at.isoformat(), i.completed_at.isoformat() if i.completed_at else "",
            )
            for i in items
        ),
    )


@router.get("/exports/payments.csv")
def export_payments_csv(q: str | None = None, purpose: str | None = None, status: str | None = None, provider: str | None = None, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    items, _ = AdminQueryService.payments(db, q=q, purpose=purpose, status=status, provider=provider, limit=EXPORT_LIMIT, offset=0)
    return _csv_response(
        "payments.csv",
        ["payment_id","purpose","customer_name","customer_email","provider","channel","provider_channel","internal_reference","provider_reference","amount","currency","status","created_at","paid_at"],
        (
            (
                i.id, _payment_purpose(i), f"{i.user.first_name} {i.user.last_name}".strip(), i.user.email,
                i.provider.value if hasattr(i.provider, "value") else str(i.provider),
                i.channel.value if i.channel is not None and hasattr(i.channel, "value") else (str(i.channel) if i.channel else ""),
                i.provider_channel or "", i.internal_reference, i.provider_reference or "",
                i.amount, i.currency, i.status, i.created_at.isoformat(),
                i.paid_at.isoformat() if i.paid_at else "",
            )
            for i in items
        ),
    )

@router.get("/exports/audit-logs.csv")
def export_audit_logs_csv(
    q: str | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    items, _ = AdminSecurityService.audit_logs(
        db,
        q=q,
        action=action,
        entity_type=entity_type,
        start_date=start_date,
        end_date=end_date,
        limit=EXPORT_LIMIT,
        offset=0,
    )
    return _csv_response(
        "audit-logs.csv",
        [
            "audit_id",
            "timestamp",
            "actor_name",
            "actor_email",
            "action",
            "entity_type",
            "entity_id",
            "ip_address",
            "details",
        ],
        (
            (
                item.id,
                item.created_at.isoformat(),
                (
                    f"{item.user.first_name} {item.user.last_name}".strip()
                    if item.user
                    else ""
                ),
                item.user.email if item.user else "",
                item.action,
                item.entity_type or "",
                item.entity_id or "",
                item.ip_address or "",
                item.details or {},
            )
            for item in items
        ),
    )


@router.get("/exports/reconciliation.csv")
def export_reconciliation_csv(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    report = AdminSecurityService.reconciliation_report(db)
    return _csv_response(
        "reconciliation.csv",
        [
            "account_id",
            "account_number",
            "customer_name",
            "actual_available",
            "expected_available",
            "available_difference",
            "actual_held",
            "expected_held",
            "held_difference",
            "status",
        ],
        (
            (
                item["account_id"],
                item["account_number"],
                item["customer_name"],
                item["actual_available_balance"],
                item["expected_available_balance"],
                item["available_difference"],
                item["actual_held_balance"],
                item["expected_held_balance"],
                item["held_difference"],
                item["status"],
            )
            for item in report["accounts"]
        ),
    )

