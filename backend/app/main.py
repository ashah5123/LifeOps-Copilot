import logging

from fastapi import FastAPI, Request
from starlette.responses import Response

from app.api import agents, approvals, auth, budget, calendar, career, dashboard, health, inbox, uploads
from app.core.config import settings

logger = logging.getLogger(__name__)

app = FastAPI(title=settings.app_name)


# ---------------------------------------------------------------------------
# Populate demo data on startup (runs once per process)
# ---------------------------------------------------------------------------

@app.on_event("startup")
def _load_demo_data() -> None:
    """Seed the in-memory FirestoreService with realistic demo data."""
    try:
        from scripts.populate_demo_data import populate
        populate()
        logger.info("Demo data loaded successfully")
    except Exception as exc:
        logger.warning("Could not load demo data: %s", exc)

ALLOWED_ORIGINS = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"}


@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    """Manual CORS middleware — works reliably on all platforms."""
    origin = request.headers.get("origin", "")

    # Handle preflight OPTIONS
    if request.method == "OPTIONS":
        response = Response(status_code=200)
        if origin in ALLOWED_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "600"
        return response

    response = await call_next(request)

    if origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"

    return response


app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(dashboard.router, prefix=settings.api_prefix)
app.include_router(uploads.router, prefix=settings.api_prefix)
app.include_router(agents.router, prefix=settings.api_prefix)
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(inbox.router, prefix=settings.api_prefix)
app.include_router(career.router, prefix=settings.api_prefix)
app.include_router(calendar.router, prefix=settings.api_prefix)
app.include_router(budget.router, prefix=settings.api_prefix)
app.include_router(approvals.router, prefix=settings.api_prefix)


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "SparkUp API is running"}
