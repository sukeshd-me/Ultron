#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="ultron-upai-technologies"
REGION="us-central1"
REPO_NAME="upai-services"
SERVICE_NAME="upai-auth"
IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${SERVICE_NAME}:latest"
GOOGLE_CLIENT_ID="432955561394-pn24e4q82fqqo57ek45tvkjdjdb3dfuk.apps.googleusercontent.com"

echo "=== 1. Ensuring Required Google Cloud APIs are Enabled ==="
gcloud services enable artifactregistry.googleapis.com run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com --project="${PROJECT_ID}"

echo "=== 2. Creating Artifact Registry Repository ==="
gcloud artifacts repositories create "${REPO_NAME}" --project="${PROJECT_ID}" --repository-format=docker --location="${REGION}" --description="UPAI Technologies Docker Repository" || true

echo "=== 3. Submitting Container Image to Cloud Build ==="
gcloud builds submit --project="${PROJECT_ID}" --tag="${IMAGE_PATH}" "$(dirname "$0")"

echo "=== 4. Setting up Session Secret in Secret Manager ==="
if ! gcloud secrets describe upai-session-secret --project="${PROJECT_ID}" >/dev/null 2>&1; then
  openssl rand -hex 32 | gcloud secrets create upai-session-secret --project="${PROJECT_ID}" --replication-policy="automatic" --data-file=-
  PROJECT_NUM=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
  gcloud secrets add-iam-policy-binding upai-session-secret --project="${PROJECT_ID}" --member="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
fi

echo "=== 5. Deploying to Google Cloud Run ==="
gcloud run deploy "${SERVICE_NAME}" --project="${PROJECT_ID}" --image="${IMAGE_PATH}" --platform=managed --region="${REGION}" --allow-unauthenticated --set-env-vars="NODE_ENV=production,GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID},CORS_ORIGIN=*" --set-secrets="SESSION_SECRET=upai-session-secret:latest"

SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --project="${PROJECT_ID}" --region="${REGION}" --format="value(status.url)")
echo "=== Deployment Complete ==="
echo "Service URL: ${SERVICE_URL}"
echo "Health Check: ${SERVICE_URL}/health"
echo "Configure ULTRON: UPAI_BACKEND_PROD_URL=${SERVICE_URL}"
