"""SignBridge AI — FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routers import health

app = FastAPI(
    title="SignBridge AI API",
    version="0.1.0",
)

# CORS: allow the local Vite dev server to call this API during development.
# This will move into environment-driven config once Milestone 1.4+ introduces
# real settings management — hardcoded here is intentional for now.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health is mounted without a version prefix — it's infrastructure, not part
# of the versioned API surface that /predict, /translations, etc. will use.
app.include_router(health.router)