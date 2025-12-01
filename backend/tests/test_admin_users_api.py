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


def register_user(client, email, role="applicant", active=True):
    payload = {
        "email": email,
        "password": "StrongP@ss1",
        "first_name": "First",
        "last_name": "Last",
        "role": role,
    }
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201
    # manually toggle active if needed
    if active is not None:
        db = TestingSessionLocal()
        u = db.query(user.User).filter_by(email=email.lower()).first()
        u.is_active = active
        db.commit()
        db.close()
    return payload


def login_token(client, email, password):
    resp = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_admin_can_list_update_and_delete_users(client):
    admin_payload = register_user(client, "admin@example.com", role="engr_admin", active=True)
    applicant_payload = register_user(client, "user1@example.com", role="applicant", active=True)

    admin_token = login_token(client, admin_payload["email"], admin_payload["password"])

    headers = {"Authorization": f"Bearer {admin_token}"}
    listed = client.get("/api/v1/admin/users", headers=headers)
    assert listed.status_code == 200
    users_list = listed.json()
    assert len(users_list) == 2

    # Update applicant to reviewer and deactivate
    target_id = next(u["id"] for u in users_list if u["email"] == applicant_payload["email"])
    updated = client.patch(
        f"/api/v1/admin/users/{target_id}",
        headers=headers,
        json={"role": "reviewer", "is_active": False},
    )
    assert updated.status_code == 200
    assert updated.json()["role"] == "reviewer"
    assert updated.json()["is_active"] is False

    # Delete the applicant
    deleted = client.delete(f"/api/v1/admin/users/{target_id}", headers=headers)
    assert deleted.status_code == 204

    relist = client.get("/api/v1/admin/users", headers=headers)
    assert relist.status_code == 200
    assert len(relist.json()) == 1  # only admin remains
