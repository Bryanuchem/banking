from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.enums.withdrawal_status import WithdrawalStatus


class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    account_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    transaction_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("transactions.id", ondelete="SET NULL"), unique=True, index=True, nullable=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    fee_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=Decimal("0.00"))
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    destination_bank_name: Mapped[str] = mapped_column(String(120), nullable=False)
    destination_account_number: Mapped[str] = mapped_column(String(30), nullable=False)
    destination_account_name: Mapped[str] = mapped_column(String(150), nullable=False)
    external_reference: Mapped[str | None] = mapped_column(
        String(120), nullable=True, index=True
    )
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), index=True, nullable=False, default=WithdrawalStatus.PENDING.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="withdrawals")
    account: Mapped["Account"] = relationship(back_populates="withdrawals")
    transaction: Mapped["Transaction | None"] = relationship(back_populates="withdrawal")
    payments: Mapped[list["Payment"]] = relationship(back_populates="withdrawal")
