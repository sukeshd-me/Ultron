import { AgentDebugEvent, RiskLevel } from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'

export class AgentDebuggerService {
  recordEvent(event: Omit<AgentDebugEvent, 'id' | 'timestamp'>): AgentDebugEvent {
    try {
      return memoryDatabase.recordAgentDebugEvent({
        requestId: event.requestId,
        stage: event.stage,
        intent: event.intent,
        model: event.model,
        skill: event.skill,
        tools: event.tools,
        risk: event.risk,
        permission: event.permission,
        execution: event.execution,
        verification: event.verification,
        recovery: event.recovery,
        result: event.result
      })
    } catch (err) {
      console.warn('[AgentDebugger] Failed to record debug event:', err)
      return {
        id: 'fallback',
        timestamp: Date.now(),
        ...event
      }
    }
  }

  listEvents(limit = 100): AgentDebugEvent[] {
    return memoryDatabase.listAgentDebugEvents(limit)
  }

  clearEvents(): boolean {
    return memoryDatabase.clearAgentDebugEvents()
  }
}

export const agentDebuggerService = new AgentDebuggerService()
