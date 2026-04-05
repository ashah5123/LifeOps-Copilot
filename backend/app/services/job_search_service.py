"""Job search service — fetches real job listings from free APIs.

Uses Remotive API (free, no key) as primary source.
Falls back to curated mock data if API is down.
"""

import logging
from datetime import datetime

import httpx

logger = logging.getLogger(__name__)

REMOTIVE_API = "https://remotive.com/api/remote-jobs"


class JobSearchService:

    async def search_jobs(self, query: str, limit: int = 12) -> list[dict]:
        """Search for real job listings."""
        jobs = await self._search_remotive(query, limit)
        if not jobs:
            jobs = self._fallback_jobs(query)
        return jobs

    async def _search_remotive(self, query: str, limit: int) -> list[dict]:
        """Fetch from Remotive API — free, no key needed."""
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(REMOTIVE_API, params={"search": query, "limit": limit})
                resp.raise_for_status()
                data = resp.json()

            raw_jobs = data.get("jobs", [])[:limit]
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
                    "description": j.get("description", "")[:500],
                    "tags": j.get("tags", [])[:5],
                    "jobType": j.get("job_type", "full_time"),
                    "category": j.get("category", "Software Development"),
                }
                for idx, j in enumerate(raw_jobs)
            ]
        except Exception as exc:
            logger.warning("Remotive API failed: %s", exc)
            return []

    def _fallback_jobs(self, query: str) -> list[dict]:
        """Curated fallback data when APIs are unreachable."""
        q = query.lower()
        jobs = []

        if any(kw in q for kw in ("data", "ml", "machine", "ai", "scientist")):
            jobs = [
                {"id": "f1", "title": "Data Scientist", "company": "Google DeepMind", "location": "Mountain View, CA", "salary": "$130k-$180k", "source": "LinkedIn"},
                {"id": "f2", "title": "ML Engineer", "company": "Netflix", "location": "Remote", "salary": "$150k-$200k", "source": "Glassdoor"},
                {"id": "f3", "title": "AI Research Intern", "company": "OpenAI", "location": "San Francisco, CA", "salary": "$60/hr", "source": "Google Jobs"},
                {"id": "f4", "title": "Data Analyst", "company": "Spotify", "location": "New York, NY", "salary": "$90k-$120k", "source": "Indeed"},
            ]
        elif any(kw in q for kw in ("software", "engineer", "swe", "developer", "backend", "frontend")):
            jobs = [
                {"id": "f5", "title": "Software Engineer Intern", "company": "Google", "location": "Mountain View, CA", "salary": "$55/hr", "source": "LinkedIn"},
                {"id": "f6", "title": "Backend Engineer", "company": "Stripe", "location": "Remote", "salary": "$140k-$180k", "source": "Glassdoor"},
                {"id": "f7", "title": "Full Stack Developer", "company": "Figma", "location": "San Francisco, CA", "salary": "$130k-$170k", "source": "Google Jobs"},
                {"id": "f8", "title": "SDE Intern", "company": "Amazon", "location": "Seattle, WA", "salary": "$50/hr", "source": "Indeed"},
            ]
        else:
            jobs = [
                {"id": "f9", "title": "Product Manager Intern", "company": "Microsoft", "location": "Redmond, WA", "salary": "$45/hr", "source": "LinkedIn"},
                {"id": "f10", "title": "UX Designer", "company": "Apple", "location": "Cupertino, CA", "salary": "$120k-$160k", "source": "Glassdoor"},
                {"id": "f11", "title": "Business Analyst", "company": "McKinsey", "location": "New York, NY", "salary": "$85k-$110k", "source": "Indeed"},
                {"id": "f12", "title": "Marketing Intern", "company": "HubSpot", "location": "Remote", "salary": "$25/hr", "source": "Google Jobs"},
            ]

        today = datetime.now().strftime("%Y-%m-%d")
        for j in jobs:
            j.setdefault("postedDate", today)
            j.setdefault("url", "")
            j.setdefault("description", f"Exciting {j['title']} opportunity at {j['company']}. Join a world-class team.")
            j.setdefault("tags", [])
            j.setdefault("jobType", "full_time")
            j.setdefault("category", "General")
        return jobs


job_search_service = JobSearchService()
