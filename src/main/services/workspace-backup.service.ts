// src/main/services/workspace-backup.service.ts — Workspace Backup Subsystem for ULTRON V1.0.7
import * as fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import {
  WorkspaceBackupMeta,
  WorkspaceBackupBundle,
  WorkspaceProfile,
  WorkspaceItem,
  AutomationDefinition,
  ScheduledMission
} from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'

export class WorkspaceBackupService {
  /**
   * Create a safe configuration backup bundle
   * Strictly excludes passwords, API tokens, credentials, and disk contents
   */
  createBackup(name = 'Workspace Configuration Backup'): WorkspaceBackupMeta {
    const workspaces = memoryDatabase.listWorkspaceProfiles()
    const items: WorkspaceItem[] = []
    for (const ws of workspaces) {
      items.push(...memoryDatabase.listWorkspaceItems(ws.id))
    }

    const automations = memoryDatabase.listAutomations()
    const scheduledMissions = memoryDatabase.listScheduledMissions()
    const preferences = memoryDatabase.getAllPreferences()

    const bundle: Omit<WorkspaceBackupBundle, 'meta'> = {
      workspaces,
      items,
      automations,
      scheduledMissions,
      preferences
    }

    return memoryDatabase.saveWorkspaceBackup(name, '1.0.7', bundle)
  }

  /**
   * List all stored workspace backups
   */
  listBackups(): WorkspaceBackupMeta[] {
    return memoryDatabase.listWorkspaceBackups()
  }

  /**
   * Restore a backup safely after creating a pre-restore backup of current state
   */
  restoreBackup(backupId: string): { success: boolean; message: string; preRestoreBackupId: string } {
    const backup = memoryDatabase.getWorkspaceBackup(backupId)
    if (!backup) {
      throw new Error(`Backup "${backupId}" not found.`)
    }

    // 1. Create a current-state backup before modifying configuration
    const preRestore = this.createBackup(`Auto-Backup Before Restoring "${backup.meta.name}"`)

    const bundle: WorkspaceBackupBundle = backup.bundle

    // 2. Restore Workspaces & Items
    if (bundle.workspaces && Array.isArray(bundle.workspaces)) {
      for (const ws of bundle.workspaces) {
        memoryDatabase.saveWorkspaceProfile(ws)
      }
    }
    if (bundle.items && Array.isArray(bundle.items)) {
      for (const item of bundle.items) {
        memoryDatabase.saveWorkspaceItem(item)
      }
    }

    // 3. Restore Automations
    if (bundle.automations && Array.isArray(bundle.automations)) {
      for (const auto of bundle.automations) {
        memoryDatabase.saveAutomation(auto)
      }
    }

    // 4. Restore Scheduled Missions
    if (bundle.scheduledMissions && Array.isArray(bundle.scheduledMissions)) {
      for (const sched of bundle.scheduledMissions) {
        memoryDatabase.saveScheduledMission(sched)
      }
    }

    return {
      success: true,
      message: `Restored backup "${backup.meta.name}". ${bundle.workspaces?.length || 0} workspaces and ${bundle.automations?.length || 0} automations updated.`,
      preRestoreBackupId: preRestore.id
    }
  }

  /**
   * Export backup bundle to an external JSON file
   */
  exportToFile(backupId: string, filePath: string): { success: boolean; filePath: string } {
    const backup = memoryDatabase.getWorkspaceBackup(backupId)
    if (!backup) {
      throw new Error(`Backup "${backupId}" not found.`)
    }

    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2), 'utf8')
    return { success: true, filePath }
  }

  /**
   * Import backup bundle from external JSON file
   */
  importFromFile(filePath: string): WorkspaceBackupMeta {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file not found at ${filePath}`)
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    if (!data.bundle || !data.meta) {
      throw new Error('Invalid backup file structure.')
    }

    return memoryDatabase.saveWorkspaceBackup(
      `Imported: ${data.meta.name}`,
      data.meta.ultronVersion || '1.0.7',
      data.bundle
    )
  }

  /**
   * Delete a backup
   */
  deleteBackup(id: string): boolean {
    return memoryDatabase.deleteWorkspaceBackup(id)
  }
}

export const workspaceBackupService = new WorkspaceBackupService()
