# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
import app.models  # ensures models are registered with Base

from app.auth import router as auth_router
from app.api.v1 import routes_scholarships

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="UMSAMS Backend")

origins = [
    "http://localhost:5173",  # Vite
    "http://localhost:3000",  # CRA (if you ever use it)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# This gives:
#   GET  /api/v1/scholarships/
#   POST /api/v1/scholarships/
app.include_router(routes_scholarships.router, prefix="/api/v1")

# This keeps your existing auth endpoints:
#   POST /api/v1/auth/register
#   POST /api/v1/auth/login
#   GET  /api/v1/auth/me
#   etc.
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
