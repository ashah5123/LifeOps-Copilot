"""Career routes — job analysis, resume tailoring, application tracking, job search."""

from uuid import uuid4

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.core.dependencies import agent_runner, firestore_service, vertex_service
from app.services.job_search_service import job_search_service

router = APIRouter(prefix="/career", tags=["career"])


# ------------------------------------------------------------------
# Request models
# ------------------------------------------------------------------

class JobAnalysisPayload(BaseModel):
    jobDescription: str
    resumeText: str = ""


class ApplicationPayload(BaseModel):
    company: str
    role: str
    status: str = "draft"


# ------------------------------------------------------------------
# POST /api/career/analyze-job
# ------------------------------------------------------------------

@router.post("/analyze-job")
def analyze_job(payload: JobAnalysisPayload) -> dict[str, object]:
    """Analyse a job description and return match insights.

    Uses Vertex AI when available; falls back to agent pipeline mock.
    """
    if vertex_service.is_live:
        prompt = (
            "Analyse this job description and return a JSON object with:\n"
            "- jobTitle: inferred job title\n"
            "- company: company name if mentioned\n"
            "- requiredSkills: list of required skills\n"
            "- matchScore: estimated fit score 0-100 based on resume\n"
            "- missingSkills: skills in the JD not in the resume\n"
            "- fitSummary: 2-3 sentence summary\n\n"
            f"Job Description:\n{payload.jobDescription}\n\n"
            f"Resume:\n{payload.resumeText or '(not provided)'}"
        )
        data = vertex_service.generate_json(prompt)
        return data if "raw" not in data else _mock_analyze(payload)

    return _mock_analyze(payload)


def _mock_analyze(payload: JobAnalysisPayload) -> dict[str, object]:
    # Run through the agent pipeline for structured extraction
    result = agent_runner.process_for_domain(payload.jobDescription, "career")
    fields = result["extracted"].get("fields", {})
    return {
        "jobTitle": fields.get("role", "Software Engineer"),
        "company": fields.get("company", "Unknown"),
        "requiredSkills": fields.get("skills", ["Python", "React", "SQL"]),
        "matchScore": 78,
        "missingSkills": ["System Design", "Kubernetes"],
        "fitSummary": f"Candidate shows relevant experience. {fields.get('summary', '')[:120]}",
    }


# ------------------------------------------------------------------
# POST /api/career/tailor-resume
# ------------------------------------------------------------------

@router.post("/tailor-resume")
def tailor_resume(payload: JobAnalysisPayload) -> dict[str, object]:
    """Suggest resume changes to improve match with a job description."""
    if vertex_service.is_live:
        prompt = (
            "Given the job description and resume below, return a JSON object with:\n"
            "- bulletSuggestions: list of 3-5 improved resume bullet points\n"
            "- keywordSuggestions: list of keywords to add\n"
            "- editSummary: brief summary of recommended changes\n\n"
            f"Job Description:\n{payload.jobDescription}\n\n"
            f"Resume:\n{payload.resumeText or '(not provided)'}"
        )
        data = vertex_service.generate_json(prompt)
        if "raw" not in data:
            return data

    return {
        "bulletSuggestions": [
            "Led cross-functional project delivery across multiple sprints.",
            "Built RESTful APIs serving 10k+ requests/day with FastAPI.",
            "Integrated CI/CD pipelines reducing deploy time by 40%.",
        ],
        "keywordSuggestions": ["agile", "cloud-native", "data pipelines", "stakeholder management"],
        "editSummary": "Focus on quantifiable impact and align terminology with the JD.",
    }


# ------------------------------------------------------------------
# Application CRUD (unchanged)
# ------------------------------------------------------------------

@router.post("/generate-cover-letter")
def generate_cover_letter(payload: JobAnalysisPayload) -> dict[str, str]:
    return {
        "coverLetter": f"Dear Hiring Team, I am excited to apply because {payload.jobDescription[:150]}"
    }


@router.post("/applications")
def create_application(payload: ApplicationPayload) -> dict[str, str]:
    record = {"id": str(uuid4()), **payload.model_dump()}
    firestore_service.create("applications", record)
    return record


@router.get("/applications")
def list_applications() -> list[dict[str, str]]:
    return firestore_service.list_collection("applications")


@router.patch("/applications/{application_id}")
def update_application(application_id: str, payload: ApplicationPayload) -> dict[str, str]:
    updated = firestore_service.update("applications", application_id, payload.model_dump())
    return updated or {"id": application_id, "status": "not-found"}


# ------------------------------------------------------------------
# GET /api/career/search-jobs?q=data+scientist
# ------------------------------------------------------------------

@router.get("/search-jobs")
async def search_jobs(q: str = Query(..., description="Search query for jobs")) -> list[dict]:
    """Search for real job listings using free APIs."""
    return await job_search_service.search_jobs(q, limit=12)
