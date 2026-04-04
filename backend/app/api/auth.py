from fastapi import APIRouter
from fastapi.responses import RedirectResponse

from app.services.google_oauth_service import GoogleOAuthService

router = APIRouter(prefix="/auth", tags=["auth"])
oauth_service = GoogleOAuthService()


@router.get("/google/login")
def google_login() -> RedirectResponse:
    auth_url = oauth_service.get_authorization_url()
    return RedirectResponse(url=auth_url)


@router.get("/google/callback")
def google_callback(code: str) -> dict[str, str]:
    tokens = oauth_service.exchange_code_for_tokens(code)
    return {
        "status": "authenticated",
        "accessToken": tokens["access_token"]
    }
