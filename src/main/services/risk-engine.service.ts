import { RiskLevel } from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'

export interface RiskAssessment {
  level: RiskLevel
  reason: string
  requiresPreview: boolean
  requiresConfirmation: boolean
  reversible: boolean
}

export class ActionRiskEngine {
  assessRisk(toolName: string, args: Record<string, any>): RiskAssessment {
    const name = toolName.toLowerCase()

    // IRREVERSIBLE ACTIONS
    if (
      name.includes('delete') ||
      name.includes('purge') ||
      name.includes('drop') ||
      name.includes('truncate') ||
      (name.includes('filesystem') && args.action === 'delete')
    ) {
      return {
        level: 'IRREVERSIBLE',
        reason: `Irreversible destructive operation targeted at ${args.path || args.target || 'system'}`,
        requiresPreview: true,
        requiresConfirmation: true,
        reversible: false
      }
    }

    // HIGH RISK ACTIONS
    if (
      name.includes('powershell') ||
      name.includes('terminal') ||
      name.includes('kill') ||
      name.includes('reboot') ||
      name.includes('shutdown') ||
      name.includes('publish') ||
      name.includes('git.push') ||
      name.includes('network.disable')
    ) {
      return {
        level: 'HIGH',
        reason: `High impact system command or external side-effect: ${toolName}`,
        requiresPreview: true,
        requiresConfirmation: true,
        reversible: false
      }
    }

    // MEDIUM RISK ACTIONS
    if (
      name.includes('createfile') ||
      name.includes('write') ||
      name.includes('modify') ||
      name.includes('move') ||
      name.includes('rename') ||
      name.includes('repair') ||
      name.includes('workflow.execute') ||
      (name.includes('filesystem') && (args.action === 'write' || args.action === 'move'))
    ) {
      return {
        level: 'MEDIUM',
        reason: `File mutation or application workflow state modification: ${toolName}`,
        requiresPreview: true,
        requiresConfirmation: false,
        reversible: true
      }
    }

    // LOW RISK ACTIONS (Reads, diagnostics, search, status)
    return {
      level: 'LOW',
      reason: 'Safe read-only or non-destructive operation',
      requiresPreview: false,
      requiresConfirmation: false,
      reversible: true
    }
  }

  logRiskEvent(toolName: string, target: string, assessment: RiskAssessment, approved: boolean): void {
    try {
      memoryDatabase.recordRiskEvent({
        toolName,
        target,
        riskLevel: assessment.level,
        reason: assessment.reason,
        approved
      })
    } catch (err) {
      console.warn('[RiskEngine] Failed to log risk event:', err)
    }
  }
}

export const actionRiskEngine = new ActionRiskEngine()
