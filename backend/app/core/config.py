from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SparkUp API"
    api_prefix: str = "/api"
    environment: str = "development"
    firestore_project_id: str = "sparkup-dev"
    gcs_bucket_name: str = "sparkup-uploads"
    vertex_model_name: str = "gemini-2.5-flash"
    google_client_id: str = "demo-client-id"
    google_client_secret: str = "demo-client-secret"
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
