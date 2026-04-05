"""Calendar routes — schedule extraction, reminders, and study planning."""

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.core.dependencies import agent_runner, reminder_service, vertex_service
from app.services.study_planner_service import StudyPlannerService

study_planner = StudyPlannerService()

router = APIRouter(prefix="/calendar", tags=["calendar"])


class CalendarPayload(BaseModel):
    content: str


# ------------------------------------------------------------------
# POST /api/calendar/extract-schedule
# ------------------------------------------------------------------

@router.post("/extract-schedule")
def extract_schedule(payload: CalendarPayload) -> dict[str, object]:
    """Extract dates, events, and reminders from schedule/syllabus text.

    Uses Vertex AI when available; otherwise uses the agent pipeline.
    """
    if vertex_service.is_live:
        prompt = (
            "Extract a schedule from the text below and return a JSON object with:\n"
            "- events: list of {title, date (YYYY-MM-DD), time (HH:MM)}\n"
            "- reminders: list of {title, dateTime (ISO 8601)}\n"
            "- summary: 1-2 sentence summary of what was extracted\n\n"
            f"Input:\n{payload.content}"
        )
        data = vertex_service.generate_json(prompt)
        if "raw" not in data:
            return data

    # Fallback: run through agent pipeline
    result = agent_runner.process_for_domain(payload.content, "calendar")
    fields = result["extracted"].get("fields", {})
    dates = fields.get("dates", [])

    events = [
        {"title": fields.get("title", "Extracted event"), "date": d, "time": "09:00"}
        for d in dates
    ] if dates else [
        {"title": "Data Structures Class", "date": "2026-04-06", "time": "09:00"},
        {"title": "Project Review", "date": "2026-04-07", "time": "14:00"},
    ]

    return {
        "events": events,
        "reminders": [{"title": e["title"], "dateTime": f"{e['date']}T{e['time']}:00"} for e in events],
        "summary": fields.get("summary", payload.content[:180]),
        "agentResult": result,
    }


# ------------------------------------------------------------------
# POST /api/calendar/reminders
# ------------------------------------------------------------------

@router.post("/reminders")
def create_reminder(payload: CalendarPayload) -> dict[str, object]:
    """Create reminders from schedule text.

    Extracts dates first via the agent pipeline, then creates reminder
    objects through the reminder service.
    """
    result = agent_runner.process_for_domain(payload.content, "calendar")
    fields = result["extracted"].get("fields", {})
    dates = fields.get("dates", [])

    created: list[dict[str, str]] = []
    if dates:
        for d in dates:
            r = reminder_service.create_reminder(
                title=fields.get("title", "Reminder"),
                date_time=f"{d}T09:00:00",
                source_module="calendar",
            )
            created.append(r)
    else:
        created.append(
            reminder_service.create_reminder(
                title="Reminder from uploaded schedule",
                date_time="2026-04-06T09:00:00",
                source_module="calendar",
            )
        )

    return {
        "reminders": created,
        "count": len(created),
        "requiresApproval": result["review"].get("requiresApproval", True),
    }


# ------------------------------------------------------------------
# Existing helper endpoints (unchanged)
# ------------------------------------------------------------------

@router.get("/events")
def list_events() -> list[dict[str, str]]:
    return [{"id": "event-1", "title": "Class", "date": "2026-04-06", "time": "09:00"}]


@router.post("/sync-google")
def sync_google_calendar() -> dict[str, str]:
    return {"status": "connected-in-demo-mode"}


# ------------------------------------------------------------------
# Study planning request models
# ------------------------------------------------------------------

class SyllabusParsePayload(BaseModel):
    syllabusText: str


class StudyPlanPayload(BaseModel):
    courses: list[dict]
    studyHoursPerWeek: float = 20.0


class ConflictsPayload(BaseModel):
    events: list[dict]


class StudyBlocksPayload(BaseModel):
    calendarEvents: list[dict] = []


class AssignmentPriorityPayload(BaseModel):
    assignments: list[dict]


# ------------------------------------------------------------------
# POST /api/calendar/syllabus/parse
# ------------------------------------------------------------------

@router.post("/syllabus/parse")
def parse_syllabus(payload: SyllabusParsePayload) -> dict:
    """Extract course details, assignments, and exams from syllabus text."""
    return study_planner.parse_syllabus(payload.syllabusText)


# ------------------------------------------------------------------
# POST /api/calendar/study-plan
# ------------------------------------------------------------------

@router.post("/study-plan")
def create_study_plan(payload: StudyPlanPayload) -> dict:
    """Generate a weekly study schedule across provided courses."""
    return study_planner.create_study_plan(payload.courses, payload.studyHoursPerWeek)


# ------------------------------------------------------------------
# POST /api/calendar/conflicts
# ------------------------------------------------------------------

@router.post("/conflicts")
def detect_conflicts(payload: ConflictsPayload) -> dict:
    """Detect scheduling conflicts among a list of calendar events."""
    return study_planner.detect_scheduling_conflicts(payload.events)


# ------------------------------------------------------------------
# POST /api/calendar/study-blocks
# ------------------------------------------------------------------

@router.post("/study-blocks")
def suggest_study_blocks(payload: StudyBlocksPayload) -> list:
    """Return suggested 2-hour study windows over the next 7 days."""
    return study_planner.suggest_study_blocks(payload.calendarEvents)


# ------------------------------------------------------------------
# GET /api/calendar/workload/{week}
# ------------------------------------------------------------------

@router.get("/workload/{week}")
def get_workload(week: str) -> dict:
    """Return workload analysis for a given week (YYYY-WNN or YYYY-MM-DD)."""
    return study_planner.calculate_workload(week)


# ------------------------------------------------------------------
# POST /api/calendar/assignments/priority
# ------------------------------------------------------------------

@router.post("/assignments/priority")
def prioritize_assignments(payload: AssignmentPriorityPayload) -> list:
    """Return assignments sorted by urgency score."""
    return study_planner.prioritize_assignments(payload.assignments)
