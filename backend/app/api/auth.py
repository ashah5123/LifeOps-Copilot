"""Auth routes — Google OAuth, email/password (JWT), and session info."""

from __future__ import annotations

import secrets
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field

from app.core.config import settings
from app.core.dependencies import auth_service, firestore_service, oauth_service
from app.services.jwt_auth_service import (
    authenticate_user,
    create_access_token,
    hash_password,
    register_user,
)

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)

USERS_COLLECTION = "users"


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = ""


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordBody(BaseModel):
    email: EmailStr


class ResetPasswordBody(BaseModel):
    email: EmailStr
    token: str
    new_password: str = Field(min_length=6)


class AuthUserOut(BaseModel):
    id: str
    email: str
    name: str


# In-memory reset token store (fine for hackathon; use Redis/DB for production)
_reset_tokens: dict[str, str] = {}  # token -> email


@router.get("/google/login")
def google_login(redirect: str = "") -> dict[str, str]:
    """Return the Google OAuth consent URL with optional redirect destination."""
    return {"authUrl": oauth_service.get_authorization_url(state=redirect or "")}


@router.get("/google/callback")
def google_callback(code: str, state: str = ""):
    """Exchange code for tokens, create/find user, issue JWT, redirect to frontend."""
    tokens = oauth_service.exchange_code_for_tokens(code)
    base = settings.frontend_url.rstrip("/")
    # state carries the post-login redirect path (e.g. "/inbox")
    redirect_after = state if state.startswith("/") else ""

    access_token = tokens.get("access_token", "")
    if not access_token:
        return RedirectResponse(url=f"{base}/login?error=oauth_failed")

    # Fetch Google profile
    profile = oauth_service.get_user_info(access_token)
    email = profile.get("email", "")
    name = profile.get("name", "")
    if not email:
        return RedirectResponse(url=f"{base}/login?error=no_email")

    # Find or create the user
    email_l = email.strip().lower()
    existing_user = None
    for u in firestore_service.list_collection(USERS_COLLECTION):
        if str(u.get("email", "")).lower() == email_l:
            existing_user = u
            break

    if existing_user:
        user_id = str(existing_user["id"])
        user_name = str(existing_user.get("name", name))
    else:
        # Auto-register from Google
        import uuid
        from datetime import datetime, timezone

        user_id = str(uuid.uuid4())
        record = {
            "id": user_id,
            "email": email_l,
            "password_hash": hash_password(secrets.token_hex(32)),
            "name": name or email_l.split("@")[0],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "auth_provider": "google",
        }
        firestore_service.create(USERS_COLLECTION, record)
        user_name = record["name"]

    # Store Gmail OAuth tokens for THIS user (per-user isolation)
    oauth_service.store_tokens_for_user(user_id, tokens)

    # Issue JWT
    jwt_token = create_access_token(user_id=user_id, email=email_l, name=user_name)

    # Redirect to frontend login page with token (login page handles auto-login)
    redirect_params: dict[str, str] = {"google_token": jwt_token, "name": user_name, "email": email_l}
    if redirect_after:
        redirect_params["redirect"] = redirect_after
    params = urlencode(redirect_params)
    return RedirectResponse(url=f"{base}/login?{params}")


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


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordBody) -> dict[str, str]:
    """Generate a password-reset token for the given email.

    In production this would send an email. For the hackathon demo the token
    is returned directly in the response so the frontend can redirect.
    """
    email_l = body.email.strip().lower()
    found = False
    for u in firestore_service.list_collection(USERS_COLLECTION):
        if str(u.get("email", "")).lower() == email_l:
            found = True
            break
    if not found:
        # Don't reveal whether the email exists
        return {"message": "If that email exists, a reset link has been sent.", "token": ""}

    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = email_l
    return {"message": "If that email exists, a reset link has been sent.", "token": token}


@router.post("/reset-password")
def reset_password(body: ResetPasswordBody) -> dict[str, str]:
    """Reset a user's password using a valid reset token."""
    email_from_token = _reset_tokens.get(body.token)
    if not email_from_token or email_from_token != body.email.strip().lower():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    email_l = body.email.strip().lower()
    for u in firestore_service.list_collection(USERS_COLLECTION):
        if str(u.get("email", "")).lower() == email_l:
            u["password_hash"] = hash_password(body.new_password)
            firestore_service.upsert(USERS_COLLECTION, str(u["id"]), u)
            _reset_tokens.pop(body.token, None)
            return {"message": "Password reset successfully"}

    raise HTTPException(status_code=404, detail="User not found")


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
