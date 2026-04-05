"""Auth routes — Google OAuth login and callback."""

from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from app.core.config import settings
from app.core.dependencies import oauth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/login")
def google_login() -> dict[str, str | bool]:
    """Return the Google OAuth consent URL when credentials are configured.

    When OAuth is not configured (local demo), ``oauthConfigured`` is False and
    ``authUrl`` is empty — the frontend should use demo inbox mode instead of
    redirecting to Google (which would error on missing ``client_id``).
    """
    if not settings.is_oauth_configured:
        return {"authUrl": "", "oauthConfigured": False}
    url = oauth_service.get_authorization_url()
    return {"authUrl": url, "oauthConfigured": bool(url)}


@router.get("/google/callback")
def google_callback(code: str):
    """Exchange an authorization code for tokens.

    Google redirects here after the user consents.
    After exchanging, redirect to the frontend inbox page.
    """
    oauth_service.exchange_code_for_tokens(code)
    base = settings.frontend_base_url.rstrip("/")
    return RedirectResponse(url=f"{base}/inbox?gmail=connected")
