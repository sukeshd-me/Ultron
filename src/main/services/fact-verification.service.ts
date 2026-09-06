// src/main/services/fact-verification.service.ts — Fact Verification Classification Layer for ULTRON V1.0.8
import { memoryDatabase } from '../database/memory.db'
import { FactClassification, FactVerificationRecord } from '../../shared/types'

export class FactVerificationService {
  /**
   * Classify an information claim into one of the 5 standards:
   * CONFIRMED | USER-PROVIDED | INFERRED | UNCERTAIN | CONFLICTING
   */
  classifyFact(params: {
    statement: string
    source: string
    evidence?: string
    isFromDisk?: boolean
    isDirectUserQuote?: boolean
    hasEvidenceConflict?: boolean
  }): FactVerificationRecord {
    const { statement, source, evidence, isFromDisk, isDirectUserQuote, hasEvidenceConflict } = params

    let classification: FactClassification = 'INFERRED'

    if (hasEvidenceConflict) {
      classification = 'CONFLICTING'
    } else if (isFromDisk) {
      classification = 'CONFIRMED'
    } else if (isDirectUserQuote) {
      classification = 'USER-PROVIDED'
    } else if (!evidence || evidence.trim().length === 0) {
      classification = 'UNCERTAIN'
    } else {
      classification = 'INFERRED'
    }

    return memoryDatabase.recordFactVerification({
      factStatement: statement,
      classification,
      source,
      evidence
    })
  }

  getRecentVerifications(limit = 50): FactVerificationRecord[] {
    return memoryDatabase.getFactVerifications(limit)
  }
}

export const factVerificationService = new FactVerificationService()