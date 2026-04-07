"""Google OAuth service for Gmail authorization.

Handles building the consent URL and exchanging authorization codes for
tokens.  Persists tokens **per user** via the shared document store
(MongoDB or in-memory) so they survive backend restarts.
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


class GoogleOAuthService:
    """Builds OAuth URLs and exchanges codes for tokens (per-user)."""

    def __init__(self, document_store: Any | None = None) -> None:
        self._store = document_store
        # In-memory cache keyed by user_id
        self._cache: dict[str, dict[str, str]] = {}

    # ------------------------------------------------------------------
    # Per-user token persistence
    # ------------------------------------------------------------------

    def _doc_id(self, user_id: str) -> str:
        return f"oauth_{user_id}"

    def _load_user_tokens(self, user_id: str) -> dict[str, str] | None:
        """Load tokens for a specific user from the store."""
        if user_id in self._cache:
            return self._cache[user_id]
        if not self._store:
            return None
        doc = self._store.get(OAUTH_COLLECTION, self._doc_id(user_id))
        if doc and doc.get("access_token"):
            tokens = {
                "access_token": str(doc["access_token"]),
                "refresh_token": str(doc.get("refresh_token") or ""),
                "scope": str(doc.get("scope") or ""),
            }
            self._cache[user_id] = tokens
            return tokens
        return None

    def _persist_user_tokens(self, user_id: str, tokens: dict[str, str]) -> None:
        self._cache[user_id] = tokens
        if self._store:
            self._store.upsert(
                OAUTH_COLLECTION,
                self._doc_id(user_id),
                {
                    "access_token": tokens.get("access_token", ""),
                    "refresh_token": tokens.get("refresh_token", ""),
                    "scope": tokens.get("scope", ""),
                    "user_id": user_id,
                },
            )

    def clear_user_tokens(self, user_id: str) -> None:
        """Remove stored tokens for a user."""
        self._cache.pop(user_id, None)
        if self._store:
            self._store.delete(OAUTH_COLLECTION, self._doc_id(user_id))

    # ------------------------------------------------------------------
    # OAuth URL + code exchange
    # ------------------------------------------------------------------

    def get_authorization_url(self, state: str = "") -> str:
        """Return the Google OAuth consent URL."""
        params = {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_redirect_uri,
            "response_type": "code",
            "scope": SCOPES,
            "access_type": "offline",
            "prompt": "consent",
        }
        if state:
            params["state"] = state
        return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"

    def exchange_code_for_tokens(self, code: str) -> dict[str, str]:
        """Exchange an authorization code for access/refresh tokens."""
        if not settings.is_oauth_configured:
            logger.info("OAuth not configured — returning demo tokens")
            return {
                "access_token": f"demo-access-token-{code[:8]}",
                "refresh_token": "demo-refresh-token",
                "scope": "gmail.readonly gmail.send",
            }

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
            return {
                "access_token": data["access_token"],
                "refresh_token": data.get("refresh_token", ""),
                "scope": data.get("scope", ""),
            }
        except Exception as exc:
            logger.error("Token exchange failed: %s", exc)
            return {
                "access_token": "",
                "refresh_token": "",
                "scope": "",
                "error": str(exc),
            }

    def store_tokens_for_user(self, user_id: str, tokens: dict[str, str]) -> None:
        """Persist tokens for a specific user after OAuth callback."""
        self._persist_user_tokens(user_id, tokens)

    # ------------------------------------------------------------------
    # Per-user token retrieval (with refresh)
    # ------------------------------------------------------------------

    def get_user_access_token(self, user_id: str) -> str | None:
        """Return access token for a user, refreshing if needed."""
        current = self._load_user_tokens(user_id)
        if not current:
            return None
        token = current.get("access_token", "")
        if not token or token.startswith("demo-"):
            return token or None

        # Try refreshing — access tokens expire in 1 hour
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
                        self._persist_user_tokens(user_id, tokens)
                        return new_token
            except Exception as exc:
                logger.debug("Token refresh failed for user %s: %s", user_id, exc)

        return token or None

    def is_user_connected(self, user_id: str) -> bool:
        """Check if a user has a valid (non-demo) Gmail token."""
        token = self.get_user_access_token(user_id)
        return token is not None and not token.startswith("demo-")

    # ------------------------------------------------------------------
    # User info
    # ------------------------------------------------------------------

    def get_user_info(self, access_token: str) -> dict[str, str]:
        """Fetch the authenticated user's Google profile."""
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
