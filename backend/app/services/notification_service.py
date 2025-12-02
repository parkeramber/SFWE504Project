# app/services/notification_service.py
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.schemas.notification import NotificationCreate


def create_notification(db: Session, payload: NotificationCreate) -> Notification:
    notif = Notification(
        user_id=payload.user_id,
        message=payload.message,
        is_read=False,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def list_notifications_for_user(db: Session, user_id: int) -> List[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )


def list_unread_notifications_for_user(db: Session, user_id: int) -> List[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read.is_(False))
        .order_by(Notification.created_at.desc())
        .all()
    )


def mark_notification_read(db: Session, notif_id: int) -> Optional[Notification]:
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        return None
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif
