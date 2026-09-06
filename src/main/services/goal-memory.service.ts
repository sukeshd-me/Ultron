import { memoryDatabase } from '../database/memory.db'
import { Goal, GoalStatus, GoalLink } from '../../shared/types'

export class GoalMemoryService {
  createGoal(title: string, project: string, metadata?: Record<string, any>): Goal {
    const record = memoryDatabase.createGoal({ title, project, status: 'ACTIVE', metadata })
    return record
  }

  updateGoalStatus(id: string, status: GoalStatus): boolean {
    return memoryDatabase.updateGoal(id, { status })
  }

  updateGoal(id: string, updates: { title?: string; status?: GoalStatus; metadata?: Record<string, any> }): boolean {
    return memoryDatabase.updateGoal(id, updates)
  }

  getGoal(id: string): Goal | null {
    return memoryDatabase.getGoal(id)
  }

  listGoals(project?: string): Goal[] {
    return memoryDatabase.listGoals(project)
  }

  getActiveGoals(): Goal[] {
    const all = memoryDatabase.listGoals()
    return all.filter((g: Goal) => g.status === 'ACTIVE')
  }

  linkItem(goalId: string, linkType: 'mission' | 'task' | 'file' | 'git' | 'decision', targetId: string, title: string): GoalLink {
    return memoryDatabase.linkGoalItem({ goalId, linkType, targetId, title })
  }

  deleteGoal(id: string): boolean {
    return memoryDatabase.deleteGoal(id)
  }

  /**
   * Find goal context for resuming ongoing work
   */
  findRelevantGoal(query: string, currentProject?: string): Goal | null {
    const goals = this.listGoals(currentProject)
    const active = goals.filter((g) => g.status === 'ACTIVE')
    if (active.length === 0) return null

    const lower = query.toLowerCase()
    for (const g of active) {
      if (lower.includes(g.title.toLowerCase()) || lower.includes(g.project.toLowerCase())) {
        return this.getGoal(g.id)
      }
    }
    // Default to most recently updated active goal
    return this.getGoal(active[0].id)
  }
}

export const goalMemoryService = new GoalMemoryService()
