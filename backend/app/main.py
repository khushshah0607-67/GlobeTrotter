from fastapi import FastAPI

from app.api.routes.auth import router as auth_router
from app.core.config import settings

app = FastAPI(
    title="GlobeTrotter API",
    description="Personalized multi-city travel planning platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

if settings.allowed_origins:
    from fastapi.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth_router, prefix="/api/v1")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "globetrotter-api",
    }
