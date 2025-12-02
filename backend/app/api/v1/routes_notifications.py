# app/api/v1/routes_notifications.py
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.notification import NotificationRead, NotificationCreate
from app.services import (
    list_notifications_for_user,
    mark_notification_read,
    create_notification,
    list_unread_notifications_for_user,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/user/{user_id}", response_model=List[NotificationRead])
def list_notifications_for_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
):
    return list_notifications_for_user(db, user_id)


@router.post("/", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
def create_notification_endpoint(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
):
    # Note: In a real system, this would likely be admin/logic-only, not open POST.
    notif = create_notification(db, payload)
    return notif


@router.get("/user/{user_id}/unread", response_model=List[NotificationRead])
def list_unread_notifications_for_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
):
    return list_unread_notifications_for_user(db, user_id)


@router.post("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read_endpoint(
    notification_id: int,
    db: Session = Depends(get_db),
):
    notif = mark_notification_read(db, notification_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return notif
