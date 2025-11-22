from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import routes_scholarships

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