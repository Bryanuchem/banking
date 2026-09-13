import secrets
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.transaction import Transaction


class TransactionService:
    @staticmethod
    def generate_reference(db: Session, prefix: str = "TXN") -> str:
        prefix = prefix.strip().upper()[:8] or "TXN"
        for _ in range(20):
            reference = f"{prefix}-{secrets.token_hex(6).upper()}"
            if db.scalar(select(Transaction.id).where(Transaction.reference == reference)) is None:
                return reference
        raise RuntimeError("Unable to generate a unique transaction reference.")

    @classmethod
    def create(
        cls,
        db: Session,
        *,
        transaction_type: str,
        amount: Decimal,
        currency: str,
        status: str,
        description: str | None = None,
        prefix: str = "TXN",
    ) -> Transaction:
        item = Transaction(
            reference=cls.generate_reference(db, prefix),
            type=transaction_type,
            amount=amount,
            currency=currency,
            status=status,
            description=description,
        )
        db.add(item)
        db.flush()
        return item
