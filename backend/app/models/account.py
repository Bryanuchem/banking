from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.enums.account_status import AccountStatus

if TYPE_CHECKING:
    from app.models.deposit import Deposit
    from app.models.ledger_entry import LedgerEntry
    from app.models.transfer import Transfer
    from app.models.user import User
    from app.models.withdrawal import Withdrawal


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    account_number: Mapped[str] = mapped_column(String(20), unique=True, index=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    available_balance: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), nullable=False, default=Decimal("0.00")
    )
    held_balance: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), nullable=False, default=Decimal("0.00"), server_default="0.00"
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default=AccountStatus.ACTIVE.value
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    deletion_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)

    user: Mapped["User"] = relationship(back_populates="account")
    ledger_entries: Mapped[list["LedgerEntry"]] = relationship(back_populates="account")
    outgoing_transfers: Mapped[list["Transfer"]] = relationship(
        back_populates="sender_account", foreign_keys="Transfer.sender_account_id"
    )
    incoming_transfers: Mapped[list["Transfer"]] = relationship(
        back_populates="recipient_account", foreign_keys="Transfer.recipient_account_id"
    )
    withdrawals: Mapped[list["Withdrawal"]] = relationship(back_populates="account")
    deposits: Mapped[list["Deposit"]] = relationship(back_populates="account")
