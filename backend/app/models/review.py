# app/models/review.py
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, String

from app.database import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score = Column(Integer, nullable=True)  # allow null until reviewer submits
    comment = Column(Text, nullable=True)
    status = Column(
        String,
        nullable=False,
        default="in_review",  # in_review | accepted | rejected
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )
