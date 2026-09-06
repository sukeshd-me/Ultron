// src/main/config/upai-backend.config.ts — Authoritative UPAI Backend Configuration
import { app } from 'electron'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Ensure local environment variables are loaded
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config()

/**
 * Explicit placeholder for production Google Cloud Run service URL.
 * Update this with the real URL after running 'gcloud run deploy upai-auth'.
 */
export const UPAI_CLOUD_RUN_PLACEHOLDER = 'https://upai-auth-REPLACE_WITH_CLOUD_RUN_URL.a.run.app'

/**
 * Checks whether a given URL points to localhost, loopback, or private host.
 */
export function isLocalhostUrl(rawUrl: string): boolean {
  if (!rawUrl) return false
  try {
    const parsed = new URL(rawUrl)
    const hostname = parsed.hostname.toLowerCase()
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.endsWith('.local')
    )
  } catch {
    return false
  }
}

/**
 * Returns the single authoritative UPAI backend URL based on execution environment:
 *
 * - DEVELOPMENT (!app.isPackaged && NODE_ENV !== 'production'):
 *   Supports local backend on localhost / 127.0.0.1 for explicit developer testing.
 *
 * - PRODUCTION (app.isPackaged || NODE_ENV === 'production'):
 *   Connects STRICTLY to the deployed Google Cloud Run HTTPS service.
 *   Throws an error if pointed to localhost or unencrypted HTTP.
 */
export function getUpaiBackendUrl(): string {
  let isPackaged = false
  try {
    isPackaged = app?.isPackaged ?? false
  } catch {
    isPackaged = false
  }

  const isExplicitDev = !isPackaged && process.env.NODE_ENV !== 'production'

  if (isExplicitDev) {
    // Development mode: Allow local laptop backend for development
    const devUrl =
      (process.env.UPAI_BACKEND_DEV_URL || process.env.UPAI_BACKEND_URL || 'http://127.0.0.1:8080').trim()
    return devUrl.replace(/\/$/, '')
  }

  // PRODUCTION MODE:
  // Check production environment variable UPAI_BACKEND_PROD_URL or UPAI_BACKEND_URL
  const prodCandidate = (process.env.UPAI_BACKEND_PROD_URL || process.env.UPAI_BACKEND_URL || '').trim()

  if (!prodCandidate || prodCandidate === UPAI_CLOUD_RUN_PLACEHOLDER) {
    throw new Error(
      'UPAI Cloud Run backend URL is not configured. Please set UPAI_BACKEND_PROD_URL in your environment to your deployed Google Cloud Run HTTPS service URL.'
    )
  }

  // Strict architectural guard: laptop/localhost must NEVER act as production backend
  if (isLocalhostUrl(prodCandidate)) {
    throw new Error(
      `Architectural Guard Violation: Production ULTRON cannot use a local laptop (${prodCandidate}) as the backend. The backend must be deployed to Google Cloud Run.`
    )
  }

  // Enforce HTTPS for production Cloud Run endpoint
  if (!prodCandidate.startsWith('https://')) {
    throw new Error(
      `Production Security Violation: Cloud Run backend URL must use HTTPS (${prodCandidate}).`
    )
  }

  return prodCandidate.replace(/\/$/, '')
}

/**
 * Returns backend environment metadata for diagnostics.
 */
export function getBackendEnvironmentMetadata(): {
  isProduction: boolean
  isCloudRun: boolean
  isLocalhost: boolean
  url: string
} {
  let isPackaged = false
  try {
    isPackaged = app?.isPackaged ?? false
  } catch {
    isPackaged = false
  }

  const isProduction = isPackaged || process.env.NODE_ENV === 'production'

  try {
    const url = getUpaiBackendUrl()
    const isLocalhost = isLocalhostUrl(url)
    const isCloudRun = url.includes('.run.app') || (!isLocalhost && url.startsWith('https://'))

    return {
      isProduction,
      isCloudRun,
      isLocalhost,
      url
    }
  } catch (err: any) {
    return {
      isProduction,
      isCloudRun: false,
      isLocalhost: false,
      url: `Error: ${err?.message || 'Configuration error'}`
    }
  }
}
