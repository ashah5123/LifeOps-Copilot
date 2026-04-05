"""Career routes — job analysis, resume tailoring, application tracking, job search."""

import re
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.core.dependencies import (
    agent_runner,
    firestore_service,
    job_matching_service,
    job_scraper_service,
    vertex_service,
)
from app.services.application_pipeline_service import ApplicationPipelineService
from app.services.interview_prep_service import InterviewPrepService
from app.services.job_search_service import job_search_service
from app.services.skills_analysis_service import SkillsAnalysisService

router = APIRouter(prefix="/career", tags=["career"])
pipeline_service = ApplicationPipelineService(firestore_service)
interview_prep = InterviewPrepService()
skills_service = SkillsAnalysisService(firestore_service)

SAVED_JOBS_COLLECTION = "saved_jobs"


# ------------------------------------------------------------------
# Request models
# ------------------------------------------------------------------

class JobAnalysisPayload(BaseModel):
    jobDescription: str
    resumeText: str = ""


class ApplicationPayload(BaseModel):
    company: str
    role: str
    status: str = "saved"
    applied_date: str = ""
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
# POST /api/career/generate-cover-letter
# ------------------------------------------------------------------

@router.post("/generate-cover-letter")
def generate_cover_letter(payload: JobAnalysisPayload) -> dict[str, str]:
    return {
        "coverLetter": f"Dear Hiring Team, I am excited to apply because {payload.jobDescription[:150]}"
    }


def _strip_html_for_prompt(text: str) -> str:
    if not text:
        return ""
    s = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
    s = re.sub(r"<style[\s\S]*?</style>", " ", s, flags=re.I)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


class AtsOptimizePayload(BaseModel):
    job_description: str
    resume_text: str = ""
    company: str = ""
    role: str = ""


@router.post("/ats-optimize-resume")
def ats_optimize_resume(payload: AtsOptimizePayload) -> dict:
    """Rewrite resume text for ATS alignment with a specific job (Gemini / Vertex when configured)."""
    jd_plain = _strip_html_for_prompt(payload.job_description)[:8000]
    resume = (payload.resume_text or "")[:12000]
    role = payload.role or "this role"
    company = payload.company or "the employer"

    transparency_steps = [
        "Parsed job description (HTML stripped for analysis).",
        f"Scoped keywords for {role} at {company}.",
        "Rewrote resume bullets for ATS keyword overlap and clear impact metrics.",
    ]

    prompt = (
        "You are an expert ATS (applicant tracking system) resume coach.\n"
        "Rewrite the candidate resume as plain text so it scores highly for THIS job.\n"
        "Return ONLY valid JSON with keys:\n"
        "- optimized_resume_text (string, full resume plain text, no markdown)\n"
        "- estimated_ats_match_percent (integer 0-100, realistic but aim for strong fit)\n"
        "- change_summary (string, 2-4 sentences)\n"
        "- keywords_added (array of up to 15 short strings)\n\n"
        f"Job title: {role}\nCompany: {company}\n\n"
        f"Job description:\n{jd_plain}\n\n"
        f"Current resume:\n{resume}\n"
    )

    if vertex_service.is_live:
        data = vertex_service.generate_json(
            prompt,
            "Respond with JSON only. No markdown fences.",
        )
        if "raw" in data or "optimized_resume_text" not in data:
            data = {
                "optimized_resume_text": _mock_optimized_resume(resume, role, company),
                "estimated_ats_match_percent": 90,
                "change_summary": "Used fallback template; Vertex returned non-JSON.",
                "keywords_added": ["communication", "attention to detail", "quality"],
            }
    else:
        data = {
            "optimized_resume_text": _mock_optimized_resume(resume, role, company),
            "estimated_ats_match_percent": 90,
            "change_summary": (
                f"Demo mode (no Vertex): prepended an ATS summary block aligned to {role}. "
                "Enable GCP + Vertex for a real Gemini rewrite."
            ),
            "keywords_added": _extract_simple_keywords(jd_plain),
        }

    return {
        "optimized_resume_text": str(data.get("optimized_resume_text", resume)),
        "estimated_ats_match_percent": int(data.get("estimated_ats_match_percent", 88)),
        "change_summary": str(data.get("change_summary", "")),
        "keywords_added": data.get("keywords_added") if isinstance(data.get("keywords_added"), list) else [],
        "transparency_steps": transparency_steps,
    }


def _mock_optimized_resume(resume: str, role: str, company: str) -> str:
    header = (
        f"[ATS-OPTIMIZED SUMMARY FOR {role.upper()} — {company}]\n"
        "Aligned phrasing with posting keywords | Quantified outcomes where possible.\n\n"
    )
    return header + (resume or "[No resume text provided — paste your resume and try again.]")


def _extract_simple_keywords(jd: str) -> list[str]:
    words = re.findall(r"[A-Za-z][A-Za-z+.#]{2,}", jd.lower())
    stop = {
        "the", "and", "for", "with", "you", "your", "our", "are", "will", "this", "that", "from", "have",
        "has", "been", "any", "all", "not", "can", "may", "must", "work", "team", "job", "role",
    }
    freq: dict[str, int] = {}
    for w in words:
        if w in stop or len(w) < 4:
            continue
        freq[w] = freq.get(w, 0) + 1
    top = sorted(freq.keys(), key=lambda k: freq[k], reverse=True)[:12]
    return top


# ------------------------------------------------------------------
# Application CRUD
# ------------------------------------------------------------------

@router.post("/applications")
def create_application(payload: ApplicationPayload) -> dict:
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    record = {
        "id": str(uuid4()),
        **payload.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    firestore_service.create("applications", record)
    return record


@router.get("/applications")
def list_applications() -> list[dict]:
    return firestore_service.list_collection("applications")


@router.get("/applications/{application_id}")
def get_application(application_id: str) -> dict:
    record = firestore_service.get("applications", application_id)
    return record or {"id": application_id, "status": "not-found"}


@router.patch("/applications/{application_id}")
def update_application(application_id: str, payload: ApplicationPayload) -> dict:
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    updated = firestore_service.update(
        "applications",
        application_id,
        {**payload.model_dump(), "updated_at": now},
    )
    return updated or {"id": application_id, "status": "not-found"}


# ------------------------------------------------------------------
# Pipeline overview
# ------------------------------------------------------------------

@router.get("/pipeline")
def get_pipeline() -> dict:
    return pipeline_service.get_pipeline_overview()


# ------------------------------------------------------------------
# Upcoming interviews
# ------------------------------------------------------------------

@router.get("/interviews/upcoming")
def get_upcoming_interviews() -> list:
    return pipeline_service.get_upcoming_interviews()


# ------------------------------------------------------------------
# Follow-ups needed
# ------------------------------------------------------------------

@router.get("/follow-ups")
def get_followups() -> list:
    return pipeline_service.get_applications_needing_followup()


# ------------------------------------------------------------------
# Success metrics
# ------------------------------------------------------------------

@router.get("/metrics")
def get_metrics() -> dict:
    return pipeline_service.track_application_metrics()


# ------------------------------------------------------------------
# Next action suggestion
# ------------------------------------------------------------------

@router.get("/applications/{application_id}/next-action")
def get_next_action(application_id: str) -> dict:
    return pipeline_service.suggest_next_action(application_id)


# ------------------------------------------------------------------
# Interview prep — request models
# ------------------------------------------------------------------

class InterviewQuestionsPayload(BaseModel):
    jobDescription: str
    role: str


class StarStoriesPayload(BaseModel):
    resumeText: str


class CompanyResearchPayload(BaseModel):
    companyName: str


class QuestionsToAskPayload(BaseModel):
    companyName: str
    role: str


class InterviewChecklistPayload(BaseModel):
    interviewType: str


# ------------------------------------------------------------------
# Interview prep — endpoints
# ------------------------------------------------------------------

@router.post("/interview-prep/questions")
def get_practice_questions(payload: InterviewQuestionsPayload) -> list:
    return interview_prep.generate_practice_questions(payload.jobDescription, payload.role)


@router.post("/interview-prep/star-stories")
def get_star_stories(payload: StarStoriesPayload) -> list:
    return interview_prep.create_star_responses(payload.resumeText)


@router.post("/interview-prep/company-research")
def get_company_research(payload: CompanyResearchPayload) -> dict:
    return interview_prep.research_company(payload.companyName)


@router.post("/interview-prep/questions-to-ask")
def get_questions_to_ask(payload: QuestionsToAskPayload) -> list:
    return interview_prep.prepare_questions_to_ask(payload.companyName, payload.role)


@router.post("/interview-prep/checklist")
def get_interview_checklist(payload: InterviewChecklistPayload) -> list:
    return interview_prep.create_interview_checklist(payload.interviewType)


# ------------------------------------------------------------------
# Skills analysis — request models
# ------------------------------------------------------------------

class SkillsGapPayload(BaseModel):
    resumeText: str
    jobDescription: str


class CertificationsPayload(BaseModel):
    targetRole: str


class LearningPlanPayload(BaseModel):
    missingSkills: list[str]


# ------------------------------------------------------------------
# Skills analysis — endpoints
# ------------------------------------------------------------------

@router.post("/skills/gap-analysis")
def get_skills_gap(payload: SkillsGapPayload) -> dict:
    return skills_service.analyze_skills_gap(payload.resumeText, payload.jobDescription)


@router.get("/skills/improvements")
def get_skill_improvements(user_id: str = Query(default="demo-user")) -> dict:
    return skills_service.track_skill_improvements(user_id)


@router.post("/skills/certifications")
def get_certifications(payload: CertificationsPayload) -> list:
    return skills_service.suggest_certifications(payload.targetRole)


@router.post("/skills/learning-plan")
def get_learning_plan(payload: LearningPlanPayload) -> dict:
    return skills_service.generate_learning_plan(payload.missingSkills)


# ------------------------------------------------------------------
# Job search — request models
# ------------------------------------------------------------------

class JobSearchPayload(BaseModel):
    query: str
    location: str = ""
    num_pages: int = 1
    filters: dict = {}


class JobRecommendPayload(BaseModel):
    resume_text: str
    query: str = "software engineer"
    location: str = ""
    num_pages: int = 1
    preferred_work_mode: str | None = None
    preferred_job_type: str | None = None
    salary_expectation: float | None = None


class ApplyFromJobPayload(BaseModel):
    resume_text: str = ""
    cover_letter: str = ""
    notes: str = ""


# ------------------------------------------------------------------
# POST /api/career/jobs/search
# ------------------------------------------------------------------

@router.post("/jobs/search")
async def search_jobs(payload: JobSearchPayload) -> dict:
    """Search jobs via JSearch API with Remotive fallback."""
    jobs = job_scraper_service.search_jobs(
        query=payload.query,
        location=payload.location,
        num_pages=payload.num_pages,
    )
    # Filter out demo jobs and fall back to free Remotive API
    jobs = [j for j in jobs if j.get("source") != "demo"]
    if not jobs:
        jobs = await job_search_service.search_jobs(payload.query, limit=12)
    if payload.filters:
        jobs = job_scraper_service.filter_jobs(jobs, payload.filters)
    return {"jobs": jobs, "count": len(jobs), "query": payload.query}


# ------------------------------------------------------------------
# GET /api/career/jobs/saved
# (must be declared before /{job_id} to avoid route conflict)
# ------------------------------------------------------------------

@router.get("/jobs/saved")
def get_saved_jobs() -> list[dict]:
    """Return all jobs saved by the user."""
    return firestore_service.list_collection(SAVED_JOBS_COLLECTION)


# ------------------------------------------------------------------
# GET /api/career/jobs/trending
# ------------------------------------------------------------------

@router.get("/jobs/trending")
async def get_trending_jobs() -> dict:
    """Return popular recent jobs (searches common roles and merges results)."""
    trending_queries = ["software engineer", "data scientist", "product manager"]
    seen: set[str] = set()
    jobs: list[dict] = []
    for q in trending_queries:
        results = job_scraper_service.search_jobs(query=q, num_pages=1)
        real = [j for j in results if j.get("source") != "demo"]
        if not real:
            real = await job_search_service.search_jobs(q, limit=5)
        for j in real:
            jid = j.get("id", "")
            if jid not in seen:
                seen.add(jid)
                jobs.append(j)
    return {"jobs": jobs[:10], "count": len(jobs[:10])}


# ------------------------------------------------------------------
# POST /api/career/jobs/recommend
# ------------------------------------------------------------------

@router.post("/jobs/recommend")
def recommend_jobs(payload: JobRecommendPayload) -> dict:
    """Return AI-matched job recommendations ranked by resume fit."""
    jobs = job_scraper_service.search_jobs(
        query=payload.query,
        location=payload.location,
        num_pages=payload.num_pages,
    )
    user_profile = {
        "resume_text": payload.resume_text,
        "preferred_work_mode": payload.preferred_work_mode,
        "preferred_job_type": payload.preferred_job_type,
        "salary_expectation": payload.salary_expectation,
    }
    ranked = job_matching_service.rank_jobs_by_fit(jobs, user_profile)
    return {"jobs": ranked, "count": len(ranked)}


# ------------------------------------------------------------------
# GET /api/career/jobs/{job_id}
# ------------------------------------------------------------------

@router.get("/jobs/{job_id}")
def get_job_details(job_id: str) -> dict:
    """Return full details for a single job posting."""
    job = job_scraper_service.get_job_details(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")
    # Attach saved flag
    saved = firestore_service.get(SAVED_JOBS_COLLECTION, job_id)
    job["is_saved"] = saved is not None
    return job


# ------------------------------------------------------------------
# POST /api/career/jobs/{job_id}/save
# ------------------------------------------------------------------

@router.post("/jobs/{job_id}/save", status_code=201)
def save_job(job_id: str) -> dict:
    """Save a job to the user's saved list."""
    existing = firestore_service.get(SAVED_JOBS_COLLECTION, job_id)
    if existing:
        return existing

    job = job_scraper_service.get_job_details(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")

    record = {**job, "id": job_id, "is_saved": True, "saved_at": datetime.now(timezone.utc).isoformat()}
    firestore_service.create(SAVED_JOBS_COLLECTION, record)
    return record


# ------------------------------------------------------------------
# DELETE /api/career/jobs/{job_id}/unsave
# ------------------------------------------------------------------

@router.delete("/jobs/{job_id}/unsave", status_code=204)
def unsave_job(job_id: str) -> None:
    """Remove a job from the user's saved list."""
    deleted = firestore_service.delete(SAVED_JOBS_COLLECTION, job_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="saved job not found")


# ------------------------------------------------------------------
# POST /api/career/jobs/{job_id}/apply
# ------------------------------------------------------------------

@router.post("/jobs/{job_id}/apply", status_code=201)
def apply_from_job(job_id: str, payload: ApplyFromJobPayload) -> dict:
    """Create an application record pre-filled from a job listing."""
    job = job_scraper_service.get_job_details(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")

    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    ms = job.get("match_score")
    match_score = int(ms) if isinstance(ms, (int, float)) else 0
    record = {
        "id": str(uuid4()),
        "job_id": job_id,
        "company": job.get("company", ""),
        "role": job.get("title", ""),
        "status": "applied",
        "applied_date": datetime.now(timezone.utc).date().isoformat(),
        "job_url": job.get("apply_link", ""),
        "job_description": job.get("description", "")[:2000],
        "salary_range": (
            f"{job.get('salary_min', '')}–{job.get('salary_max', '')} {job.get('salary_currency', '')}"
            if job.get("salary_min") else ""
        ),
        "location": job.get("location", ""),
        "work_mode": job.get("work_mode", ""),
        "recruiter_name": None,
        "recruiter_email": None,
        "interview_dates": [],
        "notes": payload.notes,
        "resume_version": "",
        "cover_letter": payload.cover_letter,
        "follow_up_date": None,
        "match_score": match_score,
        "created_at": now,
        "updated_at": now,
    }
    firestore_service.create("applications", record)
    return record


# ------------------------------------------------------------------
# GET /api/career/search-jobs — legacy free-API search (frontend compatibility)
# ------------------------------------------------------------------


@router.get("/search-jobs")
async def search_jobs_free_api(q: str = Query(..., description="Search query for jobs")) -> list[dict]:
    """Search for job listings using free APIs (no RapidAPI key required)."""
    return await job_search_service.search_jobs(q, limit=12)
