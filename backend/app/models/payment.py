from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.enums.payment_channel import PaymentChannel
from app.enums.payment_provider import PaymentProvider
from app.enums.payment_status import PaymentStatus

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.withdrawal import Withdrawal


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    withdrawal_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("withdrawals.id", ondelete="SET NULL"), index=True, nullable=True
    )

    provider: Mapped[PaymentProvider] = mapped_column(
        SAEnum(
            PaymentProvider,
            native_enum=False,
            create_constraint=True,
            name="payment_provider",
            length=30,
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        index=True,
        nullable=False,
    )
    channel: Mapped[PaymentChannel | None] = mapped_column(
        SAEnum(
            PaymentChannel,
            native_enum=False,
            create_constraint=True,
            name="payment_channel",
            length=30,
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        index=True,
        nullable=True,
    )
    provider_channel: Mapped[str | None] = mapped_column(String(64), nullable=True)

    provider_reference: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    internal_reference: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), index=True, nullable=False, default=PaymentStatus.PENDING.value
    )
    provider_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="payments")
    withdrawal: Mapped["Withdrawal | None"] = relationship(back_populates="payments")
