from fastapi import APIRouter
from pydantic import BaseModel

from app.services.reminder_service import ReminderService

router = APIRouter(prefix="/calendar", tags=["calendar"])
reminder_service = ReminderService()


class CalendarPayload(BaseModel):
    content: str


@router.post("/extract-schedule")
def extract_schedule(payload: CalendarPayload) -> dict[str, object]:
    return {
        "events": [
            {"title": "Data Structures Class", "date": "2026-04-06", "time": "09:00"},
            {"title": "Project Review", "date": "2026-04-07", "time": "14:00"}
        ],
        "summary": payload.content[:180]
    }


@router.post("/reminders")
def create_reminder(payload: CalendarPayload) -> dict[str, str]:
    return reminder_service.create_reminder(
        title="Reminder from uploaded schedule",
        date_time="2026-04-06T09:00:00",
        source_module="calendar"
    )


@router.get("/events")
def list_events() -> list[dict[str, str]]:
    return [{"id": "event-1", "title": "Class", "date": "2026-04-06", "time": "09:00"}]


@router.post("/sync-google")
def sync_google_calendar() -> dict[str, str]:
    return {"status": "connected-in-demo-mode"}
