import sys
from pathlib import Path
from datetime import date

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


def create_user(client, email="applicant@example.com", role="applicant"):
    payload = {
        "email": email,
        "password": "StrongP@ss1",
        "first_name": "App",
        "last_name": "User",
        "role": role,
    }
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201
    return resp.json()


def create_scholarship(client, name="Test Scholarship"):
    payload = {
        "name": name,
        "description": "Desc",
        "amount": 1000,
        "deadline": date.today().isoformat(),
        "requirements": "Reqs",
        "requires_essay": True,
        "requires_transcript": False,
        "requires_questions": False,
    }
    resp = client.post("/api/v1/scholarships", json=payload)
    assert resp.status_code == 201
    return resp.json()


def test_create_application_and_list_by_user(client):
    user_obj = create_user(client)
    sch = create_scholarship(client)

    payload = {
        "user_id": user_obj["id"],
        "scholarship_id": sch["id"],
        "essay_text": "My essay",
        "transcript_url": "http://example.com/transcript.pdf",
        "answers_json": '{"q1": "a1"}',
    }
    created = client.post("/api/v1/applications/", json=payload)
    assert created.status_code == 201, created.text
    app_json = created.json()
    assert app_json["user_id"] == user_obj["id"]
    assert app_json["scholarship_id"] == sch["id"]
    assert app_json["essay_text"] == "My essay"

    by_user = client.get(f"/api/v1/applications/by-user/{user_obj['id']}")
    assert by_user.status_code == 200
    apps = by_user.json()
    assert len(apps) == 1
    assert apps[0]["id"] == app_json["id"]
