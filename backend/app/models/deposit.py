from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.enums.deposit_status import DepositStatus

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.payment import Payment
    from app.models.transaction import Transaction
    from app.models.user import User


class Deposit(Base):
    __tablename__ = "deposits"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False)
    account_id: Mapped[UUID] = mapped_column(ForeignKey("accounts.id", ondelete="RESTRICT"), index=True, nullable=False)
    transaction_id: Mapped[UUID | None] = mapped_column(ForeignKey("transactions.id", ondelete="SET NULL"), unique=True, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    status: Mapped[str] = mapped_column(String(30), index=True, nullable=False, default=DepositStatus.AWAITING_PAYMENT.value)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="deposits")
    account: Mapped["Account"] = relationship(back_populates="deposits")
    transaction: Mapped["Transaction | None"] = relationship(back_populates="deposit")
    payments: Mapped[list["Payment"]] = relationship(back_populates="deposit")
