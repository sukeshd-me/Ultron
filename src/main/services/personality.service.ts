// src/main/services/personality.service.ts — Agent Personality Profiles for ULTRON V1.0.7
import { PersonalityProfile, PersonalityType } from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'

export class PersonalityService {
  /**
   * List all personality profiles
   */
  listProfiles(): PersonalityProfile[] {
    return memoryDatabase.listPersonalityProfiles()
  }

  /**
   * Get currently active personality profile
   */
  getActiveProfile(): PersonalityProfile {
    return memoryDatabase.getActivePersonality()
  }

  /**
   * Set active personality profile
   */
  setActiveProfile(id: PersonalityType | string): { success: boolean; profile: PersonalityProfile } {
    const success = memoryDatabase.setActivePersonality(id)
    const profile = memoryDatabase.getActivePersonality()
    return { success, profile }
  }

  /**
   * Return behavioral instructions to inject into agent prompt without bypassing safety
   */
  getPersonalityPromptModifier(): string {
    const p = this.getActiveProfile()

    let toneDirective = ''
    switch (p.id) {
      case 'Technical':
        toneDirective = 'Focus on systems telemetry, exact architectural components, and technical precision. Be thorough and analytical.'
        break
      case 'Minimal':
        toneDirective = 'Keep outputs ultra-concise. State only core telemetry and action status. No unnecessary pleasantries.'
        break
      case 'Professional':
        toneDirective = 'Adopt an executive command posture. Clear, structured, polite, and decision-oriented.'
        break
      case 'Tutor':
        toneDirective = 'Explain core concepts clearly and guide the user with educational clarity and next steps.'
        break
      case 'Developer':
        toneDirective = 'Adopt a software engineer mindset. Emphasize code syntax, Git state, build logs, and test verification.'
        break
      case 'Researcher':
        toneDirective = 'Structure answers with citations, verifiable evidence, and deep exploratory insights.'
        break
      case 'Balanced':
      default:
        toneDirective = 'Maintain a poised, natural, and adaptive conversational style with concise summaries.'
        break
    }

    return `[PERSONALITY PROFILE: ${p.name.toUpperCase()}]\n${toneDirective}\nVerbosity: ${p.verbosity}. Status Prefix: [${p.statusPrefix}]. Note: Safety, risk limits, and permission constraints remain strictly inviolable.`
  }
}

export const personalityService = new PersonalityService()
