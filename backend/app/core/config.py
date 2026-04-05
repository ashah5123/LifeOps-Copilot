from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve backend/.env regardless of where uvicorn was started (repo root vs backend/).
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_PATH = _BACKEND_ROOT / ".env"


class Settings(BaseSettings):
    app_name: str = "LifeOps API"
    api_prefix: str = "/api"
    environment: str = "development"

    # GCP core
    google_cloud_project: str = "lifeops-dev"
    vertex_location: str = "us-central1"
    vertex_model_name: str = "gemini-2.5-flash"
    firestore_project_id: str = "lifeops-dev"
    gcs_bucket_name: str = "lifeops-uploads"
    document_ai_processor_id: str = ""

    # Google OAuth
    google_client_id: str = "demo-client-id"
    google_client_secret: str = "demo-client-secret"
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"

    # RapidAPI — JSearch
    rapidapi_key: str = "demo-key"
    rapidapi_host: str = "jsearch.p.rapidapi.com"

    # MongoDB (optional — when empty, API uses in-memory store)
    mongodb_uri: str = ""
    mongodb_database: str = "lifeops"

    # JWT (set a long random secret in production)
    jwt_secret: str = "change-me-in-production-use-openssl-rand-hex-32"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7

    # Frontend URL for OAuth redirect
    frontend_url: str = "http://localhost:3000"

    @property
    def is_gcp_configured(self) -> bool:
        """True when real GCP credentials are available."""
        return self.google_cloud_project != "lifeops-dev" and self.google_cloud_project != ""

    @property
    def is_oauth_configured(self) -> bool:
        """True when real OAuth client credentials are set."""
        return self.google_client_id not in ("demo-client-id", "")

    model_config = SettingsConfigDict(
        env_file=str(_ENV_PATH),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
