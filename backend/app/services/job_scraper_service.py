"""Job scraping via RapidAPI JSearch with Firestore caching."""

import hashlib
import logging
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import requests

from app.core.config import settings
from app.services.firestore_service import FirestoreService

logger = logging.getLogger(__name__)

CACHE_COLLECTION = "job_listings"
CACHE_TTL_HOURS = 24

# JSearch API constants
JSEARCH_BASE = "https://jsearch.p.rapidapi.com"


def _cache_key(query: str, location: str, page: int) -> str:
    raw = f"{query}|{location}|{page}".lower()
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _is_expired(created_at: str) -> bool:
    try:
        ts = datetime.fromisoformat(created_at)
        return datetime.now(timezone.utc) - ts > timedelta(hours=CACHE_TTL_HOURS)
    except (ValueError, TypeError):
        return True


def _normalize_job(raw: dict, now: str) -> dict:
    """Map a JSearch API result dict to our internal schema."""
    salary_min = raw.get("job_min_salary")
    salary_max = raw.get("job_max_salary")

    work_mode = "onsite"
    if raw.get("job_is_remote"):
        work_mode = "remote"
    elif "hybrid" in (raw.get("job_work_from_home", "") or "").lower():
        work_mode = "hybrid"

    exp_map = {
        "no_experience": "entry",
        "under_3_years_experience": "entry",
        "more_than_3_years_experience": "mid",
        "senior": "senior",
    }
    exp_raw = raw.get("job_required_experience", {}) or {}
    exp_level = exp_map.get(exp_raw.get("experience_level", ""), "mid")

    return {
        "id": raw.get("job_id", str(uuid4())),
        "title": raw.get("job_title", ""),
        "company": raw.get("employer_name", ""),
        "company_logo": raw.get("employer_logo"),
        "location": raw.get("job_city") or raw.get("job_country") or "Unknown",
        "work_mode": work_mode,
        "salary_min": float(salary_min) if salary_min is not None else None,
        "salary_max": float(salary_max) if salary_max is not None else None,
        "salary_currency": raw.get("job_salary_currency") or "USD",
        "description": raw.get("job_description", ""),
        "responsibilities": raw.get("job_highlights", {}).get("Responsibilities", []),
        "qualifications": raw.get("job_highlights", {}).get("Qualifications", []),
        "apply_link": raw.get("job_apply_link", ""),
        "posted_date": raw.get("job_posted_at_datetime_utc", ""),
        "expires_date": raw.get("job_offer_expiration_datetime_utc"),
        "job_type": (raw.get("job_employment_type") or "FULLTIME").lower().replace("_", "-"),
        "experience_level": exp_level,
        "skills_required": raw.get("job_required_skills") or [],
        "benefits": raw.get("job_highlights", {}).get("Benefits", []),
        "source": "jsearch",
        "is_saved": False,
        "created_at": now,
    }


class JobScraperService:
    def __init__(self, firestore: FirestoreService | None = None) -> None:
        self._db = firestore
        self._headers = {
            "X-RapidAPI-Key": settings.rapidapi_key,
            "X-RapidAPI-Host": settings.rapidapi_host,
        }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def search_jobs(
        self,
        query: str,
        location: str = "",
        num_pages: int = 1,
    ) -> list[dict]:
        """Return jobs for query/location; uses Firestore cache where fresh."""
        results: list[dict] = []

        for page in range(1, num_pages + 1):
            cached = self._get_cached(query, location, page)
            if cached is not None:
                results.extend(cached)
                continue

            fetched = self._fetch_page(query, location, page)
            if fetched is not None:
                self._store_cache(query, location, page, fetched)
                results.extend(fetched)
            else:
                # API failed — try stale cache as fallback
                stale = self._get_cached(query, location, page, allow_stale=True)
                if stale:
                    results.extend(stale)

        return results

    def get_job_details(self, job_id: str) -> dict | None:
        """Fetch full job details; checks Firestore cache first."""
        if self._db is not None:
            cached = self._db.get(CACHE_COLLECTION, job_id)
            if cached and not _is_expired(cached.get("created_at", "")):
                return cached

        if settings.rapidapi_key in ("demo-key", ""):
            return self._demo_job(job_id)

        try:
            resp = requests.get(
                f"{JSEARCH_BASE}/job-details",
                headers=self._headers,
                params={"job_id": job_id, "extended_publisher_details": "false"},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json().get("data", [])
            if not data:
                return None
            now = datetime.now(timezone.utc).isoformat()
            job = _normalize_job(data[0], now)
            if self._db is not None:
                self._db.update(CACHE_COLLECTION, job["id"], job) or self._db.create(
                    CACHE_COLLECTION, job
                )
            return job
        except Exception as exc:
            logger.warning("JSearch job-details failed for %s: %s", job_id, exc)
            return self._db.get(CACHE_COLLECTION, job_id) if self._db else None

    def filter_jobs(self, jobs: list[dict], criteria: dict) -> list[dict]:
        """Filter a job list by salary, remote flag, and/or job_type."""
        out = jobs
        if criteria.get("remote_only"):
            out = [j for j in out if j.get("work_mode") == "remote"]
        if criteria.get("work_mode"):
            out = [j for j in out if j.get("work_mode") == criteria["work_mode"]]
        if criteria.get("job_type"):
            out = [j for j in out if j.get("job_type") == criteria["job_type"]]
        if criteria.get("salary_min") is not None:
            out = [
                j for j in out
                if j.get("salary_max") is not None and j["salary_max"] >= criteria["salary_min"]
            ]
        if criteria.get("experience_level"):
            out = [j for j in out if j.get("experience_level") == criteria["experience_level"]]
        return out

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _fetch_page(self, query: str, location: str, page: int) -> list[dict] | None:
        if settings.rapidapi_key in ("demo-key", ""):
            return self._demo_results(query, location, page)

        params: dict = {"query": f"{query} {location}".strip(), "page": str(page), "num_pages": "1"}
        try:
            resp = requests.get(
                f"{JSEARCH_BASE}/search",
                headers=self._headers,
                params=params,
                timeout=15,
            )
            resp.raise_for_status()
            raw_list = resp.json().get("data", [])
            now = datetime.now(timezone.utc).isoformat()
            return [_normalize_job(r, now) for r in raw_list]
        except requests.exceptions.HTTPError as exc:
            if exc.response is not None and exc.response.status_code == 429:
                logger.warning("JSearch rate limit hit; falling back to cache")
            else:
                logger.warning("JSearch HTTP error: %s", exc)
            return None
        except Exception as exc:
            logger.warning("JSearch request failed: %s", exc)
            return None

    def _cache_doc_id(self, query: str, location: str, page: int) -> str:
        return f"cache_{_cache_key(query, location, page)}_p{page}"

    def _get_cached(
        self, query: str, location: str, page: int, allow_stale: bool = False
    ) -> list[dict] | None:
        if self._db is None:
            return None
        doc = self._db.get(CACHE_COLLECTION, self._cache_doc_id(query, location, page))
        if doc is None:
            return None
        if not allow_stale and _is_expired(doc.get("cached_at", "")):
            return None
        return doc.get("jobs", [])

    def _store_cache(self, query: str, location: str, page: int, jobs: list[dict]) -> None:
        if self._db is None:
            return
        doc_id = self._cache_doc_id(query, location, page)
        now = datetime.now(timezone.utc).isoformat()
        cache_doc = {"id": doc_id, "jobs": jobs, "cached_at": now}
        existing = self._db.get(CACHE_COLLECTION, doc_id)
        if existing:
            self._db.update(CACHE_COLLECTION, doc_id, cache_doc)
        else:
            self._db.create(CACHE_COLLECTION, cache_doc)
        # Also store individual job docs for get_job_details lookups
        for job in jobs:
            if not self._db.get(CACHE_COLLECTION, job["id"]):
                self._db.create(CACHE_COLLECTION, job)

    # ------------------------------------------------------------------
    # Demo / fallback data (used when no API key is configured)
    # ------------------------------------------------------------------

    def _demo_results(self, query: str, location: str, page: int) -> list[dict]:
        now = datetime.now(timezone.utc).isoformat()
        base = [
            {
                "id": "demo-job-001",
                "title": "Software Engineer",
                "company": "TechCorp",
                "company_logo": None,
                "location": location or "San Francisco, CA",
                "work_mode": "hybrid",
                "salary_min": 120000.0,
                "salary_max": 160000.0,
                "salary_currency": "USD",
                "description": f"We are looking for a talented engineer with experience in {query}.",
                "responsibilities": ["Build scalable services", "Collaborate with product"],
                "qualifications": ["3+ years experience", "Strong CS fundamentals"],
                "apply_link": "https://example.com/apply/001",
                "posted_date": "2026-04-01T00:00:00Z",
                "expires_date": None,
                "job_type": "full-time",
                "experience_level": "mid",
                "skills_required": ["Python", "React", "PostgreSQL"],
                "benefits": ["401k", "Health insurance", "Remote work"],
                "source": "demo",
                "is_saved": False,
                "created_at": now,
            },
            {
                "id": "demo-job-002",
                "title": "Senior Frontend Engineer",
                "company": "StartupXYZ",
                "company_logo": None,
                "location": location or "Remote",
                "work_mode": "remote",
                "salary_min": 130000.0,
                "salary_max": 175000.0,
                "salary_currency": "USD",
                "description": f"Join our team to build next-gen UIs. {query} experience preferred.",
                "responsibilities": ["Own frontend architecture", "Mentor junior engineers"],
                "qualifications": ["5+ years frontend", "TypeScript expert"],
                "apply_link": "https://example.com/apply/002",
                "posted_date": "2026-04-02T00:00:00Z",
                "expires_date": None,
                "job_type": "full-time",
                "experience_level": "senior",
                "skills_required": ["TypeScript", "React", "GraphQL"],
                "benefits": ["Equity", "Unlimited PTO", "Home office stipend"],
                "source": "demo",
                "is_saved": False,
                "created_at": now,
            },
            {
                "id": "demo-job-003",
                "title": "Data Engineer Intern",
                "company": "DataCo",
                "company_logo": None,
                "location": location or "New York, NY",
                "work_mode": "onsite",
                "salary_min": 30.0,
                "salary_max": 40.0,
                "salary_currency": "USD",
                "description": f"Summer internship in data engineering. Background in {query} helpful.",
                "responsibilities": ["Build ETL pipelines", "Write data quality tests"],
                "qualifications": ["Currently enrolled in CS degree", "Python basics"],
                "apply_link": "https://example.com/apply/003",
                "posted_date": "2026-04-03T00:00:00Z",
                "expires_date": "2026-05-01T00:00:00Z",
                "job_type": "internship",
                "experience_level": "entry",
                "skills_required": ["Python", "SQL", "Spark"],
                "benefits": ["Housing stipend", "Mentorship"],
                "source": "demo",
                "is_saved": False,
                "created_at": now,
            },
        ]
        # Pagination offset for demo
        per_page = 3
        start = (page - 1) * per_page
        return base[start: start + per_page]

    def _demo_job(self, job_id: str) -> dict | None:
        all_jobs = self._demo_results("software engineer", "", 1)
        for j in all_jobs:
            if j["id"] == job_id:
                return j
        return None
