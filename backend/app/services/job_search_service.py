"""Job search service — fetches real job listings from free APIs (Remotive, no API key)."""

import logging

import httpx

logger = logging.getLogger(__name__)

REMOTIVE_API = "https://remotive.com/api/remote-jobs"


class JobSearchService:

    async def search_jobs(self, query: str, limit: int = 12) -> list[dict]:
        """Search for real job listings (Remotive only — no mock fallback)."""
        jobs = await self._search_remotive(query, limit)
        if not jobs:
            logger.info("Remotive returned no jobs for query=%r", query)
        return jobs

    async def _search_remotive(self, query: str, limit: int) -> list[dict]:
        """Fetch from Remotive API — free, no key needed."""
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                # Remotive works best with single keyword; try full query then first word
                resp = await client.get(REMOTIVE_API, params={"search": query, "limit": limit})
                resp.raise_for_status()
                data = resp.json()
                raw_jobs = data.get("jobs", [])
                if not raw_jobs and " " in query:
                    resp = await client.get(REMOTIVE_API, params={"search": query.split()[0], "limit": limit})
                    resp.raise_for_status()
                    data = resp.json()
                    raw_jobs = data.get("jobs", [])

            raw_jobs = raw_jobs[:limit]
            return [
                {
                    "id": str(j.get("id", idx)),
                    "title": j.get("title", "Unknown Role"),
                    "company": j.get("company_name", "Unknown"),
                    "location": j.get("candidate_required_location", "Remote"),
                    "salary": j.get("salary", "Not disclosed"),
                    "url": j.get("url", ""),
                    "source": "Remotive",
                    "postedDate": j.get("publication_date", "")[:10],
                    "description": (j.get("description") or "")[:8000],
                    "tags": j.get("tags", [])[:5],
                    "jobType": j.get("job_type", "full_time"),
                    "category": j.get("category", "Software Development"),
                }
                for idx, j in enumerate(raw_jobs)
            ]
        except Exception as exc:
            logger.warning("Remotive API failed: %s", exc)
            return []

job_search_service = JobSearchService()
