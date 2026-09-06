// src/main/services/confidence.service.ts — Unified Confidence System for ULTRON V1.0.8
import { memoryDatabase } from '../database/memory.db'
import { ConfidenceLevel, ConfidenceAssessment, ConfidenceRecord } from '../../shared/types'

export class ConfidenceService {
  /**
   * Assess confidence level and provide transparent reasoning
   */
  assess(params: {
    entityType: string
    entityId: string
    verifiedLocally: boolean
    hasMultipleSources?: boolean
    isUserProvided?: boolean
    contextCompleteness?: number // 0.0 to 1.0
  }): ConfidenceAssessment {
    const { entityType, entityId, verifiedLocally, hasMultipleSources = false, isUserProvided = false, contextCompleteness = 1.0 } = params

    let level: ConfidenceLevel = 'UNKNOWN'
    let reason = ''

    if (verifiedLocally) {
      level = 'HIGH'
      reason = 'Verified directly against local project files, system APIs, or active hardware.'
    } else if (isUserProvided) {
      level = 'HIGH'
      reason = 'Provided explicitly by the user instruction.'
    } else if (hasMultipleSources && contextCompleteness >= 0.7) {
      level = 'MEDIUM'
      reason = 'Consistent across multiple available context sources, but not independently verified on disk.'
    } else if (contextCompleteness < 0.5) {
      level = 'LOW'
      reason = 'Insufficient or incomplete evidence available in current context.'
    } else {
      level = 'MEDIUM'
      reason = 'Based on available context signals without formal deterministic verification.'
    }

    // Record into database
    try {
      memoryDatabase.recordConfidence({
        entityType,
        entityId,
        confidenceLevel: level,
        reason
      })
    } catch {}

    return {
      level,
      reason,
      verifiedLocally
    }
  }

  getRecentConfidence(entityType: string, entityId: string): ConfidenceRecord | null {
    return memoryDatabase.getConfidence(entityType, entityId)
  }
}

export const confidenceService = new ConfidenceService()