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

**Purpose:** Tracks job applications submitted through the Career module.

| Field     | Type   | Description                                                     |
|-----------|--------|-----------------------------------------------------------------|
| `id`      | string | UUID generated at creation                                      |
| `company` | string | Company name                                                    |
| `role`    | string | Job title / role applied for                                    |
| `status`  | string | `draft`, `applied`, `interviewing`, `offer`, `rejected`         |

**Example document:**
```json
{
  "id": "a3f1c2d4-5e6b-7890-abcd-ef1234567890",
  "company": "Google",
  "role": "Software Engineer Intern",
  "status": "applied"
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
| `fileUrl`       | string | GCS URL (mocked as `https://storage.googleapis.com/sparkup-uploads/<filename>`)   |
| `status`        | string | `uploaded` if no text was extracted, `processed` if extraction succeeded          |
| `extractedText` | string | Text extracted from the file via PDF parsing or OCR (empty string if unavailable) |

**Example document:**
```json
{
  "uploadId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "fileName": "syllabus_spring2026.pdf",
  "fileUrl": "https://storage.googleapis.com/sparkup-uploads/syllabus_spring2026.pdf",
  "status": "processed",
  "extractedText": "CS 3310 Data Structures — Spring 2026\nExam 1: Feb 20..."
}
```

---

### 6. `reminders`

**Purpose:** Stores reminders created from calendar events or uploaded schedules.

| Field          | Type   | Description                                           |
|----------------|--------|-------------------------------------------------------|
| `id`           | string | UUID generated by `ReminderService`                   |
| `title`        | string | Reminder title                                        |
| `dateTime`     | string | ISO 8601 datetime string (e.g. `2026-04-06T09:00:00`) |
| `sourceModule` | string | Module that created the reminder (e.g. `calendar`)    |

**Example document:**
```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "title": "Data Structures Class",
  "dateTime": "2026-04-06T09:00:00",
  "sourceModule": "calendar"
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

## Notes for Contributors

- **No setup needed locally** — the mock DB is zero-config and starts empty on each run.
- **Data does not persist** between server restarts. For testing multi-step flows, keep the server running.
- **Same interface** — `FirestoreService` exposes `create`, `get`, `list_collection`, and `update`. Swapping in a real Firestore client only requires updating that class.
- **No deletes yet** — the current mock does not implement a `delete` method. Add it to `FirestoreService` if needed.
- **Demo data** — run `python -m scripts.populate_demo_data` from `backend/` to load 3+ months of realistic budget entries and goals for development and demos.
