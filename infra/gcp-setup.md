# GCP Setup — SparkUp Hackathon

## 1. Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `sparkup-hackathon`).
3. Note the **Project ID** — you will use it as `GOOGLE_CLOUD_PROJECT`.

## 2. Enable Required APIs

Open **APIs & Services → Library** and enable:

| API | Purpose |
|-----|---------|
| Vertex AI API | LLM inference (Gemini) |
| Cloud Firestore API | Document database |
| Cloud Storage API | File uploads |
| Firebase Authentication | (optional) user auth |
| Cloud Run API | Container deployment |
| Cloud Build API | CI/CD builds |
| Artifact Registry API | Docker image storage |
| Secret Manager API | Secure env vars |
| Gmail API | Read/send email (testing mode) |
| Cloud Document AI API | Document parsing |

## 3. Set Up Gmail OAuth (Testing Mode)

1. Go to **APIs & Services → OAuth consent screen**.
2. Select **External** user type.
3. Fill in app name (`SparkUp`) and support email.
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
5. Under **Test users**, add your demo/team Google accounts.
6. Leave publishing status as **Testing** (no verification needed).

### Create OAuth Client Credentials

1. Go to **APIs & Services → Credentials**.
2. Click **Create Credentials → OAuth client ID**.
3. Application type: **Web application**.
4. Add authorized redirect URI: `http://localhost:8000/api/auth/google/callback`.
5. Copy the **Client ID** and **Client Secret** into your `.env` file.

## 4. Set Up Vertex AI

1. Go to **Vertex AI → Dashboard** and enable the API if prompted.
2. The default region is `us-central1`.
3. The model used is `gemini-2.5-flash` (configurable via `VERTEX_MODEL_NAME`).
4. No additional setup needed for basic `GenerativeModel` usage.

## 5. Set Up Firestore

1. Go to **Firestore → Create database**.
2. Choose **Native mode**.
3. Select a region close to your deployment.
4. For hackathon: the backend uses an in-memory mock by default. Firestore is optional.

## 6. Set Up Cloud Storage

1. Go to **Cloud Storage → Create bucket**.
2. Name it (e.g., `sparkup-uploads`).
3. For hackathon: the backend uses a mock storage service by default.

## 7. (Optional) Set Up Document AI

1. Go to **Document AI → Processors**.
2. Create a **General Document** processor.
3. Note the processor ID for `DOCUMENT_AI_PROCESSOR_ID`.

## 8. Environment Variables

Create a `.env` file in `backend/` with:

```env
GOOGLE_CLOUD_PROJECT=sparkup-hackathon
VERTEX_LOCATION=us-central1
VERTEX_MODEL_NAME=gemini-2.5-flash
FIRESTORE_PROJECT_ID=sparkup-hackathon
GCS_BUCKET_NAME=sparkup-uploads
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
DOCUMENT_AI_PROCESSOR_ID=
```

## 9. Local Development Without GCP

All services have **mock/demo fallback** built in. If GCP credentials are missing:

- Vertex AI returns deterministic mock responses.
- Gmail returns sample messages and simulates sends.
- Firestore uses in-memory storage.
- Document AI returns placeholder extracted text.
- OAuth returns demo tokens.

You can run the full backend locally with **zero GCP configuration**.
