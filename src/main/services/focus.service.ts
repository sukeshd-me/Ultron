// src/main/services/focus.service.ts — Focus Mode Subsystem for ULTRON V1.0.7
import { FocusModeType, FocusSession } from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'
import { appsService } from './apps.service'
import { windowManagerService } from './window-manager.service'

export class FocusService {
  private timer: NodeJS.Timeout | null = null
  private activeSessionId: string | null = null

  constructor() {
    // Resume existing active session on startup if any
    const active = memoryDatabase.getActiveFocusSession()
    if (active) {
      this.activeSessionId = active.id
      this.startTimer(active.id)
    }
  }

  /**
   * Start a dedicated Focus Session with designated mode and duration
   */
  async startFocus(
    mode: FocusModeType = 'Coding',
    durationMinutes = 45,
    customApps?: string[]
  ): Promise<{
    session: FocusSession
    message: string
    launchedApps: string[]
  }> {
    // 1. Determine target applications by mode
    let targetApps: string[] = customApps || []
    if (targetApps.length === 0) {
      switch (mode) {
        case 'Coding':
          targetApps = ['vscode', 'terminal']
          break
        case 'Research':
          targetApps = ['chrome']
          break
        case 'Study':
          targetApps = ['notepad']
          break
        case 'Writing':
          targetApps = ['notepad']
          break
        case 'General Focus':
        case 'Custom':
          targetApps = []
          break
      }
    }

    // 2. Launch/focus target applications safely without terminating others
    const launchedApps: string[] = []
    for (const app of targetApps) {
      try {
        const res = await appsService.launch(app)
        if (res.success) {
          launchedApps.push(app)
        }
      } catch {}
    }

    // 3. Save new session in SQLite
    const session = memoryDatabase.startFocusSession({
      mode,
      durationMinutes,
      startedAt: Date.now(),
      targetApps,
      notificationsMuted: true
    })

    this.activeSessionId = session.id
    this.startTimer(session.id)

    const message = `Started ${mode} Focus Mode for ${durationMinutes} minutes. ${
      launchedApps.length > 0 ? `Target apps active: ${launchedApps.join(', ')}.` : ''
    } Non-critical alerts are suppressed.`

    return { session, message, launchedApps }
  }

  /**
   * Stop active focus session
   */
  endFocus(): { success: boolean; message: string; elapsedMinutes: number } {
    this.stopTimer()

    const active = memoryDatabase.getActiveFocusSession()
    if (!active) {
      return { success: false, message: 'No active focus session to end.', elapsedMinutes: 0 }
    }

    memoryDatabase.endFocusSession(active.id)
    const elapsedMinutes = Math.max(1, Math.round(active.elapsedSeconds / 60))
    this.activeSessionId = null

    return {
      success: true,
      message: `Ended ${active.mode} Focus session. Completed ${elapsedMinutes} minute${elapsedMinutes === 1 ? '' : 's'} of deep work.`,
      elapsedMinutes
    }
  }

  /**
   * Get current active focus session status
   */
  getActiveSession(): FocusSession | null {
    return memoryDatabase.getActiveFocusSession()
  }

  /**
   * List past focus sessions
   */
  listSessions(limit = 20): FocusSession[] {
    return memoryDatabase.listFocusSessions(limit)
  }

  private startTimer(sessionId: string) {
    this.stopTimer()
    this.timer = setInterval(() => {
      const active = memoryDatabase.getActiveFocusSession()
      if (!active || active.id !== sessionId) {
        this.stopTimer()
        return
      }

      const newElapsed = active.elapsedSeconds + 1
      memoryDatabase.updateFocusSession(sessionId, newElapsed)

      // Auto-end if reached duration
      if (newElapsed >= active.durationMinutes * 60) {
        this.endFocus()
      }
    }, 1000)
  }

  private stopTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}

export const focusService = new FocusService()
