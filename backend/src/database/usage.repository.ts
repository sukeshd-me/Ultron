// backend/src/database/usage.repository.ts — Future Quota & Monetization Scaffolding
import { UsageRecord } from '../types/index.js'
import { getFirestore } from './firestore.js'
import { config } from '../config.js'

export interface QuotaCheckResult {
  allowed: boolean
  remainingRequests: number
  plan: string
}

export interface UsageRepository {
  recordUsage(userId: string, tokens: number): Promise<UsageRecord>
  getUserUsage(userId: string, date: string): Promise<UsageRecord | null>
  checkQuota(userId: string): Promise<QuotaCheckResult>
}

export class FirestoreUsageRepository implements UsageRepository {
  private collectionName = 'usage'

  private getDb() {
    const db = getFirestore()
    if (!db) {
      throw new Error('Firestore is not available for usage records')
    }
    return db
  }

  async recordUsage(userId: string, tokens: number): Promise<UsageRecord> {
    const today = new Date().toISOString().split('T')[0]
    const docId = `${userId}_${today}`
    const docRef = this.getDb().collection(this.collectionName).doc(docId)

    const doc = await docRef.get()
    const now = new Date().toISOString()

    if (!doc.exists) {
      const newRecord: UsageRecord = {
        userId,
        date: today,
        requestCount: 1,
        tokenCount: tokens,
        updatedAt: now
      }
      await docRef.set(newRecord)
      return newRecord
    }

    const data = doc.data() as UsageRecord
    const updated: UsageRecord = {
      ...data,
      requestCount: (data.requestCount || 0) + 1,
      tokenCount: (data.tokenCount || 0) + tokens,
      updatedAt: now
    }
    await docRef.update(updated)
    return updated
  }

  async getUserUsage(userId: string, date: string): Promise<UsageRecord | null> {
    const docId = `${userId}_${date}`
    const doc = await this.getDb().collection(this.collectionName).doc(docId).get()
    if (!doc.exists) return null
    return doc.data() as UsageRecord
  }

  async checkQuota(userId: string): Promise<QuotaCheckResult> {
    // Scaffolded for future subscription tiers (Free: 1000/day, Plus: 10000/day, Pro: unlimited)
    const today = new Date().toISOString().split('T')[0]
    const usage = await this.getUserUsage(userId, today)
    const used = usage?.requestCount || 0
    const limit = 1000

    return {
      allowed: used < limit,
      remainingRequests: Math.max(0, limit - used),
      plan: 'FREE'
    }
  }
}

export class InMemoryUsageRepository implements UsageRepository {
  private usageMap = new Map<string, UsageRecord>()

  async recordUsage(userId: string, tokens: number): Promise<UsageRecord> {
    const today = new Date().toISOString().split('T')[0]
    const key = `${userId}_${today}`
    const existing = this.usageMap.get(key)
    const now = new Date().toISOString()

    const updated: UsageRecord = {
      userId,
      date: today,
      requestCount: (existing?.requestCount || 0) + 1,
      tokenCount: (existing?.tokenCount || 0) + tokens,
      updatedAt: now
    }
    this.usageMap.set(key, updated)
    return { ...updated }
  }

  async getUserUsage(userId: string, date: string): Promise<UsageRecord | null> {
    const key = `${userId}_${date}`
    const u = this.usageMap.get(key)
    return u ? { ...u } : null
  }

  async checkQuota(userId: string): Promise<QuotaCheckResult> {
    const today = new Date().toISOString().split('T')[0]
    const key = `${userId}_${today}`
    const used = this.usageMap.get(key)?.requestCount || 0
    return {
      allowed: used < 1000,
      remainingRequests: Math.max(0, 1000 - used),
      plan: 'FREE'
    }
  }
}

export function createUsageRepository(): UsageRepository {
  if (config.useInMemoryRepo || !config.firebaseProjectId) {
    return new InMemoryUsageRepository()
  }
  return new FirestoreUsageRepository()
}

export const usageRepository = createUsageRepository()
