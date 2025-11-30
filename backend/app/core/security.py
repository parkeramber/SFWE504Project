import os
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union


from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Defaults are for development; override via environment variables in production.
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-me")
JWT_REFRESH_SECRET_KEY = os.getenv("JWT_REFRESH_SECRET_KEY", "dev-refresh-secret-key-change-me")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
ALGORITHM = "HS256"


def get_password_hash(password: str) -> str:
    # Enforce 20-char max (project requirement), well within bcrypt's 72-byte limit.
    if len(password) > 20:
        raise ValueError("Password must be at most 20 characters.")
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def _build_expiry(delta: timedelta) -> datetime:
    return datetime.now(timezone.utc) + delta


def create_access_token(
    subject: Union[str, int],
    role: str,
    expires_minutes: Optional[int] = None,
) -> str:
    expire = _build_expiry(timedelta(minutes=expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "token_type": "access",
        "exp": expire,
    }
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(
    subject: Union[str, int],
    role: str,
    expires_days: Optional[int] = None,
) -> str:
    expire = _build_expiry(timedelta(days=expires_days or REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "token_type": "refresh",
        "exp": expire,
    }
    return jwt.encode(to_encode, JWT_REFRESH_SECRET_KEY, algorithm=ALGORITHM)



def decode_token(token: str, refresh: bool = False) -> Dict[str, Any]:
    secret = JWT_REFRESH_SECRET_KEY if refresh else JWT_SECRET_KEY
    try:
        return jwt.decode(token, secret, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("Invalid or expired token") from exc
