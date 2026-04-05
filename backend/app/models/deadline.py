from pydantic import BaseModel, Field


class DeadlineMilestone(BaseModel):
    """Intermediate checkpoint for a project or large assignment."""

    order: int
    title: str
    dueDate: str
    percent_complete_target: int | None = None


class CalendarDeadline(BaseModel):
    """Calendar / academic deadline stored in `deadlines` collection."""

    id: str
    title: str
    type: str
    dueDate: str
    status: str
    user_id: str | None = None
    course: str | None = None
    notes: str | None = None
    milestones: list[DeadlineMilestone] = Field(default_factory=list)
    created_at: str | None = None
    updated_at: str | None = None
