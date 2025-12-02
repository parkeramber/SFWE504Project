# app/api/v1/routes_admin.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.scholarship import Scholarship
from app.models.application import Application
from app.schemas.suitability import SuitabilityResult
from app.services.application_service import evaluate_application_suitability
from app.auth import service as auth_service
from app.auth.schemas import UserAdminUpdate

router = APIRouter(
    prefix="/admin",   # <-- keep this
    tags=["admin"],
)

@router.get("/summary")
def admin_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.require_roles(UserRole.ENGR_ADMIN)),
):
    total_scholarships = db.query(Scholarship).count()
    total_users = db.query(User).count()

    # snake_case keys → TS maps them to camelCase
    return {
        "total_users": total_users,
        "total_scholarships": total_scholarships,
        "total_applicants": 12,        # fake number for now
        "total_applications": 5,       # fake number for now
    }


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.require_roles(UserRole.ENGR_ADMIN)),
):
    return db.query(User).all()


@router.patch("/users/{user_id}")
def update_user_admin(
    user_id: int,
    payload: UserAdminUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.require_roles(UserRole.ENGR_ADMIN)),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.first_name is not None:
        user.first_name = payload.first_name
    if payload.last_name is not None:
        user.last_name = payload.last_name
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_admin(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.require_roles(UserRole.ENGR_ADMIN)),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    db.delete(user)
    db.commit()
    return {"detail": "User deleted"}


@router.get("/qualified/{scholarship_id}", response_model=list[SuitabilityResult])
def qualified_applicants_for_scholarship(
    scholarship_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.require_roles(UserRole.ENGR_ADMIN)),
):
    """
    Returns suitability results for all applications to a scholarship.
    """
    apps = db.query(Application).filter(Application.scholarship_id == scholarship_id).all()
    results: list[SuitabilityResult] = []
    for app in apps:
        res = evaluate_application_suitability(db, app.id)
        if res:
            results.append(res)
    return results
