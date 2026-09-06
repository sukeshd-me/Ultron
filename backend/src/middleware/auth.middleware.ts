// backend/src/middleware/auth.middleware.ts — Fastify Authentication Hook
import { FastifyRequest, FastifyReply } from 'fastify'
import { authService } from '../services/auth.service.js'
import { SanitizedUser } from '../types/index.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: SanitizedUser
    sessionToken?: string
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      error: 'Missing or malformed Authorization header'
    })
  }

  const token = authHeader.slice(7).trim()
  if (!token) {
    return reply.status(401).send({
      success: false,
      error: 'Session token is required'
    })
  }

  const user = await authService.getUserByToken(token)
  if (!user) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid or expired session token'
    })
  }

  request.user = user
  request.sessionToken = token
}
