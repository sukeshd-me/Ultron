// backend/src/config.ts — UPAI Backend Configuration
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env') })
dotenv.config({ path: path.join(process.cwd(), 'backend/.env') })
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config()

export interface AppConfig {
  port: number
  host: string
  nodeEnv: string
  googleClientId: string
  sessionSecret: string
  sessionTtlSeconds: number
  corsOrigin: string | string[]
  firebaseProjectId: string
  googleApplicationCredentials?: string
  useInMemoryRepo: boolean
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-change-in-production-64chars',
  sessionTtlSeconds: parseInt(process.env.SESSION_TTL_SECONDS || '2592000', 10), // 30 days
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  firebaseProjectId: (process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || '').trim(),
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  useInMemoryRepo: process.env.USE_IN_MEMORY_REPO === 'true' || process.env.NODE_ENV === 'test'
}
