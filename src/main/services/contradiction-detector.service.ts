// src/main/services/contradiction-detector.service.ts — Contradiction & Conflict Detection Layer for ULTRON V1.0.8
import { memoryDatabase } from '../database/memory.db'
import { ContradictionRecord } from '../../shared/types'

export interface ConflictReport {
  hasConflict: boolean
  contradictions: ContradictionRecord[]
  summary?: string
}

export class ContradictionDetectorService {
  /**
   * Detect conflicts across automations, schedules, and user instructions
   */
  detectConflicts(newInstruction?: string): ConflictReport {
    const activeContradictions: ContradictionRecord[] = []

    try {
      const automations = memoryDatabase.getAutomations ? memoryDatabase.getAutomations() : []
      const scheduled = memoryDatabase.getScheduledMissions ? memoryDatabase.getScheduledMissions() : []

      // 1. Check for opposing automation actions
      for (let i = 0; i < automations.length; i++) {
        for (let j = i + 1; j < automations.length; j++) {
          const a = automations[i]
          const b = automations[j]
          if (!a.enabled || !b.enabled) continue

          const aDesc = (a.description || a.name).toLowerCase()
          const bDesc = (b.description || b.name).toLowerCase()

          // Check opposing workspace open/close rules
          const isOpposingWorkspace =
            (aDesc.includes('open') && bDesc.includes('close')) ||
            (aDesc.includes('close') && bDesc.includes('open')) ||
            (aDesc.includes('enable') && bDesc.includes('disable'))

          if (isOpposingWorkspace && a.trigger_type === b.trigger_type) {
            const conflict = memoryDatabase.recordContradiction({
              sourceA: `Automation "${a.name}"`,
              sourceB: `Automation "${b.name}"`,
              entityType: 'AUTOMATION',
              description: `Contradictory automation triggers detected: "${a.name}" vs "${b.name}". Both operate on the same event/schedule with opposing actions.`,
              resolutionOptions: [
                `Disable automation "${b.name}"`,
                `Disable automation "${a.name}"`,
                'Separate triggers by time window or manual confirmation'
              ],
              status: 'ACTIVE'
            })
            activeContradictions.push(conflict)
          }
        }
      }

      // 2. Check if a new instruction directly contradicts active rules
      if (newInstruction) {
        const lower = newInstruction.toLowerCase()
        if (lower.includes('never open') || lower.includes('stop opening')) {
          for (const a of automations) {
            if (a.enabled && (a.name.toLowerCase().includes('open') || a.description?.toLowerCase().includes('open'))) {
              const conflict = memoryDatabase.recordContradiction({
                sourceA: `User instruction: "${newInstruction}"`,
                sourceB: `Active Automation "${a.name}"`,
                entityType: 'INSTRUCTION_VS_AUTOMATION',
                description: `Instruction contradicts active automation "${a.name}".`,
                resolutionOptions: [
                  `Disable automation "${a.name}"`,
                  'Proceed with instruction as a one-time override',
                  'Keep automation active and cancel instruction'
                ],
                status: 'ACTIVE'
              })
              activeContradictions.push(conflict)
            }
          }
        }
      }
    } catch (err) {
      console.warn('[ContradictionDetector] Evaluation error:', err)
    }

    const hasConflict = activeContradictions.length > 0
    let summary: string | undefined
    if (hasConflict) {
      summary = activeContradictions.map(c =>
        `CONFLICT DETECTED\nRule A: ${c.sourceA}\nRule B: ${c.sourceB}\nDescription: ${c.description}\nPossible Resolutions:\n${c.resolutionOptions.map(o => `• ${o}`).join('\n')}`
      ).join('\n\n')
    }

    return {
      hasConflict,
      contradictions: activeContradictions,
      summary
    }
  }

  /**
   * Detect direct contradictions between an array of user rules or automations
   */
  detectContradictions(rules: string[]): ContradictionRecord[] {
    const records: ContradictionRecord[] = []
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rA = rules[i].toLowerCase()
        const rB = rules[j].toLowerCase()
        if (
          (rA.includes('open') && rB.includes('close')) ||
          (rA.includes('close') && rB.includes('open')) ||
          (rA.includes('start') && rB.includes('stop')) ||
          (rA.includes('enable') && rB.includes('disable'))
        ) {
          const rec = memoryDatabase.recordContradiction({
            sourceA: `Rule A: ${rules[i]}`,
            sourceB: `Rule B: ${rules[j]}`,
            entityType: 'AUTOMATION_CONFLICT',
            description: `Contradiction detected: "${rules[i]}" opposes "${rules[j]}".`,
            resolutionOptions: [
              `Prioritize "${rules[i]}"`,
              `Prioritize "${rules[j]}"`,
              'Ask for clarification before executing'
            ],
            status: 'ACTIVE'
          })
          records.push(rec)
        }
      }
    }
    return records
  }

  getActiveConflicts(): ContradictionRecord[] {
    return memoryDatabase.getActiveContradictions()
  }

  resolveConflict(id: string): boolean {
    return memoryDatabase.resolveContradiction(id)
  }
}

export const contradictionDetectorService = new ContradictionDetectorService()