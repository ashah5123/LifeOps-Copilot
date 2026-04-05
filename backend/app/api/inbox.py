"""Inbox routes — process emails, list Gmail messages, send with approval."""

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.dependencies import agent_runner, gmail_service
from app.services.gmail_service import GmailAPIError, GmailNotConnectedError

router = APIRouter(prefix="/inbox", tags=["inbox"])


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
    """Run raw text/email content through the full agent pipeline.

    Works in both Gmail-connected and manual-paste mode.
    """
    return agent_runner.process(payload.content)


# ------------------------------------------------------------------
# POST /api/inbox/draft-reply  (existing helper endpoint)
# ------------------------------------------------------------------

@router.post("/draft-reply")
def draft_reply(payload: InboxPayload) -> dict[str, str]:
    """Generate a draft via the inbox branch of the 6-agent pipeline (ActionAgent draftReply)."""
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
# GET /api/inbox/actions  (existing helper endpoint)
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
# GET /api/inbox/gmail/status
# ------------------------------------------------------------------


@router.get("/gmail/status")
def gmail_connection_status() -> dict[str, bool]:
    """True when a non-demo OAuth token is stored (server can call Gmail API)."""
    return gmail_service.connection_status()


# ------------------------------------------------------------------
# GET /api/inbox/gmail/messages
# ------------------------------------------------------------------

@router.get("/gmail/messages")
def list_gmail_messages() -> list[dict[str, Any]]:
    """Return recent Gmail summaries, or [] when not connected (never mock data)."""
    try:
        return gmail_service.list_messages()
    except GmailAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc


@router.get("/gmail/messages/{message_id}")
def get_gmail_message(message_id: str) -> dict[str, object]:
    """Return one message with full MIME body (plain text or HTML stripped)."""
    try:
        out = gmail_service.get_message(message_id)
    except GmailNotConnectedError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except GmailAPIError as exc:
        raise HTTPException(status_code=502, detail=exc.message) from exc
    if not out:
        raise HTTPException(status_code=404, detail="Message not found")
    return out


# ------------------------------------------------------------------
# POST /api/inbox/gmail/send
# ------------------------------------------------------------------

@router.post("/gmail/send")
def send_gmail_message(payload: GmailSendPayload) -> dict[str, str]:
    """Send an email that the user has already reviewed and approved.

    Human-in-the-loop: the frontend must only call this after the user
    clicks 'Confirm Send'.
    """
    try:
        return gmail_service.send_message(
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
