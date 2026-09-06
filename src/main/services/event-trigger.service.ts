// src/main/services/event-trigger.service.ts — Event-Based Automation Triggers for ULTRON V1.0.7
import { v4 as uuidv4 } from 'uuid'
import { AutomationEventType, EventTrigger } from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'
import { automationService } from './automation.service'

export class EventTriggerService {
  /**
   * Register an event trigger linking an event type to an automation ID
   */
  registerTrigger(eventType: AutomationEventType, automationId: string): EventTrigger {
    const id = uuidv4()
    const trigger: EventTrigger = {
      id,
      eventType,
      automationId,
      enabled: true
    }
    return memoryDatabase.saveEventTrigger(trigger)
  }

  /**
   * Unregister an event trigger
   */
  unregisterTrigger(id: string): boolean {
    return memoryDatabase.deleteEventTrigger(id)
  }

  /**
   * List all registered event triggers
   */
  listTriggers(eventType?: AutomationEventType): EventTrigger[] {
    return memoryDatabase.listEventTriggers(eventType)
  }

  /**
   * Dispatch an incoming event, executing all linked enabled automations safely
   */
  async emitEvent(eventType: AutomationEventType, payload: Record<string, any> = {}): Promise<number> {
    const triggers = memoryDatabase.listEventTriggers(eventType)
    let triggeredCount = 0

    for (const trigger of triggers) {
      if (trigger.enabled) {
        try {
          await automationService.executeAutomation(trigger.automationId, {
            ...payload,
            eventType,
            triggeredAt: Date.now()
          })
          triggeredCount++
        } catch (err) {
          console.warn(`[EventTrigger] Trigger ${trigger.id} failed:`, err)
        }
      }
    }

    return triggeredCount
  }
}

export const eventTriggerService = new EventTriggerService()
