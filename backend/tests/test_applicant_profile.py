import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models import user  # noqa: F401,E402 - ensure models are loaded

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


def register_applicant(client, email="applicant@example.com"):
    payload = {
        "email": email,
        "password": "StrongP@ss1",
        "first_name": "App",
        "last_name": "licant",
        "role": "applicant",
    }
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201
    return payload


def auth_header(client, email, password):
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_profile_flag_clears_after_onboarding(client):
    payload = register_applicant(client)
    login = client.post("/api/v1/auth/login", json={"email": payload["email"], "password": payload["password"]})
    assert login.json()["needs_profile_setup"] is True

    headers = auth_header(client, payload["email"], payload["password"])
    upsert = client.put(
        "/api/v1/applicant/profile/me",
        headers=headers,
        json={
            "first_name": "Updated",
            "last_name": "Name",
            "student_id": "12345",
            "netid": "abc123",
            "degree_major": "CS",
            "degree_minor": "Math",
            "gpa": 3.8,
            "academic_achievements": "Dean's list",
            "financial_information": "Need-based",
            "written_essays": "Sample",
        },
    )
    assert upsert.status_code == 200

    # Refresh session and ensure flag clears
    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": login.json()["refresh_token"]})
    assert refreshed.status_code == 200
    assert refreshed.json()["needs_profile_setup"] is False


def test_profile_validation_requires_gpa_and_core_fields(client):
    payload = register_applicant(client, email="nogpa@example.com")
    headers = auth_header(client, payload["email"], payload["password"])
    bad = client.put(
        "/api/v1/applicant/profile/me",
        headers=headers,
        json={
            "student_id": "12345",
            "netid": "abc123",
            "degree_major": "CS",
            # gpa missing
        },
    )
    assert bad.status_code == 422


def test_applicant_profile_read_after_upsert(client):
    payload = register_applicant(client, email="read@example.com")
    headers = auth_header(client, payload["email"], payload["password"])
    create = client.put(
        "/api/v1/applicant/profile/me",
        headers=headers,
        json={
            "student_id": "99999",
            "netid": "net999",
            "degree_major": "EE",
            "gpa": 3.5,
        },
    )
    assert create.status_code == 200

    read = client.get("/api/v1/applicant/profile/me", headers=headers)
    assert read.status_code == 200
    data = read.json()
    assert data["student_id"] == "99999"
    assert data["netid"] == "net999"
    assert data["degree_major"] == "EE"
    assert data["gpa"] == 3.5
