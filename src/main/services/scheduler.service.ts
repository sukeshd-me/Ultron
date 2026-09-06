// src/main/services/scheduler.service.ts — Scheduled Missions Engine for ULTRON V1.0.7
import { v4 as uuidv4 } from 'uuid'
import { ScheduledMission } from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'
import { missionService } from './mission.service'

export class SchedulerService {
  private ticker: NodeJS.Timeout | null = null

  constructor() {
    this.startTicker()
  }

  /**
   * Calculate the next timestamp for a given recurrence pattern
   */
  calculateNextRun(recurrence: ScheduledMission['recurrence'], baseTime = Date.now()): number {
    const oneHour = 3600 * 1000
    const oneDay = 24 * oneHour
    const oneWeek = 7 * oneDay

    switch (recurrence) {
      case 'daily':
        return baseTime + oneDay
      case 'weekly':
        return baseTime + oneWeek
      case 'one_time':
      case 'custom':
      default:
        return baseTime + oneHour
    }
  }

  /**
   * Schedule a new or recurring mission
   */
  scheduleMission(params: {
    title: string
    goal: string
    recurrence: ScheduledMission['recurrence']
    cronOrSchedule?: string
    nextRunAt?: number
  }): ScheduledMission {
    const id = uuidv4()
    const now = Date.now()
    const nextRunAt = params.nextRunAt || this.calculateNextRun(params.recurrence, now)

    const mission: ScheduledMission = {
      id,
      title: params.title,
      goal: params.goal,
      recurrence: params.recurrence,
      cronOrSchedule: params.cronOrSchedule || params.recurrence,
      nextRunAt,
      status: 'SCHEDULED',
      createdAt: now
    }

    return memoryDatabase.saveScheduledMission(mission)
  }

  /**
   * List all scheduled missions
   */
  listScheduledMissions(): ScheduledMission[] {
    return memoryDatabase.listScheduledMissions()
  }

  /**
   * Pause a scheduled mission
   */
  pauseMission(id: string): boolean {
    return memoryDatabase.updateScheduledMissionStatus(id, 'PAUSED')
  }

  /**
   * Resume a paused mission
   */
  resumeMission(id: string): boolean {
    return memoryDatabase.updateScheduledMissionStatus(id, 'SCHEDULED')
  }

  /**
   * Cancel a scheduled mission
   */
  cancelMission(id: string): boolean {
    return memoryDatabase.updateScheduledMissionStatus(id, 'CANCELLED')
  }

  /**
   * Delete a scheduled mission entirely
   */
  deleteMission(id: string): boolean {
    return memoryDatabase.deleteScheduledMission(id)
  }

  /**
   * Run a scheduled mission immediately
   */
  async runNow(id: string): Promise<{ success: boolean; missionId?: string; message: string }> {
    const missions = memoryDatabase.listScheduledMissions()
    const sched = missions.find(m => m.id === id)
    if (!sched) {
      return { success: false, message: `Scheduled mission "${id}" not found.` }
    }

    try {
      // Create executable mission in core mission engine
      const mission = missionService.createMission({
        title: sched.title,
        description: sched.goal,
        steps: [
          {
            title: 'Analyze Goal & Prepare Environment',
            description: sched.goal
          },
          {
            title: 'Verify Results',
            description: 'Verify execution state and finalize summary'
          }
        ]
      })

      // Update last run time and compute next recurrence
      const now = Date.now()
      sched.lastRunAt = now
      if (sched.recurrence === 'one_time') {
        sched.status = 'COMPLETED'
      } else {
        sched.nextRunAt = this.calculateNextRun(sched.recurrence, now)
      }
      memoryDatabase.saveScheduledMission(sched)

      return {
        success: true,
        missionId: mission.id,
        message: `Triggered scheduled mission "${sched.title}". Next run: ${new Date(sched.nextRunAt).toLocaleString()}.`
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to trigger scheduled mission: ${err.message}`
      }
    }
  }

  private startTicker() {
    if (this.ticker) return
    this.ticker = setInterval(() => {
      this.checkDueMissions()
    }, 30000) // check every 30s
  }

  private async checkDueMissions() {
    const now = Date.now()
    const missions = memoryDatabase.listScheduledMissions()

    for (const m of missions) {
      if (m.status === 'SCHEDULED' && m.nextRunAt <= now) {
        try {
          await this.runNow(m.id)
        } catch (err) {
          console.warn(`[SchedulerService] Execution failed for ${m.id}:`, err)
        }
      }
    }
  }
}

export const schedulerService = new SchedulerService()
