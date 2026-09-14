from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.enums.account_status import AccountStatus
from app.enums.ledger_entry_type import LedgerEntryType
from app.enums.transaction_status import TransactionStatus
from app.enums.transaction_type import TransactionType
from app.models.account import Account
from app.models.audit_log import AuditLog
from app.models.ledger_entry import LedgerEntry
from app.models.transaction import Transaction
from app.models.user import User
from app.services.idempotency_service import IdempotencyService
from app.services.notification_service import NotificationService
from app.services.transaction_service import TransactionService


class AdminAccountService:
    @staticmethod
    def credit_account(
        db: Session,
        *,
        admin: User,
        account_id: UUID,
        amount: Decimal,
        description: str,
        idempotency_key: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[Account, Transaction]:
        if not admin.is_admin:
            raise HTTPException(status_code=403, detail="Administrator access is required.")
        if amount <= Decimal("0.00"):
            raise HTTPException(status_code=400, detail="Credit amount must be greater than zero.")

        fingerprint = IdempotencyService.fingerprint(
            {"account_id": str(account_id), "amount": str(amount), "description": description}
        )
        record, is_new = IdempotencyService.claim(
            db,
            user_id=admin.id,
            scope="admin.account_credit",
            key=idempotency_key,
            fingerprint=fingerprint,
        )
        if not is_new:
            if record.resource_type != "transaction" or record.resource_id is None:
                raise HTTPException(status_code=409, detail="This admin credit is still being resolved.")
            transaction = db.get(Transaction, record.resource_id)
            account = db.get(Account, account_id)
            if transaction is None or account is None:
                raise HTTPException(status_code=409, detail="Idempotent admin credit resource was not found.")
            return account, transaction

        account = db.scalar(select(Account).where(Account.id == account_id).with_for_update())
        if account is None:
            raise HTTPException(status_code=404, detail="Account was not found.")
        if account.status != AccountStatus.ACTIVE.value:
            raise HTTPException(status_code=400, detail="Only active accounts can be credited.")

        account.available_balance += amount
        transaction = TransactionService.create(
            db,
            transaction_type=TransactionType.ADMIN_CREDIT.value,
            amount=amount,
            currency=account.currency,
            status=TransactionStatus.COMPLETED.value,
            description=description,
            prefix="ADM",
        )
        db.add(
            LedgerEntry(
                transaction_id=transaction.id,
                account_id=account.id,
                entry_type=LedgerEntryType.CREDIT.value,
                amount=amount,
                balance_after=account.available_balance,
            )
        )
        db.add(
            AuditLog(
                user_id=admin.id,
                action="account.admin_credit",
                entity_type="account",
                entity_id=account.id,
                ip_address=ip_address,
                user_agent=user_agent,
                details={
                    "transaction_id": str(transaction.id),
                    "reference": transaction.reference,
                    "amount": str(amount),
                    "currency": account.currency,
                    "balance_after": str(account.available_balance),
                    "description": description,
                },
            )
        )
        db.flush()
        NotificationService.safe_notify_user(
            db, user_id=account.user_id,
            title="Account credited",
            message=f"Your account was credited with {account.currency} {amount:,.2f}.",
            event_type="account.credited", category="financial", severity="success",
            action_url="/activity",
            metadata={"amount": str(amount), "currency": account.currency, "reference": transaction.reference},
        )
        IdempotencyService.bind(record, resource_type="transaction", resource_id=transaction.id)
        db.flush()
        return account, transaction
