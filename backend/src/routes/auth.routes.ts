// backend/src/routes/auth.routes.ts — Google Authentication & Session Endpoints
import { FastifyPluginAsync } from 'fastify'
import { authService } from '../services/auth.service.js'
import { GoogleAuthRequest, RefreshRequest, LogoutRequest } from '../types/index.js'

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /auth/google
   * Authenticate with Google ID token, returns UPAI session + sanitized user
   */
  fastify.post<{ Body: GoogleAuthRequest }>('/auth/google', async (request, reply) => {
    try {
      const { idToken } = request.body || {}
      if (!idToken || typeof idToken !== 'string') {
        return reply.status(400).send({
          success: false,
          error: 'Missing required field: idToken'
        })
      }

      const authResult = await authService.authenticateGoogle(idToken)
      return reply.status(200).send(authResult)
    } catch (err: any) {
      request.log.warn({ err }, 'Google auth failed')
      return reply.status(401).send({
        success: false,
        error: err.message || 'Authentication failed'
      })
    }
  })

  /**
   * POST /auth/refresh
   * Refresh an existing session token
   */
  fastify.post<{ Body: RefreshRequest }>('/auth/refresh', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
      const token = bearerToken || request.body?.sessionToken

      if (!token) {
        return reply.status(400).send({
          success: false,
          error: 'Missing session token'
        })
      }

      const refreshResult = await authService.refreshSession(token)
      return reply.status(200).send(refreshResult)
    } catch (err: any) {
      return reply.status(401).send({
        success: false,
        error: err.message || 'Session refresh failed'
      })
    }
  })

  /**
   * POST /auth/logout
   * Invalidate the current session
   */
  fastify.post<{ Body: LogoutRequest }>('/auth/logout', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null
      const token = bearerToken || request.body?.sessionToken

      if (token) {
        await authService.logout(token)
      }

      return reply.status(200).send({
        success: true,
        message: 'Signed out successfully'
      })
    } catch (err: any) {
      return reply.status(200).send({
        success: true
      })
    }
  })
}
