"""Job-to-resume matching and skill comparison."""

import re

# Common tech skills for extraction heuristics
_SKILL_PATTERNS = re.compile(
    r"\b("
    r"python|javascript|typescript|java|kotlin|swift|go|rust|c\+\+|c#|ruby|scala|"
    r"react|vue|angular|nextjs|svelte|"
    r"fastapi|django|flask|express|spring|rails|"
    r"postgres|postgresql|mysql|mongodb|redis|elasticsearch|dynamodb|sqlite|"
    r"aws|gcp|azure|kubernetes|docker|terraform|ansible|"
    r"graphql|grpc|rest|sql|nosql|"
    r"git|ci/cd|github actions|jenkins|"
    r"machine learning|ml|deep learning|nlp|llm|pytorch|tensorflow|"
    r"data engineering|spark|kafka|airflow|dbt|"
    r"product management|agile|scrum|jira|figma|"
    r"node\.?js|html|css|tailwind|sass"
    r")\b",
    re.IGNORECASE,
)

_EXP_KEYWORDS = {
    "entry": ["entry", "junior", "intern", "0-2 years", "new grad", "recent graduate"],
    "mid": ["mid", "3-5 years", "2-4 years", "intermediate"],
    "senior": ["senior", "lead", "principal", "staff", "5+ years", "7+ years"],
}


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            out.append(item)
    return out


class JobMatchingService:

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def extract_skills_from_job(self, job_description: str) -> list[str]:
        """Return unique skills mentioned in a job description."""
        found = _SKILL_PATTERNS.findall(job_description)
        return _dedupe([s.lower() for s in found])

    def extract_skills_from_resume(self, resume_text: str) -> list[str]:
        """Return unique skills detected in a resume."""
        found = _SKILL_PATTERNS.findall(resume_text)
        return _dedupe([s.lower() for s in found])

    def compare_skills(
        self, resume_skills: list[str], job_skills: list[str]
    ) -> dict:
        """Return matching, missing, and extra skills plus a pct match."""
        resume_set = {s.lower() for s in resume_skills}
        job_set = {s.lower() for s in job_skills}
        matching = sorted(resume_set & job_set)
        missing = sorted(job_set - resume_set)
        extra = sorted(resume_set - job_set)
        pct = round(len(matching) / max(len(job_set), 1) * 100, 1)
        return {
            "matching": matching,
            "missing": missing,
            "extra": extra,
            "match_percentage": pct,
        }

    def match_jobs_to_resume(self, resume_text: str, jobs: list[dict]) -> list[dict]:
        """Attach a match_score (0-100) to each job dict and return sorted list."""
        resume_skills = self.extract_skills_from_resume(resume_text)
        scored: list[dict] = []
        for job in jobs:
            score = self._score_job(resume_text, resume_skills, job)
            enriched = {**job, "match_score": score}
            scored.append(enriched)
        scored.sort(key=lambda j: j["match_score"], reverse=True)
        return scored

    def rank_jobs_by_fit(self, jobs: list[dict], user_profile: dict) -> list[dict]:
        """Sort jobs by fit given a structured user profile.

        user_profile keys used:
          - resume_text (str)
          - preferred_work_mode (str | None)
          - preferred_job_type (str | None)
          - salary_expectation (float | None)
        """
        resume_text = user_profile.get("resume_text", "")
        preferred_mode = user_profile.get("preferred_work_mode")
        preferred_type = user_profile.get("preferred_job_type")
        salary_exp = user_profile.get("salary_expectation")

        resume_skills = self.extract_skills_from_resume(resume_text)

        def _fit(job: dict) -> float:
            base = self._score_job(resume_text, resume_skills, job)
            bonus = 0.0
            if preferred_mode and job.get("work_mode") == preferred_mode:
                bonus += 5
            if preferred_type and job.get("job_type") == preferred_type:
                bonus += 5
            if salary_exp is not None:
                job_max = job.get("salary_max")
                if job_max is not None and job_max >= salary_exp:
                    bonus += 5
            return min(base + bonus, 100)

        return sorted(jobs, key=_fit, reverse=True)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _score_job(
        self, resume_text: str, resume_skills: list[str], job: dict
    ) -> int:
        job_desc = job.get("description", "") + " ".join(job.get("qualifications", []))
        job_skills = job.get("skills_required") or self.extract_skills_from_job(job_desc)

        skill_cmp = self.compare_skills(resume_skills, job_skills)
        skill_score = skill_cmp["match_percentage"]  # 0-100

        # Title keyword overlap bonus (up to 10 pts)
        title_words = {w.lower() for w in job.get("title", "").split()}
        resume_lower = resume_text.lower()
        title_hits = sum(1 for w in title_words if len(w) > 3 and w in resume_lower)
        title_bonus = min(title_hits * 3, 10)

        return min(round(skill_score * 0.9 + title_bonus), 100)
