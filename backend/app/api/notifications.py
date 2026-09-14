from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.database.dependencies import get_db
from app.models.user import User
from app.schemas.notifications import NotificationItem, NotificationListResponse, NotificationUnreadCount
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationListResponse)
def notifications(
    unread_only: bool = False,
    category: str | None = None,
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items, total, unread = NotificationService.list_for_user(
        db, user_id=user.id, unread_only=unread_only, category=category, limit=limit, offset=offset
    )
    return NotificationListResponse(items=[NotificationItem(**item) for item in items], total=total, unread=unread)


@router.get("/unread-count", response_model=NotificationUnreadCount)
def unread_count(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _, _, unread = NotificationService.list_for_user(
        db, user_id=user.id, unread_only=False, category=None, limit=1, offset=0
    )
    return NotificationUnreadCount(unread=unread)


@router.patch("/{notification_id}/read")
def read_notification(notification_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not NotificationService.mark_read(db, user_id=user.id, notification_id=notification_id):
        raise HTTPException(status_code=404, detail="Notification not found.")
    db.commit()
    return {"message": "Notification marked as read."}


@router.post("/read-all")
def read_all(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = NotificationService.mark_all_read(db, user_id=user.id)
    db.commit()
    return {"count": count}


@router.delete("/{notification_id}")
def dismiss_notification(notification_id: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not NotificationService.dismiss(db, user_id=user.id, notification_id=notification_id):
        raise HTTPException(status_code=404, detail="Notification not found.")
    db.commit()
    return {"message": "Notification dismissed."}
