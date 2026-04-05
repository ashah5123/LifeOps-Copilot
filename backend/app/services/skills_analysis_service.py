import re
from datetime import date
from dateutil.relativedelta import relativedelta


# ---------------------------------------------------------------------------
# Static knowledge bases
# ---------------------------------------------------------------------------

SKILL_KEYWORDS: list[str] = [
    # Languages
    "python", "javascript", "typescript", "java", "go", "rust", "c++", "c#", "ruby", "swift",
    "kotlin", "scala", "r", "matlab", "bash", "sql", "html", "css",
    # Frontend
    "react", "vue", "angular", "next.js", "svelte", "tailwind", "webpack", "vite",
    # Backend / Frameworks
    "fastapi", "django", "flask", "express", "spring", "rails", "laravel", "graphql", "rest api",
    # Data / ML
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras", "spark", "hadoop",
    "tableau", "power bi", "dbt", "airflow", "mlflow",
    # Cloud & DevOps
    "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ci/cd", "github actions",
    "jenkins", "ansible", "linux",
    # Databases
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "bigquery", "snowflake",
    # Practices
    "agile", "scrum", "tdd", "bdd", "microservices", "system design", "api design",
    # Soft skills
    "leadership", "communication", "problem solving", "teamwork", "mentoring",
]

LEARNING_RESOURCES: dict[str, dict] = {
    "python":         {"platform": "Python.org / Real Python",      "url": "https://realpython.com"},
    "javascript":     {"platform": "javascript.info",                "url": "https://javascript.info"},
    "typescript":     {"platform": "TypeScript Docs",                "url": "https://www.typescriptlang.org/docs"},
    "react":          {"platform": "React Docs (react.dev)",         "url": "https://react.dev"},
    "next.js":        {"platform": "Next.js Docs",                   "url": "https://nextjs.org/docs"},
    "fastapi":        {"platform": "FastAPI Docs",                   "url": "https://fastapi.tiangolo.com"},
    "django":         {"platform": "Django Docs",                    "url": "https://docs.djangoproject.com"},
    "docker":         {"platform": "Docker Get Started",             "url": "https://docs.docker.com/get-started"},
    "kubernetes":     {"platform": "Kubernetes Docs",                "url": "https://kubernetes.io/docs/home"},
    "aws":            {"platform": "AWS Skill Builder",              "url": "https://skillbuilder.aws"},
    "gcp":            {"platform": "Google Cloud Skills Boost",      "url": "https://cloudskillsboost.google"},
    "azure":          {"platform": "Microsoft Learn",                "url": "https://learn.microsoft.com/en-us/azure"},
    "terraform":      {"platform": "HashiCorp Learn",                "url": "https://developer.hashicorp.com/terraform/tutorials"},
    "sql":            {"platform": "Mode SQL Tutorial",              "url": "https://mode.com/sql-tutorial"},
    "postgresql":     {"platform": "PostgreSQL Tutorial",            "url": "https://www.postgresqltutorial.com"},
    "mongodb":        {"platform": "MongoDB University",             "url": "https://learn.mongodb.com"},
    "pandas":         {"platform": "Pandas Docs",                    "url": "https://pandas.pydata.org/docs"},
    "scikit-learn":   {"platform": "scikit-learn User Guide",        "url": "https://scikit-learn.org/stable/user_guide.html"},
    "tensorflow":     {"platform": "TensorFlow Tutorials",           "url": "https://www.tensorflow.org/tutorials"},
    "pytorch":        {"platform": "PyTorch Tutorials",              "url": "https://pytorch.org/tutorials"},
    "system design":  {"platform": "System Design Primer (GitHub)",  "url": "https://github.com/donnemartin/system-design-primer"},
    "agile":          {"platform": "Scrum.org",                      "url": "https://www.scrum.org/resources"},
    "ci/cd":          {"platform": "GitHub Actions Docs",            "url": "https://docs.github.com/en/actions"},
    "linux":          {"platform": "Linux Journey",                  "url": "https://linuxjourney.com"},
    "graphql":        {"platform": "GraphQL.org Learn",              "url": "https://graphql.org/learn"},
    "redis":          {"platform": "Redis University",               "url": "https://university.redis.com"},
}

CERTIFICATIONS: dict[str, list[dict]] = {
    "software engineer": [
        {"name": "AWS Certified Developer – Associate",         "provider": "Amazon Web Services", "level": "intermediate", "duration_months": 2},
        {"name": "Google Associate Cloud Engineer",             "provider": "Google Cloud",        "level": "intermediate", "duration_months": 2},
        {"name": "Certified Kubernetes Application Developer",  "provider": "CNCF",                "level": "intermediate", "duration_months": 3},
        {"name": "HashiCorp Terraform Associate",               "provider": "HashiCorp",           "level": "beginner",     "duration_months": 1},
    ],
    "data scientist": [
        {"name": "Google Professional Data Engineer",           "provider": "Google Cloud",        "level": "advanced",     "duration_months": 3},
        {"name": "AWS Certified Machine Learning – Specialty",  "provider": "Amazon Web Services", "level": "advanced",     "duration_months": 3},
        {"name": "TensorFlow Developer Certificate",            "provider": "Google",              "level": "intermediate", "duration_months": 2},
        {"name": "Databricks Certified Associate Developer",    "provider": "Databricks",          "level": "intermediate", "duration_months": 2},
    ],
    "data analyst": [
        {"name": "Google Data Analytics Certificate",           "provider": "Google / Coursera",   "level": "beginner",     "duration_months": 2},
        {"name": "Microsoft Power BI Data Analyst",             "provider": "Microsoft",           "level": "intermediate", "duration_months": 2},
        {"name": "Tableau Desktop Specialist",                  "provider": "Tableau",             "level": "beginner",     "duration_months": 1},
        {"name": "dbt Analytics Engineer Certification",        "provider": "dbt Labs",            "level": "intermediate", "duration_months": 1},
    ],
    "devops engineer": [
        {"name": "Certified Kubernetes Administrator",          "provider": "CNCF",                "level": "advanced",     "duration_months": 3},
        {"name": "AWS Certified DevOps Engineer – Professional","provider": "Amazon Web Services", "level": "advanced",     "duration_months": 4},
        {"name": "GitHub Actions Certification",                "provider": "GitHub",              "level": "beginner",     "duration_months": 1},
        {"name": "HashiCorp Terraform Associate",               "provider": "HashiCorp",           "level": "beginner",     "duration_months": 1},
    ],
    "frontend engineer": [
        {"name": "Meta Front-End Developer Certificate",        "provider": "Meta / Coursera",     "level": "beginner",     "duration_months": 2},
        {"name": "Google UX Design Certificate",                "provider": "Google / Coursera",   "level": "beginner",     "duration_months": 2},
        {"name": "AWS Certified Cloud Practitioner",            "provider": "Amazon Web Services", "level": "beginner",     "duration_months": 1},
    ],
    "product manager": [
        {"name": "Certified Product Manager (CPM)",             "provider": "AIPMM",               "level": "intermediate", "duration_months": 2},
        {"name": "Google Project Management Certificate",       "provider": "Google / Coursera",   "level": "beginner",     "duration_months": 2},
        {"name": "Professional Scrum Product Owner (PSPO)",     "provider": "Scrum.org",           "level": "intermediate", "duration_months": 1},
    ],
}

# Priority ordering for 30/60/90 day plan
SKILL_PRIORITY: dict[str, int] = {
    "python": 1, "javascript": 1, "typescript": 1, "sql": 1,
    "react": 2, "fastapi": 2, "django": 2, "docker": 2, "aws": 2, "gcp": 2,
    "kubernetes": 3, "terraform": 3, "system design": 3, "scikit-learn": 3, "tensorflow": 3,
}


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------

class SkillsAnalysisService:
    def __init__(self, firestore_service=None):
        self.db = firestore_service

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _extract_skills(self, text: str) -> set[str]:
        text_lower = text.lower()
        found = set()
        for skill in SKILL_KEYWORDS:
            # Word-boundary-aware match to avoid "go" matching "django"
            pattern = r"\b" + re.escape(skill) + r"\b"
            if re.search(pattern, text_lower):
                found.add(skill)
        return found

    def _skill_priority(self, skill: str) -> int:
        return SKILL_PRIORITY.get(skill, 2)

    # ------------------------------------------------------------------
    # analyze_skills_gap
    # ------------------------------------------------------------------

    def analyze_skills_gap(self, resume_text: str, job_description: str) -> dict:
        resume_skills = self._extract_skills(resume_text)
        jd_skills = self._extract_skills(job_description)

        matching = sorted(resume_skills & jd_skills)
        missing = sorted(jd_skills - resume_skills)
        bonus = sorted(resume_skills - jd_skills)

        learning_resources = []
        for skill in missing:
            resource = LEARNING_RESOURCES.get(skill)
            if resource:
                learning_resources.append({
                    "skill": skill,
                    "platform": resource["platform"],
                    "resource_url": resource["url"],
                })

        match_score = round(len(matching) / len(jd_skills) * 100) if jd_skills else 0

        return {
            "match_score": match_score,
            "matching_skills": matching,
            "missing_skills": missing,
            "bonus_skills": bonus,
            "jd_skill_count": len(jd_skills),
            "resume_skill_count": len(resume_skills),
            "learning_resources": learning_resources,
        }

    # ------------------------------------------------------------------
    # track_skill_improvements
    # ------------------------------------------------------------------

    def track_skill_improvements(self, user_id: str) -> dict:
        if not self.db:
            return {"user_id": user_id, "snapshots": [], "improvements": []}

        snapshots = [
            s for s in self.db.list_collection("skill_snapshots")
            if s.get("user_id") == user_id
        ]
        snapshots_sorted = sorted(snapshots, key=lambda s: s.get("recorded_at", ""))

        if len(snapshots_sorted) < 2:
            return {
                "user_id": user_id,
                "snapshots": snapshots_sorted,
                "improvements": [],
                "message": "Need at least 2 snapshots to track improvements.",
            }

        first = set(snapshots_sorted[0].get("skills", []))
        latest = set(snapshots_sorted[-1].get("skills", []))
        newly_added = sorted(latest - first)
        dropped = sorted(first - latest)

        return {
            "user_id": user_id,
            "first_snapshot": snapshots_sorted[0].get("recorded_at"),
            "latest_snapshot": snapshots_sorted[-1].get("recorded_at"),
            "skills_then": sorted(first),
            "skills_now": sorted(latest),
            "newly_added": newly_added,
            "dropped": dropped,
            "net_gain": len(newly_added) - len(dropped),
            "snapshots_count": len(snapshots_sorted),
        }

    # ------------------------------------------------------------------
    # suggest_certifications
    # ------------------------------------------------------------------

    def suggest_certifications(self, target_role: str) -> list[dict]:
        role_lower = target_role.lower()

        # Fuzzy match against known roles
        for known_role, certs in CERTIFICATIONS.items():
            if known_role in role_lower or any(word in role_lower for word in known_role.split()):
                return [{"rank": i + 1, **cert} for i, cert in enumerate(certs)]

        # Generic fallback — surface broadly applicable certs
        generic = [
            {"name": "AWS Certified Cloud Practitioner",   "provider": "Amazon Web Services", "level": "beginner",     "duration_months": 1},
            {"name": "Google IT Support Certificate",       "provider": "Google / Coursera",   "level": "beginner",     "duration_months": 2},
            {"name": "Professional Scrum Master I (PSM I)", "provider": "Scrum.org",           "level": "beginner",     "duration_months": 1},
            {"name": "Google Project Management Certificate","provider": "Google / Coursera",  "level": "beginner",     "duration_months": 2},
        ]
        return [{"rank": i + 1, **cert} for i, cert in enumerate(generic)]

    # ------------------------------------------------------------------
    # generate_learning_plan
    # ------------------------------------------------------------------

    def generate_learning_plan(self, missing_skills: list[str]) -> dict:
        today = date.today()

        # Sort by priority (1 = highest)
        sorted_skills = sorted(missing_skills, key=self._skill_priority)

        # Distribute across three phases
        n = len(sorted_skills)
        phase1_skills = sorted_skills[:max(1, n // 3)]
        phase2_skills = sorted_skills[max(1, n // 3): max(2, 2 * n // 3)]
        phase3_skills = sorted_skills[max(2, 2 * n // 3):]

        def _build_phase(skills: list[str], start: date, end: date, label: str) -> dict:
            tasks = []
            for skill in skills:
                resource = LEARNING_RESOURCES.get(skill, {})
                tasks.append({
                    "skill": skill,
                    "goal": f"Achieve working proficiency in {skill}",
                    "suggested_hours_per_week": 5,
                    "resource": resource.get("platform", "Search for tutorials and documentation"),
                    "resource_url": resource.get("url", ""),
                    "milestone": f"Build a small project or pass a practice assessment in {skill}",
                })
            return {
                "phase": label,
                "start_date": str(start),
                "end_date": str(end),
                "focus": f"Foundation — {', '.join(skills)}" if skills else "No skills assigned",
                "tasks": tasks,
                "weekly_time_commitment": f"{len(skills) * 5} hours/week across {len(skills)} skill(s)",
            }

        plan = {
            "generated_at": str(today),
            "total_skills": len(missing_skills),
            "estimated_completion": str(today + relativedelta(months=3)),
            "phases": [
                _build_phase(phase1_skills, today,                          today + relativedelta(days=29),  "30-Day"),
                _build_phase(phase2_skills, today + relativedelta(days=30), today + relativedelta(days=59),  "60-Day"),
                _build_phase(phase3_skills, today + relativedelta(days=60), today + relativedelta(days=89),  "90-Day"),
            ],
            "tips": [
                "Block 1-hour learning sessions in your calendar 5 days a week.",
                "Build a small project at the end of each phase to solidify skills.",
                "Track progress in your skills snapshot so improvements are recorded.",
                "Pair learning with job applications — apply while you grow.",
            ],
        }

        return plan
