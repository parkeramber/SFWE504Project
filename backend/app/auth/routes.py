from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.auth.schemas import (
    Token,
    UserCreate,
    UserLogin,
    UserRead,
    UserUpdate,
    PasswordChange,
)
from app.auth import service as auth_service

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user; defaults to applicant role."""
    return auth_service.create_user(db, user_in)


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, user_in.email, user_in.password)
    tokens = auth_service.build_tokens(user)
    return {"token_type": "bearer", **tokens}


@router.post("/refresh", response_model=Token)
def refresh(token: str = Body(..., embed=True, description="Refresh token"), db: Session = Depends(get_db)):
    payload = auth_service.decode_refresh_token(token)
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    tokens = auth_service.build_tokens(user)
    return {"token_type": "bearer", **tokens}


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(auth_service.get_current_user)):
    return current_user


@router.get("/require-admin")
def admin_ping(current_user: User = Depends(auth_service.require_roles(UserRole.ENGR_ADMIN))):
    """Example protected route showing role-based guard."""
    return {"message": f"Hello, {current_user.first_name or current_user.email}", "role": current_user.role}


@router.patch("/me", response_model=UserRead)
def update_me(
    updates: UserUpdate,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's basic profile (first/last name)."""
    return auth_service.update_user(db, current_user, updates)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChange,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
):
    auth_service.change_password(db, current_user, payload)
