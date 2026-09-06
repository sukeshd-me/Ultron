// backend/src/database/firestore.ts — Firebase Firestore Connection & Lifecycle
import { initializeApp, getApps, cert, AppOptions } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore, Firestore } from 'firebase-admin/firestore'
import * as fs from 'fs'
import * as path from 'path'
import { config } from '../config.js'

let firestoreInstance: Firestore | null = null
let initAttempted = false
let initError: string | null = null

/**
 * Initializes and returns the Firestore database instance.
 * Returns null if Firebase is unconfigured or fails to initialize.
 */
export function getFirestore(): Firestore | null {
  if (firestoreInstance) {
    return firestoreInstance
  }

  if (initAttempted && initError) {
    return null
  }

  initAttempted = true

  try {
    const existingApps = getApps()
    if (existingApps.length > 0 && existingApps[0]) {
      firestoreInstance = getAdminFirestore(existingApps[0])
      return firestoreInstance
    }

    const projectId = config.firebaseProjectId

    // Check if any credentials or project ID are provided
    if (!projectId && !config.googleApplicationCredentials) {
      initError =
        'Firebase Firestore is not configured. Set FIREBASE_PROJECT_ID or GOOGLE_APPLICATION_CREDENTIALS in backend/.env'
      console.warn('[Firestore] Notice: ' + initError)
      return null
    }

    const appOptions: AppOptions = {}
    if (projectId) {
      appOptions.projectId = projectId
    }

    if (config.googleApplicationCredentials) {
      try {
        let credPath = config.googleApplicationCredentials
        if (!fs.existsSync(credPath)) {
          const candidate1 = path.resolve(process.cwd(), 'backend', credPath)
          const candidate2 = path.resolve(__dirname, '../../', credPath)
          const candidate3 = path.resolve(__dirname, '../', credPath)
          if (fs.existsSync(candidate1)) {
            credPath = candidate1
          } else if (fs.existsSync(candidate2)) {
            credPath = candidate2
          } else if (fs.existsSync(candidate3)) {
            credPath = candidate3
          }
        }

        if (fs.existsSync(credPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'))
          appOptions.credential = cert(serviceAccount)
          console.log('[Firestore] Successfully loaded service account credentials from ' + credPath)
        } else {
          console.warn('[Firestore] Could not find credentials file at ' + config.googleApplicationCredentials)
        }
      } catch (err: any) {
        console.warn(
          '[Firestore] Could not load credentials from ' +
            config.googleApplicationCredentials +
            ': ' +
            err.message
        )
      }
    }

    const app = initializeApp(appOptions)
    firestoreInstance = getAdminFirestore(app)
    firestoreInstance.settings({ ignoreUndefinedProperties: true })

    console.log('[Firestore] Initialized Firestore client for project: ' + (projectId || 'default-adc'))
    return firestoreInstance
  } catch (err: any) {
    initError = err.message || 'Unknown Firestore initialization error'
    console.warn('[Firestore] Failed to initialize Firebase Admin SDK: ' + initError)
    return null
  }
}

/**
 * Checks whether Firestore configuration is provided.
 */
export function isFirestoreConfigured(): boolean {
  return Boolean(config.firebaseProjectId || config.googleApplicationCredentials)
}

/**
 * Checks if Firestore is currently initialized and responsive.
 */
export async function isFirestoreConnected(): Promise<boolean> {
  const db = getFirestore()
  if (!db) return false

  try {
    await db.collection('_health').doc('ping').get()
    return true
  } catch {
    return false
  }
}

export function getFirestoreInitError(): string | null {
  return initError
}
