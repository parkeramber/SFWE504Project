# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
import app.models  # ensures models are registered with Base

from app.auth import router as auth_router
from app.api.v1 import (
    routes_scholarships,
    routes_admin,
    routes_applications,
    routes_applicant_profile,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="UMSAMS Backend")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes: /api/v1/auth/...
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])

# Scholarship CRUD: /api/v1/scholarships/...
app.include_router(routes_scholarships.router, prefix="/api/v1", tags=["scholarships"])

# Admin routes: /api/v1/admin/summary
app.include_router(routes_admin.router, prefix="/api/v1", tags=["admin"])

# Application routes
app.include_router(routes_applications.router, prefix="/api/v1", tags=["applications"])

# Applicant onboarding/profile routes
app.include_router(routes_applicant_profile.router, prefix="/api/v1", tags=["applicant_profile"])
