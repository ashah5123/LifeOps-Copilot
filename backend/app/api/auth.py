"""Auth routes — Google OAuth login and callback."""

from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from app.core.dependencies import oauth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google/login")
def google_login() -> dict[str, str]:
    """Return the Google OAuth consent URL.

    The frontend should redirect the user to this URL.
    """
    return {"authUrl": oauth_service.get_authorization_url()}


@router.get("/google/callback")
def google_callback(code: str):
    """Exchange an authorization code for tokens.

    Google redirects here after the user consents.
    After exchanging, redirect to the frontend inbox page.
    """
    oauth_service.exchange_code_for_tokens(code)
    # Redirect back to the frontend inbox with a success flag
    return RedirectResponse(url="http://localhost:3000/inbox?gmail=connected")
