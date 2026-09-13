from __future__ import annotations

from decimal import Decimal
from uuid import uuid4

from sqlalchemy.orm import Session

from app.enums.account_status import AccountStatus
from app.enums.ledger_entry_type import LedgerEntryType
from app.enums.transaction_status import TransactionStatus
from app.enums.transaction_type import TransactionType
from app.models.account import Account
from app.models.ledger_entry import LedgerEntry
from app.models.user import User
from app.services.transaction_service import TransactionService


def make_user(
    db: Session,
    *,
    email: str,
    account_number: str,
    balance: Decimal = Decimal("0.00"),
    is_admin: bool = False,
) -> User:
    user = User(
        email=email,
        password_hash="integration-test-hash",
        first_name="Integration",
        last_name="User",
        is_active=True,
        is_verified=True,
        is_admin=is_admin,
    )
    account = Account(
        user=user,
        account_number=account_number,
        currency="USD",
        available_balance=Decimal("0.00"),
        held_balance=Decimal("0.00"),
        status=AccountStatus.ACTIVE.value,
    )
    db.add_all([user, account])
    db.flush()

    if balance > Decimal("0.00"):
        transaction = TransactionService.create(
            db,
            transaction_type=TransactionType.ADMIN_CREDIT.value,
            amount=balance,
            currency="USD",
            status=TransactionStatus.COMPLETED.value,
            description="Integration test opening balance",
            prefix="TST",
        )
        account.available_balance = balance
        db.add(
            LedgerEntry(
                transaction_id=transaction.id,
                account_id=account.id,
                entry_type=LedgerEntryType.CREDIT.value,
                amount=balance,
                balance_after=balance,
            )
        )
    db.commit()
    db.refresh(user)
    db.refresh(account)
    return user
