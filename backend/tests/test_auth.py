import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

# Ensure app package is importable when running pytest from backend/
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import user  # noqa: F401,E402 - ensure models are loaded
from app.auth.service import authenticate_user  # noqa: E402


# Use a shared in-memory SQLite DB for tests
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def register_payload(email="user@example.com", password="StrongP@ss1", first="Test", last="User"):
    return {
        "email": email,
        "password": password,
        "first_name": first,
        "last_name": last,
        "role": "applicant",
    }


def test_register_success(client):
    resp = client.post("/api/v1/auth/register", json=register_payload())
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["email"] == "user@example.com"
    assert "id" in data


def test_register_duplicate_email(client):
    payload = register_payload()
    first = client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    second = client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 400
    assert "Email already registered" in second.json()["detail"]


def test_register_weak_password_rejected(client):
    weak = register_payload(password="weak")
    resp = client.post("/api/v1/auth/register", json=weak)
    assert resp.status_code == 422


def test_register_too_long_password_rejected(client):
    long_pw = "A1!" + "x" * 80
    payload = register_payload(password=long_pw)
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code in (400, 422)


def test_login_success_and_me(client):
    payload = register_payload(email="MixedCase@Example.com")
    assert client.post("/api/v1/auth/register", json=payload).status_code == 201
    # login with different casing
    login = client.post("/api/v1/auth/login", json={"email": payload["email"].upper(), "password": payload["password"]})
    assert login.status_code == 200
    tokens = login.json()
    assert "access_token" in tokens and "refresh_token" in tokens

    me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == payload["email"].lower()


def test_login_wrong_password(client):
    payload = register_payload()
    client.post("/api/v1/auth/register", json=payload)
    bad = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": "WrongPass1!"})
    assert bad.status_code == 401


def test_refresh_token(client):
    payload = register_payload()
    client.post("/api/v1/auth/register", json=payload)
    login = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    refresh_token = login.json()["refresh_token"]

    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refreshed.status_code == 200
    data = refreshed.json()
    assert "access_token" in data and "refresh_token" in data


def test_needs_profile_flag_for_applicant_without_profile(client):
    payload = register_payload()
    client.post("/api/v1/auth/register", json=payload)
    login = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    data = login.json()
    assert data["needs_profile_setup"] is True


def test_reviewer_requires_activation_before_login(client):
    payload = register_payload(email="reviewer@example.com")
    payload["role"] = "reviewer"
    client.post("/api/v1/auth/register", json=payload)

    # Reviewer starts inactive and cannot login
    login = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert login.status_code == 403


def test_admin_requires_activation_before_login(client):
    payload = register_payload(email="admin@example.com")
    payload["role"] = "engr_admin"
    client.post("/api/v1/auth/register", json=payload)

    login = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert login.status_code == 403


def test_active_reviewer_can_login_after_activation(client):
    payload = register_payload(email="reviewer2@example.com")
    payload["role"] = "reviewer"
    client.post("/api/v1/auth/register", json=payload)

    # Manually activate reviewer in DB
    db = TestingSessionLocal()
    user_obj = db.query(user.User).filter_by(email=payload["email"]).first()
    user_obj.is_active = True
    db.commit()
    db.close()

    login = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert login.status_code == 200


def test_revoke_user_blocks_login(client):
    payload = register_payload(email="revoke@example.com")
    client.post("/api/v1/auth/register", json=payload)

    # login works initially
    login = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert login.status_code == 200

    # deactivate and ensure login blocked
    db = TestingSessionLocal()
    user_obj = db.query(user.User).filter_by(email=payload["email"]).first()
    user_obj.is_active = False
    db.commit()
    db.close()

    login2 = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert login2.status_code == 403


def test_me_requires_auth(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401
