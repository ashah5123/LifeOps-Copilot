# Deploy LifeOps Copilot to Google Cloud Run

Complete guide for deploying the LifeOps backend (Python FastAPI) and frontend (Next.js) to Google Cloud Run.

---

## Prerequisites

### Local Machine Setup
1. **Google Cloud SDK** (gcloud CLI)
   - Install: https://cloud.google.com/sdk/docs/install
   - Verify: `gcloud version`

2. **Docker**
   - Install Docker Desktop (Windows/Mac) or Docker Engine (Linux)
   - Verify: `docker --version`

3. **Authenticate with Google Cloud**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

### Google Cloud Project Setup
1. Create a new project or select existing:
   ```bash
   gcloud projects create lifeops-prod --name="LifeOps Production"
   # OR use existing
   gcloud config set project YOUR_PROJECT_ID
   ```

2. Enable billing for your project in GCP Console

3. Set your project ID as a variable:
   ```bash
   export PROJECT_ID="lifeops-prod"
   gcloud config set project $PROJECT_ID
   ```

---

## Step 1: Enable Required APIs

```bash
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com aiplatform.googleapis.com gmail.googleapis.com firestore.googleapis.com storage.googleapis.com
```

---

## Step 2: Set Up Artifact Registry

Create a Docker repository to store your images:

```bash
# Set region
export REGION="us-central1"

# Create repository
gcloud artifacts repositories create lifeops-repo --repository-format=docker --location=$REGION --description="LifeOps Docker images"

# Configure Docker
gcloud auth configure-docker $REGION-docker.pkg.dev
```

---

## Step 3: Set Up Secret Manager

Create secrets for sensitive environment variables:

```bash
# MongoDB URI
echo -n "mongodb://your-connection-string" | gcloud secrets create mongodb-uri --data-file=-

# JWT Secret
echo -n "$(openssl rand -hex 32)" | gcloud secrets create jwt-secret --data-file=-

# Google OAuth Secret
echo -n "your-google-oauth-secret" | gcloud secrets create google-oauth-secret --data-file=-

# RapidAPI Key (optional)
echo -n "your-rapidapi-key" | gcloud secrets create rapidapi-key --data-file=-
```

### Grant Cloud Run access to secrets:
```bash
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
SERVICE_ACCOUNT="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

for SECRET in mongodb-uri jwt-secret google-oauth-secret rapidapi-key; do
  gcloud secrets add-iam-policy-binding $SECRET --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/secretmanager.secretAccessor"
done
```

---

## Step 4: Set Up Google OAuth

### Create OAuth Credentials
1. Go to GCP Console → APIs & Services → Credentials
2. Create Credentials → OAuth client ID
3. Type: Web application
4. Name: LifeOps Copilot
5. Redirect URIs:
   - http://localhost:8000/api/auth/google/callback
   - https://YOUR-BACKEND-URL.run.app/api/auth/google/callback
6. Save Client ID and Client Secret

### OAuth Consent Screen
1. Go to OAuth consent screen
2. User type: External
3. Add scopes: gmail.readonly, gmail.send
4. Add test users
5. Keep in Testing mode

---

## Step 5: Deploy Backend

### Build and push:
```bash
cd backend
export BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/lifeops-repo/backend:latest"
docker build -t $BACKEND_IMAGE .
docker push $BACKEND_IMAGE
```

### Deploy:
```bash
gcloud run deploy lifeops-api --image=$BACKEND_IMAGE --region=$REGION --platform=managed --allow-unauthenticated --memory=1Gi --cpu=1 --timeout=300 --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,VERTEX_LOCATION=$REGION,VERTEX_MODEL_NAME=gemini-2.5-flash,FIRESTORE_PROJECT_ID=$PROJECT_ID,GOOGLE_CLIENT_ID=YOUR_CLIENT_ID,RAPIDAPI_HOST=jsearch.p.rapidapi.com,MONGODB_DATABASE=lifeops,JWT_EXPIRE_MINUTES=10080" --set-secrets="MONGODB_URI=mongodb-uri:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_CLIENT_SECRET=google-oauth-secret:latest,RAPIDAPI_KEY=rapidapi-key:latest"
```

Copy the backend URL after deployment.

---

## Step 6: Deploy Frontend

### Update backend CORS first:
Edit `backend/app/main.py` and add your frontend URL to ALLOWED_ORIGINS.

### Build and push:
```bash
cd frontend
export FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/lifeops-repo/frontend:latest"
docker build --build-arg NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.run.app -t $FRONTEND_IMAGE .
docker push $FRONTEND_IMAGE
```

### Deploy:
```bash
gcloud run deploy lifeops-frontend --image=$FRONTEND_IMAGE --region=$REGION --platform=managed --allow-unauthenticated --memory=512Mi --cpu=1 --timeout=60
```

Copy the frontend URL.

---

## Step 7: Update Environment Variables

```bash
gcloud run services update lifeops-api --region=$REGION --update-env-vars="FRONTEND_URL=https://YOUR-FRONTEND-URL.run.app,GOOGLE_REDIRECT_URI=https://YOUR-BACKEND-URL.run.app/api/auth/google/callback"
```

Update OAuth redirect URI in GCP Console to match.

---

## Step 8: Test Deployment

1. Open frontend URL
2. Sign up / Sign in
3. Test document upload
4. Check Inbox, Career, Calendar, Budget

### View logs:
```bash
gcloud run services logs read lifeops-api --region=$REGION --limit=50
gcloud run services logs read lifeops-frontend --region=$REGION --limit=50
```

---

## Updating Deployment

### Backend:
```bash
cd backend
docker build -t $BACKEND_IMAGE .
docker push $BACKEND_IMAGE
gcloud run deploy lifeops-api --image=$BACKEND_IMAGE --region=$REGION
```

### Frontend:
```bash
cd frontend
docker build --build-arg NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-URL.run.app -t $FRONTEND_IMAGE .
docker push $FRONTEND_IMAGE
gcloud run deploy lifeops-frontend --image=$FRONTEND_IMAGE --region=$REGION
```

---

## Cost Optimization

```bash
# Limit max instances
gcloud run services update lifeops-api --max-instances=10 --region=$REGION
gcloud run services update lifeops-frontend --max-instances=10 --region=$REGION

# Scale to zero when idle
gcloud run services update lifeops-api --min-instances=0 --region=$REGION
gcloud run services update lifeops-frontend --min-instances=0 --region=$REGION
```

---

## Troubleshooting

**Backend won't start**: Check logs, verify secrets IAM
**Frontend can't reach backend**: Check CORS, verify NEXT_PUBLIC_API_URL
**Gmail OAuth fails**: Verify redirect URI, test users added
**Vertex AI issues**: Check API enabled, billing active

---

## Quick Reference

### Backend Environment Variables:
- GOOGLE_CLOUD_PROJECT
- VERTEX_LOCATION
- VERTEX_MODEL_NAME
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET (secret)
- GOOGLE_REDIRECT_URI
- JWT_SECRET (secret)
- FRONTEND_URL
- MONGODB_URI (secret)

### Frontend Build Args:
- NEXT_PUBLIC_API_URL

---

## Resources

- Cloud Run: https://cloud.google.com/run/docs
- Artifact Registry: https://cloud.google.com/artifact-registry/docs
- Secret Manager: https://cloud.google.com/secret-manager/docs
- Vertex AI: https://cloud.google.com/vertex-ai/docs
