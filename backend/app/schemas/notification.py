# app/schemas/notification.py
from datetime import datetime
from pydantic import BaseModel


class NotificationCreate(BaseModel):
  user_id: int
  message: str


class NotificationRead(BaseModel):
  id: int
  user_id: int
  message: str
  is_read: bool
  created_at: datetime

  class Config:
    from_attributes = True
