# Database Schema

## Overview

The backend currently uses a **mock in-memory database** implemented in `backend/app/services/firestore_service.py`.
Data is stored in a plain Python dictionary (`self.mock_db`) and **resets on every server restart**.
This is intentional for local development — no setup required.

When Firestore (or another persistent store) is integrated, each collection below maps directly to a Firestore collection with the same name and fields.

To pre-load realistic demo data run:
```bash
cd backend
python -m scripts.populate_demo_data
```

---

## Collections

### 1. `applications`

**Purpose:** Tracks job applications through the full Career pipeline — from saved to accepted.

| Field             | Type           | Description                                                                 |
|-------------------|----------------|-----------------------------------------------------------------------------|
| `id`              | string         | UUID generated at creation                                                  |
| `company`         | string         | Company name                                                                |
| `role`            | string         | Job title / role applied for                                                |
| `status`          | string         | `saved`, `applied`, `screening`, `interview`, `offer`, `rejected`, `accepted` |
| `applied_date`    | string         | Date of application in `YYYY-MM-DD` format                                  |
| `job_url`         | string         | Link to the original job posting                                            |
| `job_description` | string         | Full job description text (used for skills gap analysis)                    |
| `salary_range`    | string         | e.g. `"$80k–$100k"` or `"$40–50/hour"`                                     |
| `location`        | string         | City, state or country                                                      |
| `work_mode`       | string         | `remote`, `hybrid`, or `onsite`                                             |
| `recruiter_name`  | string \| null  | Name of the recruiter or hiring manager                                     |
| `recruiter_email` | string \| null  | Recruiter contact email                                                     |
| `interview_dates` | list[dict]     | List of `{date, type, interviewer}` objects                                 |
| `notes`           | string         | Free-text notes about the application                                       |
| `resume_version`  | string         | Filename of the resume version submitted                                    |
| `cover_letter`    | string         | Cover letter text                                                           |
| `follow_up_date`  | string \| null  | Date to follow up if no response (`YYYY-MM-DD`)                             |
| `match_score`     | int            | Estimated fit score 0–100 from skills gap analysis                          |
| `job_id`          | string \| null | External listing id when the application was created from job search / scraper (links card ↔ application) |
| `created_at`      | string         | ISO timestamp when the record was created                                   |
| `updated_at`      | string         | ISO timestamp of last update                                                |

**Example document:**
```json
{
  "id": "app-001",
  "job_id": "remotive-12345",
  "company": "Google",
  "role": "Software Engineer Intern",
  "status": "interview",
  "applied_date": "2026-03-15",
  "job_url": "https://careers.google.com/jobs/123",
  "job_description": "Full job description here...",
  "salary_range": "$40-50/hour",
  "location": "Mountain View, CA",
  "work_mode": "hybrid",
  "recruiter_name": "Jane Smith",
  "recruiter_email": "jsmith@google.com",
  "interview_dates": [
    {"date": "2026-04-10", "type": "phone screen", "interviewer": "John Doe"}
  ],
  "notes": "Applied through campus recruiting",
  "resume_version": "resume_v3_swe.pdf",
  "cover_letter": "Dear Hiring Manager...",
  "follow_up_date": "2026-04-08",
  "match_score": 85,
  "created_at": "2026-03-15T10:00:00Z",
  "updated_at": "2026-04-01T14:30:00Z"
}
```

---

### 2. `budget_entries`

**Purpose:** Stores all financial transactions (income, expenses, savings) for the Budget module.

| Field                 | Type          | Description                                                                 |
|-----------------------|---------------|-----------------------------------------------------------------------------|
| `id`                  | string        | UUID generated at creation                                                  |
| `title`               | string        | Label for the entry (e.g. `"Monthly Salary"`, `"Rent"`)                     |
| `amount`              | float         | Dollar amount (always positive)                                             |
| `entry_type`          | string        | `income`, `expense`, or `savings`                                           |
| `category`            | string        | `salary`, `food`, `rent`, `utilities`, `entertainment`, `transportation`, `education`, `healthcare`, `other` |
| `date`                | string        | Transaction date in `YYYY-MM-DD` format                                     |
| `is_recurring`        | boolean       | `true` if this is a repeating transaction                                   |
| `recurring_frequency` | string \| null | `daily`, `weekly`, `monthly`, or `yearly` — `null` for one-off entries     |
| `notes`               | string \| null | Optional free-text notes                                                   |
| `created_at`          | string        | ISO timestamp of when the record was created                                |

**Example document:**
```json
{
  "id": "b7e2d3f5-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
  "title": "Monthly Salary",
  "amount": 3200.00,
  "entry_type": "income",
  "category": "salary",
  "date": "2026-04-01",
  "is_recurring": true,
  "recurring_frequency": "monthly",
  "notes": null,
  "created_at": "2026-04-01"
}
```

```json
{
  "id": "c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
  "title": "Rent",
  "amount": 1200.00,
  "entry_type": "expense",
  "category": "rent",
  "date": "2026-04-01",
  "is_recurring": true,
  "recurring_frequency": "monthly",
  "notes": null,
  "created_at": "2026-04-01"
}
```

---

### 3. `budget_goals`

**Purpose:** Stores financial goals — either savings targets or per-category spending limits.

| Field            | Type   | Description                                                         |
|------------------|--------|---------------------------------------------------------------------|
| `id`             | string | UUID generated at creation                                          |
| `goal_type`      | string | `savings` (accumulate a target amount) or `expense_limit` (cap spending in a category) |
| `category`       | string | The category this goal applies to (matches `budget_entries.category`) |
| `target_amount`  | float  | The goal target in dollars                                          |
| `current_amount` | float  | Amount saved or spent so far (updated manually or via analytics)    |
| `deadline`       | string | Target completion date in `YYYY-MM-DD` format                       |
| `status`         | string | `on_track`, `at_risk`, or `completed`                               |

**Example documents:**
```json
{
  "id": "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  "goal_type": "savings",
  "category": "savings",
  "target_amount": 5000.00,
  "current_amount": 1200.00,
  "deadline": "2026-12-31",
  "status": "on_track"
}
```

```json
{
  "id": "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
  "goal_type": "expense_limit",
  "category": "food",
  "target_amount": 600.00,
  "current_amount": 0.00,
  "deadline": "2026-12-31",
  "status": "on_track"
}
```

---

### 4. `approvals`

**Purpose:** Holds pending action items that require user review or approval (e.g. drafted emails, suggested calendar events).

| Field       | Type    | Description                                                  |
|-------------|---------|--------------------------------------------------------------|
| `id`        | string  | UUID generated at creation                                   |
| `approved`  | boolean | `false` while pending, `true` once approved                  |
| *(flexible)*| any     | Additional fields vary by source module (e.g. `type`, `description`) |

**Example document:**
```json
{
  "id": "f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c",
  "type": "email_draft",
  "description": "Reply to professor about office hours",
  "approved": false
}
```

---

### 5. `uploads`

**Purpose:** Tracks files uploaded through the Uploads module. File bytes are stored in GCS (mocked via `StorageService`); this collection holds metadata and extracted text.

| Field           | Type   | Description                                                                       |
|-----------------|--------|-----------------------------------------------------------------------------------|
| `uploadId`      | string | UUID generated at upload time                                                     |
| `fileName`      | string | Original filename                                                                 |
| `fileUrl`       | string | GCS URL (mocked as `https://storage.googleapis.com/lifeops-uploads/<filename>`)   |
| `status`        | string | `uploaded` if no text was extracted, `processed` if extraction succeeded          |
| `extractedText` | string | Text extracted from the file via PDF parsing or OCR (empty string if unavailable) |

**Example document:**
```json
{
  "uploadId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "fileName": "syllabus_spring2026.pdf",
  "fileUrl": "https://storage.googleapis.com/lifeops-uploads/syllabus_spring2026.pdf",
  "status": "processed",
  "extractedText": "CS 3310 Data Structures — Spring 2026\nExam 1: Feb 20..."
}
```

---

### 6. `reminders`

**Purpose:** Stores reminders created from calendar events or uploaded schedules.

| Field          | Type   | Description                                           |
|----------------|--------|-------------------------------------------------------|
| `id`           | string         | UUID generated by `ReminderService`                                      |
| `title`        | string         | Reminder title                                                             |
| `dateTime`     | string         | ISO 8601 datetime string (e.g. `2026-04-06T09:00:00`)                      |
| `sourceModule` | string         | Module that created the reminder (e.g. `calendar`)                        |
| `deadlineId`   | string \| null | When set, links this reminder to a `deadlines` document (auto-reminders) |

**Example document:**
```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "title": "Data Structures Class",
  "dateTime": "2026-04-06T09:00:00",
  "sourceModule": "calendar",
  "deadlineId": null
}
```

---

### 7. `feed_items`

**Purpose:** Stores activity feed items displayed on the Dashboard's Today Feed.

| Field   | Type   | Description                                               |
|---------|--------|-----------------------------------------------------------|
| `id`    | string | UUID generated at creation                                |
| `type`  | string | `task`, `reminder`, or `upload`                           |
| `title` | string | Display title shown in the feed                           |
| `time`  | string | Human-readable time string (e.g. `2 hours ago`)           |

**Example document:**
```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-012345678902",
  "type": "task",
  "title": "Review calculus homework",
  "time": "2 hours ago"
}
```

---

### 8. `interview_prep`

**Purpose:** Stores interview preparation data linked to a specific job application — practice questions, STAR stories, company research, and questions to ask.

| Field                  | Type       | Description                                                              |
|------------------------|------------|--------------------------------------------------------------------------|
| `id`                   | string     | UUID generated at creation                                               |
| `application_id`       | string     | Reference to the parent `applications` document                          |
| `company`              | string     | Company name (denormalised for convenience)                              |
| `role`                 | string     | Role being applied for                                                   |
| `interview_date`       | string     | Scheduled interview date in `YYYY-MM-DD` format                          |
| `interview_type`       | string     | `phone`, `video`, `onsite`, or `technical`                               |
| `practice_questions`   | list[dict] | List of `{question, category, answer \| null}` objects                   |
| `star_stories`         | list[dict] | List of `{situation, task, action, result}` STAR story templates         |
| `company_research`     | dict       | `{size, culture, recent_news: list, values: list}`                       |
| `questions_to_ask`     | list[str]  | Smart questions for the candidate to ask the interviewer                 |
| `preparation_status`   | string     | `not_started`, `in_progress`, or `ready`                                 |
| `created_at`           | string     | ISO timestamp when the record was created                                |

**Example document:**
```json
{
  "id": "prep-001",
  "application_id": "app-001",
  "company": "Google",
  "role": "Software Engineer Intern",
  "interview_date": "2026-04-10",
  "interview_type": "technical",
  "practice_questions": [
    {"question": "Explain your most challenging project", "category": "behavioral", "answer": null},
    {"question": "Reverse a linked list", "category": "technical", "answer": null}
  ],
  "star_stories": [
    {
      "situation": "Team project deadline was approaching",
      "task": "Needed to implement authentication",
      "action": "Led design review and coded the feature",
      "result": "Delivered on time, used by 1000+ users"
    }
  ],
  "company_research": {
    "size": "Large (100k+ employees)",
    "culture": "Innovation-focused, collaborative",
    "recent_news": ["Launched new AI product", "Q4 earnings beat expectations"],
    "values": ["User focus", "Innovation", "Boldness"]
  },
  "questions_to_ask": [
    "What does success look like in this role?",
    "What are the team's current priorities?"
  ],
  "preparation_status": "in_progress",
  "created_at": "2026-04-01T10:00:00Z"
}
```

---

### 9. `skills_tracking`

**Purpose:** Individual skill records for a user — proficiency level, source, and project associations. Used by `SkillsAnalysisService` to track improvements over time.

| Field              | Type       | Description                                                           |
|--------------------|------------|-----------------------------------------------------------------------|
| `id`               | string     | UUID generated at creation                                            |
| `user_id`          | string     | Owner of this skill record                                            |
| `skill_name`       | string     | Skill name (e.g. `"Python"`, `"React"`, `"System Design"`)           |
| `proficiency`      | string     | `beginner`, `intermediate`, `advanced`, or `expert`                  |
| `source`           | string     | `resume`, `added_manually`, or `learned_recently`                    |
| `verified`         | boolean    | `true` if the skill has been demonstrated or certified                |
| `date_acquired`    | string     | Date the skill was first learned in `YYYY-MM-DD` format              |
| `last_used`        | string     | Date the skill was most recently used in `YYYY-MM-DD` format         |
| `related_projects` | list[str]  | Project names or IDs where this skill was applied                    |

**Example document:**
```json
{
  "id": "skill-001",
  "user_id": "user-123",
  "skill_name": "Python",
  "proficiency": "advanced",
  "source": "resume",
  "verified": true,
  "date_acquired": "2024-01-15",
  "last_used": "2026-04-01",
  "related_projects": ["LifeOps-Copilot", "ML Course Project"]
}
```

---

### 10. `skill_snapshots`

**Purpose:** Point-in-time snapshots of a user's full skill set, used by `track_skill_improvements()` to diff skills gained or lost over time.

| Field         | Type      | Description                                              |
|---------------|-----------|----------------------------------------------------------|
| `id`          | string    | UUID generated at creation                               |
| `user_id`     | string    | Owner of this snapshot                                   |
| `skills`      | list[str] | List of skill names present at the time of the snapshot  |
| `recorded_at` | string    | ISO timestamp when the snapshot was taken                |

**Example document:**
```json
{
  "id": "snap-001",
  "user_id": "user-123",
  "skills": ["python", "react", "sql", "docker"],
  "recorded_at": "2026-01-01T00:00:00Z"
}
```

---

### 11. `deadlines`

**Purpose:** Academic and calendar deadlines for `DeadlineService` — upcoming/overdue lists, milestone breakdowns, and linked reminders.

| Field         | Type           | Description                                                                 |
|---------------|----------------|-----------------------------------------------------------------------------|
| `id`          | string         | Stable id (UUID or client-provided)                                         |
| `user_id`     | string \| null | Owner; `null` in single-user demo                                           |
| `title`       | string         | Display title                                                               |
| `type`        | string         | `assignment`, `project`, `exam`, or `other`                                   |
| `dueDate`     | string         | Due instant, ISO 8601 (timezone-aware recommended)                          |
| `status`      | string         | `pending`, `late`, `missed`, `done`, `completed`, or `submitted`              |
| `course`      | string \| null | Course label or code                                                        |
| `notes`       | string \| null | Optional context                                                            |
| `milestones`  | list[dict]     | Optional saved breakdown: `{order, title, dueDate, percent_complete_target}` |
| `created_at`  | string \| null | ISO timestamp                                                               |
| `updated_at`  | string \| null | ISO timestamp                                                               |

**Example document:**
```json
{
  "id": "dl-demo-1",
  "user_id": "demo-user",
  "title": "Problem Set 3",
  "type": "assignment",
  "dueDate": "2026-04-07T23:59:00+00:00",
  "status": "pending",
  "course": "CS 101",
  "notes": null,
  "milestones": [],
  "created_at": "2026-04-01T12:00:00Z",
  "updated_at": "2026-04-01T12:00:00Z"
}
```

---

### 12. `time_activity_logs`

**Purpose:** Raw time blocks used to compute weekly distribution, focus-time recommendations, and procrastination-style signals.

| Field        | Type           | Description                                                                 |
|--------------|----------------|-----------------------------------------------------------------------------|
| `id`         | string         | UUID                                                                        |
| `user_id`    | string         | Owner                                                                       |
| `started_at` | string         | ISO 8601 start                                                              |
| `ended_at`   | string         | ISO 8601 end                                                                |
| `category`   | string         | `class`, `study`, `work`, `free_time`, or `other`                           |
| `label`      | string \| null | Short description                                                           |
| `course`     | string \| null | Related course when `category` is `class` or `study`                        |
| `source`     | string \| null | `manual`, `calendar_import`, `inferred`, etc.                               |

---

### 13. `time_week_summaries`

**Purpose:** One row per user per ISO week (`YYYY-WNN`) for fast `get_time_distribution` without scanning all activity logs.

| Field        | Type   | Description                                                                 |
|--------------|--------|-----------------------------------------------------------------------------|
| `id`         | string | UUID                                                                        |
| `user_id`    | string | Owner                                                                       |
| `week`       | string | ISO week key, e.g. `2026-W14`                                               |
| `hours`      | dict   | Keys: `classes`, `study`, `work`, `free_time` (float hours, sum ≈ tracked total) |
| `source`     | string | `tracked` (from logs) or `estimated` (planner / syllabus defaults)          |
| `updated_at` | string | ISO timestamp                                                               |

**Example document:**
```json
{
  "id": "tw-001",
  "user_id": "demo-user",
  "week": "2026-W14",
  "hours": {
    "classes": 18.0,
    "study": 22.0,
    "work": 12.0,
    "free_time": 38.0
  },
  "source": "tracked",
  "updated_at": "2026-04-04T10:00:00Z"
}
```

---

### 14. `course_study_metrics`

**Purpose:** Semester-level aggregates for `calculate_study_efficiency` (time logged vs grade).

| Field           | Type           | Description                                                                 |
|-----------------|----------------|-----------------------------------------------------------------------------|
| `id`            | string         | UUID                                                                        |
| `user_id`       | string         | Owner                                                                       |
| `course`        | string         | Display name (matches lookup in analytics, e.g. `CS 101`)                   |
| `course_code`   | string \| null | Optional normalized code                                                    |
| `semester`      | string \| null | e.g. `2026-spring`                                                          |
| `hours_logged`  | float          | Total study/time attributed to the course                                   |
| `grade_percent` | float \| null  | Current or final numeric grade (0–100)                                      |
| `updated_at`    | string \| null | ISO timestamp                                                               |

---

### 15. `behavior_signals`

**Purpose:** Stored outputs of procrastination / habit detection for `detect_procrastination_patterns` and `suggest_productivity_improvements`.

| Field                 | Type           | Description                                                                 |
|-----------------------|----------------|-----------------------------------------------------------------------------|
| `id`                  | string         | UUID                                                                        |
| `user_id`             | string         | Owner                                                                       |
| `signal_type`         | string         | e.g. `late_night_study`, `last_minute_work`, `context_switching`            |
| `severity`            | string         | `low`, `medium`, or `high`                                                  |
| `detected_at`         | string         | ISO timestamp of detection or rollup window end                             |
| `occurrences_window`  | int \| null    | Count in the reporting window (e.g. last 30 days)                           |
| `metadata`            | dict           | Extra fields (`typical_window_local`, `share_of_assignments_percent`, …)    |

---

### 16. `focus_time_profiles`

**Purpose:** Per-user recommended focus windows derived from historical activity (`get_focus_time_recommendations`).

| Field                 | Type           | Description                                                                 |
|-----------------------|----------------|-----------------------------------------------------------------------------|
| `id`                  | string         | UUID                                                                        |
| `user_id`             | string         | Owner (one active profile per user is typical)                              |
| `best_windows`        | list[dict]     | e.g. `{weekday, start, end, score, reason}`                                 |
| `secondary_windows`   | list[dict]     | Lower-confidence slots                                                      |
| `avoid`               | list[dict]     | e.g. `{weekday, start, end, reason}`                                        |
| `historical_basis`    | string \| null | Description of the training window                                          |
| `timezone_note`       | string \| null | Clarifies local vs UTC if needed                                            |
| `updated_at`          | string \| null | ISO timestamp                                                               |

---

## Notes for Contributors

- **No setup needed locally** — the mock DB is zero-config and starts empty on each run.
- **Data does not persist** between server restarts. For testing multi-step flows, keep the server running.
- **Same interface** — `FirestoreService` exposes `create`, `get`, `list_collection`, and `update`. Swapping in a real Firestore client only requires updating that class.
- **No deletes yet** — the current mock does not implement a `delete` method. Add it to `FirestoreService` if needed.
- **Demo data** — run `python -m scripts.populate_demo_data` from `backend/` to load budget, career, and **calendar** sample rows (`deadlines`, `time_activity_logs`, `time_week_summaries`, `course_study_metrics`, `behavior_signals`, `focus_time_profiles`) for development and demos.
