# app/api/v1/routes_applicant_profile.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import service as auth_service
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.applicant_profile import ApplicantProfileCreate, ApplicantProfileRead
from app.services import get_profile_for_user, upsert_applicant_profile

router = APIRouter(prefix="/applicant/profile", tags=["applicant_profile"])


@router.get("/me", response_model=ApplicantProfileRead)
def read_my_profile(
    current_user: User = Depends(auth_service.require_roles(UserRole.APPLICANT)),
    db: Session = Depends(get_db),
):
    profile = get_profile_for_user(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Applicant profile not found",
        )
    return profile


@router.get("/by-user/{user_id}", response_model=ApplicantProfileRead)
def read_profile_for_user(
    user_id: int,
    current_user: User = Depends(
        auth_service.require_roles(UserRole.REVIEWER, UserRole.ENGR_ADMIN, UserRole.STEWARD)
    ),
    db: Session = Depends(get_db),
):
    """
    Allow reviewers/admins/stewards to fetch an applicant's profile for evaluation.
    """
    profile = get_profile_for_user(db, user_id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Applicant profile not found",
        )
    return profile


@router.put("/me", response_model=ApplicantProfileRead, status_code=status.HTTP_200_OK)
def upsert_my_profile(
    payload: ApplicantProfileCreate,
    current_user: User = Depends(auth_service.require_roles(UserRole.APPLICANT)),
    db: Session = Depends(get_db),
):
    profile = upsert_applicant_profile(db, current_user, payload)

    # Update the user's name if provided during onboarding
    updated_user = False
    if payload.first_name is not None:
        current_user.first_name = payload.first_name
        updated_user = True
    if payload.last_name is not None:
        current_user.last_name = payload.last_name
        updated_user = True
    if updated_user:
        db.add(current_user)
        db.commit()
        db.refresh(current_user)

    return profile
