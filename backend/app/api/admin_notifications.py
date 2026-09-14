from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import require_admin
from app.database.dependencies import get_db
from app.models.audit_log import AuditLog
from app.models.notification import Notification, NotificationRecipient
from app.models.user import User
from app.schemas.notifications import (
    AdminNotificationSendRequest, AdminNotificationSendResponse,
    AdminSentNotificationItem, AdminSentNotificationListResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/admin/notifications", tags=["admin-notifications"])


@router.post("", response_model=AdminNotificationSendResponse, status_code=201)
def send_notification(
    payload: AdminNotificationSendRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if payload.audience == "selected":
        if not payload.user_ids:
            raise HTTPException(status_code=422, detail="Select at least one customer.")
        ids = db.scalars(select(User.id).where(
            User.id.in_(payload.user_ids), User.is_admin.is_(False), User.is_active.is_(True)
        )).all()
        if len(set(ids)) != len(set(payload.user_ids)):
            raise HTTPException(status_code=422, detail="One or more selected customers are unavailable.")
    else:
        ids = db.scalars(select(User.id).where(
            User.is_admin.is_(False), User.is_active.is_(True)
        )).all()

    if not ids:
        raise HTTPException(status_code=422, detail="No active customers match this audience.")

    item, count = NotificationService.create(
        db, user_ids=ids, title=payload.title, message=payload.message,
        event_type="announcement.admin", category=payload.category, severity=payload.severity,
        action_url=payload.action_url, created_by_user_id=admin.id,
        metadata={"audience": payload.audience, "recipient_count": len(ids)},
    )
    db.add(AuditLog(
        user_id=admin.id, action="notification.sent", entity_type="notification", entity_id=item.id,
        details={"audience": payload.audience, "recipient_count": count, "title": payload.title},
    ))
    db.commit()
    return AdminNotificationSendResponse(notification_id=item.id, recipient_count=count)


@router.get("/sent", response_model=AdminSentNotificationListResponse)
def sent_notifications(
    limit: int = Query(50, ge=1, le=100), offset: int = Query(0, ge=0),
    admin: User = Depends(require_admin), db: Session = Depends(get_db),
):
    count_subq = (
        select(NotificationRecipient.notification_id, func.count(NotificationRecipient.id).label("recipient_count"))
        .group_by(NotificationRecipient.notification_id).subquery()
    )
    stmt = (
        select(Notification, func.coalesce(count_subq.c.recipient_count, 0))
        .outerjoin(count_subq, count_subq.c.notification_id == Notification.id)
        .where(Notification.created_by_user_id.is_not(None))
    )
    total = int(db.scalar(
        select(func.count()).select_from(Notification).where(Notification.created_by_user_id.is_not(None))
    ) or 0)
    rows = db.execute(stmt.order_by(Notification.created_at.desc()).limit(limit).offset(offset)).all()
    return AdminSentNotificationListResponse(
        items=[AdminSentNotificationItem(
            id=item.id, title=item.title, message=item.message, category=item.category,
            severity=item.severity, event_type=item.event_type, action_url=item.action_url,
            recipient_count=int(recipient_count), created_at=item.created_at,
        ) for item, recipient_count in rows],
        total=total,
    )
