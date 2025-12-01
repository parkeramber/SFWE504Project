# app/services/application_service.py

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.application import Application
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
