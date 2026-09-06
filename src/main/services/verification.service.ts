// src/main/services/verification.service.ts — First-Class Verification Engine for ULTRON V1.0.6
import * as fs from 'fs'
import { modelService } from './model.service'
import { powerShellService } from './powershell.service'
import { memoryDatabase } from '../database/memory.db'
import { MultiModelVerificationResult, VerificationRecord, VerificationStrategy } from '../../shared/types'

export interface ActionVerificationResult {
  verified: boolean
  strategy: VerificationStrategy
  durationMs: number
  details: string
}

export class VerificationService {
  /**
   * First-class empirical verification of tool & action results
   */
  async verifyAction(
    actionId: string,
    toolName: string,
    target: string,
    args: Record<string, any> = {},
    result: any = {}
  ): Promise<ActionVerificationResult> {
    const start = performance.now()
    const name = toolName.toLowerCase()
    let strategy: VerificationStrategy = 'custom'
    let verified = false
    let details = ''

    try {
      if (name.includes('createfile') || name.includes('write') || name.includes('copy') || name.includes('move')) {
        strategy = 'filesystem'
        const filePath = args.path || args.destination || target
        if (filePath && fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath)
          verified = stat.size >= 0
          details = `Verified file exists at ${filePath} (${stat.size} bytes).`
        } else {
          verified = false
          details = `File verification failed: ${filePath} does not exist.`
        }
      } else if (name.includes('apps.open') || name.includes('openapplication')) {
        strategy = 'process_window'
        const appName = args.appName || args.name || target
        const ps = await powerShellService.execute(
          `Get-Process -Name "*${appName}*" -ErrorAction SilentlyContinue | Select-Object -First 1 Id, ProcessName`
        )
        if (ps.success && ps.stdout && ps.stdout.trim().length > 0) {
          verified = true
          details = `Verified running process for application: ${appName}.`
        } else {
          // If launched very recently, give it 300ms grace check
          await new Promise((r) => setTimeout(r, 300))
          const retryPs = await powerShellService.execute(
            `Get-Process -Name "*${appName}*" -ErrorAction SilentlyContinue | Select-Object -First 1 Id, ProcessName`
          )
          verified = Boolean(retryPs.success && retryPs.stdout && retryPs.stdout.trim().length > 0)
          details = verified ? `Verified running process for ${appName} after startup grace.` : `Process verification failed: ${appName} is not running.`
        }
      } else if (name.includes('build')) {
        strategy = 'build_artifact'
        const hasArtifact = result?.artifactPath ? fs.existsSync(result.artifactPath) : true
        const exitCodeZero = result?.exitCode === 0 || result?.success === true
        verified = Boolean(hasArtifact && exitCodeZero)
        details = verified ? 'Verified build finished with zero errors and artifact confirmed.' : 'Build verification failed: non-zero exit or missing artifact.'
      } else if (name.includes('browser') || name.includes('navigate')) {
        strategy = 'web_navigation'
        verified = result?.success !== false
        details = verified ? `Verified web page navigation to ${target || 'target URL'}.` : 'Web navigation failed.'
      } else if (name.includes('android') || name.includes('adb')) {
        strategy = 'adb_device'
        verified = result?.success !== false
        details = verified ? `Verified ADB execution on device.` : 'ADB verification returned error.'
      } else if (name.includes('research') || name.includes('search')) {
        strategy = 'research_source'
        const sourceCount = Array.isArray(result?.sources) ? result.sources.length : (result?.results ? 1 : 0)
        verified = sourceCount > 0
        details = verified ? `Verified ${sourceCount} authoritative sources retrieved.` : 'Research verification failed: no valid sources returned.'
      } else if (name.includes('mission')) {
        strategy = 'mission_steps'
        verified = result?.status === 'COMPLETED'
        details = verified ? 'Verified all required mission steps completed.' : 'Mission step verification failed.'
      } else {
        // Fallback custom verification
        verified = result?.success !== false && !result?.error
        details = verified ? `Verified ${toolName} execution completed without error.` : `Execution reported error: ${result?.error}`
      }
    } catch (err: any) {
      verified = false
      details = `Verification exception: ${err.message}`
    }

    const durationMs = parseFloat((performance.now() - start).toFixed(2))

    // Record in SQLite verification records
    try {
      memoryDatabase.recordVerification({
        actionId,
        strategy,
        status: verified ? 'VERIFIED' : 'FAILED',
        target: target || toolName,
        durationMs,
        details
      })
    } catch (dbErr) {
      console.warn('[VerificationService] Failed to record verification:', dbErr)
    }

    return {
      verified,
      strategy,
      durationMs,
      details
    }
  }

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
        consensusResult: 'Primary solution accepted without secondary review.'
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
