# Google Cloud Run Deployment for Windows PowerShell
$ErrorActionPreference = "Stop"

$ProjectId = "ultron-upai-technologies"
$Region = "us-central1"
$RepoName = "upai-services"
$ServiceName = "upai-auth"
$ImagePath = "${Region}-docker.pkg.dev/${ProjectId}/${RepoName}/${ServiceName}:latest"
$ClientId = "432955561394-pn24e4q82fqqo57ek45tvkjdjdb3dfuk.apps.googleusercontent.com"

Write-Host "=== 1. Ensuring Required Google Cloud APIs are Enabled ===" -ForegroundColor Cyan
gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com --project=$ProjectId

Write-Host "=== 2. Creating Artifact Registry Repository ===" -ForegroundColor Cyan
try { gcloud artifacts repositories create $RepoName --project=$ProjectId --repository-format=docker --location=$Region --description="UPAI Technologies Container Repository" } catch {}

Write-Host "=== 3. Submitting Container Image to Cloud Build with Artifact Registry ===" -ForegroundColor Cyan
$BackendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
gcloud builds submit --project=$ProjectId --tag=$ImagePath $BackendDir

Write-Host "=== 4. Setting up Session Secret in Secret Manager ===" -ForegroundColor Cyan
try {
    gcloud secrets describe upai-session-secret --project=$ProjectId 2>$null
} catch {
    Write-Host "Generating secure session secret in Google Secret Manager..." -ForegroundColor Yellow
    $bytes = New-Object byte[] 32
    (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    $secretHex = [System.BitConverter]::ToString($bytes).Replace("-", "").ToLower()
    $secretHex | gcloud secrets create upai-session-secret --project=$ProjectId --replication-policy="automatic" --data-file=-

    $projectNum = (gcloud projects describe $ProjectId --format='value(projectNumber)').Trim()
    gcloud secrets add-iam-policy-binding upai-session-secret --project=$ProjectId --member="serviceAccount:$projectNum-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
}

Write-Host "=== 5. Deploying to Google Cloud Run ===" -ForegroundColor Cyan
gcloud run deploy $ServiceName --project=$ProjectId --image=$ImagePath --platform=managed --region=$Region --allow-unauthenticated --set-env-vars=NODE_ENV=production,GOOGLE_CLIENT_ID=$ClientId,CORS_ORIGIN=* --set-secrets=SESSION_SECRET=upai-session-secret:latest

$ServiceUrl = (gcloud run services describe $ServiceName --project=$ProjectId --region=$Region --format='value(status.url)').Trim()
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host "Service URL: $ServiceUrl" -ForegroundColor Green
Write-Host "Health Check: $ServiceUrl/health" -ForegroundColor Green
Write-Host "Configure ULTRON: UPAI_BACKEND_PROD_URL=$ServiceUrl" -ForegroundColor Green
