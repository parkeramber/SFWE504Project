# app/services/application_service.py

from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.review import Review
from app.models.user import User
from app.models.scholarship import Scholarship
from app.models.applicant_profile import ApplicantProfile
from app.schemas.application import ApplicationCreate, ApplicationRead
from app.schemas.review import ReviewCreate, ReviewRead
from app.schemas.suitability import SuitabilityResult
from app.services.applicant_profile_service import get_profile_for_user
from app.models.scholarship import Scholarship


def create_application(
    db: Session,
    payload: ApplicationCreate,
) -> Application:
    """
    Create a new application for a given user & scholarship.
    """
    # Enforce basic eligibility before creation
    scholarship = db.get(Scholarship, payload.scholarship_id)
    profile = get_profile_for_user(db, payload.user_id)

    # Deadline enforcement
    if scholarship and scholarship.deadline and scholarship.deadline < datetime.utcnow().date():
        raise ValueError("The scholarship deadline has passed.")

    if scholarship and profile:
        if scholarship.min_gpa is not None:
            if profile.gpa is None or profile.gpa < scholarship.min_gpa:
                raise ValueError("Applicant does not meet GPA requirement.")
        if scholarship.required_major:
            if not profile.degree_major or profile.degree_major.lower() != scholarship.required_major.lower():
                raise ValueError("Applicant does not meet major requirement.")
        if scholarship.required_citizenship:
            if not profile.citizenship or profile.citizenship.lower() != scholarship.required_citizenship.lower():
                raise ValueError("Applicant does not meet citizenship requirement.")

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


def evaluate_application_suitability(
    db: Session, application_id: int
) -> Optional[SuitabilityResult]:
    app_obj = get_application(db, application_id)
    if not app_obj:
        return None
    scholarship = db.get(Scholarship, app_obj.scholarship_id)
    profile = get_profile_for_user(db, app_obj.user_id)

    if not scholarship or not profile:
        return SuitabilityResult(
            status="unknown",
            notes=["Missing scholarship or applicant profile data."],
        )

    notes: list[str] = []
    qualified = True

    if scholarship.min_gpa is not None:
        if profile.gpa is not None and profile.gpa >= scholarship.min_gpa:
            notes.append(f"Meets GPA requirement ({profile.gpa} ≥ {scholarship.min_gpa}).")
        else:
            qualified = False
            notes.append(
                f"Below GPA requirement ({profile.gpa if profile.gpa is not None else 'N/A'} < {scholarship.min_gpa})."
            )

    if scholarship.required_citizenship:
        if profile.citizenship and profile.citizenship.lower() == scholarship.required_citizenship.lower():
            notes.append("Citizenship matches requirement.")
        else:
            qualified = False
            notes.append(
                f"Citizenship does not match requirement ({profile.citizenship or 'N/A'} ≠ {scholarship.required_citizenship})."
            )

    if scholarship.required_major:
        if profile.degree_major and profile.degree_major.lower() == scholarship.required_major.lower():
            notes.append("Major matches requirement.")
        else:
            qualified = False
            notes.append("Major does not match requirement.")

    if scholarship.required_minor:
        if profile.degree_minor and profile.degree_minor.lower() == scholarship.required_minor.lower():
            notes.append("Minor matches requirement.")
        else:
            notes.append("Minor requirement not confirmed.")

    status = "qualified" if qualified else "unqualified"
    if not notes:
        notes.append("No structured requirements found; manual review needed.")
    return SuitabilityResult(status=status, notes=notes)
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
        .filter(Application.reviewer_id == reviewer_id)
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


# ---------- Reviews ----------

def upsert_review(
    db: Session,
    application_id: int,
    payload: ReviewCreate,
) -> Review:
    """
    Create or update a review for an application by a specific reviewer.
    """
    review = (
        db.query(Review)
        .filter(
            Review.application_id == application_id,
            Review.reviewer_id == payload.reviewer_id,
        )
        .first()
    )

    if not review:
        review = Review(
          application_id=application_id,
          reviewer_id=payload.reviewer_id,
        )
        db.add(review)

    review.score = payload.score
    review.comment = payload.comment
    review.status = payload.status
    db.commit()
    db.refresh(review)
    return review


def list_reviews_for_application(db: Session, application_id: int) -> List[Review]:
    return (
        db.query(Review)
        .filter(Review.application_id == application_id)
        .order_by(Review.created_at.desc())
        .all()
    )


def list_reviews_for_reviewer(db: Session, reviewer_id: int) -> List[Review]:
    return (
        db.query(Review)
        .filter(Review.reviewer_id == reviewer_id)
        .order_by(Review.created_at.desc())
        .all()
    )


def update_application_status(
    db: Session,
    application_id: int,
    status: str,
) -> Optional[Application]:
    """
    Update an application's status (e.g., in_review -> accepted/rejected).
    """
    app_obj = (
        db.query(Application)
        .filter(Application.id == application_id)
        .first()
    )
    if not app_obj:
        return None
    app_obj.status = status
    db.commit()
    db.refresh(app_obj)
    return app_obj
