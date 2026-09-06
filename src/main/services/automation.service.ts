// src/main/services/automation.service.ts — Visual + Natural Language Automation Engine for ULTRON V1.0.7
import { v4 as uuidv4 } from 'uuid'
import {
  AutomationDefinition,
  AutomationRun,
  AutomationCondition,
  AutomationAction,
  RiskLevel
} from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'
import { actionRiskEngine } from './risk-engine.service'
import { toolsRegistry } from './tools.registry'

export class AutomationService {
  /**
   * List all configured automations
   */
  listAutomations(): AutomationDefinition[] {
    return memoryDatabase.listAutomations()
  }

  /**
   * Retrieve automation by ID
   */
  getAutomation(id: string): AutomationDefinition | null {
    return memoryDatabase.getAutomation(id)
  }

  /**
   * Create or update an automation definition
   */
  saveAutomation(def: Omit<AutomationDefinition, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): AutomationDefinition {
    const id = def.id || uuidv4()
    const now = Date.now()

    // Validate risk level for actions
    const validatedActions = def.actions.map(action => {
      const assessment = actionRiskEngine.assessRisk(action.tool, action.args)
      return {
        ...action,
        riskLevel: assessment.level,
        requiresPermission: assessment.requiresConfirmation
      }
    })

    const automation: AutomationDefinition = {
      id,
      name: def.name,
      description: def.description || '',
      triggerType: def.triggerType,
      eventType: def.eventType,
      cronExpression: def.cronExpression,
      timeSchedule: def.timeSchedule,
      conditions: def.conditions || [],
      actions: validatedActions,
      enabled: def.enabled !== false,
      createdAt: now,
      updatedAt: now
    }

    return memoryDatabase.saveAutomation(automation)
  }

  /**
   * Delete an automation
   */
  deleteAutomation(id: string): boolean {
    return memoryDatabase.deleteAutomation(id)
  }

  /**
   * Toggle enabled state
   */
  toggleAutomation(id: string, enabled: boolean): boolean {
    return memoryDatabase.toggleAutomation(id, enabled)
  }

  /**
   * Evaluate conditions against contextual event data
   */
  private evaluateConditions(conditions: AutomationCondition[], contextData: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) return true

    for (const cond of conditions) {
      const val = contextData[cond.field]
      switch (cond.operator) {
        case 'equals':
          if (val !== cond.value) return false
          break
        case 'contains':
          if (typeof val === 'string' && !val.includes(cond.value)) return false
          break
        case 'greater_than':
          if (typeof val === 'number' && val <= cond.value) return false
          break
        case 'less_than':
          if (typeof val === 'number' && val >= cond.value) return false
          break
      }
    }
    return true
  }

  /**
   * Execute an automation rule safely
   * High-impact actions require explicit permission and cannot bypass the permission center
   */
  async executeAutomation(
    id: string,
    contextData: Record<string, any> = {},
    permissionGranted = false
  ): Promise<AutomationRun> {
    const startMs = performance.now()
    const auto = this.getAutomation(id)

    if (!auto) {
      throw new Error(`Automation "${id}" not found.`)
    }

    if (!auto.enabled) {
      return memoryDatabase.recordAutomationRun({
        automationId: id,
        status: 'CANCELLED',
        actionsCount: 0,
        error: 'Automation is disabled.',
        durationMs: 0
      })
    }

    // 1. Evaluate conditions
    const conditionsMet = this.evaluateConditions(auto.conditions, contextData)
    if (!conditionsMet) {
      return memoryDatabase.recordAutomationRun({
        automationId: id,
        status: 'SKIPPED' as any,
        actionsCount: 0,
        error: 'Conditions not satisfied.',
        durationMs: parseFloat((performance.now() - startMs).toFixed(2))
      })
    }

    // 2. Risk check: Ensure no action bypasses permissions
    const requiresPermission = auto.actions.some(a => a.requiresPermission || a.riskLevel === 'HIGH' || a.riskLevel === 'IRREVERSIBLE')

    if (requiresPermission && !permissionGranted) {
      return memoryDatabase.recordAutomationRun({
        automationId: id,
        status: 'WAITING_PERMISSION',
        actionsCount: auto.actions.length,
        error: 'Automation contains high-impact actions requiring user approval.',
        durationMs: parseFloat((performance.now() - startMs).toFixed(2))
      })
    }

    // 3. Execute actions sequentially
    let executedActions = 0
    let lastError: string | undefined

    for (const action of auto.actions) {
      try {
        await toolsRegistry.execute(action.tool, action.args)
        executedActions++
      } catch (err: any) {
        lastError = `Action ${action.tool} failed: ${err.message}`
        break
      }
    }

    const durationMs = parseFloat((performance.now() - startMs).toFixed(2))
    const status = lastError ? 'FAILED' : 'SUCCESS'

    return memoryDatabase.recordAutomationRun({
      automationId: id,
      status,
      actionsCount: executedActions,
      error: lastError,
      durationMs
    })
  }

  /**
   * List telemetry history of past runs
   */
  listRuns(limit = 50, automationId?: string): AutomationRun[] {
    return memoryDatabase.listAutomationRuns(limit, automationId)
  }
}

export const automationService = new AutomationService()
