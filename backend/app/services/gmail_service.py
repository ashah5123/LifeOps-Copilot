"""Gmail service — list and send messages via the Gmail API.

Requires a real OAuth access token (no mock inbox). When disconnected,
callers get an empty list or HTTP errors from the API routes.

All operations are **per-user**: the caller must provide a user_id so
the correct OAuth token is used.
"""

from __future__ import annotations

import base64
from typing import Any
import html as html_module
import logging
import re
import time
from email.mime.text import MIMEText

import httpx

from app.services.google_oauth_service import GoogleOAuthService
from app.core.config import settings

logger = logging.getLogger(__name__)


class GmailNotConnectedError(Exception):
    """Raised when Gmail OAuth is not configured or no live token is stored."""


class GmailAPIError(Exception):
    """Raised when the Gmail HTTP API returns an error."""

    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)

GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me"


def _decode_part_data(data_b64: str) -> str:
    if not data_b64:
        return ""
    pad = (-len(data_b64)) % 4
    raw = base64.urlsafe_b64decode(data_b64 + "=" * pad)
    return raw.decode("utf-8", errors="replace")


def _strip_html_to_text(html: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", html, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return html_module.unescape(re.sub(r"[ \t]+", " ", text).strip())


def _collect_text_parts(payload: dict) -> tuple[str, str]:
    """Walk a Gmail message payload; return (best_plain, best_html)."""
    plain_acc, html_acc = "", ""

    def walk(part: dict) -> None:
        nonlocal plain_acc, html_acc
        mime = (part.get("mimeType") or "").lower()
        body = part.get("body", {})
        data = body.get("data")
        if data:
            raw = _decode_part_data(data)
            if mime == "text/plain" and not plain_acc:
                plain_acc = raw
            elif mime == "text/html" and not html_acc:
                html_acc = raw
        for sub in part.get("parts") or []:
            walk(sub)

    if payload.get("parts"):
        for p in payload["parts"]:
            walk(p)
    else:
        walk(payload)
    return plain_acc, html_acc


def _body_from_payload(payload: dict, fallback_snippet: str) -> str:
    plain, html_body = _collect_text_parts(payload)
    if plain.strip():
        return plain.strip()
    if html_body.strip():
        return _strip_html_to_text(html_body)
    return fallback_snippet or ""


class GmailService:
    """Read and send Gmail messages using per-user OAuth tokens."""

    def __init__(self, oauth_service: GoogleOAuthService | None = None) -> None:
        self._oauth = oauth_service or GoogleOAuthService()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _headers_for_user(self, user_id: str) -> dict[str, str]:
        token = self._oauth.get_user_access_token(user_id) or ""
        return {"Authorization": f"Bearer {token}"}

    def connection_status(self, user_id: str) -> dict[str, bool]:
        """Whether the server can call Gmail on behalf of a specific user."""
        connected = self._oauth.is_user_connected(user_id) if user_id else False
        return {
            "connected": connected,
            "oauthConfigured": settings.is_oauth_configured,
        }

    # ------------------------------------------------------------------
    # List messages
    # ------------------------------------------------------------------

    def list_messages(self, user_id: str, max_results: int = 12) -> list[dict[str, Any]]:
        """Return recent Gmail message summaries for a user."""
        if not self._oauth.is_user_connected(user_id):
            return []

        headers = self._headers_for_user(user_id)
        try:
            resp = httpx.get(
                f"{GMAIL_API}/messages",
                headers=headers,
                params={"maxResults": max_results},
                timeout=15,
            )
            resp.raise_for_status()
            message_ids = [m["id"] for m in resp.json().get("messages", [])]

            results: list[dict[str, Any]] = []
            for msg_id in message_ids[:max_results]:
                detail = httpx.get(
                    f"{GMAIL_API}/messages/{msg_id}",
                    headers=headers,
                    params={
                        "format": "metadata",
                        "metadataHeaders": ["From", "Subject", "Message-Id"],
                    },
                    timeout=15,
                )
                detail.raise_for_status()
                data = detail.json()
                headers_list = data.get("payload", {}).get("headers", [])
                header_map = {h["name"]: h["value"] for h in headers_list}
                label_ids = data.get("labelIds") or []
                internal_date = data.get("internalDate") or str(int(time.time() * 1000))
                results.append({
                    "id": msg_id,
                    "threadId": data.get("threadId", msg_id),
                    "sender": header_map.get("From", "unknown"),
                    "subject": header_map.get("Subject", "(no subject)"),
                    "snippet": data.get("snippet", ""),
                    "internalDate": internal_date,
                    "isUnread": "UNREAD" in label_ids,
                    "rfc822MessageId": header_map.get("Message-Id", ""),
                })
            return results
        except Exception as exc:
            logger.error("Gmail list_messages failed for user %s: %s", user_id, exc)
            raise GmailAPIError(f"Could not load messages from Gmail: {exc}") from exc

    def get_message(self, user_id: str, message_id: str) -> dict[str, object]:
        """Fetch one message with decoded plain/HTML body."""
        if not self._oauth.is_user_connected(user_id):
            raise GmailNotConnectedError("Gmail is not connected. Complete Google sign-in from Inbox.")

        headers = self._headers_for_user(user_id)
        try:
            resp = httpx.get(
                f"{GMAIL_API}/messages/{message_id}",
                headers=headers,
                params={"format": "full"},
                timeout=25,
            )
            resp.raise_for_status()
            data = resp.json()
            payload = data.get("payload") or {}
            headers_list = payload.get("headers", [])
            header_map = {h["name"]: h["value"] for h in headers_list}
            label_ids = data.get("labelIds") or []
            body_text = _body_from_payload(payload, data.get("snippet") or "")
            return {
                "id": message_id,
                "threadId": str(data.get("threadId") or message_id),
                "sender": header_map.get("From", "unknown"),
                "subject": header_map.get("Subject", "(no subject)"),
                "snippet": data.get("snippet", ""),
                "body": body_text,
                "internalDate": str(data.get("internalDate") or int(time.time() * 1000)),
                "isUnread": "UNREAD" in label_ids,
                "rfc822MessageId": header_map.get("Message-Id", ""),
            }
        except GmailNotConnectedError:
            raise
        except Exception as exc:
            logger.error("Gmail get_message failed for user %s: %s", user_id, exc)
            raise GmailAPIError(f"Could not load message: {exc}") from exc

    # ------------------------------------------------------------------
    # Send message (human-approved only)
    # ------------------------------------------------------------------

    def send_message(
        self,
        user_id: str,
        to_email: str,
        subject: str,
        body: str,
        thread_id: str | None = None,
        in_reply_to_message_id: str | None = None,
    ) -> dict[str, str]:
        """Send an email via Gmail API after explicit user approval."""
        if not self._oauth.is_user_connected(user_id):
            raise GmailNotConnectedError("Gmail is not connected. Connect Gmail before sending.")

        headers = self._headers_for_user(user_id)
        try:
            mime = MIMEText(body)
            mime["to"] = to_email
            mime["subject"] = subject
            if in_reply_to_message_id:
                mid = in_reply_to_message_id.strip()
                if not mid.startswith("<"):
                    mid = f"<{mid}>"
                mime["In-Reply-To"] = mid
                mime["References"] = mid
            raw = base64.urlsafe_b64encode(mime.as_bytes()).decode()

            send_body: dict[str, str] = {"raw": raw}
            if thread_id:
                send_body["threadId"] = thread_id

            resp = httpx.post(
                f"{GMAIL_API}/messages/send",
                headers=headers,
                json=send_body,
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
        except GmailNotConnectedError:
            raise
        except Exception as exc:
            logger.error("Gmail send_message failed for user %s: %s", user_id, exc)
            raise GmailAPIError(f"Send failed: {exc}") from exc
