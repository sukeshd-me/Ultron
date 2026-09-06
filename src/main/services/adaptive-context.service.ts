import { goalMemoryService } from './goal-memory.service'
import { memoryDatabase } from '../database/memory.db'

export interface RankedContext {
  activeGoal?: any
  recentConversation: any[]
  screenContext?: any
  preferences: Record<string, any>
  systemHealth: string
}

export class AdaptiveContextManager {
  rankAndSelectContext(query: string, currentWorkspace?: string): RankedContext {
    // 1. Resolve relevant active goal
    const activeGoal = goalMemoryService.findRelevantGoal(query, currentWorkspace)

    // 2. Fetch recent conversation turns (keep to last 4 turns for low latency)
    const recent = memoryDatabase.listMemories('conversation', 4)

    // 3. Screen memory if query mentions screen or visual
    let screenContext: any = null
    const lower = query.toLowerCase()
    if (lower.includes('screen') || lower.includes('look') || lower.includes('error') || lower.includes('window')) {
      screenContext = memoryDatabase.getLatestScreenContext()
    }

    // 4. Relevant preferences
    const preferences: Record<string, any> = {}
    const prefsList = memoryDatabase.listPreferences()
    for (const p of prefsList) {
      preferences[p.key] = p.value
    }

    return {
      activeGoal: activeGoal || undefined,
      recentConversation: recent,
      screenContext: screenContext || undefined,
      preferences,
      systemHealth: 'Healthy'
    }
  }
}

export const adaptiveContextManager = new AdaptiveContextManager()
