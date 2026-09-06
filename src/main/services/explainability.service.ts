// src/main/services/explainability.service.ts — High-Level Explainability Mode for ULTRON V1.0.7
import { v4 as uuidv4 } from 'uuid'
import { ExecutionExplanation, RiskLevel } from '../../shared/types'

export class ExplainabilityService {
  private explanations: Map<string, ExecutionExplanation> = new Map()

  /**
   * Record a clean, observable execution explanation without exposing chain-of-thought
   */
  recordExplanation(exp: {
    requestId: string
    request: string
    intent: string
    selectedCapability: string
    toolsUsed: string[]
    permission: string
    risk: RiskLevel
    execution: string
    verification: string
    result: string
  }): ExecutionExplanation {
    const id = uuidv4()
    const explanation: ExecutionExplanation = {
      id,
      requestId: exp.requestId,
      request: exp.request,
      intent: exp.intent,
      selectedCapability: exp.selectedCapability,
      toolsUsed: exp.toolsUsed,
      permission: exp.permission,
      risk: exp.risk,
      execution: exp.execution,
      verification: exp.verification,
      result: exp.result,
      timestamp: Date.now()
    }

    this.explanations.set(exp.requestId, explanation)

    // Keep map bounded to last 200 items in memory
    if (this.explanations.size > 200) {
      const firstKey = this.explanations.keys().next().value
      if (firstKey) this.explanations.delete(firstKey)
    }

    return explanation
  }

  /**
   * Get explanation by request ID
   */
  getExplanation(requestId: string): ExecutionExplanation | null {
    return this.explanations.get(requestId) || null
  }

  /**
   * List recent execution explanations
   */
  listRecent(limit = 20): ExecutionExplanation[] {
    return Array.from(this.explanations.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
}

export const explainabilityService = new ExplainabilityService()
