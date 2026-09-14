from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


NotificationSeverity = Literal["info", "success", "warning", "danger"]
NotificationCategory = Literal["financial", "security", "account", "support", "system", "announcement"]


class NotificationItem(BaseModel):
    id: UUID
    title: str
    message: str
    category: str
    severity: str
    event_type: str
    action_url: str | None
    metadata: dict[str, Any] | None = None
    created_at: datetime
    read_at: datetime | None
    dismissed_at: datetime | None


class NotificationListResponse(BaseModel):
    items: list[NotificationItem]
    total: int
    unread: int


class NotificationUnreadCount(BaseModel):
    unread: int


class AdminNotificationSendRequest(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    message: str = Field(min_length=1, max_length=5000)
    severity: NotificationSeverity = "info"
    category: NotificationCategory = "announcement"
    audience: Literal["selected", "all_active_customers"]
    user_ids: list[UUID] = Field(default_factory=list)
    action_url: str | None = Field(default=None, max_length=500)


class AdminNotificationSendResponse(BaseModel):
    notification_id: UUID
    recipient_count: int


class AdminSentNotificationItem(BaseModel):
    id: UUID
    title: str
    message: str
    category: str
    severity: str
    event_type: str
    action_url: str | None
    recipient_count: int
    created_at: datetime


class AdminSentNotificationListResponse(BaseModel):
    items: list[AdminSentNotificationItem]
    total: int
