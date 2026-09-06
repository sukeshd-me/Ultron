// backend/src/database/account.repository.ts — UPAI Account Repository
import { User } from '../types/index.js'
import { getFirestore } from './firestore.js'
import { config } from '../config.js'

export interface AccountRepository {
  findUserById(userId: string): Promise<User | null>
  findUserByGoogleSub(googleSub: string): Promise<User | null>
  findUserByGoogleSubjectId(googleSub: string): Promise<User | null>
  findUserByEmail(email: string): Promise<User | null>
  createUser(user: User): Promise<User>
  updateUser(userId: string, updates: Partial<User>): Promise<User | null>
}

/**
 * Firestore Persistent Implementation
 * Stores user documents in collection 'users/{upaiUserId}'.
 */
export class FirestoreAccountRepository implements AccountRepository {
  private collectionName = 'users'

  private getDb() {
    const db = getFirestore()
    if (!db) {
      throw new Error(
        'Firestore is not available. Please verify FIREBASE_PROJECT_ID in backend/.env'
      )
    }
    return db
  }

  async findUserById(userId: string): Promise<User | null> {
    const doc = await this.getDb().collection(this.collectionName).doc(userId).get()
    if (!doc.exists) return null
    return this.mapDocToUser(doc.data())
  }

  async findUserByGoogleSub(googleSub: string): Promise<User | null> {
    const snapshot = await this.getDb()
      .collection(this.collectionName)
      .where('googleSub', '==', googleSub)
      .limit(1)
      .get()

    if (snapshot.empty) return null
    return this.mapDocToUser(snapshot.docs[0].data())
  }

  async findUserByGoogleSubjectId(googleSub: string): Promise<User | null> {
    return this.findUserByGoogleSub(googleSub)
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const snapshot = await this.getDb()
      .collection(this.collectionName)
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get()

    if (snapshot.empty) return null
    return this.mapDocToUser(snapshot.docs[0].data())
  }

  async createUser(user: User): Promise<User> {
    const docRef = this.getDb().collection(this.collectionName).doc(user.upaiUserId)
    const dataToSave = {
      upaiUserId: user.upaiUserId,
      userId: user.userId,
      googleSub: user.googleSub,
      googleSubjectId: user.googleSubjectId,
      email: user.email.toLowerCase(),
      displayName: user.displayName,
      photoUrl: user.photoUrl || user.avatarUrl || null,
      avatarUrl: user.avatarUrl || user.photoUrl || null,
      plan: user.plan || 'free',
      status: user.status || 'active',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt || user.createdAt,
      lastLoginAt: user.lastLoginAt,
      subscriptionStatus: user.subscriptionStatus || 'NONE'
    }

    await docRef.set(dataToSave)
    return { ...user }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const docRef = this.getDb().collection(this.collectionName).doc(userId)
    const existing = await docRef.get()
    if (!existing.exists) return null

    const dataToUpdate: any = {
      ...updates,
      updatedAt: new Date().toISOString()
    }

    if (updates.email) {
      dataToUpdate.email = updates.email.toLowerCase()
    }
    if (updates.photoUrl) {
      dataToUpdate.avatarUrl = updates.photoUrl
    }
    if (updates.avatarUrl) {
      dataToUpdate.photoUrl = updates.avatarUrl
    }

    await docRef.update(dataToUpdate)
    const refreshed = await docRef.get()
    return this.mapDocToUser(refreshed.data())
  }

  private mapDocToUser(data: any): User {
    return {
      upaiUserId: data.upaiUserId || data.userId,
      userId: data.userId || data.upaiUserId,
      googleSub: data.googleSub || data.googleSubjectId,
      googleSubjectId: data.googleSubjectId || data.googleSub,
      email: data.email,
      displayName: data.displayName,
      photoUrl: data.photoUrl || data.avatarUrl,
      avatarUrl: data.avatarUrl || data.photoUrl,
      plan: data.plan || 'free',
      status: data.status || 'active',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt || data.createdAt,
      lastLoginAt: data.lastLoginAt,
      subscriptionStatus: data.subscriptionStatus || 'NONE',
      billingCustomerId: data.billingCustomerId,
      entitlements: data.entitlements
    }
  }
}

/**
 * In-Memory Mock Implementation
 * Used for automated unit tests and local offline fallback.
 */
export class InMemoryAccountRepository implements AccountRepository {
  private users = new Map<string, User>()
  private googleSubIndex = new Map<string, string>()
  private emailIndex = new Map<string, string>()

  async findUserById(userId: string): Promise<User | null> {
    const u = this.users.get(userId)
    return u ? { ...u } : null
  }

  async findUserByGoogleSub(googleSub: string): Promise<User | null> {
    const userId = this.googleSubIndex.get(googleSub)
    if (!userId) return null
    return this.findUserById(userId)
  }

  async findUserByGoogleSubjectId(googleSub: string): Promise<User | null> {
    return this.findUserByGoogleSub(googleSub)
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const userId = this.emailIndex.get(email.toLowerCase())
    if (!userId) return null
    return this.findUserById(userId)
  }

  async createUser(user: User): Promise<User> {
    const copy: User = {
      ...user,
      upaiUserId: user.upaiUserId || user.userId,
      userId: user.userId || user.upaiUserId,
      googleSub: user.googleSub || user.googleSubjectId,
      googleSubjectId: user.googleSubjectId || user.googleSub,
      photoUrl: user.photoUrl || user.avatarUrl,
      avatarUrl: user.avatarUrl || user.photoUrl
    }
    this.users.set(copy.upaiUserId, copy)
    this.googleSubIndex.set(copy.googleSub, copy.upaiUserId)
    this.emailIndex.set(copy.email.toLowerCase(), copy.upaiUserId)
    return { ...copy }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const existing = this.users.get(userId)
    if (!existing) return null

    const updated: User = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    if (updates.email) {
      this.emailIndex.set(updates.email.toLowerCase(), userId)
    }

    this.users.set(userId, updated)
    return { ...updated }
  }

  clear(): void {
    this.users.clear()
    this.googleSubIndex.clear()
    this.emailIndex.clear()
  }
}

/**
 * Factory creating the authoritative account repository instance.
 */
export function createAccountRepository(): AccountRepository {
  if (config.useInMemoryRepo || !config.firebaseProjectId) {
    return new InMemoryAccountRepository()
  }
  return new FirestoreAccountRepository()
}

export const accountRepository = createAccountRepository()
