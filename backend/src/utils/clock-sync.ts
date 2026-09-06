// backend/src/utils/clock-sync.ts — Auto Clock Skew Detection & Sync for Google Auth / Firestore
let syncPromise: Promise<number> | null = null
let clockOffsetMs = 0

/**
 * Checks Google server time and synchronizes the Node process Date if significant clock skew (>5s) is detected.
 * This prevents OAuth token exchange and Firestore gRPC authentication failures caused by local clock skew.
 */
export async function syncClockWithGoogle(): Promise<number> {
  if (syncPromise) return syncPromise

  syncPromise = (async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'HEAD',
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      const serverDateStr = res.headers.get('date')
      if (serverDateStr) {
        const serverTime = new Date(serverDateStr).getTime()
        const localTime = Date.now()
        const offset = serverTime - localTime

        if (Math.abs(offset) > 5000) {
          clockOffsetMs = offset
          console.log(
            `[ClockSync] Detected clock skew of ${(offset / 1000).toFixed(1)}s. Applying time synchronization offset.`
          )

          const OriginalDate = globalThis.Date
          const originalNow = OriginalDate.now.bind(OriginalDate)

          // Patch Date.now() to return corrected time
          OriginalDate.now = () => originalNow() + clockOffsetMs

          // Patch the Date constructor for new Date() (no-args) calls
          const OriginalDateConstructor = OriginalDate
          // @ts-ignore — override global Date constructor
          globalThis.Date = class extends OriginalDateConstructor {
            constructor(...args: any[]) {
              if (args.length === 0) {
                super(originalNow() + clockOffsetMs)
              } else {
                // @ts-ignore
                super(...args)
              }
            }

            static now() {
              return originalNow() + clockOffsetMs
            }
          } as DateConstructor
        }
      }
    } catch (err: any) {
      console.warn('[ClockSync] Could not check Google server time:', err.message)
    }
    return clockOffsetMs
  })()

  return syncPromise
}

// Trigger clock sync check eagerly in background on load
syncClockWithGoogle().catch(() => {})
