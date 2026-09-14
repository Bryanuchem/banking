from app.models.notification import Notification, NotificationRecipient
from app.schemas.notifications import AdminNotificationSendRequest


def test_notification_tables_are_split_between_message_and_recipient_state():
    assert Notification.__tablename__ == "notifications"
    assert NotificationRecipient.__tablename__ == "notification_recipients"


def test_admin_broadcast_contract_supports_selected_and_all_customers():
    selected = AdminNotificationSendRequest(
        title="Maintenance", message="Scheduled maintenance tonight.",
        audience="selected", user_ids=[], severity="info",
    )
    assert selected.audience == "selected"
