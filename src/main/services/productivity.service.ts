import { memoryDatabase } from '../database/memory.db'
import { ProductivitySummary, ProactiveSuggestion } from '../../shared/types'

export class ProductivityService {
  recordMissionComplete(durationMs: number, project: string): void {
    const date = new Date().toISOString().split('T')[0]
    memoryDatabase.recordProductivityMetric(date, {
      missionsCompleted: 1,
      avgDurationMs: durationMs,
      activeProject: project
    })
  }

  recordTaskComplete(taskName: string): void {
    const date = new Date().toISOString().split('T')[0]
    const toolsUsed: Record<string, number> = {}
    toolsUsed[taskName] = 1
    memoryDatabase.recordProductivityMetric(date, {
      tasksCompleted: 1,
      toolsUsed
    })
  }

  recordTaskFailure(error: string): void {
    const date = new Date().toISOString().split('T')[0]
    memoryDatabase.recordProductivityMetric(date, {
      failedTasks: 1
    })
  }

  getSummary(): ProductivitySummary {
    return memoryDatabase.getProductivitySummary()
  }

  clearMetrics(): boolean {
    return memoryDatabase.clearProductivityMetrics()
  }

  generateSuggestion(triggerEvent: string, text: string, actionPayload?: Record<string, any>): ProactiveSuggestion {
    return memoryDatabase.recordProactiveSuggestion({
      triggerEvent,
      suggestion: text,
      actionPayload
    })
  }

  listPendingSuggestions(): ProactiveSuggestion[] {
    return memoryDatabase.listProactiveSuggestions()
  }

  updateSuggestionStatus(id: string, status: 'ACCEPTED' | 'DISMISSED'): boolean {
    return memoryDatabase.updateSuggestionStatus(id, status)
  }
}

export const productivityService = new ProductivityService()
