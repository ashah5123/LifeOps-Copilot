"""Google OAuth service for Gmail authorization.

Handles building the consent URL and exchanging authorization codes for
tokens.  Falls back to demo/mock behaviour when OAuth credentials are
not configured (e.g. local development without GCP).
"""

from __future__ import annotations

import logging
from urllib.parse import urlencode

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

SCOPES = (
    "https://www.googleapis.com/auth/gmail.readonly "
    "https://www.googleapis.com/auth/gmail.send"
)


class GoogleOAuthService:
    """Builds OAuth URLs and exchanges codes for tokens."""

    # In-memory token store (per-process).  In production you would
    # persist these in Firestore keyed by user id.
    _tokens: dict[str, dict[str, str]] = {}

    def get_authorization_url(self) -> str:
        """Return the Google OAuth consent URL, or empty string if not configured."""
        if not settings.is_oauth_configured:
            return ""
        params = {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_redirect_uri,
            "response_type": "code",
            "scope": SCOPES,
            "access_type": "offline",
            "prompt": "consent",
        }
        return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    def exchange_code_for_tokens(self, code: str) -> dict[str, str]:
        """Exchange an authorization code for access/refresh tokens.

        Returns a dict with ``access_token``, ``refresh_token``, and
        ``scope`` keys.  In demo mode the tokens are faked.
        """
        if not settings.is_oauth_configured:
            logger.info("OAuth not configured — returning demo tokens")
            demo = {
                "access_token": f"demo-access-token-{code[:8]}",
                "refresh_token": "demo-refresh-token",
                "scope": "gmail.readonly gmail.send",
            }
            self._tokens["demo-user"] = demo
            return demo

        payload = {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": settings.google_redirect_uri,
        }

        try:
            resp = httpx.post(GOOGLE_TOKEN_URL, data=payload, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            tokens = {
                "access_token": data["access_token"],
                "refresh_token": data.get("refresh_token", ""),
                "scope": data.get("scope", ""),
            }
            self._tokens["current"] = tokens
            return tokens
        except Exception as exc:
            logger.error("Token exchange failed: %s", exc)
            return {
                "access_token": "",
                "refresh_token": "",
                "scope": "",
                "error": str(exc),
            }

    def get_stored_access_token(self) -> str | None:
        """Return the most recent access token if one exists."""
        for key in ("current", "demo-user"):
            token = self._tokens.get(key, {}).get("access_token")
            if token:
                return token
        return None
