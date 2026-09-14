from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.constants.setting_key import SettingKeys
from app.database.dependencies import get_db
from app.enums.payment_provider import PaymentProvider
from app.models.ledger_entry import LedgerEntry
from app.models.transaction import Transaction
from app.models.user import User
from app.models.withdrawal import Withdrawal
from app.schemas.money import (
    AccountDeleteRequest,
    AccountDeletionResponse,
    AccountDeletionStatusResponse,
    AccountLookupResponse,
    AccountSummaryResponse,
    TransactionHistoryItem,
    TransferRequest,
    TransferResponse,
    WithdrawalQuoteResponse,
    WithdrawalRequest,
    WithdrawalResponse,
)
from app.schemas.payment import PaymentCheckoutResponse, PaymentClientApprovalRequest, PaymentStatusResponse
from app.services.account_deletion_service import AccountDeletionService
from app.services.idempotency_service import IdempotencyService
from app.services.payment_service import PaymentService
from app.services.rate_limit_service import RateLimitService
from app.services.transfer_service import TransferService
from app.services.withdrawal_service import WithdrawalService
from app.utils.step_up import require_step_up_if_enabled

router = APIRouter(tags=["money"])


def _withdrawal_response(item: Withdrawal) -> WithdrawalResponse:
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


@router.get("/account", response_model=AccountSummaryResponse)
def get_account(user: User = Depends(get_current_user)) -> AccountSummaryResponse:
    account = user.account
    return AccountSummaryResponse(
        id=account.id,
        account_number=account.account_number,
        currency=account.currency,
        available_balance=account.available_balance,
        held_balance=account.held_balance,
        status=account.status,
    )


@router.get(
    "/account/deletion-status",
    response_model=AccountDeletionStatusResponse,
)
def account_deletion_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AccountDeletionStatusResponse:
    account = user.account
    if account is None or account.deleted_at is not None:
        raise HTTPException(
            status_code=404,
            detail="Customer account not found.",
        )
    return AccountDeletionStatusResponse(
        **AccountDeletionService.status(db, account=account)
    )


@router.delete(
    "/account",
    response_model=AccountDeletionResponse,
)
def delete_customer_account(
    payload: AccountDeleteRequest,
    x_step_up_authorization: str | None = Header(
        default=None,
        alias="X-Step-Up-Authorization",
    ),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AccountDeletionResponse:
    account = user.account
    if account is None or account.deleted_at is not None:
        raise HTTPException(
            status_code=404,
            detail="Customer account not found.",
        )

    require_step_up_if_enabled(
        db,
        user=user,
        authorization_token=x_step_up_authorization,
        required_scope="account:delete",
    )

    item, user_deactivated = AccountDeletionService.delete(
        db,
        account_id=account.id,
        actor=user,
        confirmation=payload.confirmation,
        reason=payload.reason,
    )
    deleted_at = item.deleted_at
    db.commit()

    return AccountDeletionResponse(
        account_id=item.id,
        account_number=item.account_number,
        deleted_at=deleted_at,
        user_deactivated=user_deactivated,
        history_preserved=True,
    )


@router.get("/accounts/lookup/{account_number}", response_model=AccountLookupResponse)
def lookup_account(
    account_number: str,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AccountLookupResponse:
    RateLimitService.check(
        db, bucket="account-lookup", subject=str(user.id),
        setting_key=SettingKeys.RATE_LIMIT_ACCOUNT_LOOKUP_PER_MINUTE,
        default_limit=30, window_seconds=60,
    )
    account, owner = TransferService.lookup_account(db, account_number)
    return AccountLookupResponse(
        account_number=account.account_number,
        account_name=f"{owner.first_name} {owner.last_name}".strip(),
        currency=account.currency,
    )


@router.post("/transfers", response_model=TransferResponse, status_code=201)
def create_transfer(
    payload: TransferRequest,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransferResponse:
    RateLimitService.check(
        db, bucket="transfer", subject=str(user.id),
        setting_key=SettingKeys.RATE_LIMIT_TRANSFER_PER_MINUTE,
        default_limit=10, window_seconds=60,
    )
    key = IdempotencyService.require_key(idempotency_key)
    transfer, recipient_user = TransferService.create_transfer(
        db,
        user=user,
        recipient_account_number=payload.recipient_account_number,
        amount=payload.amount,
        narration=payload.narration,
        idempotency_key=key,
    )
    db.commit()
    db.refresh(transfer)
    return TransferResponse(
        id=transfer.id,
        reference=transfer.transaction.reference,
        sender_account_number=transfer.sender_account.account_number,
        recipient_account_number=transfer.recipient_account.account_number,
        recipient_name=f"{recipient_user.first_name} {recipient_user.last_name}".strip(),
        amount=transfer.amount,
        currency=transfer.transaction.currency,
        narration=transfer.narration,
        status=transfer.transaction.status,
        created_at=transfer.created_at,
    )


@router.get("/transactions", response_model=list[TransactionHistoryItem])
def transaction_history(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    transaction_type: str | None = Query(default=None, alias="type"),
    status: str | None = Query(default=None),
    direction: str | None = Query(default=None),
    search: str | None = Query(default=None, max_length=120),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TransactionHistoryItem]:
    statement = (
        select(LedgerEntry, Transaction)
        .join(Transaction, Transaction.id == LedgerEntry.transaction_id)
        .where(LedgerEntry.account_id == user.account.id)
    )

    if transaction_type:
        statement = statement.where(Transaction.type == transaction_type)

    if status:
        statement = statement.where(Transaction.status == status)

    if direction:
        statement = statement.where(LedgerEntry.entry_type == direction)

    if search and search.strip():
        term = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Transaction.reference.ilike(term),
                Transaction.description.ilike(term),
            )
        )

    rows = db.execute(
        statement
        .order_by(LedgerEntry.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()

    return [
        TransactionHistoryItem(
            id=transaction.id,
            reference=transaction.reference,
            type=transaction.type,
            direction=entry.entry_type,
            amount=entry.amount,
            currency=transaction.currency,
            status=transaction.status,
            description=transaction.description,
            balance_after=entry.balance_after,
            created_at=entry.created_at,
        )
        for entry, transaction in rows
    ]


@router.get(
    "/transactions/{transaction_id}",
    response_model=TransactionHistoryItem,
)
def transaction_detail(
    transaction_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TransactionHistoryItem:
    row = db.execute(
        select(LedgerEntry, Transaction)
        .join(Transaction, Transaction.id == LedgerEntry.transaction_id)
        .where(
            LedgerEntry.account_id == user.account.id,
            Transaction.id == transaction_id,
        )
    ).first()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Transaction not found.",
        )

    entry, transaction = row

    return TransactionHistoryItem(
        id=transaction.id,
        reference=transaction.reference,
        type=transaction.type,
        direction=entry.entry_type,
        amount=entry.amount,
        currency=transaction.currency,
        status=transaction.status,
        description=transaction.description,
        balance_after=entry.balance_after,
        created_at=entry.created_at,
    )


@router.get(
    "/withdrawals/quote",
    response_model=WithdrawalQuoteResponse,
)
def withdrawal_quote(
    amount: Decimal = Query(gt=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WithdrawalQuoteResponse:
    normalized = amount.quantize(Decimal("0.01"))
    fee = WithdrawalService.calculate_fee(db, normalized)
    return WithdrawalQuoteResponse(
        amount=normalized,
        fee_amount=fee,
        currency=user.account.currency,
        recipient_receives=normalized,
    )


@router.post("/withdrawals", response_model=WithdrawalResponse, status_code=201)
def create_withdrawal(
    payload: WithdrawalRequest,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WithdrawalResponse:
    RateLimitService.check(
        db, bucket="withdrawal", subject=str(user.id),
        setting_key=SettingKeys.RATE_LIMIT_WITHDRAWAL_PER_HOUR,
        default_limit=5, window_seconds=3600,
    )
    key = IdempotencyService.require_key(idempotency_key)
    item = WithdrawalService.create_request(
        db,
        user=user,
        idempotency_key=key,
        **payload.model_dump(),
    )
    db.commit()
    db.refresh(item)
    return _withdrawal_response(item)


@router.post("/withdrawals/{withdrawal_id}/cancel", response_model=WithdrawalResponse)
def cancel_withdrawal(
    withdrawal_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WithdrawalResponse:
    item = WithdrawalService.cancel_by_user(db, user=user, withdrawal_id=withdrawal_id)
    db.commit()
    db.refresh(item)
    return _withdrawal_response(item)


@router.get("/withdrawals", response_model=list[WithdrawalResponse])
def list_withdrawals(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[WithdrawalResponse]:
    items = db.scalars(
        select(Withdrawal)
        .where(Withdrawal.user_id == user.id)
        .order_by(Withdrawal.created_at.desc())
        .offset(offset)
        .limit(limit)
    ).all()
    return [_withdrawal_response(item) for item in items]


@router.get(
    "/withdrawals/{withdrawal_id}",
    response_model=WithdrawalResponse,
)
def get_withdrawal(
    withdrawal_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WithdrawalResponse:
    item = db.scalar(
        select(Withdrawal).where(
            Withdrawal.id == withdrawal_id,
            Withdrawal.user_id == user.id,
        )
    )
    if item is None:
        raise HTTPException(
            status_code=404,
            detail="Withdrawal not found.",
        )
    return _withdrawal_response(item)


@router.get(
    "/payments/providers",
    response_model=list[PaymentProvider],
)
def payment_providers(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[PaymentProvider]:
    return PaymentService.available_providers(db)


@router.post("/withdrawals/{withdrawal_id}/fee-payment", response_model=PaymentCheckoutResponse, status_code=201)
def initialize_withdrawal_fee_payment(
    withdrawal_id: UUID,
    provider: PaymentProvider | None = Query(default=None),
    x_step_up_authorization: str | None = Header(default=None, alias="X-Step-Up-Authorization"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentCheckoutResponse:
    RateLimitService.check(
        db, bucket="payment-init", subject=str(user.id),
        setting_key=SettingKeys.RATE_LIMIT_PAYMENT_PER_HOUR,
        default_limit=10, window_seconds=3600,
    )
    require_step_up_if_enabled(
        db,
        user=user,
        authorization_token=x_step_up_authorization,
        required_scope="payment:create",
    )
    payment, checkout = PaymentService.initialize_withdrawal_fee(
        db,
        user=user,
        withdrawal_id=withdrawal_id,
        provider_name=provider,
    )
    db.commit()
    db.refresh(payment)
    return PaymentCheckoutResponse(
        id=payment.id,
        reference=payment.provider_reference or payment.internal_reference,
        amount=payment.amount,
        currency=payment.currency,
        status=payment.status,
        provider=payment.provider,
        authorization_url=checkout.authorization_url or "",
        access_code=checkout.access_code,
        checkout_data=checkout.metadata,
        created_at=payment.created_at,
    )


@router.post("/payments/{payment_id}/client-approval", response_model=PaymentStatusResponse)
def complete_payment_client_approval(
    payment_id: UUID,
    payload: PaymentClientApprovalRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentStatusResponse:
    payment = PaymentService.complete_customer_approval(
        db, user=user, payment_id=payment_id, approval_data=payload.model_dump()
    )
    db.commit()
    db.refresh(payment)
    return PaymentStatusResponse(
        id=payment.id,
        reference=payment.provider_reference or payment.internal_reference,
        amount=payment.amount,
        currency=payment.currency,
        status=payment.status,
        provider=payment.provider,
        paid_at=payment.paid_at,
    )


@router.get("/payments/{reference}/verify", response_model=PaymentStatusResponse)
def verify_payment(
    reference: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PaymentStatusResponse:
    payment = PaymentService.verify_payment(db, reference)
    if payment.user_id != user.id:
        raise HTTPException(status_code=404, detail="Payment not found.")
    db.commit()
    db.refresh(payment)
    return PaymentStatusResponse(
        id=payment.id,
        reference=payment.provider_reference or payment.internal_reference,
        amount=payment.amount,
        currency=payment.currency,
        status=payment.status,
        provider=payment.provider,
        paid_at=payment.paid_at,
    )


@router.post("/payments/{provider}/webhook", include_in_schema=False)
async def payment_webhook(
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    raw_body = await request.body()
    try:
        event = await request.json()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook payload.") from exc
    PaymentService.process_webhook(
        db,
        provider_name=provider,
        raw_body=raw_body,
        headers=request.headers,
        event=event,
    )
    db.commit()
    return {"status": "ok"}
