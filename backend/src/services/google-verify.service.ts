// backend/src/services/google-verify.service.ts — Google Identity Verification
import { VerifiedGoogleIdentity } from '../types/index.js'
import { config } from '../config.js'

export class GoogleVerifyService {
  private tokenInfoUrl = 'https://oauth2.googleapis.com/tokeninfo'

  /**
   * Verifies Google ID Token against Google's tokeninfo endpoint.
   * Validates issuer, audience, expiration, and extracts Google sub as stable identity key.
   */
  async verifyIdToken(idToken: string): Promise<VerifiedGoogleIdentity> {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('Missing or invalid ID token format')
    }

    // Call Google's official tokeninfo verification endpoint
    const url = `${this.tokenInfoUrl}?id_token=${encodeURIComponent(idToken)}`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      throw new Error(`Google token validation failed (${response.status}): ${errText || 'Invalid token'}`)
    }

    const payload = (await response.json()) as any

    // 1. Validate issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com']
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      throw new Error(`Invalid token issuer: ${payload.iss}`)
    }

    // 2. Validate audience if client ID is configured
    if (config.googleClientId && payload.aud !== config.googleClientId) {
      throw new Error(`Token audience mismatch. Expected: ${config.googleClientId}, got: ${payload.aud}`)
    }

    // 3. Validate expiration
    const nowSec = Math.floor(Date.now() / 1000)
    const exp = parseInt(payload.exp, 10)
    if (!exp || nowSec > exp) {
      throw new Error('Google ID token has expired')
    }

    // 4. Validate subject identifier
    if (!payload.sub || typeof payload.sub !== 'string') {
      throw new Error('Missing Google subject identifier (sub)')
    }

    return {
      sub: payload.sub,
      email: payload.email || '',
      emailVerified: payload.email_verified === 'true' || payload.email_verified === true,
      name: payload.name || payload.given_name || payload.email?.split('@')[0] || 'ULTRON User',
      picture: payload.picture
    }
  }
}

export const googleVerifyService = new GoogleVerifyService()
