# SignBridge AI

A real-time sign language interpreter — fingerspelling recognition today, continuous sign recognition on the roadmap.

**Status:** Milestone 1.1 — project skeleton (frontend + backend running, connected via a health check).

## Stack
- Frontend: React + Vite + Tailwind
- Backend: FastAPI
- ML: TensorFlow + MediaPipe (arrives in later milestones)

## Getting Started

### Backend
\```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -e .
uvicorn app.main:app --reload --port 8000
\```
Backend runs at `http://localhost:8000`. Check `http://localhost:8000/health`.

### Frontend
\```bash
cd apps/web
npm install
npm run dev
\```
Frontend runs at `http://localhost:5173`.

## Project Structure
See `apps/web`, `apps/api`, and `ml` for the frontend, backend, and machine learning pipeline respectively. Full architecture: see the project's architecture document.