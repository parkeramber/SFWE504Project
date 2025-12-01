# app/services/applicant_profile_service.py
from typing import Optional

from sqlalchemy.orm import Session

from app.models.applicant_profile import ApplicantProfile
from app.models.user import User
from app.schemas.applicant_profile import ApplicantProfileCreate


def get_profile_for_user(db: Session, user_id: int) -> Optional[ApplicantProfile]:
    return db.query(ApplicantProfile).filter(ApplicantProfile.user_id == user_id).first()


def applicant_profile_exists(db: Session, user_id: int) -> bool:
    profile = get_profile_for_user(db, user_id)
    if not profile:
        return False
    required_fields_present = all(
        [
            bool(profile.student_id),
            bool(profile.netid),
            bool(profile.degree_major),
            profile.gpa is not None,
        ]
    )
    return required_fields_present


def upsert_applicant_profile(
    db: Session, user: User, payload: ApplicantProfileCreate
) -> ApplicantProfile:
    profile = get_profile_for_user(db, user.id)
    if not profile:
        profile = ApplicantProfile(user_id=user.id)
        db.add(profile)

    profile.student_id = payload.student_id
    profile.netid = payload.netid
    profile.degree_major = payload.degree_major
    profile.degree_minor = payload.degree_minor
    profile.gpa = payload.gpa
    profile.academic_achievements = payload.academic_achievements
    profile.financial_information = payload.financial_information
    profile.written_essays = payload.written_essays

    db.commit()
    db.refresh(profile)
    return profile
