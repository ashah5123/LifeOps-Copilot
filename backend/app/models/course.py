from pydantic import BaseModel


class Course(BaseModel):
    id: str
    course_name: str
    course_code: str
    instructor: str
    credits: int
    schedule: list[dict] = []
    assignments: list[dict] = []
    exams: list[dict] = []
    office_hours: list[dict] = []
    grading_breakdown: dict = {}
