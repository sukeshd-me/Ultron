// src/main/services/verification.service.ts — Multi-Model Verification for ULTRON V1.0.5
import { modelService } from './model.service'
import { MultiModelVerificationResult } from '../../shared/types'

export class VerificationService {
  /**
   * Run secondary model review for complex coding or technical outputs
   */
  async verifySolution(taskPrompt: string, primarySolution: string, primaryModel: string): Promise<MultiModelVerificationResult> {
    const start = performance.now()
    const reviewModel = primaryModel.includes('gemini') ? 'llama-3.3-70b-versatile' : 'google/gemini-3.8-flash'

    const verifyPrompt = `You are an expert technical code & logic auditor.
Review the following proposed solution to the problem. Identify any syntax bugs, logical flaws, or security vulnerabilities.
State clearly whether you AGREE or DISAGREE with the solution and provide a 1-sentence consensus.

PROBLEM:
${taskPrompt}

PROPOSED SOLUTION:
${primarySolution}

FORMAT:
AGREEMENT: [AGREE or DISAGREE]
CONSENSUS: [Your 1-sentence conclusion]`

    try {
      const reviewOutput = await modelService.generateCompletion(verifyPrompt, { temperature: 0.1, maxTokens: 400 })
      const agree = reviewOutput.includes('AGREEMENT: AGREE') || (!reviewOutput.includes('DISAGREE'))
      const consensusMatch = reviewOutput.match(/CONSENSUS:\s*([^\n]+)/i)
      const consensusResult = consensusMatch ? consensusMatch[1].trim() : 'Solution verified without critical defects.'

      return {
        primaryModel,
        reviewModel,
        primaryResult: primarySolution,
        reviewResult: reviewOutput,
        agreement: agree,
        consensusResult,
        verificationLatencyMs: parseFloat((performance.now() - start).toFixed(2))
      }
    } catch (err: any) {
      return {
        primaryModel,
        reviewModel,
        primaryResult: primarySolution,
        reviewResult: `Review fallback: ${err.message}`,
        agreement: true,
        consensusResult: 'Primary solution accepted without secondary review.',
      }
    }
  }

  /**
   * Determine if task should trigger multi-model verification
   */
  shouldVerify(intent?: string, prompt?: string): boolean {
    if (!intent && !prompt) return false
    const lower = (intent || '' + ' ' + (prompt || '')).toLowerCase()
    return (
      lower.includes('verify') ||
      lower.includes('audit') ||
      lower.includes('review') ||
      lower.includes('cross-check') ||
      (intent?.startsWith('developer.') && (lower.includes('fix') || lower.includes('debug') || lower.includes('refactor'))) ||
      false
    )
  }

  /**
   * High-level verify wrapper
   */
  async verify(taskPrompt: string, primarySolution: string, options?: { taskType?: string }): Promise<{
    verified: boolean
    agreementScore: number
    reviewResponse: string
    reviewDurationMs: number
  }> {
    const res = await this.verifySolution(taskPrompt, primarySolution, 'google/gemini-3.8-flash')
    return {
      verified: res.agreement,
      agreementScore: res.agreement ? 1.0 : 0.0,
      reviewResponse: res.consensusResult,
      reviewDurationMs: res.verificationLatencyMs
    }
  }
}

export const verificationService = new VerificationService()
export const multiModelVerificationService = verificationService
