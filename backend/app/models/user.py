from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, Column, DateTime, Enum as SAEnum, Integer, String, func

from app.database import Base


class UserRole(str, Enum):
    APPLICANT = "applicant"
    REVIEWER = "reviewer"
    SPONSOR_DONOR = "sponsor_donor"
    STEWARD = "steward"
    ENGR_ADMIN = "engr_admin"  # includes scholarship admins


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.APPLICANT)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
