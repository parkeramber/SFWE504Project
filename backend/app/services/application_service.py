# app/services/application_service.py

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationRead


def create_application(
    db: Session,
    payload: ApplicationCreate,
) -> Application:
    """
    Create a new application for a given user & scholarship.
    """
    app_obj = Application(
        user_id=payload.user_id,
        scholarship_id=payload.scholarship_id,
        essay_text=payload.essay_text,
        transcript_url=payload.transcript_url,
        answers_json=payload.answers_json,
        status="submitted",
    )
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)
    return app_obj


def list_applications_for_user(db: Session, user_id: int) -> List[Application]:
    """
    Return all applications for a specific user.
    """
    return (
        db.query(Application)
        .filter(Application.user_id == user_id)
        .order_by(Application.created_at.desc())
        .all()
    )


def get_application(db: Session, application_id: int) -> Optional[Application]:
    """
    Fetch a single application by ID.
    """
    return (
        db.query(Application)
        .filter(Application.id == application_id)
        .first()
    )
def assign_reviewer(
    db: Session,
    application_id: int,
    reviewer_id: int,
) -> Optional[Application]:
    """
    Assign or reassign a reviewer to an application.
    """
    app_obj = (
        db.query(Application)
        .filter(Application.id == application_id)
        .first()
    )

    if not app_obj:
        return None

    app_obj.reviewer_id = reviewer_id
    db.commit()
    db.refresh(app_obj)
    return app_obj


def list_applications_for_reviewer(db: Session, reviewer_id: int) -> List[Application]:
    """
    Return all applications assigned to a specific reviewer.
    """
    return (
        db.query(Application)
        .filter(Application.assigned_reviewer_id == reviewer_id)
        .order_by(Application.created_at.desc())
        .all()
    )
def list_all_applications(db: Session) -> List[Application]:
    """
    Return all applications in the system.
    (Used by ENGR Admin to see everything.)
    """
    return (
        db.query(Application)
        .order_by(Application.created_at.desc())
        .all()
    )