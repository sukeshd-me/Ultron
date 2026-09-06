// src/main/services/mission.service.ts — Agent Mission Engine for ULTRON V1.0.8 (DAG, Parallel Execution & Checkpoints)
import { v4 as uuidv4 } from 'uuid'
import { memoryDatabase } from '../database/memory.db'
import { toolsRegistry } from './tools.registry'
import { permissionsService } from './permissions.service'
import { agentStateMachine } from './state-machine.service'
import { taskHistoryService } from './task-history.service'
import { notificationService } from './notification.service'
import { actionRiskEngine } from './risk-engine.service'
import {
  Mission,
  MissionStep,
  MissionStatus,
  MissionStepStatus,
  ActionPreview,
  MissionCheckpoint,
  MissionDependency,
  RiskLevel
} from '../../shared/types'

export class MissionService {
  private activeMissionId: string | null = null
  private isPaused = false
  private updateListeners: Set<(missions: Mission[]) => void> = new Set()
  private previewListeners: Set<(preview: ActionPreview) => void> = new Set()
  private checkpointListeners: Set<(checkpoint: MissionCheckpoint) => void> = new Set()
  private pendingPreviews: Map<string, { missionId: string; resolve: (approved: boolean) => void }> = new Map()
  private pendingCheckpoints: Map<string, { resolve: (action: 'APPROVED' | 'EDITED' | 'CANCELLED') => void }> = new Map()

  subscribeUpdates(callback: (missions: Mission[]) => void): () => void {
    this.updateListeners.add(callback)
    return () => this.updateListeners.delete(callback)
  }

  subscribePreviews(callback: (preview: ActionPreview) => void): () => void {
    this.previewListeners.add(callback)
    return () => this.previewListeners.delete(callback)
  }

  subscribeCheckpoints(callback: (checkpoint: MissionCheckpoint) => void): () => void {
    this.checkpointListeners.add(callback)
    return () => this.checkpointListeners.delete(callback)
  }

  private notifyUpdates(): void {
    const list = this.listMissions()
    for (const listener of this.updateListeners) {
      try { listener(list) } catch {}
    }
  }

  listMissions(limit = 50): Mission[] {
    return memoryDatabase.listMissions(limit)
  }

  getMission(id: string): Mission | null {
    return memoryDatabase.getMission(id)
  }

  createMission(data: {
    title: string
    description: string
    steps?: Array<{
      title: string
      description: string
      tool?: string
      args?: any
      requiredPermission?: string
      dependencies?: string[]
    }>
  }): Mission {
    const mission = memoryDatabase.createMission({
      title: data.title,
      description: data.description,
      status: 'READY'
    })

    if (data.steps && data.steps.length > 0) {
      data.steps.forEach((s, idx) => {
        const stepId = uuidv4()
        memoryDatabase.saveMissionStep({
          id: stepId,
          missionId: mission.id,
          stepNumber: idx + 1,
          title: s.title,
          description: s.description,
          status: 'PLANNED',
          dependencies: s.dependencies || (idx > 0 ? [mission.steps?.[idx - 1]?.id || ''] : []),
          tool: s.tool,
          args: s.args,
          requiredPermission: s.requiredPermission,
          retryCount: 0,
          maxRetries: 2
        })

        // Record DAG dependency in database
        if (s.dependencies && s.dependencies.length > 0) {
          for (const depId of s.dependencies) {
            if (depId) {
              memoryDatabase.addMissionDependency({
                missionId: mission.id,
                stepId,
                dependsOnStepId: depId,
                failurePolicy: 'ABORT'
              })
            }
          }
        }
      })
    }

    const full = memoryDatabase.getMission(mission.id)!
    this.notifyUpdates()
    return full
  }

  /**
   * Request pre-execution action preview for impactful missions
   */
  async requestActionPreview(mission: Mission): Promise<boolean> {
    const previewId = `preview-${mission.id}-${Date.now()}`
    const plannedActions = mission.steps.map((s) => ({
      id: s.id,
      type: s.tool || 'system.action',
      target: s.args?.path || s.args?.query || s.args?.command || s.title,
      description: s.description || s.title,
      reversible: s.tool ? !s.tool.includes('delete') && !s.tool.includes('rm') : true,
      requiredPermission: s.requiredPermission
    }))

    const preview: ActionPreview = {
      id: previewId,
      missionId: mission.id,
      title: mission.title,
      description: mission.description,
      impactLevel: mission.steps.some(s => s.tool?.includes('build') || s.tool?.includes('write') || s.tool?.includes('delete')) ? 'HIGH' : 'MEDIUM',
      plannedActions,
      status: 'PENDING',
      createdAt: Date.now()
    }

    return new Promise<boolean>((resolve) => {
      this.pendingPreviews.set(previewId, { missionId: mission.id, resolve })
      for (const listener of this.previewListeners) {
        try { listener(preview) } catch {}
      }
    })
  }

  respondToPreview(previewId: string, approved: boolean): boolean {
    const pending = this.pendingPreviews.get(previewId)
    if (!pending) return false
    this.pendingPreviews.delete(previewId)
    pending.resolve(approved)
    return true
  }

  /**
   * Checkpoint Resolution (Human-in-the-Loop)
   */
  resolveCheckpoint(checkpointId: string, action: 'APPROVED' | 'EDITED' | 'CANCELLED'): boolean {
    const pending = this.pendingCheckpoints.get(checkpointId)
    if (!pending) return false
    this.pendingCheckpoints.delete(checkpointId)
    memoryDatabase.resolveMissionCheckpoint(checkpointId, action)
    pending.resolve(action)
    return true
  }

  getCheckpoints(missionId: string): MissionCheckpoint[] {
    return memoryDatabase.getMissionCheckpoints(missionId)
  }

  async startMission(id: string): Promise<Mission> {
    const mission = memoryDatabase.getMission(id)
    if (!mission) throw new Error(`Mission ${id} not found`)

    this.activeMissionId = id
    this.isPaused = false
    const startedAt = Date.now()
    memoryDatabase.updateMission(id, { status: 'RUNNING', startedAt })
    agentStateMachine.transitionTo('MISSION_RUNNING', { missionId: id })

    taskHistoryService.record({
      timestamp: startedAt,
      missionId: id,
      userRequest: mission.title,
      intent: 'mission.execute',
      skill: 'system',
      status: 'WAITING',
      startTime: startedAt,
      endTime: startedAt,
      durationMs: 0,
      category: 'MISSIONS',
      resultSummary: `Mission "${mission.title}" started with ${mission.steps.length} steps`
    })

    this.notifyUpdates()

    // Execute steps with DAG dependency evaluation and parallel execution where safe
    this.executeMissionDAG(id).catch((err) => {
      console.error(`[MissionService] Mission ${id} execution error:`, err)
    })

    return memoryDatabase.getMission(id)!
  }

  /**
   * Parallel Mission Execution 2.0 with DAG dependency resolution & Checkpoints
   */
  private async executeMissionDAG(missionId: string): Promise<void> {
    while (this.activeMissionId === missionId) {
      if (this.isPaused) {
        await new Promise((r) => setTimeout(r, 500))
        continue
      }

      const steps = memoryDatabase.getMissionSteps(missionId)
      const pendingSteps = steps.filter(s => s.status === 'PLANNED' || s.status === 'READY')

      if (pendingSteps.length === 0) {
        // Check if any steps are currently running
        const runningSteps = steps.filter(s => s.status === 'RUNNING')
        if (runningSteps.length === 0) {
          // All steps completed or handled
          break
        }
        await new Promise((r) => setTimeout(r, 300))
        continue
      }

      // Find ready steps whose dependencies are satisfied
      const completedStepIds = new Set(steps.filter(s => s.status === 'COMPLETED').map(s => s.id))
      const failedStepIds = new Set(steps.filter(s => s.status === 'FAILED').map(s => s.id))

      const readyToRun: MissionStep[] = []

      for (const step of pendingSteps) {
        const deps = step.dependencies || []
        const hasFailedDep = deps.some(d => failedStepIds.has(d))
        if (hasFailedDep) {
          // Mark step skipped or aborted based on policy
          memoryDatabase.updateMissionStep(step.id, {
            status: 'SKIPPED',
            completedAt: Date.now(),
            error: 'Prerequisite step failed.'
          })
          continue
        }

        const allDepsSatisfied = deps.length === 0 || deps.every(d => completedStepIds.has(d))
        if (allDepsSatisfied) {
          readyToRun.push(step)
        }
      }

      if (readyToRun.length === 0) {
        // No steps can run right now, wait or check if blocked
        const running = steps.filter(s => s.status === 'RUNNING')
        if (running.length === 0) {
          // Deadlock or finished
          break
        }
        await new Promise((r) => setTimeout(r, 300))
        continue
      }

      // Parallel execution of independent steps
      await Promise.allSettled(readyToRun.map(step => this.executeSingleStep(missionId, step)))
      this.notifyUpdates()
    }

    // Complete mission
    const finalSteps = memoryDatabase.getMissionSteps(missionId)
    const hasFailures = finalSteps.some(s => s.status === 'FAILED')
    const finalStatus: MissionStatus = hasFailures ? 'FAILED' : 'COMPLETED'

    const mission = memoryDatabase.getMission(missionId)
    const completedAt = Date.now()
    const totalDurationMs = mission?.startedAt ? completedAt - mission.startedAt : 0
    memoryDatabase.updateMission(missionId, { status: finalStatus, completedAt, totalDurationMs })
    agentStateMachine.transitionTo(hasFailures ? 'ERROR' : 'SUCCESS', { missionId })
    this.activeMissionId = null
    this.notifyUpdates()

    notificationService.sendNotification(
      hasFailures ? 'Mission Completed with Warnings' : 'Mission Completed',
      `Mission "${mission?.title}" finished in ${(totalDurationMs / 1000).toFixed(1)}s (${finalStatus}).`,
      hasFailures ? 'warning' : 'success'
    )
  }

  private async executeSingleStep(missionId: string, step: MissionStep): Promise<void> {
    const stepStart = Date.now()

    // 1. Human-in-the-Loop Checkpoint evaluation
    const isHighRisk = step.tool && (
      step.tool.includes('delete') ||
      step.tool.includes('rm') ||
      step.tool.includes('push') ||
      step.tool.includes('publish') ||
      step.tool.includes('format') ||
      step.requiredPermission
    )

    if (isHighRisk) {
      const checkpoint = memoryDatabase.createMissionCheckpoint({
        missionId,
        stepId: step.id,
        reason: `High-risk operation detected in step "${step.title}" (${step.tool || 'Action'}). User checkpoint confirmation required.`,
        riskLevel: 'HIGH',
        status: 'PENDING'
      })

      // Notify UI
      for (const l of this.checkpointListeners) {
        try { l(checkpoint) } catch {}
      }

      agentStateMachine.transitionTo('WAITING_PERMISSION', { stepId: step.id, checkpointId: checkpoint.id })
      this.notifyUpdates()

      // Wait for checkpoint resolution
      const decision = await new Promise<'APPROVED' | 'EDITED' | 'CANCELLED'>((resolve) => {
        this.pendingCheckpoints.set(checkpoint.id, { resolve })
      })

      if (decision === 'CANCELLED') {
        memoryDatabase.updateMissionStep(step.id, {
          status: 'SKIPPED',
          completedAt: Date.now(),
          error: 'Cancelled at human checkpoint.'
        })
        return
      }
    }

    // Mark step running
    memoryDatabase.updateMissionStep(step.id, { status: 'RUNNING', startedAt: stepStart })
    agentStateMachine.transitionTo('EXECUTING', { stepId: step.id })
    this.notifyUpdates()

    try {
      let result: any = null
      if (step.tool) {
        result = await toolsRegistry.execute(step.tool, step.args || {})
        if (result && result.success === false) {
          throw new Error(result.error || 'Tool execution failed')
        }
      } else {
        await new Promise((r) => setTimeout(r, 600))
        result = { success: true, message: `Step "${step.title}" executed successfully` }
      }

      const durationMs = parseFloat((Date.now() - stepStart).toFixed(2))
      memoryDatabase.updateMissionStep(step.id, {
        status: 'COMPLETED',
        completedAt: Date.now(),
        durationMs,
        result
      })

      taskHistoryService.record({
        timestamp: Date.now(),
        missionId,
        userRequest: step.title,
        intent: 'mission.step',
        skill: 'system',
        tool: step.tool,
        status: 'SUCCESS',
        startTime: stepStart,
        endTime: Date.now(),
        durationMs,
        category: 'MISSIONS',
        resultSummary: step.description || step.title
      })
    } catch (err: any) {
      const durationMs = parseFloat((Date.now() - stepStart).toFixed(2))
      memoryDatabase.updateMissionStep(step.id, {
        status: 'FAILED',
        completedAt: Date.now(),
        durationMs,
        error: err.message
      })

      taskHistoryService.record({
        timestamp: Date.now(),
        missionId,
        userRequest: step.title,
        intent: 'mission.step',
        skill: 'system',
        tool: step.tool,
        status: 'FAILED',
        startTime: stepStart,
        endTime: Date.now(),
        durationMs,
        error: err.message,
        category: 'MISSIONS'
      })
    }
  }

  pauseMission(id: string): boolean {
    if (this.activeMissionId === id) {
      this.isPaused = true
      memoryDatabase.updateMission(id, { status: 'PAUSED' })
      this.notifyUpdates()
      return true
    }
    return false
  }

  resumeMission(id: string): boolean {
    if (this.activeMissionId === id && this.isPaused) {
      this.isPaused = false
      memoryDatabase.updateMission(id, { status: 'RUNNING' })
      this.notifyUpdates()
      return true
    }
    return false
  }

  cancelMission(id: string): boolean {
    if (this.activeMissionId === id) {
      this.activeMissionId = null
      this.isPaused = false
    }
    memoryDatabase.updateMission(id, { status: 'CANCELLED' })
    agentStateMachine.transitionTo('IDLE')
    this.notifyUpdates()
    return true
  }

  async retryStep(missionId: string, stepId: string): Promise<boolean> {
    const steps = memoryDatabase.getMissionSteps(missionId)
    const step = steps.find((s) => s.id === stepId)
    if (!step) return false

    memoryDatabase.updateMissionStep(stepId, {
      status: 'READY',
      retryCount: (step.retryCount || 0) + 1,
      error: undefined
    })
    memoryDatabase.updateMission(missionId, { status: 'RUNNING' })
    this.activeMissionId = missionId
    this.isPaused = false
    this.notifyUpdates()

    this.executeMissionDAG(missionId).catch(() => {})
    return true
  }
}

export const missionService = new MissionService()
