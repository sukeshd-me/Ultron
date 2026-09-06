// backend/src/routes/account.routes.ts — Account Profile Endpoints
import { FastifyPluginAsync } from 'fastify'
import { requireAuth } from '../middleware/auth.middleware.js'

export const accountRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /account
   * Retrieves sanitized account profile for the authenticated session
   */
  fastify.get(
    '/account',
    {
      preHandler: [requireAuth]
    },
    async (request, reply) => {
      return reply.status(200).send({
        success: true,
        user: request.user
      })
    }
  )
}
