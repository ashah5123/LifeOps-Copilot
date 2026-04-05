"""
Populate the in-memory FirestoreService with realistic demo data.

Usage (from backend/):
    python -m scripts.populate_demo_data

The script imports the live singleton from app.core.dependencies, so the
data is available immediately in the same process.  Start uvicorn *after*
importing this module, or call populate() from your app startup for demos.
"""

from datetime import date, datetime, timedelta, timezone
from dateutil.relativedelta import relativedelta
from uuid import uuid4

from app.core.dependencies import firestore_service


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _months_ago(n: int, day: int = 1) -> str:
    dt = date.today() + relativedelta(months=-n, day=day)
    return str(dt)


def _days_ago(n: int) -> str:
    return str(date.today() + relativedelta(days=-n))


def _days_from_now(n: int) -> str:
    return str(date.today() + relativedelta(days=n))


def _entry(
    title: str,
    amount: float,
    entry_type: str,
    category: str,
    entry_date: str,
    is_recurring: bool = False,
    recurring_frequency: str | None = None,
    notes: str | None = None,
) -> dict:
    return {
        "id": str(uuid4()),
        "title": title,
        "amount": amount,
        "entry_type": entry_type,
        "category": category,
        "date": entry_date,
        "is_recurring": is_recurring,
        "recurring_frequency": recurring_frequency,
        "notes": notes,
        "created_at": str(date.today()),
    }


# ---------------------------------------------------------------------------
# Budget data
# ---------------------------------------------------------------------------

def _populate_budget() -> tuple[int, int]:
    entries = []

    m3 = lambda day: _months_ago(3, day)  # noqa: E731
    entries += [
        _entry("Monthly Salary",             3200.00, "income",  "salary",           m3(1),  True,  "monthly"),
        _entry("Freelance Project",            450.00, "income",  "other",            m3(12), False, None, "Logo design contract"),
        _entry("Rent",                        1200.00, "expense", "rent",             m3(1),  True,  "monthly"),
        _entry("Electric & Gas",               145.00, "expense", "utilities",        m3(3),  True,  "monthly"),
        _entry("Internet",                      55.00, "expense", "utilities",        m3(3),  True,  "monthly"),
        _entry("Health Insurance",              80.00, "expense", "healthcare",       m3(5),  True,  "monthly"),
        _entry("Grocery Run — Trader Joe's",   210.00, "expense", "food",             m3(4),  False),
        _entry("Grocery Run — Costco",         145.00, "expense", "food",             m3(14), False),
        _entry("Grocery Run — Safeway",         95.00, "expense", "food",             m3(24), False),
        _entry("Uber / Lyft rides",            115.00, "expense", "transportation",   m3(8),  False),
        _entry("Gas",                           62.00, "expense", "transportation",   m3(18), False),
        _entry("Dinner — Cheesecake Factory",   68.00, "expense", "food",             m3(10), False),
        _entry("Coffee & Lunches",              84.00, "expense", "food",             m3(20), False),
        _entry("Netflix + Spotify",             28.00, "expense", "entertainment",    m3(5),  True,  "monthly"),
        _entry("Movie night",                   35.00, "expense", "entertainment",    m3(16), False),
        _entry("Online Course — Udemy",        500.00, "expense", "education",        m3(2),  False, None, "Full-stack dev bootcamp"),
    ]

    m2 = lambda day: _months_ago(2, day)  # noqa: E731
    entries += [
        _entry("Monthly Salary",             3200.00, "income",  "salary",           m2(1),  True,  "monthly"),
        _entry("Investment Dividend",          120.00, "income",  "other",            m2(15), False, None, "Index fund dividend"),
        _entry("Rent",                        1200.00, "expense", "rent",             m2(1),  True,  "monthly"),
        _entry("Electric & Gas",               138.00, "expense", "utilities",        m2(3),  True,  "monthly"),
        _entry("Internet",                      55.00, "expense", "utilities",        m2(3),  True,  "monthly"),
        _entry("Health Insurance",              80.00, "expense", "healthcare",       m2(5),  True,  "monthly"),
        _entry("Grocery Run — Trader Joe's",   195.00, "expense", "food",             m2(5),  False),
        _entry("Grocery Run — Whole Foods",    160.00, "expense", "food",             m2(18), False),
        _entry("Grocery Run — Safeway",        110.00, "expense", "food",             m2(26), False),
        _entry("Bus pass",                      65.00, "expense", "transportation",   m2(1),  True,  "monthly"),
        _entry("Uber rides",                    88.00, "expense", "transportation",   m2(12), False),
        _entry("Dinner — Thai Palace",          52.00, "expense", "food",             m2(9),  False),
        _entry("Brunch outing",                 74.00, "expense", "food",             m2(22), False),
        _entry("Netflix + Spotify",             28.00, "expense", "entertainment",    m2(5),  True,  "monthly"),
        _entry("Concert tickets",              110.00, "expense", "entertainment",    m2(19), False),
        _entry("Doctor visit co-pay",           40.00, "expense", "healthcare",       m2(11), False),
    ]

    m1 = lambda day: _months_ago(1, day)  # noqa: E731
    entries += [
        _entry("Monthly Salary",             3200.00, "income",  "salary",           m1(1),  True,  "monthly"),
        _entry("Freelance — web update",      300.00, "income",  "other",            m1(8),  False),
        _entry("Investment Dividend",          135.00, "income",  "other",            m1(15), False, None, "Index fund dividend"),
        _entry("Rent",                        1200.00, "expense", "rent",             m1(1),  True,  "monthly"),
        _entry("Electric & Gas",               152.00, "expense", "utilities",        m1(3),  True,  "monthly"),
        _entry("Internet",                      55.00, "expense", "utilities",        m1(3),  True,  "monthly"),
        _entry("Health Insurance",              80.00, "expense", "healthcare",       m1(5),  True,  "monthly"),
        _entry("Grocery Run — Trader Joe's",   220.00, "expense", "food",             m1(3),  False),
        _entry("Grocery Run — Costco",         175.00, "expense", "food",             m1(15), False),
        _entry("Grocery Run — Safeway",         88.00, "expense", "food",             m1(27), False),
        _entry("Bus pass",                      65.00, "expense", "transportation",   m1(1),  True,  "monthly"),
        _entry("Uber rides",                    72.00, "expense", "transportation",   m1(20), False),
        _entry("Dinner — Sushi place",          90.00, "expense", "food",             m1(7),  False),
        _entry("Coffee & Lunches",              96.00, "expense", "food",             m1(17), False),
        _entry("Netflix + Spotify",             28.00, "expense", "entertainment",    m1(5),  True,  "monthly"),
        _entry("Video game",                    60.00, "expense", "entertainment",    m1(12), False),
        _entry("Gym membership",                45.00, "expense", "healthcare",       m1(1),  True,  "monthly"),
    ]

    m0 = lambda day: _months_ago(0, day)  # noqa: E731
    entries += [
        _entry("Monthly Salary",             3200.00, "income",  "salary",           m0(1),  True,  "monthly"),
        _entry("Rent",                        1200.00, "expense", "rent",             m0(1),  True,  "monthly"),
        _entry("Electric & Gas",               141.00, "expense", "utilities",        m0(3),  True,  "monthly"),
        _entry("Internet",                      55.00, "expense", "utilities",        m0(3),  True,  "monthly"),
        _entry("Health Insurance",              80.00, "expense", "healthcare",       m0(5),  True,  "monthly"),
        _entry("Grocery Run",                  185.00, "expense", "food",             m0(4),  False),
        _entry("Netflix + Spotify",             28.00, "expense", "entertainment",    m0(5),  True,  "monthly"),
        _entry("Gym membership",                45.00, "expense", "healthcare",       m0(1),  True,  "monthly"),
        _entry("Bus pass",                      65.00, "expense", "transportation",   m0(1),  True,  "monthly"),
    ]

    for e in entries:
        firestore_service.create("budget_entries", e)

    end_of_year = f"{date.today().year}-12-31"
    goals = [
        {"id": str(uuid4()), "goal_type": "savings",       "category": "savings",       "target_amount": 5000.00, "current_amount": 1200.00, "deadline": end_of_year, "status": "on_track"},
        {"id": str(uuid4()), "goal_type": "expense_limit", "category": "food",          "target_amount":  600.00, "current_amount":    0.00, "deadline": end_of_year, "status": "on_track"},
        {"id": str(uuid4()), "goal_type": "expense_limit", "category": "entertainment", "target_amount":  150.00, "current_amount":    0.00, "deadline": end_of_year, "status": "on_track"},
    ]
    for g in goals:
        firestore_service.create("budget_goals", g)

    return len(entries), len(goals)


# ---------------------------------------------------------------------------
# Career data
# ---------------------------------------------------------------------------

def _populate_career() -> tuple[int, int, int]:
    today = date.today()

    # IDs referenced by interview prep records
    google_id   = str(uuid4())
    stripe_id   = str(uuid4())
    meta_id     = str(uuid4())
    amazon_id   = str(uuid4())
    microsoft_id = str(uuid4())
    airbnb_id   = str(uuid4())
    amazon2_id  = str(uuid4())

    applications = [
        # ---- applied (waiting) ----------------------------------------
        {
            "id": google_id,
            "company": "Google",
            "role": "Software Engineer Intern",
            "status": "applied",
            "applied_date": _days_ago(18),
            "job_url": "https://careers.google.com/jobs/results/swe-intern-2026",
            "job_description": (
                "Join Google's core engineering team to build scalable backend systems "
                "serving billions of users. You will work with Python, Go, and distributed "
                "systems while collaborating with senior engineers on high-impact projects."
            ),
            "salary_range": "$50/hour",
            "location": "Mountain View, CA",
            "work_mode": "hybrid",
            "recruiter_name": None,
            "recruiter_email": None,
            "interview_dates": [],
            "notes": "Applied through campus recruiting portal. Strong match on Python and distributed systems.",
            "resume_version": "resume_v3_swe.pdf",
            "cover_letter": "Dear Google Hiring Team, I am excited to apply for the SWE Intern role...",
            "follow_up_date": _days_from_now(3),
            "match_score": 88,
            "created_at": f"{_days_ago(18)}T09:15:00Z",
            "updated_at": f"{_days_ago(18)}T09:15:00Z",
        },
        {
            "id": airbnb_id,
            "company": "Airbnb",
            "role": "Software Engineer Intern",
            "status": "applied",
            "applied_date": _days_ago(12),
            "job_url": "https://careers.airbnb.com/positions/swe-intern",
            "job_description": (
                "Work on Airbnb's payments and trust infrastructure using React, TypeScript, "
                "and Java. You will ship production features used by millions of hosts and guests "
                "worldwide, with a strong emphasis on code quality and system reliability."
            ),
            "salary_range": "$48/hour",
            "location": "San Francisco, CA",
            "work_mode": "hybrid",
            "recruiter_name": None,
            "recruiter_email": None,
            "interview_dates": [],
            "notes": "Referred by a friend on the payments team.",
            "resume_version": "resume_v3_swe.pdf",
            "cover_letter": "Dear Airbnb Team, Airbnb's mission to create belonging resonates deeply...",
            "follow_up_date": _days_from_now(5),
            "match_score": 82,
            "created_at": f"{_days_ago(12)}T11:30:00Z",
            "updated_at": f"{_days_ago(12)}T11:30:00Z",
        },

        # ---- screening (recruiter call) --------------------------------
        {
            "id": microsoft_id,
            "company": "Microsoft",
            "role": "Product Manager Intern",
            "status": "screening",
            "applied_date": _days_ago(22),
            "job_url": "https://careers.microsoft.com/students/us/en/job/pm-intern",
            "job_description": (
                "Drive product strategy for Microsoft Teams features used by 300M+ daily active users. "
                "You will conduct user research, write product specs, and partner with engineering and "
                "design to deliver impactful experiences on a fast-moving product team."
            ),
            "salary_range": "$45/hour",
            "location": "Redmond, WA",
            "work_mode": "hybrid",
            "recruiter_name": "Sarah Chen",
            "recruiter_email": "schen@microsoft.com",
            "interview_dates": [
                {"date": _days_from_now(2), "type": "phone screen", "interviewer": "Sarah Chen (Recruiter)"}
            ],
            "notes": "Recruiter reached out on LinkedIn. Call scheduled for early next week.",
            "resume_version": "resume_v2_pm.pdf",
            "cover_letter": "Dear Microsoft Team, I am passionate about building tools that empower every person...",
            "follow_up_date": None,
            "match_score": 79,
            "created_at": f"{_days_ago(22)}T14:00:00Z",
            "updated_at": f"{_days_ago(3)}T10:45:00Z",
        },

        # ---- interview (upcoming interviews within 7 days) -------------
        {
            "id": stripe_id,
            "company": "Stripe",
            "role": "Software Engineer Intern",
            "status": "interview",
            "applied_date": _days_ago(28),
            "job_url": "https://stripe.com/jobs/listing/software-engineer-intern",
            "job_description": (
                "Build the financial infrastructure that powers the internet. "
                "You will work on Stripe's core payments APIs using Ruby, Go, and TypeScript, "
                "contributing to systems that process hundreds of billions of dollars annually."
            ),
            "salary_range": "$60/hour",
            "location": "San Francisco, CA",
            "work_mode": "onsite",
            "recruiter_name": "Marcus Webb",
            "recruiter_email": "mwebb@stripe.com",
            "interview_dates": [
                {"date": _days_from_now(3), "type": "technical", "interviewer": "Marcus Webb"},
                {"date": _days_from_now(5), "type": "system design", "interviewer": "Engineering Manager"},
            ],
            "notes": "Two-round virtual interview. First is a 60-min coding round, second is system design.",
            "resume_version": "resume_v3_swe.pdf",
            "cover_letter": "Dear Stripe Team, I have been fascinated by Stripe's approach to developer experience...",
            "follow_up_date": None,
            "match_score": 91,
            "created_at": f"{_days_ago(28)}T08:00:00Z",
            "updated_at": f"{_days_ago(7)}T16:20:00Z",
        },
        {
            "id": meta_id,
            "company": "Meta",
            "role": "Data Analyst Intern",
            "status": "interview",
            "applied_date": _days_ago(25),
            "job_url": "https://metacareers.com/jobs/data-analyst-intern",
            "job_description": (
                "Analyse product metrics across Facebook, Instagram, and WhatsApp to drive "
                "data-informed decisions. You will use SQL, Python, and internal tooling to "
                "build dashboards, run A/B tests, and present findings to cross-functional teams."
            ),
            "salary_range": "$52/hour",
            "location": "Menlo Park, CA",
            "work_mode": "hybrid",
            "recruiter_name": "Priya Sharma",
            "recruiter_email": "psharma@meta.com",
            "interview_dates": [
                {"date": _days_from_now(4), "type": "case study", "interviewer": "Priya Sharma"},
            ],
            "notes": "Case study involves a product metrics scenario. Prepare SQL and A/B test fundamentals.",
            "resume_version": "resume_v1_data.pdf",
            "cover_letter": "Dear Meta Team, Meta's scale presents unique challenges in data analysis...",
            "follow_up_date": None,
            "match_score": 85,
            "created_at": f"{_days_ago(25)}T13:00:00Z",
            "updated_at": f"{_days_ago(5)}T09:10:00Z",
        },

        # ---- offer ------------------------------------------------------
        {
            "id": amazon_id,
            "company": "Amazon",
            "role": "Software Development Engineer Intern",
            "status": "offer",
            "applied_date": _days_ago(45),
            "job_url": "https://amazon.jobs/en/jobs/sde-intern-2026",
            "job_description": (
                "Build and own full-stack features for Amazon's retail platform, working closely "
                "with senior SDEs to design, implement, and deploy services at massive scale. "
                "Strong emphasis on Amazon's Leadership Principles and customer obsession."
            ),
            "salary_range": "$46/hour + housing stipend",
            "location": "Seattle, WA",
            "work_mode": "onsite",
            "recruiter_name": "Jordan Lee",
            "recruiter_email": "jlee@amazon.com",
            "interview_dates": [
                {"date": _days_ago(14), "type": "virtual onsite", "interviewer": "Panel (4 rounds)"},
            ],
            "notes": "Offer received! $46/hr + $2,000 housing stipend. Deadline to accept: " + _days_from_now(7),
            "resume_version": "resume_v3_swe.pdf",
            "cover_letter": "Dear Amazon Team, I am driven by Amazon's culture of ownership and innovation...",
            "follow_up_date": None,
            "match_score": 93,
            "created_at": f"{_days_ago(45)}T10:00:00Z",
            "updated_at": f"{_days_ago(2)}T15:30:00Z",
        },

        # ---- rejected ---------------------------------------------------
        {
            "id": amazon2_id,
            "company": "Amazon",
            "role": "Product Manager Intern",
            "status": "rejected",
            "applied_date": _days_ago(35),
            "job_url": "https://amazon.jobs/en/jobs/pm-intern-2026",
            "job_description": (
                "Lead product initiatives for Amazon's Prime membership team, defining roadmaps "
                "and working with engineers and designers to deliver features for 200M+ Prime members. "
                "Strong analytical skills and customer focus required."
            ),
            "salary_range": "$42/hour",
            "location": "Seattle, WA",
            "work_mode": "hybrid",
            "recruiter_name": "Emily Torres",
            "recruiter_email": "etorres@amazon.com",
            "interview_dates": [
                {"date": _days_ago(20), "type": "phone screen", "interviewer": "Emily Torres"},
            ],
            "notes": "Did not advance past phone screen. Feedback: strengthen product metrics storytelling.",
            "resume_version": "resume_v2_pm.pdf",
            "cover_letter": "",
            "follow_up_date": None,
            "match_score": 72,
            "created_at": f"{_days_ago(35)}T09:00:00Z",
            "updated_at": f"{_days_ago(10)}T11:00:00Z",
        },
    ]

    for app in applications:
        firestore_service.create("applications", app)

    # ---- interview prep records ----------------------------------------
    prep_records = [
        {
            "id": str(uuid4()),
            "application_id": stripe_id,
            "company": "Stripe",
            "role": "Software Engineer Intern",
            "interview_date": _days_from_now(3),
            "interview_type": "technical",
            "practice_questions": [
                {"question": "Implement a rate limiter for an API.", "category": "technical", "answer": None},
                {"question": "Design a payment retry system with idempotency.", "category": "system design", "answer": None},
                {"question": "Tell me about a time you debugged a hard-to-reproduce bug.", "category": "behavioral", "answer": None},
                {"question": "Reverse a linked list in-place.", "category": "technical", "answer": None},
                {"question": "How would you detect duplicate transactions?", "category": "technical", "answer": None},
            ],
            "star_stories": [
                {
                    "situation": "Led a team sprint with a tight 2-week deadline for a new API feature.",
                    "task": "Design and implement a REST endpoint handling high-concurrency requests.",
                    "action": "Wrote detailed technical spec, divided work across team, added load tests.",
                    "result": "Shipped on time with <10ms p99 latency; adopted by 3 downstream services.",
                }
            ],
            "company_research": {
                "size": "~8,000 employees",
                "culture": "High engineering bar, developer-first, strong ownership culture.",
                "recent_news": ["Stripe raised $6.5B at $65B valuation", "Launched Stripe Financial Connections"],
                "values": ["Move with urgency", "Think rigorously", "Be a craft person"],
            },
            "questions_to_ask": [
                "What does a typical sprint look like for the intern team?",
                "Which team would I be embedded in, and what's their current focus?",
                "How do interns get code into production?",
            ],
            "preparation_status": "in_progress",
            "created_at": f"{_days_ago(5)}T18:00:00Z",
        },
        {
            "id": str(uuid4()),
            "application_id": meta_id,
            "company": "Meta",
            "role": "Data Analyst Intern",
            "interview_date": _days_from_now(4),
            "interview_type": "case study",
            "practice_questions": [
                {"question": "A key metric dropped 15% overnight. How do you investigate?", "category": "product analytics", "answer": None},
                {"question": "Write a SQL query to find the top 10 users by engagement in the last 7 days.", "category": "technical", "answer": None},
                {"question": "How would you design an A/B test for a new feed ranking change?", "category": "experimentation", "answer": None},
                {"question": "Describe a time you turned data into a business decision.", "category": "behavioral", "answer": None},
            ],
            "star_stories": [
                {
                    "situation": "Noticed a 20% drop in user retention during a university research project.",
                    "task": "Investigate root cause and propose a data-driven fix.",
                    "action": "Segmented cohorts by sign-up date, ran regression analysis, found onboarding friction.",
                    "result": "Redesigned onboarding flow; retention improved by 12% in follow-up study.",
                }
            ],
            "company_research": {
                "size": "70,000+ employees",
                "culture": "Move fast, bold bets, impact at scale.",
                "recent_news": ["Llama 3 open-source release", "Ray-Ban Meta glasses expansion", "Instagram Threads growth"],
                "values": ["Move Fast", "Focus on Long-Term Impact", "Build Awesome Things"],
            },
            "questions_to_ask": [
                "What data stack does the intern team work with day-to-day?",
                "What's the most impactful analysis a past intern ran here?",
                "How does the team balance exploratory analysis vs. dashboard maintenance?",
            ],
            "preparation_status": "not_started",
            "created_at": f"{_days_ago(4)}T20:00:00Z",
        },
    ]

    for prep in prep_records:
        firestore_service.create("interview_prep", prep)

    # ---- skills tracking -----------------------------------------------
    user_id = "demo-user"
    skills = [
        {"skill_name": "Python",        "proficiency": "advanced",      "source": "resume",           "verified": True,  "date_acquired": "2023-09-01", "last_used": str(today), "related_projects": ["LifeOps-Copilot", "ML Course Project", "Data Pipeline CLI"]},
        {"skill_name": "JavaScript",    "proficiency": "intermediate",  "source": "resume",           "verified": True,  "date_acquired": "2023-01-15", "last_used": str(today), "related_projects": ["LifeOps-Copilot", "Portfolio Website"]},
        {"skill_name": "TypeScript",    "proficiency": "intermediate",  "source": "resume",           "verified": True,  "date_acquired": "2024-03-01", "last_used": str(today), "related_projects": ["LifeOps-Copilot"]},
        {"skill_name": "React",         "proficiency": "intermediate",  "source": "resume",           "verified": True,  "date_acquired": "2023-06-01", "last_used": str(today), "related_projects": ["LifeOps-Copilot", "Portfolio Website"]},
        {"skill_name": "SQL",           "proficiency": "advanced",      "source": "resume",           "verified": True,  "date_acquired": "2022-09-01", "last_used": _days_ago(3), "related_projects": ["Data Pipeline CLI", "University Research DB"]},
        {"skill_name": "FastAPI",       "proficiency": "intermediate",  "source": "resume",           "verified": True,  "date_acquired": "2024-01-10", "last_used": str(today), "related_projects": ["LifeOps-Copilot"]},
        {"skill_name": "Docker",        "proficiency": "beginner",      "source": "learned_recently", "verified": False, "date_acquired": "2024-08-01", "last_used": _days_ago(10), "related_projects": ["LifeOps-Copilot"]},
        {"skill_name": "Git",           "proficiency": "advanced",      "source": "resume",           "verified": True,  "date_acquired": "2022-01-01", "last_used": str(today), "related_projects": ["LifeOps-Copilot", "All projects"]},
        {"skill_name": "AWS",           "proficiency": "beginner",      "source": "learned_recently", "verified": False, "date_acquired": "2024-10-01", "last_used": _days_ago(20), "related_projects": ["Cloud Lab Assignment"]},
        {"skill_name": "pandas",        "proficiency": "advanced",      "source": "resume",           "verified": True,  "date_acquired": "2023-01-01", "last_used": _days_ago(5), "related_projects": ["ML Course Project", "Data Pipeline CLI"]},
        {"skill_name": "scikit-learn",  "proficiency": "intermediate",  "source": "resume",           "verified": True,  "date_acquired": "2023-06-01", "last_used": _days_ago(30), "related_projects": ["ML Course Project"]},
        {"skill_name": "PostgreSQL",    "proficiency": "intermediate",  "source": "resume",           "verified": True,  "date_acquired": "2023-09-01", "last_used": _days_ago(7), "related_projects": ["University Research DB"]},
        {"skill_name": "system design", "proficiency": "beginner",      "source": "learned_recently", "verified": False, "date_acquired": "2025-01-01", "last_used": _days_ago(14), "related_projects": []},
        {"skill_name": "agile",         "proficiency": "intermediate",  "source": "resume",           "verified": True,  "date_acquired": "2023-09-01", "last_used": _days_ago(2), "related_projects": ["LifeOps-Copilot", "Capstone Project"]},
        {"skill_name": "linux",         "proficiency": "intermediate",  "source": "resume",           "verified": True,  "date_acquired": "2022-06-01", "last_used": str(today), "related_projects": ["All projects"]},
    ]

    for s in skills:
        record = {"id": str(uuid4()), "user_id": user_id, **s}
        firestore_service.create("skills_tracking", record)

    # Skill snapshot for improvement tracking
    snapshot = {
        "id": str(uuid4()),
        "user_id": user_id,
        "skills": [s["skill_name"] for s in skills if s["date_acquired"] < "2025-01-01"],
        "recorded_at": "2025-01-01T00:00:00Z",
    }
    firestore_service.create("skill_snapshots", snapshot)

    return len(applications), len(prep_records), len(skills)


# ---------------------------------------------------------------------------
# Calendar deadlines & time analytics (schemas: deadlines, time_* , behavior_* , focus_*)
# ---------------------------------------------------------------------------

def _populate_calendar_deadlines_and_time_analytics() -> tuple[int, int, int, int, int, int, int]:
    """Seed Firestore-shaped collections for DeadlineService / TimeAnalyticsService persistence."""
    today = date.today()
    user_id = "demo-user"
    y, w, _ = today.isocalendar()
    week_cur = f"{y}-W{w:02d}"
    prev = today - timedelta(days=7)
    py, pw, _ = prev.isocalendar()
    week_prev = f"{py}-W{pw:02d}"

    def _dt(day_offset: int, hour: int, minute: int = 0) -> str:
        d = today + timedelta(days=day_offset)
        return datetime(d.year, d.month, d.day, hour, minute, tzinfo=timezone.utc).isoformat()

    deadlines = [
        {
            "id": "dl-demo-1",
            "user_id": user_id,
            "title": "Problem Set 3",
            "type": "assignment",
            "dueDate": _dt(2, 23, 59),
            "status": "pending",
            "course": "CS 101",
            "notes": None,
            "milestones": [],
            "created_at": _dt(-5, 10, 0),
            "updated_at": _dt(-5, 10, 0),
        },
        {
            "id": "dl-demo-2",
            "user_id": user_id,
            "title": "Midterm paper draft",
            "type": "assignment",
            "dueDate": _dt(5, 17, 0),
            "status": "pending",
            "course": "ENG 200",
            "notes": None,
            "milestones": [],
            "created_at": _dt(-7, 9, 0),
            "updated_at": _dt(-7, 9, 0),
        },
        {
            "id": "dl-demo-3",
            "user_id": user_id,
            "title": "Capstone milestone",
            "type": "project",
            "dueDate": _dt(-1, 9, 0),
            "status": "late",
            "course": "CS 499",
            "notes": None,
            "milestones": [],
            "created_at": _dt(-14, 12, 0),
            "updated_at": _dt(-1, 9, 30),
        },
        {
            "id": "dl-demo-4",
            "user_id": user_id,
            "title": "Lab report",
            "type": "assignment",
            "dueDate": _dt(-3, 23, 59),
            "status": "missed",
            "course": "PHY 120",
            "notes": None,
            "milestones": [],
            "created_at": _dt(-10, 8, 0),
            "updated_at": _dt(-3, 23, 59),
        },
    ]
    for doc in deadlines:
        firestore_service.create("deadlines", doc)

    activity_logs = [
        ("study", "Deep work — algorithms", "CS 101", -1, 9, 0, -1, 10, 30),
        ("study", "Reading", "ENG 200", -2, 14, 0, -2, 15, 30),
        ("class", "Lecture", "PHY 120", 0, 10, 0, 0, 11, 15),
        ("work", "Campus job shift", None, -3, 14, 0, -3, 18, 0),
        ("free_time", "Break / meals", None, -1, 12, 0, -1, 13, 0),
        ("study", "Evening lab", "CS 499", -4, 20, 0, -4, 22, 0),
        ("study", "Problem set", "CS 101", -6, 19, 0, -6, 21, 0),
        ("work", "TA hours", "CS 101", -5, 16, 0, -5, 17, 30),
    ]
    for cat, label, course, sd, sh, sm, ed, eh, em in activity_logs:
        sd_d = today + timedelta(days=sd)
        ed_d = today + timedelta(days=ed)
        started = datetime(sd_d.year, sd_d.month, sd_d.day, sh, sm, tzinfo=timezone.utc).isoformat()
        ended = datetime(ed_d.year, ed_d.month, ed_d.day, eh, em, tzinfo=timezone.utc).isoformat()
        firestore_service.create(
            "time_activity_logs",
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "started_at": started,
                "ended_at": ended,
                "category": cat,
                "label": label,
                "course": course,
                "source": "manual",
            },
        )

    firestore_service.create(
        "time_week_summaries",
        {
            "id": str(uuid4()),
            "user_id": user_id,
            "week": week_cur,
            "hours": {"classes": 18.0, "study": 22.0, "work": 12.0, "free_time": 42.0},
            "source": "tracked",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
    )
    firestore_service.create(
        "time_week_summaries",
        {
            "id": str(uuid4()),
            "user_id": user_id,
            "week": week_prev,
            "hours": {"classes": 17.0, "study": 24.0, "work": 10.0, "free_time": 40.0},
            "source": "tracked",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    course_metrics = [
        ("CS 101", "CS 101", 42.0, 88.0),
        ("ENG 200", "ENG 200", 28.0, 91.0),
        ("PHY 120", "PHY 120", 55.0, 79.0),
        ("CS 499", "CS 499", 96.0, 93.0),
    ]
    for course, code, hrs, grade in course_metrics:
        firestore_service.create(
            "course_study_metrics",
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "course": course,
                "course_code": code,
                "semester": "2026-spring",
                "hours_logged": hrs,
                "grade_percent": grade,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
        )

    signals = [
        ("late_night_study", "medium", 9, {"typical_window_local": "23:00–01:30"}),
        ("last_minute_work", "high", 5, {"share_of_assignments_percent": 35.0}),
        ("context_switching", "low", 14, {}),
    ]
    for sig_type, severity, occ, meta in signals:
        firestore_service.create(
            "behavior_signals",
            {
                "id": str(uuid4()),
                "user_id": user_id,
                "signal_type": sig_type,
                "severity": severity,
                "detected_at": datetime.now(timezone.utc).isoformat(),
                "occurrences_window": occ,
                "metadata": meta,
            },
        )

    firestore_service.create(
        "focus_time_profiles",
        {
            "id": str(uuid4()),
            "user_id": user_id,
            "best_windows": [
                {"weekday": "Tuesday", "start": "09:00", "end": "11:30", "score": 0.92, "reason": "Highest historical focus streaks"},
                {"weekday": "Thursday", "start": "08:30", "end": "10:00", "score": 0.88, "reason": "Low interruption rate"},
            ],
            "secondary_windows": [
                {"weekday": "Wednesday", "start": "14:00", "end": "15:30", "score": 0.72},
            ],
            "avoid": [
                {"weekday": "Friday", "start": "16:00", "end": "19:00", "reason": "Elevated context switching"},
            ],
            "historical_basis": "rolling_8_week_demo_profile",
            "timezone_note": "Local wall-clock; connect calendar for personalization.",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    return (
        len(deadlines),
        len(activity_logs),
        2,
        len(course_metrics),
        len(signals),
        1,
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def populate() -> None:
    budget_entries, budget_goals = _populate_budget()
    applications, prep_records, skills = _populate_career()
    dl, logs, weeks, metrics, sigs, profiles = _populate_calendar_deadlines_and_time_analytics()

    print(
        f"Demo data loaded:\n"
        f"  Budget   — {budget_entries} entries, {budget_goals} goals\n"
        f"  Career   — {applications} applications, {prep_records} interview prep records, {skills} skills\n"
        f"  Calendar — {dl} deadlines, {logs} time_activity_logs, {weeks} time_week_summaries, "
        f"{metrics} course_study_metrics, {sigs} behavior_signals, {profiles} focus_time_profiles\n"
    )


if __name__ == "__main__":
    populate()
    print("Done.")
