
````markdown
# EduAid

Scholarship management system using **FastAPI (backend)** and **React + Vite (frontend)** with **JWT authentication** and **SQLite storage**.

---

## Backend Setup

1. Install **Python 3.12+** and create a virtual environment:
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
````

2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

3. Create `backend/.env` and set:

   ```ini
   JWT_SECRET_KEY=your-access-secret
   JWT_REFRESH_SECRET_KEY=your-refresh-secret
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_TOKEN_EXPIRE_DAYS=7
   DATABASE_URL=sqlite:///./eduaid.db
   ```

4. Run the API:

   ```bash
   uvicorn app.main:app --reload
   ```

   The database is created automatically at `backend/eduaid.db`.

5. Run backend tests:

   ```bash
   pytest
   ```

---

## Frontend Setup

1. Install **Node.js (LTS)** and npm.

2. Install packages and start the dev server:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Open the printed URL (usually [http://localhost:5173](http://localhost:5173)).
   The frontend expects the backend at **[http://127.0.0.1:8000](http://127.0.0.1:8000)**.

---

```

---
