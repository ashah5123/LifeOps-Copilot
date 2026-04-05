from pydantic import BaseModel, Field


class PracticeQuestionItem(BaseModel):
    question: str
    category: str
    answer: str | None = None


class StarStoryItem(BaseModel):
    situation: str
    task: str
    action: str
    result: str


class CompanyResearch(BaseModel):
    size: str = ""
    culture: str = ""
    recent_news: list[str] = Field(default_factory=list)
    values: list[str] = Field(default_factory=list)


class InterviewPrep(BaseModel):
    id: str
    application_id: str
    company: str
    role: str
    interview_date: str
    interview_type: str
    practice_questions: list[dict] = Field(default_factory=list)
    star_stories: list[dict] = Field(default_factory=list)
    company_research: dict = Field(default_factory=dict)
    questions_to_ask: list[str] = Field(default_factory=list)
    preparation_status: str = "not_started"
    created_at: str = ""
