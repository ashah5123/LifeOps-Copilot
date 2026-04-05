from pydantic import BaseModel, Field


class SkillsTracking(BaseModel):
    id: str
    user_id: str
    skill_name: str
    proficiency: str
    source: str
    verified: bool = False
    date_acquired: str = ""
    last_used: str = ""
    related_projects: list[str] = Field(default_factory=list)
