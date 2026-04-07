"""Inbox routes — process emails, list Gmail messages, send with approval.

All Gmail endpoints are **per-user**: the JWT token identifies which
user's Gmail to access.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.core.dependencies import agent_runner, auth_service, gmail_service
from app.services.gmail_service import GmailAPIError, GmailNotConnectedError

router = APIRouter(prefix="/inbox", tags=["inbox"])
security = HTTPBearer(auto_error=False)


def _get_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> str:
    """Extract the user ID from the JWT token, or return empty string."""
    if not credentials:
        return ""
    parsed = auth_service.validate_token(credentials.credentials)
    if not parsed:
        return ""
    return parsed.get("userId", "")


# ------------------------------------------------------------------
# Request models
# ------------------------------------------------------------------

class InboxPayload(BaseModel):
    content: str


class GmailSendPayload(BaseModel):
    toEmail: str
    subject: str
    body: str
    threadId: str | None = None
    inReplyToMessageId: str | None = None


# ------------------------------------------------------------------
# POST /api/inbox/process
# ------------------------------------------------------------------

@router.post("/process")
def process_inbox(payload: InboxPayload) -> dict[str, object]:
    """Run raw text/email content through the full agent pipeline."""
    return agent_runner.process(payload.content)


# ------------------------------------------------------------------
# POST /api/inbox/draft-reply
# ------------------------------------------------------------------

@router.post("/draft-reply")
def draft_reply(payload: InboxPayload) -> dict[str, str]:
    """Generate a draft via the inbox branch of the 6-agent pipeline."""
    try:
        result = agent_runner.process_for_domain(payload.content, "inbox")
        action = result.get("result", {}) or {}
        draft = str(action.get("draftReply", "") or "").strip()
        if not draft:
            extracted = (result.get("extracted") or {}) if isinstance(result.get("extracted"), dict) else {}
            fields = extracted.get("fields", {}) if isinstance(extracted, dict) else {}
            summary = str(fields.get("summary", ""))[:200]
            draft = (
                f"Hi,\n\nThank you for your message{f' about: {summary}' if summary else ''}.\n\n"
                "I'll review and follow up shortly.\n\nBest regards"
            )
        return {"subject": "Re: Your message", "draft": draft}
    except Exception:
        return {
            "subject": "Re: Your message",
            "draft": f"Hi,\n\nThanks for reaching out. I've noted: {payload.content[:200]}...\n\nBest regards",
        }


# ------------------------------------------------------------------
# GET /api/inbox/actions
# ------------------------------------------------------------------

@router.get("/actions")
def get_inbox_actions() -> list[dict[str, str]]:
    return [
        {
            "id": "inbox-1",
            "title": "Reply to professor",
            "detail": "Draft waiting for approval.",
        }
    ]


# ------------------------------------------------------------------
# GET /api/inbox/gmail/status  (per-user)
# ------------------------------------------------------------------

@router.get("/gmail/status")
def gmail_connection_status(
    user_id: str = Depends(_get_user_id),
) -> dict[str, bool]:
    """True when the current user has a non-demo OAuth token stored."""
    return gmail_service.connection_status(user_id)


# ------------------------------------------------------------------
# GET /api/inbox/gmail/messages  (per-user)
# ------------------------------------------------------------------

@router.get("/gmail/messages")
def list_gmail_messages(
    max_results: int = Query(12, ge=1, le=30),
    user_id: str = Depends(_get_user_id),
) -> list[dict[str, Any]]:
    """Return recent Gmail summaries for the authenticated user."""
    if not user_id:
        return []
    try:
        return gmail_service.list_messages(user_id, max_results=max_results)
    except GmailAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc


@router.get("/gmail/messages/{message_id}")
def get_gmail_message(
    message_id: str,
    user_id: str = Depends(_get_user_id),
) -> dict[str, object]:
    """Return one message with full MIME body for the authenticated user."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        out = gmail_service.get_message(user_id, message_id)
    except GmailNotConnectedError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except GmailAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    if not out:
        raise HTTPException(status_code=404, detail="Message not found")
    return out


# ------------------------------------------------------------------
# POST /api/inbox/gmail/send  (per-user)
# ------------------------------------------------------------------

@router.post("/gmail/send")
def send_gmail_message(
    payload: GmailSendPayload,
    user_id: str = Depends(_get_user_id),
) -> dict[str, str]:
    """Send an email that the user has already reviewed and approved."""
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return gmail_service.send_message(
            user_id=user_id,
            to_email=payload.toEmail,
            subject=payload.subject,
            body=payload.body,
            thread_id=payload.threadId,
            in_reply_to_message_id=payload.inReplyToMessageId,
        )
    except GmailNotConnectedError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except GmailAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
