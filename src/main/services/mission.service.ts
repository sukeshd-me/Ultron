// src/main/services/mission.service.ts — Agent Mission Engine for ULTRON V1.0.5
import { v4 as uuidv4 } from 'uuid'
import { memoryDatabase } from '../database/memory.db'
import { toolsRegistry } from './tools.registry'
import { permissionsService } from './permissions.service'
import { agentStateMachine } from './state-machine.service'
import { taskHistoryService } from './task-history.service'
import { notificationService } from './notification.service'
import { Mission, MissionStep, MissionStatus, MissionStepStatus, ActionPreview } from '../../shared/types'

export class MissionService {
  private activeMissionId: string | null = null
  private isPaused = false
  private updateListeners: Set<(missions: Mission[]) => void> = new Set()
  private previewListeners: Set<(preview: ActionPreview) => void> = new Set()
  private pendingPreviews: Map<string, { missionId: string; resolve: (approved: boolean) => void }> = new Map()

  subscribeUpdates(callback: (missions: Mission[]) => void): () => void {
    this.updateListeners.add(callback)
    return () => this.updateListeners.delete(callback)
  }

  subscribePreviews(callback: (preview: ActionPreview) => void): () => void {
    this.previewListeners.add(callback)
    return () => this.previewListeners.delete(callback)
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
    }>
  }): Mission {
    const mission = memoryDatabase.createMission({
      title: data.title,
      description: data.description,
      status: 'READY'
    })

    if (data.steps && data.steps.length > 0) {
      data.steps.forEach((s, idx) => {
        memoryDatabase.saveMissionStep({
          id: uuidv4(),
          missionId: mission.id,
          stepNumber: idx + 1,
          title: s.title,
          description: s.description,
          status: 'PLANNED',
          dependencies: idx > 0 ? [mission.steps[idx - 1]?.id || ''] : [],
          tool: s.tool,
          args: s.args,
          requiredPermission: s.requiredPermission,
          retryCount: 0,
          maxRetries: 2
        })
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

    // Execute steps sequentially
    this.executeMissionSteps(id).catch((err) => {
      console.error(`[MissionService] Mission ${id} execution error:`, err)
    })

    return memoryDatabase.getMission(id)!
  }

  private async executeMissionSteps(missionId: string): Promise<void> {
    const steps = memoryDatabase.getMissionSteps(missionId)

    for (const step of steps) {
      if (this.activeMissionId !== missionId) {
        // Mission was cancelled
        break
      }

      while (this.isPaused) {
        await new Promise((r) => setTimeout(r, 500))
        if (this.activeMissionId !== missionId) break
      }

      // Check permissions
      if (step.requiredPermission) {
        const canExecute = await permissionsService.verifyPermission(step.requiredPermission as any, step.title, 'MEDIUM')
        if (!canExecute) {
          memoryDatabase.updateMissionStep(step.id, {
            status: 'WAITING_PERMISSION',
            error: `Permission required for ${step.requiredPermission}`
          })
          agentStateMachine.transitionTo('WAITING_PERMISSION', { stepId: step.id })
          this.notifyUpdates()
          notificationService.sendNotification(
            'Permission Required',
            `Step "${step.title}" is waiting for permission approval.`,
            'warning'
          )
          return
        }
      }

      // Mark step running
      const stepStart = Date.now()
      memoryDatabase.updateMissionStep(step.id, { status: 'RUNNING', startedAt: stepStart })
      this.notifyUpdates()

      try {
        let result: any = null
        if (step.tool) {
          result = await toolsRegistry.execute(step.tool, step.args || {})
          if (result && result.success === false) {
            throw new Error(result.error || 'Tool execution failed')
          }
        } else {
          // Simulated step completion
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

        this.notifyUpdates()
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

        memoryDatabase.updateMission(missionId, { status: 'FAILED' })
        agentStateMachine.transitionTo('ERROR', { missionId, stepId: step.id })
        this.activeMissionId = null
        this.notifyUpdates()

        notificationService.sendNotification(
          'Mission Failed',
          `Mission step "${step.title}" failed: ${err.message}`,
          'error'
        )
        return
      }
    }

    // All steps completed
    const mission = memoryDatabase.getMission(missionId)
    const completedAt = Date.now()
    const totalDurationMs = mission?.startedAt ? completedAt - mission.startedAt : 0
    memoryDatabase.updateMission(missionId, { status: 'COMPLETED', completedAt, totalDurationMs })
    agentStateMachine.transitionTo('SUCCESS', { missionId })
    this.activeMissionId = null
    this.notifyUpdates()

    notificationService.sendNotification(
      'Mission Completed',
      `Mission "${mission?.title}" completed successfully in ${(totalDurationMs / 1000).toFixed(1)}s.`,
      'success'
    )
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

    this.executeMissionSteps(missionId).catch(() => {})
    return true
  }
}

export const missionService = new MissionService()
