// backend/src/services/auth.service.ts — UPAI Authentication & Session Service
import * as crypto from 'crypto'
import { accountRepository, AccountRepository } from '../database/account.repository.js'
import { sessionRepository, SessionRepository } from '../database/session.repository.js'
import { googleVerifyService } from './google-verify.service.js'
import { User, Session, SanitizedUser, AuthResponse } from '../types/index.js'
import { config } from '../config.js'

export class AuthService {
  constructor(
    private accountRepo: AccountRepository = accountRepository,
    private sessionRepo: SessionRepository = sessionRepository
  ) {}

  /**
   * Computes a SHA-256 hash of a session token for secure database storage.
   * Raw session tokens are NEVER stored in Firestore (Requirement 5).
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  /**
   * Authenticate with verified Google ID Token
   */
  async authenticateGoogle(idToken: string): Promise<AuthResponse> {
    // 1. Verify Google identity via Google's tokeninfo
    const googleId = await googleVerifyService.verifyIdToken(idToken)

    const now = new Date().toISOString()

    // 2. Find or create user by stable Google sub identifier (Requirement 4 & 7)
    let user = await this.accountRepo.findUserByGoogleSub(googleId.sub)

    if (!user) {
      // Create new persistent UPAI account
      const newUserId = `usr_${crypto.randomBytes(12).toString('hex')}`
      user = await this.accountRepo.createUser({
        upaiUserId: newUserId,
        userId: newUserId,
        googleSub: googleId.sub,
        googleSubjectId: googleId.sub,
        email: googleId.email,
        displayName: googleId.name || 'ULTRON User',
        photoUrl: googleId.picture,
        avatarUrl: googleId.picture,
        plan: 'free',
        status: 'active',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
        subscriptionStatus: 'NONE'
      })
    } else {
      // Update last login and profile changes idempotently
      user =
        (await this.accountRepo.updateUser(user.upaiUserId || user.userId, {
          lastLoginAt: now,
          displayName: googleId.name || user.displayName,
          photoUrl: googleId.picture || user.photoUrl || user.avatarUrl,
          avatarUrl: googleId.picture || user.avatarUrl || user.photoUrl
        })) || user
    }

    // 3. Mint secure UPAI session token
    const rawSessionToken = this.generateSessionToken(user.upaiUserId || user.userId)
    const tokenHash = this.hashToken(rawSessionToken)
    const expiresAt = Date.now() + config.sessionTtlSeconds * 1000

    const session: Session = {
      sessionId: `ses_${crypto.randomBytes(12).toString('hex')}`,
      sessionTokenHash: tokenHash,
      userId: user.upaiUserId || user.userId,
      createdAt: Date.now(),
      expiresAt
    }

    await this.sessionRepo.createSession(session)

    return {
      success: true,
      sessionToken: rawSessionToken,
      expiresAt,
      user: this.sanitizeUser(user)
    }
  }

  /**
   * Validate and refresh existing session token
   */
  async refreshSession(currentToken: string): Promise<AuthResponse> {
    if (!currentToken) {
      throw new Error('Missing session token')
    }

    const tokenHash = this.hashToken(currentToken)
    const session = await this.sessionRepo.findSessionByTokenHash(tokenHash)
    if (!session) {
      throw new Error('Invalid or expired session')
    }

    const user = await this.accountRepo.findUserById(session.userId)
    if (!user) {
      throw new Error('User account not found')
    }

    // Invalidate old session and generate fresh token
    await this.sessionRepo.deleteSession(tokenHash)

    const rawNewToken = this.generateSessionToken(user.upaiUserId || user.userId)
    const newTokenHash = this.hashToken(rawNewToken)
    const newExpiresAt = Date.now() + config.sessionTtlSeconds * 1000

    const newSession: Session = {
      sessionId: `ses_${crypto.randomBytes(12).toString('hex')}`,
      sessionTokenHash: newTokenHash,
      userId: user.upaiUserId || user.userId,
      createdAt: Date.now(),
      expiresAt: newExpiresAt
    }

    await this.sessionRepo.createSession(newSession)

    return {
      success: true,
      sessionToken: rawNewToken,
      expiresAt: newExpiresAt,
      user: this.sanitizeUser(user)
    }
  }

  /**
   * Invalidate session token on logout
   */
  async logout(sessionToken: string): Promise<{ success: boolean }> {
    if (!sessionToken) return { success: true }
    const tokenHash = this.hashToken(sessionToken)
    await this.sessionRepo.deleteSession(tokenHash)
    return { success: true }
  }

  /**
   * Get user profile by active session token
   */
  async getUserByToken(token: string): Promise<SanitizedUser | null> {
    const tokenHash = this.hashToken(token)
    const session = await this.sessionRepo.findSessionByTokenHash(tokenHash)
    if (!session) return null

    const user = await this.accountRepo.findUserById(session.userId)
    return user ? this.sanitizeUser(user) : null
  }

  private generateSessionToken(userId: string): string {
    const randomHex = crypto.randomBytes(32).toString('hex')
    const signature = crypto
      .createHmac('sha256', config.sessionSecret)
      .update(`${userId}:${randomHex}`)
      .digest('hex')
    return `upai_${randomHex}_${signature.substring(0, 16)}`
  }

  public sanitizeUser(user: User): SanitizedUser {
    return {
      authenticated: true,
      userId: user.userId || user.upaiUserId,
      upaiUserId: user.upaiUserId || user.userId,
      email: user.email,
      displayName: user.displayName,
      photoUrl: user.photoUrl || user.avatarUrl,
      avatarUrl: user.avatarUrl || user.photoUrl,
      plan: user.plan,
      status: user.status || 'active',
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    }
  }
}

export const authService = new AuthService()
