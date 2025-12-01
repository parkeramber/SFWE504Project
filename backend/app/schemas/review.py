# app/schemas/review.py
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ReviewBase(BaseModel):
    score: Optional[int] = Field(default=None, ge=0, le=100)
    comment: Optional[str] = None
    status: str = "in_review"  # in_review | accepted | rejected


class ReviewCreate(ReviewBase):
    reviewer_id: int


class ReviewRead(ReviewBase):
    id: int
    application_id: int
    reviewer_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
