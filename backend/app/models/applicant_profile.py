# app/models/applicant_profile.py

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Float, func

from app.database import Base


class ApplicantProfile(Base):
    __tablename__ = "applicant_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    student_id = Column(String, nullable=False)
    netid = Column(String, nullable=False)
    degree_major = Column(String, nullable=False)
    degree_minor = Column(String, nullable=True)
    gpa = Column(Float, nullable=True)
    academic_achievements = Column(Text, nullable=True)
    financial_information = Column(Text, nullable=True)
    written_essays = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
