from pydantic import BaseModel, Field


class TimeActivityLog(BaseModel):
    """Single focused block of time for building weekly distribution and focus patterns."""

    id: str
    user_id: str
    started_at: str
    ended_at: str
    category: str
    label: str | None = None
    course: str | None = None
    source: str | None = None


class TimeWeekSummary(BaseModel):
    """Pre-aggregated hours for one ISO week (`get_time_distribution` source of truth)."""

    id: str
    user_id: str
    week: str
    hours: dict[str, float]
    source: str = "tracked"
    updated_at: str | None = None


class CourseStudyMetrics(BaseModel):
    """Hours vs outcomes for `calculate_study_efficiency`."""

    id: str
    user_id: str
    course: str
    course_code: str | None = None
    semester: str | None = None
    hours_logged: float
    grade_percent: float | None = None
    updated_at: str | None = None


class BehaviorSignal(BaseModel):
    """Detected procrastination / workload patterns (`detect_procrastination_patterns`)."""

    id: str
    user_id: str
    signal_type: str
    severity: str
    detected_at: str
    occurrences_window: int | None = None
    metadata: dict[str, object] = Field(default_factory=dict)


class FocusTimeProfile(BaseModel):
    """Learned best / avoid windows (`get_focus_time_recommendations`)."""

    id: str
    user_id: str
    best_windows: list[dict[str, object]] = Field(default_factory=list)
    secondary_windows: list[dict[str, object]] = Field(default_factory=list)
    avoid: list[dict[str, object]] = Field(default_factory=list)
    historical_basis: str | None = None
    timezone_note: str | None = None
    updated_at: str | None = None
