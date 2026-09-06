// backend/src/types/index.ts — UPAI Backend Type Definitions

export type UserPlan = 'free' | 'plus' | 'pro' | 'FREE'
export type UserStatus = 'active' | 'suspended' | 'disabled' | 'ACTIVE'

export interface User {
  upaiUserId: string
  userId: string // Alias for compatibility with existing Electron IPC
  googleSub: string // Stable Google identity sub identifier
  googleSubjectId: string // Alias for compatibility
  email: string
  displayName: string
  photoUrl?: string
  avatarUrl?: string // Alias for compatibility
  plan: UserPlan
  status: UserStatus
  createdAt: string
  updatedAt: string
  lastLoginAt: string

  // Future monetization & entitlement scaffolding
  subscriptionStatus?: 'none' | 'active' | 'past_due' | 'canceled' | 'NONE'
  billingCustomerId?: string
  entitlements?: string[]
}

export interface SanitizedUser {
  authenticated: true
  userId: string
  upaiUserId: string
  email: string
  displayName: string
  photoUrl?: string
  avatarUrl?: string
  plan: UserPlan
  status: UserStatus
  createdAt: string
  lastLoginAt: string
}

export interface Session {
  sessionId: string
  sessionTokenHash: string // SHA-256 hash of session token (raw token is NEVER stored in database)
  userId: string
  createdAt: number
  expiresAt: number
}

export interface UsageRecord {
  userId: string
  date: string // YYYY-MM-DD
  requestCount: number
  tokenCount: number
  updatedAt: string
}

export interface GoogleAuthRequest {
  idToken: string
}

export interface AuthResponse {
  success: boolean
  sessionToken: string
  expiresAt: number
  user: SanitizedUser
}

export interface RefreshRequest {
  sessionToken: string
}

export interface LogoutRequest {
  sessionToken?: string
}

export interface VerifiedGoogleIdentity {
  sub: string
  email: string
  emailVerified: boolean
  name?: string
  picture?: string
}

