"""SignBridge AI — FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routers import health, predict

app = FastAPI(
    title="SignBridge AI API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health is mounted without a version prefix — infrastructure, not part
# of the versioned API surface.
app.include_router(health.router)

# Predict already carries its own /api/v1 prefix.
app.include_router(predict.router)