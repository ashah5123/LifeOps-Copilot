from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.dependencies import firestore_service

router = APIRouter(prefix="/career", tags=["career"])


class JobAnalysisPayload(BaseModel):
    jobDescription: str
    resumeText: str


class ApplicationPayload(BaseModel):
    company: str
    role: str
    status: str = "draft"


@router.post("/analyze-job")
def analyze_job(payload: JobAnalysisPayload) -> dict[str, object]:
    return {
        "matchScore": 82,
        "missingSkills": ["System Design", "SQL"],
        "summary": payload.jobDescription[:180]
    }


@router.post("/tailor-resume")
def tailor_resume(payload: JobAnalysisPayload) -> dict[str, list[str]]:
    return {
        "bulletSuggestions": [
            "Led student project delivery across multiple deadlines.",
            "Built full-stack features with API integrations.",
            "Improved team productivity with automation workflows."
        ]
    }


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
