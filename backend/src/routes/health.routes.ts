// backend/src/routes/health.routes.ts — Health Check with Firestore status
import { FastifyPluginAsync } from 'fastify'
import { isFirestoreConfigured, isFirestoreConnected, getFirestoreInitError } from '../database/firestore.js'

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_request, reply) => {
    const firestoreConfigured = isFirestoreConfigured()
    let firestoreConnected = false
    if (firestoreConfigured) {
      firestoreConnected = await isFirestoreConnected()
    }

    return reply.status(200).send({
      status: 'ok',
      service: 'upai-auth',
      firestore: {
        configured: firestoreConfigured,
        connected: firestoreConnected,
        error: getFirestoreInitError() || undefined
      }
    })
  })
}
