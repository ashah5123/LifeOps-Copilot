from pydantic import BaseModel


class JobListing(BaseModel):
    id: str
    title: str
    company: str
    company_logo: str | None = None
    location: str
    work_mode: str = "onsite"          # remote | hybrid | onsite
    salary_min: float | None = None
    salary_max: float | None = None
    salary_currency: str = "USD"
    description: str = ""              # full HTML/text from API
    responsibilities: list[str] = []
    qualifications: list[str] = []
    apply_link: str = ""
    posted_date: str = ""              # ISO date string
    expires_date: str | None = None
    job_type: str = "full-time"        # full-time | part-time | internship | contract
    experience_level: str = "mid"      # entry | mid | senior
    skills_required: list[str] = []
    benefits: list[str] = []
    source: str = "jsearch"
    is_saved: bool = False
    created_at: str
