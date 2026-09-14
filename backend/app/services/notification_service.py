import logging
from datetime import UTC, datetime
from typing import Iterable
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationRecipient
from app.models.user import User

logger = logging.getLogger("banking.notifications")


class NotificationService:
    @staticmethod
    def _item(row: NotificationRecipient) -> dict:
        item = row.notification
        return {
            "id": item.id,
            "title": item.title,
            "message": item.message,
            "category": item.category,
            "severity": item.severity,
            "event_type": item.event_type,
            "action_url": item.action_url,
            "metadata": item.payload,
            "created_at": item.created_at,
            "read_at": row.read_at,
            "dismissed_at": row.dismissed_at,
        }

    @classmethod
    def create(
        cls, db: Session, *, user_ids: Iterable[UUID], title: str, message: str,
        event_type: str, category: str = "system", severity: str = "info",
        action_url: str | None = None, created_by_user_id: UUID | None = None,
        metadata: dict | None = None,
    ) -> tuple[Notification, int]:
        ids = list(dict.fromkeys(user_ids))
        item = Notification(
            title=title.strip(), message=message.strip(), category=category,
            severity=severity, event_type=event_type, action_url=action_url,
            created_by_user_id=created_by_user_id, payload=metadata,
        )
        db.add(item)
        db.flush()
        db.add_all(NotificationRecipient(notification_id=item.id, user_id=user_id) for user_id in ids)
        db.flush()
        return item, len(ids)

    @classmethod
    def safe_notify_user(cls, db: Session, *, user_id: UUID, **kwargs) -> None:
        # Domain-service unit tests use lightweight DB test doubles that
        # intentionally do not implement the full SQLAlchemy Session API.
        # Notifications are best-effort side effects, so those callers must
        # never make an otherwise valid banking operation fail.
        if not callable(getattr(db, "begin_nested", None)):
            logger.debug(
                "Skipping notification persistence for user %s: "
                "session does not support nested transactions",
                user_id,
            )
            return

        try:
            with db.begin_nested():
                cls.create(db, user_ids=[user_id], **kwargs)
        except SQLAlchemyError:
            logger.exception("Could not persist notification for user %s", user_id)

    @classmethod
    def safe_notify_admins(cls, db: Session, **kwargs) -> None:
        if not callable(getattr(db, "begin_nested", None)):
            logger.debug(
                "Skipping administrator notification persistence: "
                "session does not support nested transactions"
            )
            return

        try:
            ids = db.scalars(
                select(User.id).where(
                    User.is_admin.is_(True),
                    User.is_active.is_(True),
                )
            ).all()
            if not ids:
                return
            with db.begin_nested():
                cls.create(db, user_ids=ids, **kwargs)
        except SQLAlchemyError:
            logger.exception("Could not persist administrator notification")

    @classmethod
    def list_for_user(cls, db: Session, *, user_id: UUID, unread_only: bool,
                      category: str | None, limit: int, offset: int) -> tuple[list[dict], int, int]:
        base = (
            select(NotificationRecipient)
            .join(Notification, Notification.id == NotificationRecipient.notification_id)
            .where(NotificationRecipient.user_id == user_id, NotificationRecipient.dismissed_at.is_(None))
        )
        count = (
            select(func.count()).select_from(NotificationRecipient)
            .join(Notification, Notification.id == NotificationRecipient.notification_id)
            .where(NotificationRecipient.user_id == user_id, NotificationRecipient.dismissed_at.is_(None))
        )
        if unread_only:
            base = base.where(NotificationRecipient.read_at.is_(None))
            count = count.where(NotificationRecipient.read_at.is_(None))
        if category:
            base = base.where(Notification.category == category)
            count = count.where(Notification.category == category)
        total = int(db.scalar(count) or 0)
        unread = int(db.scalar(
            select(func.count()).select_from(NotificationRecipient).where(
                NotificationRecipient.user_id == user_id,
                NotificationRecipient.read_at.is_(None),
                NotificationRecipient.dismissed_at.is_(None),
            )
        ) or 0)
        rows = db.scalars(
            base.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
        ).all()
        return [cls._item(row) for row in rows], total, unread

    @staticmethod
    def mark_read(db: Session, *, user_id: UUID, notification_id: UUID) -> bool:
        row = db.scalar(select(NotificationRecipient).where(
            NotificationRecipient.user_id == user_id,
            NotificationRecipient.notification_id == notification_id,
        ))
        if row is None:
            return False
        if row.read_at is None:
            row.read_at = datetime.now(UTC)
        return True

    @staticmethod
    def mark_all_read(db: Session, *, user_id: UUID) -> int:
        result = db.execute(
            update(NotificationRecipient).where(
                NotificationRecipient.user_id == user_id,
                NotificationRecipient.read_at.is_(None),
                NotificationRecipient.dismissed_at.is_(None),
            ).values(read_at=datetime.now(UTC))
        )
        return int(result.rowcount or 0)

    @staticmethod
    def dismiss(db: Session, *, user_id: UUID, notification_id: UUID) -> bool:
        row = db.scalar(select(NotificationRecipient).where(
            NotificationRecipient.user_id == user_id,
            NotificationRecipient.notification_id == notification_id,
        ))
        if row is None:
            return False
        row.dismissed_at = datetime.now(UTC)
        return True
