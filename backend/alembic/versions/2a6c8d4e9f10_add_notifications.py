"""add persistent notifications

Revision ID: 2a6c8d4e9f10
Revises: 9f7a4b2c1d65
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "2a6c8d4e9f10"
down_revision = "9f7a4b2c1d65"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=40), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("event_type", sa.String(length=100), nullable=False),
        sa.Column("action_url", sa.String(length=500), nullable=True),
        sa.Column("created_by_user_id", sa.UUID(), nullable=True),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    for name, col in [
        ("ix_notifications_category","category"),("ix_notifications_severity","severity"),
        ("ix_notifications_event_type","event_type"),("ix_notifications_created_by_user_id","created_by_user_id"),
        ("ix_notifications_created_at","created_at"),
    ]:
        op.create_index(name, "notifications", [col], unique=False)

    op.create_table(
        "notification_recipients",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("notification_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("dismissed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["notification_id"], ["notifications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("notification_id", "user_id", name="uq_notification_recipient_user"),
    )
    op.create_index("ix_notification_recipients_notification_id","notification_recipients",["notification_id"],unique=False)
    op.create_index("ix_notification_recipients_user_id","notification_recipients",["user_id"],unique=False)


def downgrade() -> None:
    op.drop_index("ix_notification_recipients_user_id", table_name="notification_recipients")
    op.drop_index("ix_notification_recipients_notification_id", table_name="notification_recipients")
    op.drop_table("notification_recipients")
    for name in ["ix_notifications_created_at","ix_notifications_created_by_user_id","ix_notifications_event_type","ix_notifications_severity","ix_notifications_category"]:
        op.drop_index(name, table_name="notifications")
    op.drop_table("notifications")
