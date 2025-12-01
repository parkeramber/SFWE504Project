# app/api/v1/routes_applications.py

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.application import ApplicationCreate, ApplicationRead
from app.services import (
    create_application,
    list_applications_for_user,
    get_application,
    assign_reviewer,
    list_applications_for_reviewer,
    list_all_applications, 
 
)

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("/", response_model=ApplicationRead, status_code=status.HTTP_201_CREATED)
def create_application_endpoint(
    payload: ApplicationCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new application.
    For now we trust the user_id passed in from the frontend.
    """
    # (Optional) you could add simple guards here later, e.g.:
    # - check that user_id / scholarship_id exist
    # - avoid duplicates

    app_obj = create_application(db, payload)
    return app_obj


@router.get("/by-user/{user_id}", response_model=List[ApplicationRead])
def list_applications_for_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db),
):
    """
    List all applications for a given user.
    (Handy later for applicant/reviewer views.)
    """
    apps = list_applications_for_user(db, user_id)
    return apps


@router.get("/{application_id}", response_model=ApplicationRead)
def get_application_endpoint(
    application_id: int,
    db: Session = Depends(get_db),
):
    """
    Fetch one application by ID.
    """
    app_obj = get_application(db, application_id)
    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    return app_obj

@router.get("/", response_model=List[ApplicationRead])
def list_all_applications_endpoint(
    db: Session = Depends(get_db),
):
    """
    List all applications in the system.
    (In a full system, this would be restricted to ENGR Admins.)
    """
    apps = list_all_applications(db)
    return apps


@router.post("/{application_id}/assign-reviewer/{reviewer_id}", response_model=ApplicationRead)
def assign_reviewer_endpoint(
    application_id: int,
    reviewer_id: int,
    db: Session = Depends(get_db),
):
    """
    Assign a reviewer to an application.
    (In a full system, this would be restricted to ENGR Admins.)
    """
    try:
        app_obj = assign_reviewer(db, application_id, reviewer_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    if not app_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    return app_obj

@router.get("/assigned/{reviewer_id}", response_model=List[ApplicationRead])
def list_assigned_applications_for_reviewer_endpoint(
    reviewer_id: int,
    db: Session = Depends(get_db),
):
    """
    List all applications assigned to a specific reviewer.
    """
    apps = list_applications_for_reviewer(db, reviewer_id)
    return apps


