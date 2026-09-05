// src/main/services/custom-skills.service.ts — Custom Skill Management for ULTRON V1.0.5
import { v4 as uuidv4 } from 'uuid'
import { memoryDatabase } from '../database/memory.db'
import { CustomSkillDefinition } from '../../shared/types'

export class CustomSkillsService {
  createSkill(definition: Omit<CustomSkillDefinition, 'id' | 'createdAt' | 'updatedAt'>): CustomSkillDefinition {
    // Validate that skills do not secretly grant unrestricted permissions
    const sanitizedPermissions = (definition.permissions || []).map((p) => p.trim().toUpperCase())
    
    const skill: CustomSkillDefinition = {
      id: `custom-${uuidv4().slice(0, 8)}`,
      name: definition.name.trim(),
      description: definition.description.trim(),
      version: definition.version || '1.0.0',
      capabilities: definition.capabilities || [],
      tools: definition.tools || [],
      permissions: sanitizedPermissions,
      triggers: definition.triggers || [],
      workflow: definition.workflow,
      enabled: definition.enabled !== undefined ? definition.enabled : true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    return memoryDatabase.saveCustomSkill(skill)
  }

  updateSkill(id: string, updates: Partial<CustomSkillDefinition>): CustomSkillDefinition {
    const skills = memoryDatabase.listCustomSkills()
    const target = skills.find((s) => s.id === id)
    if (!target) throw new Error(`Skill ${id} not found`)

    const updated: CustomSkillDefinition = {
      ...target,
      ...updates,
      updatedAt: Date.now()
    }
    return memoryDatabase.saveCustomSkill(updated)
  }

  listSkills(): CustomSkillDefinition[] {
    return memoryDatabase.listCustomSkills()
  }

  deleteSkill(id: string): boolean {
    return memoryDatabase.deleteCustomSkill(id)
  }

  toggleSkill(id: string, enabled: boolean): boolean {
    const skills = memoryDatabase.listCustomSkills()
    const target = skills.find((s) => s.id === id)
    if (!target) return false
    memoryDatabase.saveCustomSkill({ ...target, enabled, updatedAt: Date.now() })
    return true
  }
}

export const customSkillsService = new CustomSkillsService()
