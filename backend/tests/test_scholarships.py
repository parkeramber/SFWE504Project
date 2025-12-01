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


def scholarship_payload(name="Created Scholarship"):
    return {
        "name": name,
        "description": "Test description",
        "amount": 5000,
        "deadline": date.today().isoformat(),
        "requirements": "Reqs",
        "requires_essay": False,
        "requires_transcript": True,
        "requires_questions": True,
    }


def test_scholarship_crud(client):
    create = client.post("/api/v1/scholarships", json=scholarship_payload())
    assert create.status_code == 201, create.text
    data = create.json()
    sid = data["id"]

    listed = client.get("/api/v1/scholarships/")
    assert listed.status_code == 200
    assert any(item["id"] == sid for item in listed.json())

    updated = client.put(
        f"/api/v1/scholarships/{sid}",
        json={**scholarship_payload(name="Updated Name"), "requires_essay": True},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Updated Name"
    assert updated.json()["requires_essay"] is True

    delete_resp = client.delete(f"/api/v1/scholarships/{sid}")
    assert delete_resp.status_code in (200, 204)

    list_after = client.get("/api/v1/scholarships/")
    assert list_after.status_code == 200
    assert all(item["id"] != sid for item in list_after.json())
