# LifeOps Copilot - Full Deployment with MongoDB
# Run this in PowerShell

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Green
Write-Host "LifeOps Copilot - Full Deployment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Project Configuration
$PROJECT_ID = "totemic-arcana-492318-b3"
$REGION = "us-central1"
$REPO_NAME = "lifeops-repo"

Write-Host "Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "Region: $REGION" -ForegroundColor Cyan
Write-Host "Database: MongoDB Atlas (persistent storage)" -ForegroundColor Cyan
Write-Host ""

# Verify tools
Write-Host "Checking gcloud..." -ForegroundColor Yellow
$gloudVersion = gcloud --version 2>&1 | Select-Object -First 1
Write-Host "OK $gloudVersion" -ForegroundColor Green

Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerVersion = docker --version
Write-Host "OK $dockerVersion" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Step 1: Enable APIs" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com aiplatform.googleapis.com gmail.googleapis.com firestore.googleapis.com storage.googleapis.com --project=$PROJECT_ID
Write-Host "OK APIs enabled" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Step 2: Create Artifact Registry" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$repoOutput = gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --description="LifeOps Docker images" --project=$PROJECT_ID 2>&1
if ($repoOutput -like "*ALREADY_EXISTS*") {
    Write-Host "OK Repository already exists" -ForegroundColor Yellow
} elseif ($LASTEXITCODE -eq 0) {
    Write-Host "OK Repository created" -ForegroundColor Green
} else {
    Write-Host "OK Repository ready" -ForegroundColor Yellow
}

gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
Write-Host "OK Docker configured" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Step 3: Create Secrets" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# MongoDB URI
Write-Host "Setting up MongoDB secret..." -ForegroundColor Yellow
$mongoUri = "mongodb+srv://nishitpatel72834_db_user:4a0PFn3r31gnjvY1@m0.cc8520b.mongodb.net/lifeops?appName=M0"
$secretOutput = echo $mongoUri | gcloud secrets create mongodb-uri --data-file=- --project=$PROJECT_ID 2>&1
if ($secretOutput -like "*ALREADY_EXISTS*") {
    echo $mongoUri | gcloud secrets versions add mongodb-uri --data-file=- --project=$PROJECT_ID 2>&1 | Out-Null
}
Write-Host "OK MongoDB URI configured" -ForegroundColor Green

# JWT Secret
Write-Host "Setting up JWT secret..." -ForegroundColor Yellow
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
$secretOutput = echo $jwtSecret | gcloud secrets create jwt-secret --data-file=- --project=$PROJECT_ID 2>&1
if ($secretOutput -like "*ALREADY_EXISTS*") {
    echo $jwtSecret | gcloud secrets versions add jwt-secret --data-file=- --project=$PROJECT_ID 2>&1 | Out-Null
}
Write-Host "OK JWT secret configured" -ForegroundColor Green

# Google OAuth
Write-Host "Setting up OAuth secret..." -ForegroundColor Yellow
$oauthSecret = Read-Host "Enter your Google OAuth Client Secret"
$secretOutput = echo $oauthSecret | gcloud secrets create google-oauth-secret --data-file=- --project=$PROJECT_ID 2>&1
if ($secretOutput -like "*ALREADY_EXISTS*") {
    echo $oauthSecret | gcloud secrets versions add google-oauth-secret --data-file=- --project=$PROJECT_ID 2>&1 | Out-Null
}
Write-Host "OK OAuth secret configured" -ForegroundColor Green

# RapidAPI
Write-Host "Setting up RapidAPI secret..." -ForegroundColor Yellow
$rapidApiKey = Read-Host "Enter your RapidAPI key"
$secretOutput = echo $rapidApiKey | gcloud secrets create rapidapi-key --data-file=- --project=$PROJECT_ID 2>&1
if ($secretOutput -like "*ALREADY_EXISTS*") {
    echo $rapidApiKey | gcloud secrets versions add rapidapi-key --data-file=- --project=$PROJECT_ID 2>&1 | Out-Null
}
Write-Host "OK RapidAPI secret configured" -ForegroundColor Green

# Grant access to secrets
Write-Host "Granting Cloud Run access to secrets..." -ForegroundColor Yellow
$projectNumber = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
$serviceAccount = "$projectNumber-compute@developer.gserviceaccount.com"

$secrets = @("mongodb-uri", "jwt-secret", "google-oauth-secret", "rapidapi-key")
foreach ($secret in $secrets) {
    gcloud secrets add-iam-policy-binding $secret --member="serviceAccount:$serviceAccount" --role="roles/secretmanager.secretAccessor" --project=$PROJECT_ID --quiet 2>&1 | Out-Null
}
Write-Host "OK Secrets accessible" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Step 4: Deploy Backend" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Set-Location backend
$backendImage = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/backend:latest"

Write-Host "Building backend Docker image..." -ForegroundColor Yellow
docker build -t $backendImage .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR Docker build failed" -ForegroundColor Red
    Write-Host "Check the error above and try again" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "OK Backend built" -ForegroundColor Green

Write-Host "Pushing to Artifact Registry..." -ForegroundColor Yellow
docker push $backendImage
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR Docker push failed" -ForegroundColor Red
    Write-Host "Check the error above and try again" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "OK Backend pushed" -ForegroundColor Green

Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy lifeops-api --image=$backendImage --region=$REGION --platform=managed --allow-unauthenticated --memory=1Gi --cpu=1 --timeout=300 --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,VERTEX_LOCATION=$REGION,VERTEX_MODEL_NAME=gemini-2.5-flash,FIRESTORE_PROJECT_ID=$PROJECT_ID,GCS_BUCKET_NAME=sparkup-uploads,GOOGLE_CLIENT_ID=$env:GOOGLE_CLIENT_ID,RAPIDAPI_HOST=jsearch.p.rapidapi.com,MONGODB_DATABASE=lifeops,JWT_EXPIRE_MINUTES=10080" --set-secrets="MONGODB_URI=mongodb-uri:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_CLIENT_SECRET=google-oauth-secret:latest,RAPIDAPI_KEY=rapidapi-key:latest" --project=$PROJECT_ID

$backendUrl = gcloud run services describe lifeops-api --region=$REGION --format="value(status.url)" --project=$PROJECT_ID
Write-Host ""
Write-Host "OK Backend deployed: $backendUrl" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Step 5: Deploy Frontend" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Set-Location frontend
$frontendImage = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/frontend:latest"

Write-Host "Building frontend Docker image..." -ForegroundColor Yellow
docker build --build-arg NEXT_PUBLIC_API_URL=$backendUrl -t $frontendImage .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR Docker build failed" -ForegroundColor Red
    Write-Host "Check the error above and try again" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "OK Frontend built" -ForegroundColor Green

Write-Host "Pushing to Artifact Registry..." -ForegroundColor Yellow
docker push $frontendImage
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR Docker push failed" -ForegroundColor Red
    Write-Host "Check the error above and try again" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "OK Frontend pushed" -ForegroundColor Green

Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy lifeops-frontend --image=$frontendImage --region=$REGION --platform=managed --allow-unauthenticated --memory=512Mi --cpu=1 --timeout=60 --project=$PROJECT_ID

$frontendUrl = gcloud run services describe lifeops-frontend --region=$REGION --format="value(status.url)" --project=$PROJECT_ID
Write-Host ""
Write-Host "OK Frontend deployed: $frontendUrl" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Step 6: Update Backend Config" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host "Updating backend environment variables..." -ForegroundColor Yellow
gcloud run services update lifeops-api --region=$REGION --update-env-vars="FRONTEND_URL=$frontendUrl,GOOGLE_REDIRECT_URI=$backendUrl/api/auth/google/callback" --project=$PROJECT_ID
Write-Host "OK Backend updated" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  $backendUrl" -ForegroundColor Cyan
Write-Host "Frontend: $frontendUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Update OAuth redirect URI at:" -ForegroundColor White
Write-Host "   https://console.cloud.google.com/apis/credentials" -ForegroundColor Cyan
Write-Host "   Add: $backendUrl/api/auth/google/callback" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Update backend CORS in backend/app/main.py:" -ForegroundColor White
Write-Host "   Add '$frontendUrl' to ALLOWED_ORIGINS" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test: $frontendUrl" -ForegroundColor Cyan
Write-Host ""
