# SparkUp

Smart student life copilot built for the Google hackathon track.

## Overview

SparkUp helps students manage:

- 📩 Inbox and email actions
- 💼 Career and job applications
- 📅 Calendar schedules and reminders
- 💰 Budget and expense tracking

It uses a shared multi-agent workflow so the product feels like one connected system instead of four separate tools.

## Core Features

- 📬 `Inbox & Action` for email summaries, task extraction, reply drafts, and Gmail human-reviewed sending
- 🧑‍💼 `Career Copilot` for resume tailoring, job analysis, and follow-up tracking
- 🗓️ `Calendar Manager` for schedule extraction, reminders, and event suggestions
- 💸 `Budget Copilot` for income, spending, and remaining balance
- 🌤️ `Today Feed` to show the most important tasks across all modules
- 📂 `Upload First UX` to drop PDFs, screenshots, resumes, receipts, and text into one place
- 🔐 `Gmail OAuth MVP` with test-user access, AI draft generation, and confirm-before-send behavior

## Architecture

- 🖥️ `Frontend`: Next.js + TypeScript
- ⚙️ `Backend`: FastAPI + Python
- 🤖 `AI Layer`: Gemini + Vertex AI + ADK-inspired agent flow
- 🗃️ `Data`: Firestore + Cloud Storage
- 🔐 `Auth`: Firebase Auth + Google OAuth for Gmail connection
- ⏱️ `Async`: Cloud Tasks / Pub/Sub

## Folder Structure

```text
SparkUp/
  frontend/
  backend/
  docs/
  infra/
  demo-data/
```

## Screenshots To Add

- 🏠 `Hero dashboard screenshot`
  Add an image of the main home screen with the four cards.
- 📤 `Upload flow screenshot`
  Add an image showing drag and drop upload or paste input.
- 📩 `Inbox Gmail flow screenshot`
  Add an image of Connect Gmail, email summary, draft reply, and confirm send UI.
- 💼 `Career module screenshot`
  Add an image of job analysis, resume tailoring, or application tracker.
- 💰 `Budget module screenshot`
  Add an image of expense summary with totals.
- 📅 `Calendar module screenshot`
  Add an image of schedule extraction or reminder list.
- 🧠 `Architecture diagram`
  Add an image showing the router, extractor, planner, review, and action agents.

## Suggested README Image Blocks

Place these once your images are ready:

```md
![SparkUp Dashboard](./docs/assets/dashboard.png)
![SparkUp Upload Flow](./docs/assets/upload-flow.png)
![SparkUp Inbox Gmail Flow](./docs/assets/inbox-gmail-flow.png)
![SparkUp Career Module](./docs/assets/career-module.png)
![SparkUp Budget Module](./docs/assets/budget-module.png)
![SparkUp Architecture](./docs/assets/architecture-diagram.png)
```

## Team

- 🎨 `Vriddhi`: UI/UX
- 💻 `Vidhi`: Frontend
- 🛠️ `Aarav`: Backend
- ☁️ `Nishit`: AI and Cloud Integration

## API Highlights

- `GET /api/dashboard/summary`
- `GET /api/feed/today`
- `POST /api/uploads`
- `GET /api/auth/google/login`
- `GET /api/auth/google/callback`
- `GET /api/inbox/gmail/messages`
- `POST /api/inbox/gmail/send`
- `POST /api/inbox/process`
- `POST /api/career/analyze-job`
- `POST /api/calendar/extract-schedule`
- `POST /api/budget/entries`
- `GET /api/budget/summary`
- `GET /api/approvals/pending`
- `PATCH /api/approvals/{approvalId}`

## Gmail MVP Decision

- ✅ Use `gmail.readonly` + `gmail.send`
- ✅ Keep app in `External + Testing` mode
- ✅ Add only team/demo accounts as test users
- ✅ Keep user in the loop for every send action
- ✅ Use OAuth login flow, not direct password access
- ❌ No autonomous sending
- ❌ No public production rollout for the hackathon demo

## Simple Gmail Flow

1. User clicks `Connect Gmail`
2. Google login and consent opens
3. Backend receives auth code and exchanges it for tokens
4. App reads Gmail messages for the connected demo user
5. AI generates summary and draft reply in SparkUp
6. User reviews and edits the draft
7. User clicks `Confirm Send`
8. Backend sends through Gmail API

## Demo Story

1. Student uploads a class schedule.
2. SparkUp extracts dates and creates reminder suggestions.
3. Student pastes a job description and gets a tailored resume suggestion.
4. Student adds an expense entry and sees budget totals update.
5. Student connects Gmail, opens an email, reviews the AI draft, and confirms send.

## Why This Project Fits The Google Track

- 🚀 It is a real agentic workflow, not just a chatbot.
- 🧩 It uses AI to reason, route, extract, plan, review, and act.
- ☁️ It maps naturally to Google Cloud services like Vertex AI, Firestore, Cloud Run, and Gmail API.
- 🎓 It solves a real student productivity problem with a polished product surface.

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Roadmap

- [ ] Shared upload pipeline
- [ ] Calendar flow
- [ ] Career flow
- [ ] Budget flow
- [ ] Gmail inbox integration in testing mode
- [ ] Approval workflow
- [ ] Google integrations polish

## Notes

- 📸 Add your final screenshots before submission.
- 📌 Keep Gmail integration in testing mode for the MVP.
- 🔒 Store Gmail tokens only on the backend.
- 🎤 Demo one connected story rather than isolated features.
