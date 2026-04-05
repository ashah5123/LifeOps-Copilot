"""Google OAuth service for Gmail authorization.

Handles building the consent URL and exchanging authorization codes for
tokens.  Persists tokens via the shared document store (MongoDB or
in-memory) so they survive backend restarts.
"""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlencode

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

SCOPES = (
    "openid email profile "
    "https://www.googleapis.com/auth/gmail.readonly "
    "https://www.googleapis.com/auth/gmail.send"
)

GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

OAUTH_COLLECTION = "oauth_tokens"
OAUTH_DOC_ID = "google_oauth_default"


class GoogleOAuthService:
    """Builds OAuth URLs and exchanges codes for tokens."""

    def __init__(self, document_store: Any | None = None) -> None:
        self._store = document_store
        self._cache: dict[str, dict[str, str]] = {}
        self._load_from_store()

    def _load_from_store(self) -> None:
        if not self._store:
            return
        doc = self._store.get(OAUTH_COLLECTION, OAUTH_DOC_ID)
        if doc and doc.get("access_token"):
            self._cache["current"] = {
                "access_token": str(doc["access_token"]),
                "refresh_token": str(doc.get("refresh_token") or ""),
                "scope": str(doc.get("scope") or ""),
            }

    def _persist(self, tokens: dict[str, str]) -> None:
        self._cache["current"] = tokens
        if self._store:
            self._store.upsert(
                OAUTH_COLLECTION,
                OAUTH_DOC_ID,
                {
                    "access_token": tokens.get("access_token", ""),
                    "refresh_token": tokens.get("refresh_token", ""),
                    "scope": tokens.get("scope", ""),
                },
            )

    def get_authorization_url(self) -> str:
        """Return the Google OAuth consent URL."""
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
            self._persist(demo)
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
            self._persist(tokens)
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
        """Return the most recent access token, refreshing if a refresh_token exists."""
        current = self._cache.get("current", {})
        token = current.get("access_token")
        if not token or token.startswith("demo-"):
            return token or None

        # Try refreshing if we have a refresh_token — access tokens expire in 1 hour
        refresh = current.get("refresh_token")
        if refresh and settings.is_oauth_configured:
            try:
                resp = httpx.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "client_id": settings.google_client_id,
                        "client_secret": settings.google_client_secret,
                        "refresh_token": refresh,
                        "grant_type": "refresh_token",
                    },
                    timeout=10,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    new_token = data.get("access_token", "")
                    if new_token:
                        tokens = {
                            "access_token": new_token,
                            "refresh_token": refresh,
                            "scope": data.get("scope", current.get("scope", "")),
                        }
                        self._persist(tokens)
                        return new_token
            except Exception as exc:
                logger.debug("Token refresh failed (will use existing): %s", exc)

        return token or None

    def get_user_info(self, access_token: str) -> dict[str, str]:
        """Fetch the authenticated user's Google profile (email, name, picture)."""
        if access_token.startswith("demo-"):
            return {"email": "demo@gmail.com", "name": "Demo User", "picture": ""}
        try:
            resp = httpx.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "email": data.get("email", ""),
                "name": data.get("name", ""),
                "picture": data.get("picture", ""),
            }
        except Exception as exc:
            logger.error("Failed to fetch user info: %s", exc)
            return {"email": "", "name": "", "picture": ""}
