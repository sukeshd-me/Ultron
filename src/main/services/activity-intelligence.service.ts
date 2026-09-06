// src/main/services/activity-intelligence.service.ts — Recent Activity Intelligence for ULTRON V1.0.8
import { memoryDatabase } from '../database/memory.db'
import { ActivitySummary } from '../../shared/types'

export class ActivityIntelligenceService {
  /**
   * Generate an honest activity summary for a time window ("today", "yesterday", "recent")
   */
  async getActivitySummary(period: 'today' | 'yesterday' | 'week' = 'today'): Promise<ActivitySummary> {
    const now = Date.now()
    let startTime = now - 24 * 60 * 60 * 1000
    if (period === 'yesterday') {
      startTime = now - 48 * 60 * 60 * 1000
    } else if (period === 'week') {
      startTime = now - 7 * 24 * 60 * 60 * 1000
    }

    const tasks = memoryDatabase.getTaskHistory ? memoryDatabase.getTaskHistory({ limit: 100 }) : []
    const missions = memoryDatabase.getMissions ? memoryDatabase.getMissions() : []
    const gitActivity = memoryDatabase.getRecentGitActivity(undefined, 20)

    const projectsAccessed = new Set<string>(['ULTRON'])
    const workspacesUsed = new Set<string>(['Development'])
    const highlights: string[] = []

    // Tasks highlights
    let tasksCount = 0
    for (const t of tasks) {
      if (t.timestamp >= startTime) {
        tasksCount++
        if (t.intent && !highlights.some(h => h.includes(t.intent))) {
          highlights.push(`Executed ${t.intent} (${t.status})`)
        }
      }
    }

    // Completed missions
    let missionsCompleted = 0
    for (const m of missions) {
      if (m.status === 'COMPLETED') {
        missionsCompleted++
        highlights.push(`Completed Mission: "${m.title}"`)
      }
    }

    // Git commits
    let gitCommitsCount = 0
    for (const g of gitActivity) {
      if (g.timestamp >= startTime) {
        gitCommitsCount++
        highlights.push(`Commit on ${g.branch}: ${g.commitMsg.slice(0, 50)}`)
      }
    }

    return {
      period,
      projectsAccessed: Array.from(projectsAccessed),
      tasksCount,
      missionsCompleted,
      workspacesUsed: Array.from(workspacesUsed),
      gitCommitsCount,
      recentHighlights: highlights.slice(0, 8),
      generatedAt: Date.now()
    }
  }
}

export const activityIntelligenceService = new ActivityIntelligenceService()