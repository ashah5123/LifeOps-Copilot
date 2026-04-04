from fastapi import APIRouter
from pydantic import BaseModel

from app.core.dependencies import agent_runner
from app.services.gmail_service import GmailService

router = APIRouter(prefix="/inbox", tags=["inbox"])
gmail_service = GmailService()


class InboxPayload(BaseModel):
    content: str


@router.post("/process")
def process_inbox(payload: InboxPayload) -> dict[str, object]:
    return agent_runner.process(payload.content)


@router.post("/draft-reply")
def draft_reply(payload: InboxPayload) -> dict[str, str]:
    return {
        "subject": "Re: Your request",
        "draft": f"Hello, here is a suggested reply based on: {payload.content[:120]}"
    }


@router.get("/actions")
def get_inbox_actions() -> list[dict[str, str]]:
    return [
        {
            "id": "inbox-1",
            "title": "Reply to professor",
            "detail": "Draft waiting for approval."
        }
    ]


class GmailSendPayload(BaseModel):
    toEmail: str
    subject: str
    body: str


@router.get("/gmail/messages")
def list_gmail_messages() -> list[dict[str, str]]:
    return gmail_service.list_messages()


@router.post("/gmail/send")
def send_gmail_message(payload: GmailSendPayload) -> dict[str, str]:
    return gmail_service.send_message(
        to_email=payload.toEmail,
        subject=payload.subject,
        body=payload.body
    )
