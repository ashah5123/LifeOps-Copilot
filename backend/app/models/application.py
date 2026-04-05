from pydantic import BaseModel


class Application(BaseModel):
    id: str
    company: str
    role: str
    status: str
    applied_date: str
    job_url: str = ""
    job_description: str = ""
    salary_range: str = ""
    location: str = ""
    work_mode: str = ""
    recruiter_name: str | None = None
    recruiter_email: str | None = None
    interview_dates: list[dict] = []
    notes: str = ""
    resume_version: str = ""
    cover_letter: str = ""
    follow_up_date: str | None = None
    match_score: int = 0
    job_id: str | None = None
    created_at: str = ""
    updated_at: str = ""
