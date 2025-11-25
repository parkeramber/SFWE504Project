from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import router as auth_router
from app.api.v1 import routes_scholarships
from app.database import Base, engine
from app.models import user  # noqa: F401 - ensure models are registered

# Create database tables on startup (simple auto-migrate for now).
Base.metadata.create_all(bind=engine)

app = FastAPI(title="UMSAMS Backend")

origins = [
    "http://localhost:5173", #VITE
    "http://localhost:3000", #CRA
    
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Wire up our first router group: scholarships
app.include_router(
    routes_scholarships.router,
    prefix="/api/v1/scholarships",
    tags=["scholarships"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
