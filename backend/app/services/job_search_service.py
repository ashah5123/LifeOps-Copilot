"""Job search service — fetches real job listings from free APIs (Remotive, no API key)."""

import logging

import httpx

logger = logging.getLogger(__name__)

REMOTIVE_API = "https://remotive.com/api/remote-jobs"
_HTTP_HEADERS = {"User-Agent": "LifeOpsCareer/1.0 (job board fallback; +https://github.com)"}


def _normalize_remotive_job(j: dict, idx: int) -> dict:
    """Shape Remotive rows like JSearch-style dicts for filters and the career UI."""
    tags = j.get("tags", []) or []
    jt = str(j.get("job_type", "full_time")).lower().replace("_", "-")
    return {
        "id": str(j.get("id", idx)),
        "title": j.get("title", "Unknown Role"),
        "company": j.get("company_name", "Unknown"),
        "location": j.get("candidate_required_location", "Remote"),
        "salary": j.get("salary", "Not disclosed"),
        "url": j.get("url", ""),
        "apply_link": j.get("url", ""),
        "source": "Remotive",
        "postedDate": (j.get("publication_date") or "")[:10],
        "posted_date": (j.get("publication_date") or "")[:10],
        "description": (j.get("description") or "")[:8000],
        "tags": tags[:8],
        "skills_required": [str(t) for t in tags[:12]],
        "jobType": j.get("job_type", "full_time"),
        "job_type": jt,
        "work_mode": "remote",
        "category": j.get("category", "Software Development"),
    }


class JobSearchService:

    async def search_jobs(self, query: str, limit: int = 12) -> list[dict]:
        """Search for real job listings (Remotive only — no mock fallback)."""
        jobs = await self._search_remotive(query, limit)
        if not jobs:
            logger.info("Remotive returned no jobs for query=%r", query)
        return jobs

    async def _search_remotive(self, query: str, limit: int) -> list[dict]:
        """Fetch from Remotive API — free, no key needed."""
        cap = max(limit, 20)
        try:
            async with httpx.AsyncClient(timeout=18.0, headers=_HTTP_HEADERS) as client:

                async def _fetch(params: dict) -> list:
                    resp = await client.get(REMOTIVE_API, params=params)
                    resp.raise_for_status()
                    return resp.json().get("jobs", [])

                raw_jobs: list = []
                q = (query or "").strip()
                if q:
                    raw_jobs = await _fetch({"search": q, "limit": cap})
                    if not raw_jobs and " " in q:
                        raw_jobs = await _fetch({"search": q.split()[0], "limit": cap})
                if not raw_jobs:
                    # Unfiltered catalog — still useful when search misses (e.g. niche titles)
                    raw_jobs = await _fetch({"limit": cap})

            raw_jobs = raw_jobs[:limit]
            return [_normalize_remotive_job(j, idx) for idx, j in enumerate(raw_jobs)]
        except Exception as exc:
            logger.warning("Remotive API failed: %s", exc)
            return []

job_search_service = JobSearchService()
