from pydantic import BaseModel


class Reminder(BaseModel):
    id: str
    title: str
    dateTime: str
    sourceModule: str
    deadlineId: str | None = None
