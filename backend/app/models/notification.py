from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(40), index=True, nullable=False, default="system")
    severity: Mapped[str] = mapped_column(String(20), index=True, nullable=False, default="info")
    event_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    action_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_by_user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )
    payload: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )

    recipients: Mapped[list["NotificationRecipient"]] = relationship(
        back_populates="notification", cascade="all, delete-orphan"
    )


class NotificationRecipient(Base):
    __tablename__ = "notification_recipients"
    __table_args__ = (
        UniqueConstraint("notification_id", "user_id", name="uq_notification_recipient_user"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    notification_id: Mapped[UUID] = mapped_column(
        ForeignKey("notifications.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    dismissed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    notification: Mapped["Notification"] = relationship(back_populates="recipients")
