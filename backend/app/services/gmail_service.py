"""Gmail service — list and send messages.

Supports two modes:
1. **Live mode** — uses the Gmail API when an OAuth access token is available.
2. **Mock mode** — returns realistic demo data so the UI works without
   any Google credentials.
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

logger = logging.getLogger(__name__)

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

    def list_messages(self, max_results: int = 10) -> list[dict[str, Any]]:
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

            results: list[dict[str, Any]] = []
            for msg_id in message_ids[:max_results]:
                detail = httpx.get(
                    f"{GMAIL_API}/messages/{msg_id}",
                    headers=self._headers(),
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
            logger.error("Gmail list_messages failed, returning mock: %s", exc)
            return self._mock_messages()

    def get_message(self, message_id: str) -> dict[str, object]:
        """Fetch one message with ``format=full`` and decoded plain/HTML body."""
        if not self._is_connected():
            for m in self._mock_messages():
                if m["id"] == message_id:
                    snip = str(m.get("snippet", ""))
                    return {
                        **m,
                        "body": f"{snip}\n\n(Mock full body — connect real Gmail for MIME parsing.)",
                        "isUnread": m.get("isUnread", False),
                    }
            return {}

        try:
            resp = httpx.get(
                f"{GMAIL_API}/messages/{message_id}",
                headers=self._headers(),
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
        except Exception as exc:
            logger.error("Gmail get_message failed: %s", exc)
            return {}

    # ------------------------------------------------------------------
    # Send message (human-approved only)
    # ------------------------------------------------------------------

    def send_message(
        self,
        to_email: str,
        subject: str,
        body: str,
        thread_id: str | None = None,
        in_reply_to_message_id: str | None = None,
    ) -> dict[str, str]:
        """Send an email via Gmail API.

        This method should ONLY be called after the user has explicitly
        approved the message in the UI (human-in-the-loop).

        Falls back to a simulated send when Gmail is not connected.
        """
        if not self._is_connected():
            return self._mock_send(to_email, subject, body, thread_id=thread_id)

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
                headers=self._headers(),
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
    def _mock_messages() -> list[dict[str, Any]]:
        ts = str(int(time.time() * 1000))
        return [
            {
                "id": "mock-msg-1",
                "threadId": "mock-thread-1",
                "sender": "Professor Lee <professor@asu.edu>",
                "subject": "Assignment follow-up",
                "snippet": "Please send the revised version by tomorrow.",
                "internalDate": ts,
                "isUnread": True,
                "rfc822MessageId": "<mock-1@local>",
            },
            {
                "id": "mock-msg-2",
                "threadId": "mock-thread-2",
                "sender": "Career Services <career-services@asu.edu>",
                "subject": "Resume workshop this Friday",
                "snippet": "Join us for a hands-on resume review session.",
                "internalDate": ts,
                "isUnread": True,
                "rfc822MessageId": "<mock-2@local>",
            },
            {
                "id": "mock-msg-3",
                "threadId": "mock-thread-3",
                "sender": "Club President <club-president@asu.edu>",
                "subject": "Hackathon team signup",
                "snippet": "Sign up before Wednesday to secure your spot.",
                "internalDate": ts,
                "isUnread": False,
                "rfc822MessageId": "<mock-3@local>",
            },
        ]

    @staticmethod
    def _mock_send(
        to_email: str,
        subject: str,
        body: str,
        *,
        thread_id: str | None = None,
    ) -> dict[str, str]:
        return {
            "status": "sent (mock)",
            "messageId": "mock-sent-001",
            "to": to_email,
            "subject": subject,
            "preview": body[:120],
            "threadId": thread_id or "",
        }
