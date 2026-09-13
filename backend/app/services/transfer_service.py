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
from app.models.ledger_entry import LedgerEntry
from app.models.transfer import Transfer
from app.models.user import User
from app.services.idempotency_service import IdempotencyService
from app.services.transaction_service import TransactionService


class TransferService:
    @staticmethod
    def lookup_account(db: Session, account_number: str) -> tuple[Account, User]:
        row = db.execute(
            select(Account, User)
            .join(User, User.id == Account.user_id)
            .where(Account.account_number == account_number.strip())
        ).first()
        if row is None:
            raise HTTPException(status_code=404, detail="Recipient account was not found.")
        account, user = row
        if account.status != AccountStatus.ACTIVE.value or not user.is_active:
            raise HTTPException(status_code=400, detail="Recipient account is not available.")
        return account, user

    @classmethod
    def create_transfer(
        cls,
        db: Session,
        *,
        user: User,
        recipient_account_number: str,
        amount: Decimal,
        narration: str | None = None,
        idempotency_key: str,
    ) -> tuple[Transfer, User]:
        if amount <= Decimal("0.00"):
            raise HTTPException(status_code=400, detail="Transfer amount must be greater than zero.")

        narration = narration.strip() if narration else None
        recipient_number = recipient_account_number.strip()
        fingerprint = IdempotencyService.fingerprint(
            {
                "recipient_account_number": recipient_number,
                "amount": str(amount),
                "narration": narration,
            }
        )
        record, is_new = IdempotencyService.claim(
            db,
            user_id=user.id,
            scope="transfer.create",
            key=idempotency_key,
            fingerprint=fingerprint,
        )
        if not is_new:
            if record.resource_type != "transfer" or record.resource_id is None:
                raise HTTPException(status_code=409, detail="This transfer request is still being resolved.")
            transfer = db.get(Transfer, record.resource_id)
            if transfer is None:
                raise HTTPException(status_code=409, detail="Idempotent transfer resource was not found.")
            recipient_user = db.get(User, transfer.recipient_account.user_id)
            if recipient_user is None:
                raise HTTPException(status_code=409, detail="Transfer recipient was not found.")
            return transfer, recipient_user

        recipient_preview, recipient_user = cls.lookup_account(db, recipient_number)
        sender_id = user.account.id
        recipient_id = recipient_preview.id

        if sender_id == recipient_id:
            raise HTTPException(status_code=400, detail="You cannot transfer to the same account.")

        account_ids: list[UUID] = sorted([sender_id, recipient_id], key=str)
        locked_accounts = db.scalars(
            select(Account)
            .where(Account.id.in_(account_ids))
            .order_by(Account.id)
            .with_for_update()
            .execution_options(populate_existing=True)
        ).all()
        account_map = {item.id: item for item in locked_accounts}
        sender = account_map.get(sender_id)
        recipient = account_map.get(recipient_id)

        if sender is None or recipient is None:
            raise HTTPException(status_code=409, detail="One of the accounts is no longer available.")
        if sender.status != AccountStatus.ACTIVE.value:
            raise HTTPException(status_code=403, detail="Your account is not active.")
        if recipient.status != AccountStatus.ACTIVE.value:
            raise HTTPException(status_code=400, detail="Recipient account is not active.")
        if sender.currency != recipient.currency:
            raise HTTPException(status_code=400, detail="Cross-currency transfers are not supported yet.")
        if sender.available_balance < amount:
            raise HTTPException(status_code=400, detail="Insufficient available balance.")

        sender.available_balance -= amount
        recipient.available_balance += amount

        transaction = TransactionService.create(
            db,
            transaction_type=TransactionType.TRANSFER.value,
            amount=amount,
            currency=sender.currency,
            status=TransactionStatus.COMPLETED.value,
            description=narration or f"Transfer to {recipient.account_number}",
            prefix="TRF",
        )
        transfer = Transfer(
            transaction_id=transaction.id,
            sender_account_id=sender.id,
            recipient_account_id=recipient.id,
            amount=amount,
            narration=narration,
        )
        db.add(transfer)
        db.add_all(
            [
                LedgerEntry(
                    transaction_id=transaction.id,
                    account_id=sender.id,
                    entry_type=LedgerEntryType.DEBIT.value,
                    amount=amount,
                    balance_after=sender.available_balance,
                ),
                LedgerEntry(
                    transaction_id=transaction.id,
                    account_id=recipient.id,
                    entry_type=LedgerEntryType.CREDIT.value,
                    amount=amount,
                    balance_after=recipient.available_balance,
                ),
            ]
        )
        db.flush()
        IdempotencyService.bind(record, resource_type="transfer", resource_id=transfer.id)
        db.flush()
        return transfer, recipient_user
