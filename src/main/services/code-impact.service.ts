// src/main/services/code-impact.service.ts — Code Change Impact Analysis for ULTRON V1.0.8
import { memoryDatabase } from '../database/memory.db'
import { CodeImpactAssessment, RiskLevel } from '../../shared/types'

export class CodeImpactService {
  /**
   * Analyze potential impact of a requested code change before modifying files
   */
  analyzeImpact(requestedChange: string, targetFileOrSymbol = 'codebase', repoPath = process.cwd()): CodeImpactAssessment {
    const lower = requestedChange.toLowerCase()
    const affectedFiles: string[] = targetFileOrSymbol ? [targetFileOrSymbol] : []
    const affectedModules: string[] = []
    const dependencies: string[] = []
    const tests: string[] = []
    let riskLevel: RiskLevel = 'LOW'

    // Evaluate risk and module dependencies
    if (lower.includes('model') || lower.includes('routing') || (targetFileOrSymbol && targetFileOrSymbol.includes('router'))) {
      affectedFiles.push('src/main/services/model.service.ts', 'src/main/services/router.service.ts', 'src/shared/models.registry.ts')
      affectedModules.push('ModelService', 'SmartModelRouter', 'ModelRegistry')
      dependencies.push('dotenv', 'shared/types')
      riskLevel = 'HIGH'
    } else if (lower.includes('database') || lower.includes('sqlite') || (targetFileOrSymbol && targetFileOrSymbol.includes('memory.db'))) {
      affectedFiles.push('src/main/database/memory.db.ts', 'src/main/services/memory.service.ts')
      affectedModules.push('MemoryDatabase', 'MemoryService')
      dependencies.push('node:sqlite', 'uuid')
      riskLevel = 'HIGH'
    } else if (lower.includes('delete') || lower.includes('remove') || lower.includes('drop')) {
      riskLevel = 'IRREVERSIBLE'
    }

    const proposedPlan = [
      `1. Inspect current definition of ${targetFileOrSymbol}`,
      `2. Verify affected modules (${affectedModules.join(', ') || 'Target module'})`,
      `3. Run typecheck validation (npx tsc --noEmit)`,
      `4. Reversible execution with pre-change snapshotting`
    ]

    return memoryDatabase.saveCodeImpact({
      repoPath,
      targetSymbolOrFile: targetFileOrSymbol,
      affectedFiles: Array.from(new Set(affectedFiles)),
      affectedModules,
      dependencies,
      tests,
      riskLevel,
      proposedPlan
    })
  }

  getRecentAssessments(limit = 20): CodeImpactAssessment[] {
    return memoryDatabase.getRecentCodeImpacts(limit)
  }
}

export const codeImpactService = new CodeImpactService()