import { VerificationRecord } from '../../shared/types'

export interface RetryPolicy {
  maxRetries: number
  backoffMs: number
  retryableErrors: string[]
}

export interface RetryResult<T> {
  success: boolean
  attempts: number
  data?: T
  error?: string
  diagnostics?: string
}

export class RetryService {
  private defaultPolicy: RetryPolicy = {
    maxRetries: 2,
    backoffMs: 500,
    retryableErrors: [
      'EBUSY',
      'ETIMEDOUT',
      'ECONNRESET',
      'lock',
      'busy',
      'timed out',
      'temporary failure',
      'not ready'
    ]
  }

  isRetryable(error: string, policy: RetryPolicy = this.defaultPolicy): boolean {
    const lower = error.toLowerCase()
    return policy.retryableErrors.some((pattern) => lower.includes(pattern.toLowerCase()))
  }

  async executeWithRetry<T>(
    operationName: string,
    action: (attempt: number) => Promise<T>,
    policy: Partial<RetryPolicy> = {}
  ): Promise<RetryResult<T>> {
    const fullPolicy: RetryPolicy = { ...this.defaultPolicy, ...policy }
    let lastError = ''

    for (let attempt = 1; attempt <= fullPolicy.maxRetries + 1; attempt++) {
      try {
        const result = await action(attempt)
        return {
          success: true,
          attempts: attempt,
          data: result
        }
      } catch (err: any) {
        lastError = err?.message || String(err)
        console.warn(`[RetryService] ${operationName} failed on attempt ${attempt}/${fullPolicy.maxRetries + 1}: ${lastError}`)

        if (attempt > fullPolicy.maxRetries || !this.isRetryable(lastError, fullPolicy)) {
          break
        }

        const waitTime = fullPolicy.backoffMs * Math.pow(1.5, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, waitTime))
      }
    }

    return {
      success: false,
      attempts: fullPolicy.maxRetries + 1,
      error: lastError,
      diagnostics: `Operation '${operationName}' failed after retries. Last error: ${lastError}`
    }
  }
}

export const retryService = new RetryService()
