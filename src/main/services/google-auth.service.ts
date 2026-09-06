// src/main/services/google-auth.service.ts — Native Google OAuth 2.0 PKCE & UPAI Session Engine
import * as http from 'http'
import * as crypto from 'crypto'
import * as path from 'path'
import { shell } from 'electron'
import * as dotenv from 'dotenv'
import { credentialService } from './credential.service'
import { getUpaiBackendUrl } from '../config/upai-backend.config'

// Ensure local environment variables are loaded
dotenv.config({ path: path.join(process.cwd(), '.env') })
dotenv.config()

export interface SanitizedUserProfile {
  authenticated: boolean
  userId: string
  email: string
  displayName: string
  avatarUrl?: string
  plan: 'FREE'
  createdAt: string
  lastLoginAt: string
}

export interface AuthStatusResult {
  authenticated: boolean
  isOffline: boolean
  user?: SanitizedUserProfile
}

export interface SignInResult {
  success: boolean
  user?: SanitizedUserProfile
  error?: string
  cancelled?: boolean
  offline?: boolean
}

export class GoogleAuthService {
  private googleTokenUrl = 'https://oauth2.googleapis.com/token'

  private getBackendUrl(): string {
    return getUpaiBackendUrl()
  }

  private getGoogleClientId(): string {
    return (process.env.GOOGLE_CLIENT_ID || '').trim()
  }

  private getGoogleClientSecret(): string {
    return (process.env.GOOGLE_CLIENT_SECRET || '').trim()
  }

  /**
   * Generates a cryptographically random URL-safe base64 string
   */
  private generateRandomString(bytesCount = 32): string {
    return crypto
      .randomBytes(bytesCount)
      .toString('base64url')
  }

  /**
   * Computes the S256 PKCE code challenge from a code verifier
   */
  private generateCodeChallenge(verifier: string): string {
    return crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64url')
  }

  /**
   * Retrieves the current authentication status and validates/restores session.
   */
  async getStatus(): Promise<AuthStatusResult> {
    const session = await credentialService.getAuthSession()
    if (!session || !session.sessionToken || !session.user) {
      return { authenticated: false, isOffline: false }
    }

    // Check expiration
    const isExpired = Date.now() > session.expiresAt
    if (isExpired) {
      // Attempt refresh
      const refreshed = await this.refreshSession()
      if (refreshed.success && refreshed.user) {
        return { authenticated: true, isOffline: false, user: refreshed.user }
      }
      return { authenticated: false, isOffline: false }
    }

    // Verify session connectivity with backend
    try {
      const response = await fetch(`${this.getBackendUrl()}/account`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.sessionToken}`,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(3500)
      })

      if (response.ok) {
        const data = (await response.json()) as any
        if (data.user) {
          return { authenticated: true, isOffline: false, user: data.user }
        }
      } else if (response.status === 401) {
        // Session was invalidated on backend
        await credentialService.clearAuthSession()
        return { authenticated: false, isOffline: false }
      }
    } catch {
      // Network failure / offline: allow valid cached session per Requirement 14
      return {
        authenticated: true,
        isOffline: true,
        user: session.user
      }
    }

    return { authenticated: true, isOffline: false, user: session.user }
  }

  /**
   * Refreshes the active session with the UPAI backend
   */
  async refreshSession(): Promise<{ success: boolean; user?: SanitizedUserProfile }> {
    const session = await credentialService.getAuthSession()
    if (!session?.sessionToken) {
      return { success: false }
    }

    try {
      const response = await fetch(`${this.getBackendUrl()}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.sessionToken}`
        },
        body: JSON.stringify({ sessionToken: session.sessionToken }),
        signal: AbortSignal.timeout(6000)
      })

      if (!response.ok) {
        await credentialService.clearAuthSession()
        return { success: false }
      }

      const data = (await response.json()) as any
      if (data.success && data.sessionToken && data.user) {
        await credentialService.saveAuthSession({
          sessionToken: data.sessionToken,
          expiresAt: data.expiresAt,
          user: data.user
        })
        return { success: true, user: data.user }
      }
    } catch {
      // Offline fallback
      if (Date.now() < session.expiresAt) {
        return { success: true, user: session.user }
      }
    }

    return { success: false }
  }

  /**
   * Executes the Google OAuth 2.0 PKCE flow:
   * 1. Generates PKCE verifier + S256 challenge + random state
   * 2. Binds temporary loopback HTTP server to 127.0.0.1
   * 3. Launches system default browser to Google OAuth consent
   * 4. Receives authorization code from loopback callback
   * 5. Exchanges code for ID token with Google
   * 6. Authenticates with UPAI backend and stores DPAPI session
   */
  async signInWithGoogle(): Promise<SignInResult> {
    const clientId = this.getGoogleClientId()

    // 1. Generate PKCE & State
    const codeVerifier = this.generateRandomString(64)
    const codeChallenge = this.generateCodeChallenge(codeVerifier)
    const state = this.generateRandomString(32)

    // 2. Start loopback server strictly bound to 127.0.0.1
    let server: http.Server | null = null
    let activeRedirectUri = ''

    try {
      const callbackResult = await new Promise<{ code?: string; error?: string; cancelled?: boolean }>(
        (resolve, reject) => {
          server = http.createServer((req, res) => {
            try {
              const reqUrl = new URL(req.url || '/', `http://127.0.0.1`)

              // Ignore browser favicon requests
              if (reqUrl.pathname === '/favicon.ico') {
                res.writeHead(204)
                res.end()
                return
              }

              const params = reqUrl.searchParams
              const returnedState = params.get('state')
              const returnedCode = params.get('code')
              const returnedError = params.get('error')

              // Match /oauth2callback or root path with code/error query
              const isCallbackPath = reqUrl.pathname === '/oauth2callback' || reqUrl.pathname === '/' || params.has('code') || params.has('error')
              if (!isCallbackPath) {
                res.writeHead(404, { 'Content-Type': 'text/plain' })
                res.end('Not Found')
                return
              }

              // HTML confirmation response served to user browser
              const renderHtml = (title: string, message: string, isSuccess: boolean) => {
                return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — ULTRON</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000000;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      background: #09090b;
      border: 1px solid ${isSuccess ? 'rgba(0, 212, 255, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      max-width: 420px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
    }
    .logo {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #00d4ff;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 18px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }
    p {
      font-size: 13px;
      color: #94a3b8;
      line-height: 1.5;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">ULTRON</div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`
              }

              if (returnedError) {
                res.writeHead(200, { 'Content-Type': 'text/html' })
                res.end(renderHtml('Authentication Cancelled', 'Google sign-in was cancelled. You can return to ULTRON.', false))
                resolve({ cancelled: true, error: returnedError })
                return
              }

              // Validate state parameter to prevent CSRF
              if (!returnedState || returnedState !== state) {
                res.writeHead(400, { 'Content-Type': 'text/html' })
                res.end(renderHtml('Security Validation Error', 'State token mismatch. Please try signing in again.', false))
                resolve({ error: 'OAuth state validation mismatch' })
                return
              }

              if (!returnedCode) {
                res.writeHead(400, { 'Content-Type': 'text/html' })
                res.end(renderHtml('Authentication Error', 'No authorization code was received from Google.', false))
                resolve({ error: 'Missing authorization code' })
                return
              }

              res.writeHead(200, { 'Content-Type': 'text/html' })
              res.end(renderHtml('Authentication Successful', 'You have signed in to ULTRON. You can close this tab and return to the app.', true))
              resolve({ code: returnedCode })
            } catch (err: any) {
              resolve({ error: err.message || 'Callback parsing error' })
            }
          })

          // Bind strictly to 127.0.0.1 (Loopback only)
          server.listen(0, '127.0.0.1', () => {
            const address = server!.address()
            if (!address || typeof address === 'string') {
              reject(new Error('Failed to obtain loopback address'))
              return
            }

            const port = address.port
            activeRedirectUri = `http://127.0.0.1:${port}/oauth2callback`

            // Construct Google OAuth URL
            const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
            authUrl.searchParams.set('client_id', clientId || 'mock_client_id_for_dev')
            authUrl.searchParams.set('redirect_uri', activeRedirectUri)
            authUrl.searchParams.set('response_type', 'code')
            authUrl.searchParams.set('scope', 'openid email profile')
            authUrl.searchParams.set('code_challenge', codeChallenge)
            authUrl.searchParams.set('code_challenge_method', 'S256')
            authUrl.searchParams.set('state', state)
            authUrl.searchParams.set('access_type', 'offline')
            authUrl.searchParams.set('prompt', 'select_account')

            // If no Google Client ID is configured yet, check if in dev mode
            if (!clientId) {
              console.warn('[GoogleAuthService] Notice: GOOGLE_CLIENT_ID not set. Opening Google Auth with placeholder or checking dev environment.')
            }

            // Launch system browser
            shell.openExternal(authUrl.toString()).catch((err) => {
              reject(new Error(`Failed to open system browser: ${err.message}`))
            })
          })

          server.on('error', (err) => {
            reject(err)
          })

          // Timeout in 3 minutes
          setTimeout(() => {
            resolve({ cancelled: true, error: 'Sign-in timed out. Please try again.' })
          }, 180000)
        }
      )

      // Close loopback server immediately
      if (server) {
        try {
          ;(server as http.Server).close()
        } catch {}
      }

      if (callbackResult.cancelled) {
        return { success: false, cancelled: true, error: 'Sign-in cancelled' }
      }

      if (callbackResult.error || !callbackResult.code) {
        return { success: false, error: callbackResult.error || 'Google sign-in failed' }
      }

      // 3. Exchange Code for ID Token with Google
      const redirectUri = activeRedirectUri || 'http://127.0.0.1/oauth2callback'

      let idToken = ''

      if (clientId) {
        const tokenParams = new URLSearchParams()
        tokenParams.set('client_id', clientId)
        tokenParams.set('code', callbackResult.code)
        tokenParams.set('code_verifier', codeVerifier)
        tokenParams.set('grant_type', 'authorization_code')
        tokenParams.set('redirect_uri', redirectUri)

        const clientSecret = this.getGoogleClientSecret()
        if (clientSecret) {
          tokenParams.set('client_secret', clientSecret)
        }

        const tokenResp = await fetch(this.googleTokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: tokenParams.toString()
        })

        if (!tokenResp.ok) {
          const errBody = await tokenResp.text().catch(() => '')
          throw new Error(`Google token exchange failed: ${errBody}`)
        }

        const tokenData = (await tokenResp.json()) as any
        idToken = tokenData.id_token
        if (!idToken) {
          throw new Error('Google did not return an ID token')
        }
      } else {
        // Fallback for local initial bootstrap if client ID has not yet been pasted by user
        throw new Error('GOOGLE_CLIENT_ID is not configured. Please set GOOGLE_CLIENT_ID in your environment or .env file.')
      }

      // 4. Authenticate with UPAI Backend
      const backendResp = await fetch(`${this.getBackendUrl()}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken })
      })

      if (!backendResp.ok) {
        const backendErr = await backendResp.text().catch(() => '')
        throw new Error(`UPAI backend authentication failed: ${backendErr}`)
      }

      const backendData = (await backendResp.json()) as any
      if (!backendData.success || !backendData.sessionToken || !backendData.user) {
        throw new Error('Invalid authentication response from UPAI backend')
      }

      // 5. Store Session Securely in Hardware/OS DPAPI Vault
      await credentialService.saveAuthSession({
        sessionToken: backendData.sessionToken,
        expiresAt: backendData.expiresAt,
        user: backendData.user
      })

      return {
        success: true,
        user: backendData.user
      }
    } catch (err: any) {
      if (server) {
        try {
          ;(server as http.Server).close()
        } catch {}
      }

      return {
        success: false,
        error: err.message || 'Google sign-in could not be completed'
      }
    }
  }

  /**
   * Signs the user out:
   * 1. Revokes session on UPAI backend (best-effort)
   * 2. Clears DPAPI encrypted storage
   */
  async signOut(): Promise<{ success: boolean }> {
    try {
      const session = await credentialService.getAuthSession()
      if (session?.sessionToken) {
        fetch(`${this.getBackendUrl()}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.sessionToken}`
          },
          body: JSON.stringify({ sessionToken: session.sessionToken }),
          signal: AbortSignal.timeout(3000)
        }).catch(() => {})
      }
    } catch {}

    await credentialService.clearAuthSession()
    return { success: true }
  }

  /**
   * Retrieves sanitized profile for renderer
   */
  async getProfile(): Promise<SanitizedUserProfile | null> {
    const status = await this.getStatus()
    return status.authenticated && status.user ? status.user : null
  }
}

export const googleAuthService = new GoogleAuthService()
