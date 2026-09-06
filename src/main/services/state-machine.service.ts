// src/main/services/state-machine.service.ts — Central Agent State Machine for ULTRON V1.0.5
import { OrbState } from '../../shared/types'

export type StateChangeCallback = (state: OrbState, previousState: OrbState, metadata?: Record<string, any>) => void

export class AgentStateMachine {
  private currentState: OrbState = 'IDLE'
  private previousState: OrbState = 'IDLE'
  private listeners: Set<StateChangeCallback> = new Set()
  private stateHistory: Array<{ state: OrbState; timestamp: number; metadata?: Record<string, any> }> = []

  constructor() {
    this.stateHistory.push({ state: 'IDLE', timestamp: Date.now() })
  }

  getCurrentState(): OrbState {
    return this.currentState
  }

  getPreviousState(): OrbState {
    return this.previousState
  }

  transitionTo(nextState: OrbState, metadata?: Record<string, any>): void {
    if (this.currentState === nextState) return

    const prev = this.currentState
    this.previousState = prev
    this.currentState = nextState

    this.stateHistory.push({
      state: nextState,
      timestamp: Date.now(),
      metadata
    })

    if (this.stateHistory.length > 100) {
      this.stateHistory.shift()
    }

    console.log(`[ULTRON StateMachine] ${prev} -> ${nextState}`)

    // Notify all registered IPC and service listeners
    for (const callback of this.listeners) {
      try {
        callback(nextState, prev, metadata)
      } catch (err) {
        console.error('[ULTRON StateMachine] Listener notification error:', err)
      }
    }
  }

  subscribe(callback: StateChangeCallback): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  onStateChange(callback: (state: OrbState) => void): () => void {
    return this.subscribe((state) => callback(state))
  }

  getHistory(limit = 20): Array<{ state: OrbState; timestamp: number; metadata?: Record<string, any> }> {
    return this.stateHistory.slice(-limit)
  }
}

export const agentStateMachine = new AgentStateMachine()
