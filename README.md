# LifeOps Copilot

LifeOps Copilot is a student life copilot that brings inbox, career planning, calendar, and budget into one place. It targets university students who juggle email, deadlines, applications, and money in disconnected tools. The app uses a FastAPI backend and a Next.js frontend, with optional Google Cloud services for AI (Vertex AI / Gemini), storage, and Gmail OAuth.

**Team:** SparkUp

---

## Table of contents

| Section | What you’ll find |
| :------ | :--------------- |
| [Features](#features) | What the app does |
| [Architecture](#architecture) | How pieces fit together |
| [Local development](#local-development) | Run frontend and backend on your machine |
| [Deploying on Google Cloud](#deploying-on-google-cloud) | Cloud Run, env vars, and integration notes |
| [Environment variables](#environment-variables) | Backend and frontend configuration |
| [Repository layout](#repository-layout) | Where code lives |
| [API overview](#api-overview) | Main HTTP endpoints |
| [Team](#team) | Contributors |
| [License](#license) | License information |

---

## Features

- **Dashboard** — Summary stats, animated module scenes, rotating quotes, upload drop zone, and a merged “today” feed (agents + API + fallbacks).
- **Inbox** — Gmail connection (OAuth), summaries, and human-in-the-loop send.
- **Career** — Job and application workflows aligned with the backend career APIs.
- **Calendar** — Events and study suggestions; optional link-out to Google Calendar in the UI.
- **Budget** — Income and expense tracking with insights when the API is enabled.
- **Auth** — Session-aware frontend with protected routes behind the app shell.

---

## Architecture

- **Frontend** — Next.js (App Router), TypeScript, Tailwind CSS v4, Framer Motion, Zustand. Calls the backend over HTTP (`NEXT_PUBLIC_API_URL`).
- **Backend** — FastAPI application (`app.main`), modular routers under `app/api/`, services for Gmail, agents, Firestore/Mongo, and optional Vertex AI.
- **Data** — Document store (Firestore or MongoDB via `MONGODB_URI`) for users, events, uploads metadata, and feed items.
- **AI** — When `GOOGLE_CLOUD_PROJECT` and credentials are configured, Vertex AI can power agent flows; otherwise the codebase falls back to deterministic or mock behavior where implemented.

For production on Google Cloud, a typical layout is: **Cloud Run** (or GKE) for the API container, **Cloud Run** or **Firebase Hosting** / **Cloud CDN** for the static/Next export or Node hosting, **Firestore** or **MongoDB Atlas**, **Cloud Storage** for uploads, **Secret Manager** for keys, and **Vertex AI** for Gemini.

---

## Local development

### Prerequisites

- Node.js 20+ and npm  
- Python 3.11+ and pip  
- (Optional) `gcloud` CLI and a GCP project for live AI and Gmail

### Backend

```bash
cd backend
pip install -r requirements.txt
copy .env.example .env   # Windows; use cp on macOS/Linux and fill values
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API base URL: `http://localhost:8000` (OpenAPI docs at `/docs` when enabled).

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

App: `http://localhost:3000`

---

## Deploying on Google Cloud

These steps describe a common pattern; adjust names and regions to match your project.

### 1. Containerize the API

- Add a `Dockerfile` in `backend/` (if not already present) that installs dependencies and runs `uvicorn` on the port Cloud Run expects (`8080` is typical; map `PORT`).
- Build and push to **Artifact Registry**:

```bash
gcloud auth configure-docker REGION-docker.pkg.dev
docker build -t REGION-docker.pkg.dev/PROJECT_ID/REPO/lifeops-api:TAG ./backend
docker push REGION-docker.pkg.dev/PROJECT_ID/REPO/lifeops-api:TAG
```

### 2. Cloud Run (backend)

- Create a Cloud Run service from that image.
- Set **environment variables** and **secrets** (Secret Manager) for everything in `.env.example` that you use in production (Mongo/Firestore, OAuth client secret, Vertex settings, etc.).
- Allow unauthenticated invocations only if you expose a public API; otherwise use IAM and/or an API gateway in front.

### 3. Frontend on Cloud Run or managed hosting

- **Option A** — Build a production Next.js image (standalone output) and deploy a second Cloud Run service; set `NEXT_PUBLIC_API_URL` to your public API URL at build time.
- **Option B** — Use **Firebase Hosting**, **Cloud Storage + load balancer**, or another static host for `next export` / static assets if your deployment model allows it.

### 4. Networking and CORS

- Configure the backend CORS `allow_origins` to include your deployed frontend origin (exact scheme + host + port).
- Use HTTPS everywhere in production.

### 5. Gmail / Google OAuth

- In [Google Cloud Console](https://console.cloud.google.com/), configure the OAuth consent screen and create OAuth 2.0 **Web** credentials.
- Set authorized **JavaScript origins** and **redirect URIs** to your production frontend and backend callback URL (e.g. `https://api.yourdomain.com/api/auth/google/callback`).
- Store `GOOGLE_CLIENT_SECRET` in Secret Manager, not in source control.

---

## Environment variables

See `backend/.env.example` for the authoritative list. Commonly:

| Area | Examples |
| :--- | :------- |
| GCP / AI | `GOOGLE_CLOUD_PROJECT`, `VERTEX_LOCATION`, `VERTEX_MODEL_NAME` |
| Data | `MONGODB_URI`, `FIRESTORE_PROJECT_ID`, `GCS_BUCKET_NAME` |
| OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| App | `JWT_SECRET` (or equivalent), CORS origins |

Frontend:

| Variable | Purpose |
| :------- | :------ |
| `NEXT_PUBLIC_API_URL` | Base URL for all API calls |

---

## Repository layout

```text
repository/
  frontend/          Next.js app (LifeOps Copilot UI)
  backend/           FastAPI app (app/main.py, app/api, app/services)
  docs/              Optional diagrams and assets (add as needed)
  demo-data/         Sample data for demos (if present)
  infra/             GCP notes and setup helpers
```

---

## API overview

Representative routes (see `/docs` on a running server for the full list):

- `GET /api/dashboard/summary` — Dashboard aggregates  
- `GET /api/dashboard/feed/today` — Today feed items  
- `GET /api/auth/google/login` — Start Gmail OAuth  
- `GET /api/inbox/gmail/messages` — List messages (when connected)  
- `POST /api/calendar/events` — Calendar CRUD  
- `POST /api/budget/entries` — Budget entries  
- Career, uploads, and agent routes under `app/api/`

---

## Team

Built by **SparkUp**:

- **Vriddhi** — UI/UX  
- **Vidhi** — Frontend, integrated backend endpoints, collaborated on AI and cloud Setup
- **Aarav** — Backend  
- **Nishit** — AI and cloud integration  

---


