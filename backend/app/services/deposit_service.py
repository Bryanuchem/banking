from __future__ import annotations
from datetime import UTC, datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.enums.account_status import AccountStatus
from app.enums.deposit_status import DepositStatus
from app.enums.ledger_entry_type import LedgerEntryType
from app.enums.transaction_status import TransactionStatus
from app.enums.transaction_type import TransactionType
from app.models.account import Account
from app.models.deposit import Deposit
from app.models.ledger_entry import LedgerEntry
from app.models.user import User
from app.services.idempotency_service import IdempotencyService
from app.services.notification_service import NotificationService
from app.services.transaction_service import TransactionService
if TYPE_CHECKING:
    from app.models.payment import Payment
MONEY=Decimal("0.01")

class DepositService:
    @classmethod
    def create_request(cls, db: Session, *, user: User, amount: Decimal, idempotency_key: str) -> Deposit:
        amount=amount.quantize(MONEY)
        if amount <= Decimal("0.00"):
            raise HTTPException(status_code=400, detail="Deposit amount must be greater than zero.")
        fingerprint=IdempotencyService.fingerprint({"amount":str(amount)})
        record,is_new=IdempotencyService.claim(db,user_id=user.id,scope="deposit:create",key=idempotency_key,fingerprint=fingerprint)
        if not is_new:
            if record.resource_type!="deposit" or record.resource_id is None:
                raise HTTPException(status_code=409, detail="This deposit request is still being resolved.")
            item=db.get(Deposit,record.resource_id)
            if item is None: raise HTTPException(status_code=409, detail="Idempotent deposit resource was not found.")
            return item
        account=db.scalar(select(Account).where(Account.id==user.account.id).with_for_update().execution_options(populate_existing=True))
        if account is None: raise HTTPException(status_code=404, detail="Account was not found.")
        if account.status!=AccountStatus.ACTIVE.value: raise HTTPException(status_code=403, detail="Your account is not active.")
        item=Deposit(user_id=user.id,account_id=account.id,amount=amount,currency=account.currency,status=DepositStatus.AWAITING_PAYMENT.value)
        db.add(item); db.flush(); IdempotencyService.bind(record,resource_type="deposit",resource_id=item.id); db.flush(); return item

    @classmethod
    def get_for_user(cls, db: Session, *, user: User, deposit_id: UUID) -> Deposit:
        item=db.scalar(select(Deposit).where(Deposit.id==deposit_id,Deposit.user_id==user.id))
        if item is None: raise HTTPException(status_code=404, detail="Deposit not found.")
        return item

    @classmethod
    def complete_verified_payment(cls, db: Session, *, deposit_id: UUID, payment: "Payment") -> Deposit:
        item=db.scalar(select(Deposit).where(Deposit.id==deposit_id).with_for_update().execution_options(populate_existing=True))
        if item is None: raise HTTPException(status_code=409, detail="Deposit attached to payment was not found.")
        if item.status==DepositStatus.COMPLETED.value: return item
        if payment.deposit_id!=item.id: raise HTTPException(status_code=409, detail="Payment is not attached to this deposit.")
        if payment.amount!=item.amount: raise HTTPException(status_code=409, detail="Deposit payment amount does not match.")
        if payment.currency.upper()!=item.currency.upper(): raise HTTPException(status_code=409, detail="Deposit payment currency does not match.")
        account=db.scalar(select(Account).where(Account.id==item.account_id).with_for_update().execution_options(populate_existing=True))
        if account is None: raise HTTPException(status_code=409, detail="Deposit account was not found.")
        account.available_balance += item.amount
        transaction=TransactionService.create(db,transaction_type=TransactionType.DEPOSIT.value,amount=item.amount,currency=item.currency,status=TransactionStatus.COMPLETED.value,description=f"Account deposit via {payment.provider.value}",prefix="DEP")
        db.add(LedgerEntry(transaction_id=transaction.id,account_id=account.id,entry_type=LedgerEntryType.CREDIT.value,amount=item.amount,balance_after=account.available_balance))
        item.transaction_id=transaction.id; item.status=DepositStatus.COMPLETED.value; item.completed_at=datetime.now(UTC); db.flush()
        NotificationService.safe_notify_user(
            db, user_id=item.user_id, title="Deposit completed",
            message=f"Your deposit of {item.currency} {item.amount:,.2f} is now available.",
            event_type="deposit.completed", category="financial", severity="success", action_url="/activity",
            metadata={"amount": str(item.amount), "currency": item.currency, "reference": transaction.reference},
        )
        return item
