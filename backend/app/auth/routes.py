from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.services import applicant_profile_exists
from app.auth.schemas import (
    Token,
    UserCreate,
    UserLogin,
    UserRead,
    UserUpdate,
    PasswordChange,
    ForgotPasswordRequest,
)
from app.auth import service as auth_service
from app.notifications import send_email_notification

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user; defaults to applicant role."""
    return auth_service.create_user(db, user_in)


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = auth_service.authenticate_user(db, user_in.email, user_in.password)
    needs_profile = user.role == UserRole.APPLICANT and not applicant_profile_exists(db, user.id)
    tokens = auth_service.build_tokens(user)
    return {"token_type": "bearer", "needs_profile_setup": needs_profile, **tokens}


@router.post("/refresh", response_model=Token)
def refresh(
    token: str = Body(..., embed=True, alias="refresh_token", description="Refresh token"),
    db: Session = Depends(get_db),
):
    payload = auth_service.decode_refresh_token(token)
    user = db.get(User, int(payload["sub"]))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    needs_profile = user.role == UserRole.APPLICANT and not applicant_profile_exists(db, user.id)
    tokens = auth_service.build_tokens(user)
    return {"token_type": "bearer", "needs_profile_setup": needs_profile, **tokens}


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


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Trigger a password reset email. We always return 202 to avoid leaking which
    emails exist. The email currently contains a placeholder link; hook up a
    real reset flow later.
    """
    user = auth_service.get_user_by_email(db, payload.email)
    if user:
        reset_link = "https://example.com/reset-password"  # placeholder
        body = (
            f"Hello {user.first_name or 'there'},\n\n"
            "We received a request to reset your EduAid password. "
            "If you made this request, use the link below to continue:\n\n"
            f"{reset_link}\n\n"
            "If you did not request a reset, you can ignore this email."
        )
        try:
            send_email_notification(
                to_email=user.email,
                subject="EduAid password reset",
                body=body,
                sender_name="EduAid",
            )
        except Exception:
            # Log in real app; we swallow to keep response generic
            pass
    return {"detail": "If the email exists, a reset link has been sent."}
