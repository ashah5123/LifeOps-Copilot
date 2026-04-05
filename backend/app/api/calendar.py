"""Calendar routes — schedule extraction, reminders, and study planning."""

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.dependencies import (
    agent_runner,
    deadline_service,
    firestore_service,
    reminder_service,
    time_analytics_service,
    vertex_service,
)
from app.services.study_planner_service import StudyPlannerService
from app.services.time_analytics_service import resolve_week_argument

study_planner = StudyPlannerService()

EVENTS_COLLECTION = "calendar_events"

router = APIRouter(prefix="/calendar", tags=["calendar"])


class CalendarPayload(BaseModel):
    content: str


class ReminderCreatePayload(BaseModel):
    title: str
    dateTime: str
    sourceModule: str = "calendar"
    deadlineId: str | None = None


class ReminderUpdatePayload(BaseModel):
    title: str | None = None
    dateTime: str | None = None
    sourceModule: str | None = None
    deadlineId: str | None = None


class EventCreatePayload(BaseModel):
    title: str
    date: str
    time: str = "09:00"
    event_type: str = "other"
    location: str | None = None
    notes: str | None = None
    is_all_day: bool = False
    course_name: str | None = None


class EventUpdatePayload(BaseModel):
    title: str | None = None
    date: str | None = None
    time: str | None = None
    event_type: str | None = None
    location: str | None = None
    notes: str | None = None
    is_all_day: bool | None = None
    course_name: str | None = None


# ------------------------------------------------------------------
# POST /api/calendar/extract-schedule
# ------------------------------------------------------------------

@router.post("/extract-schedule")
def extract_schedule(payload: CalendarPayload) -> dict[str, object]:
    """Extract dates, events, and reminders from schedule/syllabus text.

    Uses Vertex AI when available; otherwise uses the agent pipeline.
    Persists extracted events and reminders to Firestore.
    """
    now = datetime.now(timezone.utc).isoformat()

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
            raw_events = data.get("events", [])
            for e in raw_events:
                firestore_service.create(EVENTS_COLLECTION, {
                    "id": str(uuid4()),
                    "title": e.get("title", "Extracted event"),
                    "date": e.get("date", ""),
                    "time": e.get("time", "09:00"),
                    "event_type": "other",
                    "location": None,
                    "notes": None,
                    "is_all_day": False,
                    "course_name": None,
                    "created_at": now,
                })
            for r in data.get("reminders", []):
                reminder_service.create_reminder(
                    title=r.get("title", "Reminder"),
                    date_time=r.get("dateTime", ""),
                    source_module="calendar",
                )
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

    # Persist to Firestore
    for e in events:
        firestore_service.create(EVENTS_COLLECTION, {
            "id": str(uuid4()),
            "title": e["title"],
            "date": e["date"],
            "time": e["time"],
            "event_type": "other",
            "location": None,
            "notes": None,
            "is_all_day": False,
            "course_name": None,
            "created_at": now,
        })

    reminders = []
    for e in events:
        r = reminder_service.create_reminder(
            title=e["title"],
            date_time=f"{e['date']}T{e['time']}:00",
            source_module="calendar",
        )
        reminders.append(r)

    return {
        "events": events,
        "reminders": reminders,
        "summary": fields.get("summary", payload.content[:180]),
        "agentResult": result,
    }


# ------------------------------------------------------------------
# Reminders CRUD
# ------------------------------------------------------------------

@router.post("/reminders", status_code=201)
def create_reminder(payload: ReminderCreatePayload) -> dict:
    """Create a reminder and persist it to Firestore."""
    reminder = reminder_service.create_reminder(
        title=payload.title,
        date_time=payload.dateTime,
        source_module=payload.sourceModule,
        deadline_id=payload.deadlineId,
    )
    return reminder


@router.get("/reminders")
def list_reminders() -> list[dict]:
    """List all reminders from Firestore."""
    return reminder_service.list_reminders()


@router.patch("/reminders/{reminder_id}")
def update_reminder(reminder_id: str, payload: ReminderUpdatePayload) -> dict:
    """Update an existing reminder."""
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="no fields to update")
    updated = reminder_service.update_reminder(reminder_id, updates)
    if updated is None:
        raise HTTPException(status_code=404, detail="reminder not found")
    return updated


@router.delete("/reminders/{reminder_id}", status_code=204)
def delete_reminder(reminder_id: str) -> None:
    """Delete a reminder."""
    deleted = reminder_service.delete_reminder(reminder_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="reminder not found")


# ------------------------------------------------------------------
# Calendar Events CRUD
# ------------------------------------------------------------------

@router.post("/events", status_code=201)
def create_event(payload: EventCreatePayload) -> dict:
    """Create a calendar event and persist it to Firestore."""
    event = {
        "id": str(uuid4()),
        "title": payload.title,
        "date": payload.date,
        "time": payload.time,
        "event_type": payload.event_type,
        "location": payload.location,
        "notes": payload.notes,
        "is_all_day": payload.is_all_day,
        "course_name": payload.course_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    firestore_service.create(EVENTS_COLLECTION, event)
    return event


@router.get("/events")
def list_events() -> list[dict]:
    """List all calendar events from Firestore."""
    return firestore_service.list_collection(EVENTS_COLLECTION)


@router.patch("/events/{event_id}")
def update_event(event_id: str, payload: EventUpdatePayload) -> dict:
    """Update an existing calendar event."""
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="no fields to update")
    updated = firestore_service.update(EVENTS_COLLECTION, event_id, updates)
    if updated is None:
        raise HTTPException(status_code=404, detail="event not found")
    return updated


@router.delete("/events/{event_id}", status_code=204)
def delete_event(event_id: str) -> None:
    """Delete a calendar event."""
    deleted = firestore_service.delete(EVENTS_COLLECTION, event_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="event not found")


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


# ------------------------------------------------------------------
# Deadline service — upcoming / overdue / milestones / reminders
# ------------------------------------------------------------------


class BigProjectPayload(BaseModel):
    big_project: dict = Field(default_factory=dict)


class DeadlineRemindersPayload(BaseModel):
    task_size: str = "medium"


@router.get("/deadlines/upcoming")
def list_upcoming_deadlines(days: int = Query(default=7, ge=1, le=366)) -> dict[str, object]:
    """All deadlines in the next N days, sorted by urgency (soonest first)."""
    items = deadline_service.get_upcoming_deadlines(days=days)
    return {"days": days, "deadlines": items, "count": len(items)}


@router.get("/deadlines/overdue")
def list_overdue_deadlines() -> dict[str, object]:
    """Missed deadlines and late assignments (excludes completed)."""
    items = deadline_service.get_overdue_items()
    return {"deadlines": items, "count": len(items)}


@router.post("/deadlines/{deadline_id}/milestones")
def create_deadline_milestones(deadline_id: str, payload: BigProjectPayload) -> dict[str, object]:
    """Break a large project into milestones with intermediate due dates."""
    base = deadline_service.get_by_id(deadline_id)
    if base is None:
        raise HTTPException(status_code=404, detail="deadline not found")
    merged: dict = {**base, **payload.big_project, "id": deadline_id}
    try:
        milestones = deadline_service.create_milestone_breakdown(merged)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"deadlineId": deadline_id, "milestones": milestones, "count": len(milestones)}


@router.post("/deadlines/{deadline_id}/reminders")
def auto_set_deadline_reminders(
    deadline_id: str,
    payload: DeadlineRemindersPayload,
) -> dict[str, object]:
    """Auto-suggest reminder times and create reminders (1w / 3d / 1d by task size)."""
    base = deadline_service.get_by_id(deadline_id)
    if base is None:
        raise HTTPException(status_code=404, detail="deadline not found")
    due_raw = base.get("dueDate") or base.get("due_date")
    if not due_raw:
        raise HTTPException(status_code=400, detail="deadline has no due date")
    suggestions = deadline_service.suggest_deadline_reminders(str(due_raw), payload.task_size)
    title = str(base.get("title", "Deadline"))
    created: list[dict[str, object]] = []
    for s in suggestions:
        r = reminder_service.create_reminder(
            title=f"{title} — {s['label']}",
            date_time=str(s["sendAt"]),
            source_module="calendar",
        )
        created.append({"suggestion": s, "reminder": r})
    return {
        "deadlineId": deadline_id,
        "taskSize": payload.task_size,
        "reminders": created,
        "count": len(created),
    }


# ------------------------------------------------------------------
# Time analytics (demo baselines)
# ------------------------------------------------------------------


@router.get("/analytics/time-distribution")
def calendar_time_distribution(
    week: str | None = Query(
        default=None,
        description="ISO week YYYY-WNN or any YYYY-MM-DD in that week; defaults to current week",
    ),
) -> dict[str, object]:
    """How time is spent: classes, study, work, free time (demo model)."""
    w = resolve_week_argument(week)
    try:
        return time_analytics_service.get_time_distribution(w)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/analytics/procrastination")
def calendar_procrastination_patterns() -> dict[str, object]:
    """Late-night studying, last-minute work, and related signals."""
    items = time_analytics_service.detect_procrastination_patterns()
    return {"patterns": items, "count": len(items)}


@router.get("/analytics/productivity-tips")
def calendar_productivity_tips() -> dict[str, object]:
    """Recommendations informed by detected procrastination patterns."""
    tips = time_analytics_service.suggest_productivity_improvements()
    return {"tips": tips, "count": len(tips)}


@router.get("/analytics/focus-times")
def calendar_focus_time_recommendations() -> dict[str, object]:
    """Suggested focus windows from historical demo patterns."""
    return time_analytics_service.get_focus_time_recommendations()
