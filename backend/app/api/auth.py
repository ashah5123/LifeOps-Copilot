"""Auth routes — Google OAuth, email/password (JWT), and session info."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field

from app.core.config import settings
from app.core.dependencies import auth_service, firestore_service, oauth_service
from app.services.jwt_auth_service import (
    authenticate_user,
    create_access_token,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = ""


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class AuthUserOut(BaseModel):
    id: str
    email: str
    name: str


@router.get("/google/login")
def google_login() -> dict[str, str]:
    """Return the Google OAuth consent URL."""
    return {"authUrl": oauth_service.get_authorization_url()}


@router.get("/google/callback")
def google_callback(code: str):
    """Exchange an authorization code for tokens and redirect to the frontend.

    Uses a public ``/gmail-connected`` page so users who are not logged in yet
    are not blocked by AuthGuard on ``/inbox``.
    """
    oauth_service.exchange_code_for_tokens(code)
    base = settings.frontend_url.rstrip("/")
    return RedirectResponse(url=f"{base}/gmail-connected")


@router.post("/register")
def register(body: RegisterBody) -> dict[str, object]:
    try:
        user = register_user(firestore_service, body.email, body.password, body.name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    token = create_access_token(user_id=user["id"], email=user["email"], name=user["name"])
    return {"token": token, "user": user}


@router.post("/login")
def login(body: LoginBody) -> dict[str, object]:
    user = authenticate_user(firestore_service, body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user_id=user["id"], email=user["email"], name=user["name"])
    return {"token": token, "user": user}


@router.get("/me")
def me(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> AuthUserOut:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    parsed = auth_service.validate_token(credentials.credentials)
    if not parsed:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return AuthUserOut(
        id=parsed["userId"],
        email=parsed["email"],
        name=parsed.get("name") or "",
    )
