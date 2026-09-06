// backend/src/server.ts — UPAI Backend Fastify Server
// Clock sync MUST be imported first to correct system clock skew before any Google API auth
import './utils/clock-sync.js'
import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { config } from './config.js'
import { healthRoutes } from './routes/health.routes.js'
import { authRoutes } from './routes/auth.routes.js'
import { accountRoutes } from './routes/account.routes.js'

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: {
      level: config.nodeEnv === 'production' ? 'info' : 'debug',
      // Redact sensitive authorization headers and body keys from logs (Requirement 10 & 23)
      redact: ['req.headers.authorization', 'req.body.idToken', 'req.body.sessionToken']
    }
  })

  // 1. CORS
  await server.register(cors, {
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })

  // 2. Rate Limiting (Requirement 23)
  await server.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute'
  })

  // 3. Register Routes
  await server.register(healthRoutes)
  await server.register(authRoutes)
  await server.register(accountRoutes)

  return server
}

export async function startServer(): Promise<void> {
  try {
    // Ensure clock is synchronized with Google before initializing Firestore
    const { syncClockWithGoogle } = await import('./utils/clock-sync.js')
    await syncClockWithGoogle()

    const server = await buildServer()
    const address = await server.listen({
      port: config.port,
      host: config.host
    })
    console.log(`[UPAI Backend] Server listening at ${address}`)
    console.log(`[UPAI Backend] Environment: ${config.nodeEnv}`)
    console.log(`[UPAI Backend] Health check: ${address}/health`)
  } catch (err) {
    console.error('[UPAI Backend] Failed to start server:', err)
    process.exit(1)
  }
}

// Start if executed directly
if (process.argv[1]?.endsWith('server.js') || process.argv[1]?.endsWith('server.ts')) {
  startServer()
}
