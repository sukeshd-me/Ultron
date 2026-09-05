// src/main/services/skills.registry.ts — Central Skills Registry & Discovery
import {
  SkillId,
  SkillDefinition,
  SKILLS_CATALOG,
  getSkillById,
  getSkillForTool
} from '../../shared/skills/skills.types'

export class SkillsRegistryService {
  private skills: SkillDefinition[] = [...SKILLS_CATALOG]

  getAllSkills(): SkillDefinition[] {
    return this.skills
  }

  getSkill(id: SkillId): SkillDefinition | undefined {
    return getSkillById(id)
  }

  getSkillByTool(toolName: string): SkillDefinition {
    return getSkillForTool(toolName)
  }

  /**
   * Determine which skill should be activated based on user prompt and detected intent
   */
  discoverSkill(prompt: string, detectedIntent = 'unknown'): SkillDefinition {
    const lower = prompt.toLowerCase().trim()

    // 1. Explicit Screen & Vision
    if (
      lower.includes('screen') ||
      lower.includes('screenshot') ||
      lower.includes('what am i looking at') ||
      lower.includes('what is on my screen') ||
      detectedIntent.startsWith('screen.')
    ) {
      return getSkillById('vision')!
    }

    // 2. Developer & Codebase diagnostics
    if (
      lower.includes('typescript') ||
      lower.includes('check project') ||
      lower.includes('analyze project') ||
      lower.includes('git status') ||
      lower.includes('find errors') ||
      lower.includes('fix code') ||
      detectedIntent.startsWith('developer.')
    ) {
      return getSkillById('developer')!
    }

    // 3. Android Companion
    if (
      lower.includes('phone') ||
      lower.includes('android') ||
      lower.includes('adb') ||
      lower.startsWith('call ') ||
      lower.startsWith('dial ') ||
      lower.includes('end call') ||
      detectedIntent.startsWith('android.') ||
      detectedIntent.startsWith('adb.')
    ) {
      return getSkillById('android')!
    }

    // 4. Filesystem
    if (
      lower.includes('file') ||
      lower.includes('folder') ||
      lower.includes('directory') ||
      detectedIntent.startsWith('filesystem.')
    ) {
      return getSkillById('files')!
    }

    // 5. Research & Web
    if (
      lower.includes('youtube') ||
      lower.includes('search web') ||
      lower.includes('google') ||
      detectedIntent.startsWith('research.')
    ) {
      return getSkillById('research')!
    }

    // 6. Memory
    if (
      lower.startsWith('remember ') ||
      lower.includes('my preference') ||
      lower.includes('recall') ||
      detectedIntent.startsWith('memory.')
    ) {
      return getSkillById('memory')!
    }

    // 7. Coding synthesis
    if (
      lower.includes('write python') ||
      lower.includes('write code') ||
      lower.includes('script') ||
      detectedIntent.startsWith('code.')
    ) {
      return getSkillById('coding')!
    }

    // 8. Windows System Telemetry & Apps
    if (
      lower.includes('cpu') ||
      lower.includes('ram') ||
      lower.includes('memory') ||
      lower.includes('disk') ||
      lower.includes('brightness') ||
      lower.includes('volume') ||
      detectedIntent.startsWith('system.')
    ) {
      return getSkillById('windows')!
    }

    // 9. Application / Browser Launching
    if (
      lower.startsWith('open ') ||
      lower.startsWith('launch ') ||
      detectedIntent.startsWith('apps.')
    ) {
      return getSkillById('browser')!
    }

    // 10. Universal Search
    if (
      lower.startsWith('search ') ||
      lower.startsWith('find ') ||
      lower.includes('search pc') ||
      lower.includes('find file') ||
      lower.includes('find project') ||
      detectedIntent.startsWith('search.')
    ) {
      return getSkillById('search') || getSkillById('system')!
    }

    // 11. Health & Self-Diagnostics
    if (
      lower.includes('diagnostic') ||
      lower.includes('health check') ||
      lower.includes('subsystem') ||
      lower.includes('check health') ||
      detectedIntent.startsWith('diagnostics.')
    ) {
      return getSkillById('diagnostics') || getSkillById('system')!
    }

    // 12. Background Tasks Engine
    if (
      lower.includes('background task') ||
      lower.includes('task manager') ||
      lower.includes('running tasks') ||
      lower.includes('cancel task') ||
      detectedIntent.startsWith('tasks.')
    ) {
      return getSkillById('tasks') || getSkillById('system')!
    }

    // 13. Security & Zero-Trust
    if (
      lower.includes('security audit') ||
      lower.includes('zero trust') ||
      lower.includes('permission check') ||
      detectedIntent.startsWith('security.')
    ) {
      return getSkillById('security') || getSkillById('system')!
    }

    // 14. Agent Missions & Multi-Step Goals
    if (
      lower.startsWith('mission ') ||
      lower.includes('prepare my project') ||
      lower.includes('prepare ultron') ||
      lower.includes('create a mission') ||
      detectedIntent.startsWith('missions.')
    ) {
      return getSkillById('system')!
    }

    // 15. Document Intelligence
    if (
      lower.includes('document') ||
      lower.includes('.pdf') ||
      lower.includes('summarize this document') ||
      lower.includes('what does this pdf say') ||
      detectedIntent.startsWith('documents.')
    ) {
      return getSkillById('research') || getSkillById('system')!
    }

    // 16. Undo & Recovery
    if (
      lower.startsWith('undo') ||
      lower.includes('undo what you just did') ||
      lower.includes('revert change') ||
      lower.includes('rollback')
    ) {
      return getSkillById('system')!
    }

    // Default: System Skill (Orchestrator)
    return getSkillById('system')!
  }
}

export const skillsRegistryService = new SkillsRegistryService()
