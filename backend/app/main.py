from fastapi import FastAPI

app = FastAPI(
    title="GlobeTrotter API",
    description="Personalized multi-city travel planning platform",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "globetrotter-api",
    }
