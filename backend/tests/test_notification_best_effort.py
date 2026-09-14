from uuid import uuid4

from app.services.notification_service import NotificationService


class MinimalDB:
    """Represents service-level DB doubles without SQLAlchemy transaction APIs."""


def test_safe_notify_user_skips_minimal_db_double() -> None:
    NotificationService.safe_notify_user(
        MinimalDB(),
        user_id=uuid4(),
        title="Test",
        message="Test message",
        event_type="test.event",
    )


def test_safe_notify_admins_skips_minimal_db_double() -> None:
    NotificationService.safe_notify_admins(
        MinimalDB(),
        title="Test",
        message="Test message",
        event_type="test.event",
    )
