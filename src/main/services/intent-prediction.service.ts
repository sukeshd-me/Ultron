// src/main/services/intent-prediction.service.ts — Contextual Intent Prediction for ULTRON V1.0.8
import { memoryDatabase } from '../database/memory.db'
import { IntentResolutionRecord } from '../../shared/types'

export interface DisambiguationContext {
  activeWorkspace?: string
  activeProject?: string
  activeMission?: string
  currentTask?: string
  recentHistory?: Array<{ role: string; content: string }>
}

export interface IntentPredictionResult {
  isAmbiguous: boolean
  resolvedInput: string
  detectedTarget?: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'
  clarificationPrompt?: string
  resolvedFromContext: boolean
  reason: string
}

export class IntentPredictionService {
  private activeProject = 'ULTRON'
  private activeWorkspace = 'Development'
  private activeMission: string | null = null
  private currentTask: string | null = null

  setActiveContext(ctx: Partial<DisambiguationContext>): void {
    if (ctx.activeProject) this.activeProject = ctx.activeProject
    if (ctx.activeWorkspace) this.activeWorkspace = ctx.activeWorkspace
    if (ctx.activeMission !== undefined) this.activeMission = ctx.activeMission
    if (ctx.currentTask !== undefined) this.currentTask = ctx.currentTask
  }

  getActiveContext(): DisambiguationContext {
    return {
      activeProject: this.activeProject,
      activeWorkspace: this.activeWorkspace,
      activeMission: this.activeMission || undefined,
      currentTask: this.currentTask || undefined
    }
  }

  /**
   * Resolve pronouns and underspecified references using context
   * Example: "Open the project" -> "Open project ULTRON"
   * Example: "Run it" -> "Run active mission / task"
   */
  predictIntent(rawInput: string, context?: DisambiguationContext): IntentPredictionResult {
    const lower = rawInput.trim().toLowerCase()
    const ctx = { ...this.getActiveContext(), ...context }

    // 1. "Open the project" / "open project"
    if (lower === 'open the project' || lower === 'open project' || lower === 'start the project') {
      const targetProject = ctx.activeProject || 'ULTRON'
      const resolved = `open project ${targetProject}`
      this.record(rawInput, 'project.open', targetProject, 'HIGH', ctx)
      return {
        isAmbiguous: false,
        resolvedInput: resolved,
        detectedTarget: targetProject,
        confidence: 'HIGH',
        resolvedFromContext: true,
        reason: `Resolved "the project" to active project: "${targetProject}".`
      }
    }

    // 2. "Run it" / "Execute it" / "Start it"
    if (lower === 'run it' || lower === 'execute it' || lower === 'start it' || lower === 'continue it') {
      if (ctx.activeMission) {
        const resolved = `run mission ${ctx.activeMission}`
        this.record(rawInput, 'mission.run', ctx.activeMission, 'HIGH', ctx)
        return {
          isAmbiguous: false,
          resolvedInput: resolved,
          detectedTarget: ctx.activeMission,
          confidence: 'HIGH',
          resolvedFromContext: true,
          reason: `Resolved "it" to active mission: "${ctx.activeMission}".`
        }
      }
      if (ctx.currentTask) {
        const resolved = `execute task ${ctx.currentTask}`
        this.record(rawInput, 'task.execute', ctx.currentTask, 'MEDIUM', ctx)
        return {
          isAmbiguous: false,
          resolvedInput: resolved,
          detectedTarget: ctx.currentTask,
          confidence: 'MEDIUM',
          resolvedFromContext: true,
          reason: `Resolved "it" to current task: "${ctx.currentTask}".`
        }
      }

      return {
        isAmbiguous: true,
        resolvedInput: rawInput,
        confidence: 'LOW',
        clarificationPrompt: 'Which task, mission, or application would you like me to run?',
        resolvedFromContext: false,
        reason: 'No active mission or task in current context to safely resolve "it".'
      }
    }

    // 3. "Restore workspace" / "Open my workspace"
    if (lower === 'restore workspace' || lower === 'open my workspace' || lower === 'open the workspace') {
      const ws = ctx.activeWorkspace || 'Development'
      const resolved = `open workspace ${ws}`
      this.record(rawInput, 'workspace.open', ws, 'HIGH', ctx)
      return {
        isAmbiguous: false,
        resolvedInput: resolved,
        detectedTarget: ws,
        confidence: 'HIGH',
        resolvedFromContext: true,
        reason: `Resolved workspace reference to active workspace: "${ws}".`
      }
    }

    // 4. Consequential ambiguous references: "delete that file", "remove it", "terminate it"
    if (
      (lower.includes('delete') || lower.includes('remove') || lower.includes('terminate') || lower.includes('kill')) &&
      (lower.includes('that') || lower.includes('this') || lower.includes(' it') || lower.endsWith(' it')) &&
      !ctx.activeMission && !ctx.currentTask
    ) {
      return {
        isAmbiguous: true,
        resolvedInput: rawInput,
        confidence: 'LOW',
        clarificationPrompt: 'Please specify the exact file, process, or target you want to delete/terminate.',
        resolvedFromContext: false,
        reason: 'Consequential action references an ambiguous target without explicit context.'
      }
    }

    // Default: clear unambiguous input
    return {
      isAmbiguous: false,
      resolvedInput: rawInput,
      confidence: 'HIGH',
      resolvedFromContext: false,
      reason: 'Explicit request without unresolved contextual references.'
    }
  }

  private record(input: string, intent: string, target: string, confidence: string, ctx: Record<string, any>): void {
    try {
      memoryDatabase.recordIntentResolution({
        userInput: input,
        resolvedIntent: intent,
        resolvedTarget: target,
        confidence,
        disambiguationContext: ctx
      })
    } catch {}
  }
}

export const intentPredictionService = new IntentPredictionService()