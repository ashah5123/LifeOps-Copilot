"""Calendar routes — schedule extraction, reminders, and study planning."""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.dependencies import (
    agent_runner,
    deadline_service,
    reminder_service,
    time_analytics_service,
    vertex_service,
)
from app.services.study_planner_service import StudyPlannerService
from app.services.time_analytics_service import resolve_week_argument

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
