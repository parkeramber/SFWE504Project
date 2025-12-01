from datetime import datetime
from typing import Optional
import re

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole = Field(default=UserRole.APPLICANT)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=20)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        pattern = re.compile(r"^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$")
        if not pattern.match(v):
            raise ValueError(
                "Password must be 8-20 chars and include an uppercase letter, a number, and a symbol."
            )
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserRead(UserBase):
    id: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None


class UserAdminUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

class PasswordChange(BaseModel):
    current_password: str = Field(min_length=8, max_length=20)
    new_password: str = Field(min_length=8, max_length=20)

    @field_validator("new_password")
    @classmethod
    def new_password_strength(cls, v: str) -> str:
        pattern = re.compile(r"^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,20}$")
        if not pattern.match(v):
            raise ValueError(
                "New password must be 8-20 chars and include an uppercase letter, a number, and a symbol."
            )
        return v


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    needs_profile_setup: Optional[bool] = None


class TokenPayload(BaseModel):
    sub: int
    role: UserRole
    token_type: str
    exp: int


class ForgotPasswordRequest(BaseModel):
    email: EmailStr
