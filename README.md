# EduAid

Authentication-enabled React + FastAPI project with SQLite storage.

## Backend setup
1) Install Python 3.12+ and create/activate a virtualenv.
2) From `backend/`:
   ```
   pip install -r requirements.txt
   ```
3) Configure environment (dev defaults provided):
   - Copy `backend/.env` (or `.env.local`) and set:
     - `JWT_SECRET_KEY` (required)
     - `JWT_REFRESH_SECRET_KEY` (required)
     - `ACCESS_TOKEN_EXPIRE_MINUTES` (default 30)
     - `REFRESH_TOKEN_EXPIRE_DAYS` (default 7)
4) Run the API from `backend/`:
   ```
   uvicorn app.main:app --reload
   ```
   SQLite DB is created at `backend/eduaid.db`.
5) Tests (from `backend/`):
   ```
   pytest
   ```

## Frontend setup
1) Install Node.js (LTS) and npm.
2) From `frontend/`:
   ```
   npm install
   npm run dev
   ```
3) Open the printed URL (default http://localhost:5173). The app expects the backend at http://127.0.0.1:8000.

## Auth notes
- Register/login are available; passwords must be 8–20 chars with uppercase, number, and symbol.
- JWT secrets must be set in env; do not commit real secrets.
