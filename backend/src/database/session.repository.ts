// backend/src/database/session.repository.ts — Secure Session Storage
import { Session } from '../types/index.js'
import { getFirestore } from './firestore.js'
import { config } from '../config.js'

export interface SessionRepository {
  createSession(session: Session): Promise<Session>
  findSessionByTokenHash(tokenHash: string): Promise<Session | null>
  deleteSession(tokenHash: string): Promise<boolean>
  deleteUserSessions(userId: string): Promise<void>
  cleanupExpiredSessions(): Promise<number>
}

/**
 * Firestore Persistent Session Implementation
 * Stores session documents under collection 'sessions/{sessionId}'.
 * Note: Raw tokens are NEVER stored; only SHA-256 hashes (sessionTokenHash) are stored.
 */
export class FirestoreSessionRepository implements SessionRepository {
  private collectionName = 'sessions'

  private getDb() {
    const db = getFirestore()
    if (!db) {
      throw new Error('Firestore is not available for session management')
    }
    return db
  }

  async createSession(session: Session): Promise<Session> {
    const docRef = this.getDb().collection(this.collectionName).doc(session.sessionId)
    await docRef.set({
      sessionId: session.sessionId,
      sessionTokenHash: session.sessionTokenHash,
      userId: session.userId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    })
    return { ...session }
  }

  async findSessionByTokenHash(tokenHash: string): Promise<Session | null> {
    const snapshot = await this.getDb()
      .collection(this.collectionName)
      .where('sessionTokenHash', '==', tokenHash)
      .limit(1)
      .get()

    if (snapshot.empty) return null
    const data = snapshot.docs[0].data() as Session

    // Check expiration
    if (Date.now() > data.expiresAt) {
      await snapshot.docs[0].ref.delete()
      return null
    }

    return data
  }

  async deleteSession(tokenHash: string): Promise<boolean> {
    const snapshot = await this.getDb()
      .collection(this.collectionName)
      .where('sessionTokenHash', '==', tokenHash)
      .get()

    if (snapshot.empty) return false
    const batch = this.getDb().batch()
    snapshot.docs.forEach((doc: any) => batch.delete(doc.ref))
    await batch.commit()
    return true
  }

  async deleteUserSessions(userId: string): Promise<void> {
    const snapshot = await this.getDb()
      .collection(this.collectionName)
      .where('userId', '==', userId)
      .get()

    if (snapshot.empty) return
    const batch = this.getDb().batch()
    snapshot.docs.forEach((doc: any) => batch.delete(doc.ref))
    await batch.commit()
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = Date.now()
    const snapshot = await this.getDb()
      .collection(this.collectionName)
      .where('expiresAt', '<', now)
      .get()

    if (snapshot.empty) return 0
    const batch = this.getDb().batch()
    snapshot.docs.forEach((doc: any) => batch.delete(doc.ref))
    await batch.commit()
    return snapshot.size
  }
}

/**
 * In-Memory Session Implementation
 * Used for automated testing and local fallback.
 */
export class InMemorySessionRepository implements SessionRepository {
  // Key: sessionTokenHash -> Session
  private sessions = new Map<string, Session>()

  async createSession(session: Session): Promise<Session> {
    this.sessions.set(session.sessionTokenHash, { ...session })
    return { ...session }
  }

  async findSessionByTokenHash(tokenHash: string): Promise<Session | null> {
    const session = this.sessions.get(tokenHash)
    if (!session) return null

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(tokenHash)
      return null
    }

    return { ...session }
  }

  async deleteSession(tokenHash: string): Promise<boolean> {
    return this.sessions.delete(tokenHash)
  }

  async deleteUserSessions(userId: string): Promise<void> {
    for (const [hash, s] of this.sessions.entries()) {
      if (s.userId === userId) {
        this.sessions.delete(hash)
      }
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = Date.now()
    let count = 0
    for (const [hash, s] of this.sessions.entries()) {
      if (s.expiresAt < now) {
        this.sessions.delete(hash)
        count++
      }
    }
    return count
  }

  clear(): void {
    this.sessions.clear()
  }
}

export function createSessionRepository(): SessionRepository {
  if (config.useInMemoryRepo || !config.firebaseProjectId) {
    return new InMemorySessionRepository()
  }
  return new FirestoreSessionRepository()
}

export const sessionRepository = createSessionRepository()
