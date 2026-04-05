"""Gmail service — list and send messages.

Supports two modes:
1. **Live mode** — uses the Gmail API when an OAuth access token is available.
2. **Mock mode** — returns realistic demo data so the UI works without
   any Google credentials.
"""

from __future__ import annotations

import base64
import logging
from email.mime.text import MIMEText

import httpx

from app.services.google_oauth_service import GoogleOAuthService

logger = logging.getLogger(__name__)

GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"


class GmailService:
    """Read and send Gmail messages with automatic mock fallback."""

    def __init__(self, oauth_service: GoogleOAuthService | None = None) -> None:
        self._oauth = oauth_service or GoogleOAuthService()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _is_connected(self) -> bool:
        token = self._oauth.get_stored_access_token()
        return token is not None and not token.startswith("demo-")

    def _headers(self) -> dict[str, str]:
        token = self._oauth.get_stored_access_token() or ""
        return {"Authorization": f"Bearer {token}"}

    # ------------------------------------------------------------------
    # List messages
    # ------------------------------------------------------------------

    def list_messages(self, max_results: int = 10) -> list[dict[str, str]]:
        """Return recent Gmail message summaries.

        Falls back to mock data when Gmail is not connected.
        """
        if not self._is_connected():
            return self._mock_messages()

        try:
            resp = httpx.get(
                f"{GMAIL_API}/messages",
                headers=self._headers(),
                params={"maxResults": max_results},
                timeout=15,
            )
            resp.raise_for_status()
            message_ids = [m["id"] for m in resp.json().get("messages", [])]

            results: list[dict[str, str]] = []
            for msg_id in message_ids[:max_results]:
                detail = httpx.get(
                    f"{GMAIL_API}/messages/{msg_id}",
                    headers=self._headers(),
                    params={"format": "metadata", "metadataHeaders": ["From", "Subject"]},
                    timeout=15,
                )
                detail.raise_for_status()
                data = detail.json()
                headers_list = data.get("payload", {}).get("headers", [])
                header_map = {h["name"]: h["value"] for h in headers_list}
                results.append({
                    "id": msg_id,
                    "sender": header_map.get("From", "unknown"),
                    "subject": header_map.get("Subject", "(no subject)"),
                    "snippet": data.get("snippet", ""),
                })
            return results
        except Exception as exc:
            logger.error("Gmail list_messages failed, returning mock: %s", exc)
            return self._mock_messages()

    # ------------------------------------------------------------------
    # Send message (human-approved only)
    # ------------------------------------------------------------------

    def send_message(self, to_email: str, subject: str, body: str) -> dict[str, str]:
        """Send an email via Gmail API.

        This method should ONLY be called after the user has explicitly
        approved the message in the UI (human-in-the-loop).

        Falls back to a simulated send when Gmail is not connected.
        """
        if not self._is_connected():
            return self._mock_send(to_email, subject, body)

        try:
            mime = MIMEText(body)
            mime["to"] = to_email
            mime["subject"] = subject
            raw = base64.urlsafe_b64encode(mime.as_bytes()).decode()

            resp = httpx.post(
                f"{GMAIL_API}/messages/send",
                headers=self._headers(),
                json={"raw": raw},
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            return {
                "status": "sent",
                "messageId": data.get("id", "unknown"),
                "to": to_email,
                "subject": subject,
            }
        except Exception as exc:
            logger.error("Gmail send_message failed: %s", exc)
            return {
                "status": "error",
                "to": to_email,
                "error": str(exc),
            }

    # ------------------------------------------------------------------
    # Mock helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _mock_messages() -> list[dict[str, str]]:
        return [
            {
                "id": "mock-msg-1",
                "sender": "professor@asu.edu",
                "subject": "Assignment follow-up",
                "snippet": "Please send the revised version by tomorrow.",
            },
            {
                "id": "mock-msg-2",
                "sender": "career-services@asu.edu",
                "subject": "Resume workshop this Friday",
                "snippet": "Join us for a hands-on resume review session.",
            },
            {
                "id": "mock-msg-3",
                "sender": "club-president@asu.edu",
                "subject": "Hackathon team signup",
                "snippet": "Sign up before Wednesday to secure your spot.",
            },
        ]

    @staticmethod
    def _mock_send(to_email: str, subject: str, body: str) -> dict[str, str]:
        return {
            "status": "sent (mock)",
            "messageId": "mock-sent-001",
            "to": to_email,
            "subject": subject,
            "preview": body[:120],
        }
