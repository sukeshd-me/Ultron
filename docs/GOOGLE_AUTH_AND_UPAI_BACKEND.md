# ULTRON V1.0.8 — Google Authentication & UPAI Backend Architecture Guide
**UPAI Technologies**  
**Founder:** Sukesh D  
**Milestone:** V1.0.8 — Google Login & UPAI Cloud Run Backend Foundation

---

## 1. Overview & Architecture

ULTRON V1.0.8 introduces a native Google-only identity authentication system backed by an independent, deployable UPAI backend service:

`
                    GOOGLE
                      │
                 OAuth 2.0 (PKCE)
                      │
                      ▼
              ULTRON Electron (Main Process)
                      │
                      │ Authenticated Identity (Google sub + ID token)
                      ▼
              UPAI Backend API (Fastify on Cloud Run)
                      │
                      ▼
              Authenticated Application Session (upai_...)
                      │
                      ▼
              ULTRON Main Application (Encrypted via Windows DPAPI)
`

- **Native App Flow**: Uses RFC 7636 PKCE (Proof Key for Code Exchange) with SHA-256 code challenge and cryptographically secure state parameter.
- **Local Loopback**: Binds temporary HTTP server strictly to 127.0.0.1 on a random ephemeral port (or standard fallback range).
- **Decoupled Backend**: Fastify TypeScript service located in /backend, containerized for Google Cloud Run.
- **Renderer Security**: The Electron renderer never sees Google OAuth credentials, authorization codes, access tokens, or session secrets. Only a sanitized profile (userId, displayName, email, vatarUrl, plan) is exposed.

---

## 2. Google Cloud Project Setup

1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one (e.g., upai-ultron-prod).
3. Ensure the project is active and billing is enabled if planning to deploy to Cloud Run.

---

## 3. Google Auth Platform Configuration

1. In the Google Cloud Console, navigate to **APIs & Services** > **OAuth consent screen** (or **Google Auth Platform**).
2. Choose **External** user type (or **Internal** if restricted to a Google Workspace domain).
3. Fill in the required application details:
   - **App name**: ULTRON
   - **User support email**: Your support email address
   - **Developer contact information**: Your contact email address
4. **Scopes Configuration**:
   - Add only the minimum identity scopes:
     - openid (Associate you with your personal info on Google)
     - https://www.googleapis.com/auth/userinfo.email (See your primary Google Account email address)
     - https://www.googleapis.com/auth/userinfo.profile (See your personal info, including any personal info you have made publicly available)
   - **DO NOT** add sensitive scopes such as Gmail, Drive, Calendar, Contacts, or YouTube.
5. Save and proceed to the Summary.

---

## 4. Creating the Desktop OAuth Client

1. In **APIs & Services** > **Credentials**, click **Create Credentials** > **OAuth client ID**.
2. Select Application type: **Desktop app**.
3. Name: ULTRON Desktop Client.
4. Click **Create**.
5. Copy the generated **Client ID** (format: xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com).
   - *Note*: A client secret is not required for native Desktop PKCE public clients according to official Google OAuth 2.0 guidelines for installed applications.

---

## 5. Required Redirect URI Configuration

Google OAuth 2.0 for Native/Desktop applications automatically allows loopback IP redirect URIs with ephemeral ports:
- http://127.0.0.1:<port>
- http://localhost:<port>

ULTRON dynamically listens on 127.0.0.1 on an available port, executes the authorization request with edirect_uri=http://127.0.0.1:<port>, and closes the socket immediately upon code receipt.

---

## 6. Required Environment Variables

### Root Application (`.env` in repository root)
```env
# Google Cloud Console Desktop OAuth 2.0 Client ID
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

# Google Cloud Console Desktop OAuth 2.0 Client Secret (Local uncommitted only)
GOOGLE_CLIENT_SECRET=your_client_secret_here

# UPAI Backend Service URL Configuration:
# Development (Active ONLY during local development):
UPAI_BACKEND_DEV_URL=http://127.0.0.1:8080

# Production (Google Cloud Run HTTPS endpoint - REQUIRED for production builds):
# Must NOT be localhost, 127.0.0.1, or laptop IP
UPAI_BACKEND_PROD_URL=https://upai-auth-REPLACE_WITH_CLOUD_RUN_URL.a.run.app
```

### Backend Application (ackend/.env)
`env
# Service port (Google Cloud Run injects PORT automatically)
PORT=8080
NODE_ENV=development

# Google OAuth 2.0 Client ID (Audience validation)
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com

# Session secret (minimum 32 characters for HMAC signing)
SESSION_SECRET=a_very_long_secure_random_string_32_chars_or_more

# CORS allowed origins
CORS_ORIGIN=*
`

---

## 7. How to Run the UPAI Backend Locally

1. Open a terminal in the ackend/ directory:
   `ash
   cd backend
   npm install
   `
2. Build the TypeScript service:
   `ash
   npm run build
   `
3. Start the service:
   `ash
   npm start
   `
4. Verify server health:
   `ash
   curl http://127.0.0.1:8080/health
   # Returns: { status:ok,service:upai-auth}
   `

---

## 8. How to Run ULTRON with the Backend

1. Ensure the UPAI backend is running on http://127.0.0.1:8080 (or UPAI_BACKEND_URL points to your deployed Cloud Run URL).
2. Configure your root .env:
   `env
   GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   UPAI_BACKEND_URL=http://127.0.0.1:8080
   `
3. In the root directory, launch ULTRON:
   `ash
   npm run dev
   `
4. On launch, ULTRON verifies session status:
   - If no valid session exists, the minimalist black Google Login screen appears.
   - Clicking **Continue with Google** opens the default browser to authenticate.
   - Upon completion, the system transitions smoothly to the ULTRON main interface.

---

## 9. How to Deploy the Backend to Google Cloud Run (via Google Artifact Registry)

The backend is configured for deployment using modern **Google Artifact Registry** (replacing the legacy `gcr.io` registry):

- **Google Cloud Project**: `ultron-upai-technologies`
- **Region**: `us-central1`
- **Artifact Registry Repository**: `upai-services`
- **Container Image**: `us-central1-docker.pkg.dev/ultron-upai-technologies/upai-services/upai-auth:latest`

### Automated Deployment Scripts
Inside the `backend/` directory, automated deployment scripts are provided:
- Linux / macOS / Cloud Shell: [`backend/deploy-cloudrun.sh`](file:///c:/Users/Sukesh%20D/Desktop/ULTRON/backend/deploy-cloudrun.sh)
- Windows PowerShell: [`backend/deploy-cloudrun.ps1`](file:///c:/Users/Sukesh%20D/Desktop/ULTRON/backend/deploy-cloudrun.ps1)

### Manual Step-by-Step Instructions

1. **Authenticate and Enable Required Google Cloud APIs**:
   ```bash
   gcloud auth login
   gcloud config set project ultron-upai-technologies

   gcloud services enable \
     artifactregistry.googleapis.com \
     run.googleapis.com \
     cloudbuild.googleapis.com \
     secretmanager.googleapis.com \
     --project ultron-upai-technologies
   ```

2. **Create the Artifact Registry Docker Repository**:
   ```bash
   gcloud artifacts repositories create upai-services \
     --project=ultron-upai-technologies \
     --repository-format=docker \
     --location=us-central1 \
     --description="UPAI Technologies Container Repository"
   ```

3. **Build & Submit Container Image via Google Cloud Build**:
   ```bash
   cd backend
   gcloud builds submit \
     --project=ultron-upai-technologies \
     --tag=us-central1-docker.pkg.dev/ultron-upai-technologies/upai-services/upai-auth:latest \
     .
   ```

4. **Configure Secure Session Secret (Google Secret Manager)**:
   *Do NOT commit secrets to Git or pass them in shell history.*
   ```bash
   # Generate and store a secure 64-character random session secret
   openssl rand -hex 32 | gcloud secrets create upai-session-secret \
     --project=ultron-upai-technologies \
     --replication-policy="automatic" \
     --data-file=-

   # Grant Cloud Run service account access to read the secret
   PROJECT_NUM=$(gcloud projects describe ultron-upai-technologies --format="value(projectNumber)")
   gcloud secrets add-iam-policy-binding upai-session-secret \
     --project=ultron-upai-technologies \
     --member="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

5. **Deploy the Service to Google Cloud Run**:
   ```bash
   gcloud run deploy upai-auth \
     --project=ultron-upai-technologies \
     --image=us-central1-docker.pkg.dev/ultron-upai-technologies/upai-services/upai-auth:latest \
     --platform=managed \
     --region=us-central1 \
     --allow-unauthenticated \
     --set-env-vars="NODE_ENV=production,GOOGLE_CLIENT_ID=432955561394-pn24e4q82fqqo57ek45tvkjdjdb3dfuk.apps.googleusercontent.com,CORS_ORIGIN=*" \
     --set-secrets="SESSION_SECRET=upai-session-secret:latest"
   ```

6. **Verify the Live Service Health Check**:
   ```bash
   curl https://<YOUR_DEPLOYED_SERVICE_URL>/health
   # Must return: {"status":"ok","service":"upai-auth"}
   ```

7. **Configure ULTRON Production Backend**:
   Update `UPAI_BACKEND_PROD_URL` in your production environment / `.env`:
   ```env
   UPAI_BACKEND_PROD_URL=https://<YOUR_DEPLOYED_SERVICE_URL>
   ```

---

## 10. Why Firebase is NOT Used

Firebase was explicitly prohibited and excluded for architectural and ownership reasons:
1. **Vendor Lock-in & Complexity**: Firebase client SDKs introduce heavy background listeners, Analytics, and opaque token managers unsuitable for a native desktop application.
2. **Standard Native Desktop OAuth Compliance**: Google's official native application recommendation is OAuth 2.0 PKCE over loopback, which grants full control over cryptographic verifiers, token exchange, and local security.
3. **Sovereign Backend Architecture**: The UPAI backend requires independent API control, custom session lifecycles, and Cloud Run portability without dependency on Firebase Auth server emulators or Firebase Admin SDKs.

---

## 11. Current In-Memory Development Storage & Future Database Migration

### Current Architecture (InMemoryAccountRepository)
In accordance with milestone specifications, **no database dependencies** (PostgreSQL, Cloud SQL, SQLite) are attached to the cloud backend at this stage.

- All accounts and active sessions are held in InMemoryAccountRepository in ackend/src/auth/account.repository.ts.
- The repository is explicitly demarcated as DEVELOPMENT AUTH STORAGE.
- Fast lookups are keyed by Google sub identifier (googleSubjectId) rather than email, preserving user identity stability across email address changes.

### Future PostgreSQL Migration Plan
When persistent storage is integrated in a subsequent milestone:
1. Implement PostgresAccountRepository implements AccountRepository:
   - Connect via pg or Prisma / Kysely to Cloud SQL (PostgreSQL).
   - Create tables:
     `sql
     CREATE TABLE users (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       google_subject_id VARCHAR(255) UNIQUE NOT NULL,
       email VARCHAR(255) NOT NULL,
       display_name VARCHAR(255) NOT NULL,
       avatar_url TEXT,
       plan VARCHAR(50) DEFAULT 'FREE',
       created_at TIMESTAMPTZ DEFAULT NOW(),
       last_login_at TIMESTAMPTZ DEFAULT NOW()
     );

     CREATE TABLE sessions (
       token VARCHAR(255) PRIMARY KEY,
       user_id UUID REFERENCES users(id) ON DELETE CASCADE,
       expires_at TIMESTAMPTZ NOT NULL,
       created_at TIMESTAMPTZ DEFAULT NOW()
     );
     `
2. Replace 
ew InMemoryAccountRepository() in ackend/src/services/auth.service.ts with 
ew PostgresAccountRepository(dbPool).
3. **Zero changes** will be required in the Electron client, preload script, IPC handlers, or renderer UI.
