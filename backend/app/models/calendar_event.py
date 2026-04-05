from pydantic import BaseModel


class CalendarEvent(BaseModel):
    id: str
    title: str
    date: str                        # YYYY-MM-DD
    time: str                        # HH:MM
    event_type: str                  # class | assignment | exam | meeting | other
    location: str | None = None
    notes: str | None = None
    is_all_day: bool = False
    course_name: str | None = None
    created_at: str
