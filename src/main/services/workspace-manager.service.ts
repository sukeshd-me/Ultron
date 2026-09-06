// src/main/services/workspace-manager.service.ts — Multiple Workspaces Manager for ULTRON V1.0.7
import { v4 as uuidv4 } from 'uuid'
import {
  WorkspaceProfile,
  WorkspaceItem,
  WorkspaceCategory
} from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'
import { appsService } from './apps.service'
import { windowManagerService } from './window-manager.service'

export class WorkspaceManagerService {
  /**
   * List all configured workspace profiles
   */
  listWorkspaces(): Array<WorkspaceProfile & { items: WorkspaceItem[] }> {
    const profiles = memoryDatabase.listWorkspaceProfiles()
    return profiles.map(p => ({
      ...p,
      items: memoryDatabase.listWorkspaceItems(p.id)
    }))
  }

  /**
   * Get the currently active workspace profile
   */
  getActiveWorkspace(): (WorkspaceProfile & { items: WorkspaceItem[] }) | null {
    const profiles = memoryDatabase.listWorkspaceProfiles()
    const active = profiles.find(p => p.isActive) || profiles[0]
    if (!active) return null
    return {
      ...active,
      items: memoryDatabase.listWorkspaceItems(active.id)
    }
  }

  /**
   * Switch to a specified workspace by ID or Name
   * Restores configured workspace applications and layout safely
   */
  async switchWorkspace(idOrName: string): Promise<{
    success: boolean
    workspace: WorkspaceProfile
    launchedCount: number
    message: string
  }> {
    const profile = memoryDatabase.getWorkspaceProfile(idOrName)
    if (!profile) {
      throw new Error(`Workspace "${idOrName}" not found.`)
    }

    // Set active in SQLite
    memoryDatabase.setActiveWorkspaceProfile(profile.id)

    // Retrieve items associated with this workspace
    const items = memoryDatabase.listWorkspaceItems(profile.id)
    let launchedCount = 0

    // Safely launch configured tools / apps
    for (const item of items) {
      try {
        if (item.itemType === 'app' || item.itemType === 'url') {
          const res = await appsService.launch(item.targetPath)
          if (res.success) launchedCount++
        }
      } catch (err) {
        console.warn(`[WorkspaceManager] Failed to launch item ${item.targetPath}:`, err)
      }
    }

    // If workspace has a layout preset, apply focus
    if (profile.layoutPreset) {
      try {
        if (profile.layoutPreset.includes('code')) {
          await windowManagerService.focusApplication('code')
        }
      } catch {}
    }

    const message = `Switched to ${profile.name} workspace. Category: ${profile.category}. Active items: ${items.length} (${launchedCount} launched/focused).`

    return {
      success: true,
      workspace: profile,
      launchedCount,
      message
    }
  }

  /**
   * Create or update a workspace profile and its items
   */
  saveWorkspace(
    profile: {
      id?: string
      name: string
      description?: string
      category: WorkspaceCategory
      defaultModel?: string
      preferredSkills?: string[]
      layoutPreset?: string
      isActive?: boolean
    },
    items?: Array<Omit<WorkspaceItem, 'id' | 'workspaceId'> & { id?: string }>
  ): WorkspaceProfile & { items: WorkspaceItem[] } {
    const id = profile.id || uuidv4()
    const saved = memoryDatabase.saveWorkspaceProfile({
      id,
      name: profile.name,
      description: profile.description || '',
      category: profile.category,
      defaultModel: profile.defaultModel,
      preferredSkills: profile.preferredSkills || [],
      layoutPreset: profile.layoutPreset,
      isActive: Boolean(profile.isActive)
    })

    if (items) {
      for (const item of items) {
        memoryDatabase.saveWorkspaceItem({
          id: item.id || uuidv4(),
          workspaceId: id,
          itemType: item.itemType,
          targetPath: item.targetPath,
          launchArgs: item.launchArgs,
          windowAction: item.windowAction
        })
      }
    }

    return {
      ...saved,
      items: memoryDatabase.listWorkspaceItems(id)
    }
  }

  /**
   * Delete a workspace profile
   */
  deleteWorkspace(id: string): boolean {
    const profile = memoryDatabase.getWorkspaceProfile(id)
    if (!profile) return false
    // Prevent deleting default core workspace
    if (profile.name === 'Development') {
      throw new Error('The default "Development" workspace cannot be deleted.')
    }
    return memoryDatabase.deleteWorkspaceProfile(id)
  }
}

export const workspaceManagerService = new WorkspaceManagerService()
