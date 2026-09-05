// src/main/services/recovery.service.ts — Safe Undo/Recovery System for ULTRON V1.0.5
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { app } from 'electron'
import { memoryDatabase } from '../database/memory.db'
import { taskHistoryService } from './task-history.service'
import { RecoveryAction } from '../../shared/types'

export class RecoveryService {
  private backupDir: string

  constructor() {
    let base = ''
    try {
      base = app?.getPath ? app.getPath('userData') : path.join(process.cwd(), 'data')
    } catch {
      base = path.join(process.cwd(), 'data')
    }
    this.backupDir = path.join(base, 'backups')
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true })
    }
  }

  /**
   * Create a safe point-in-time file snapshot before a reversible modification
   */
  createFileSnapshot(targetPath: string): string | null {
    try {
      if (!fs.existsSync(targetPath)) return null
      const ext = path.extname(targetPath)
      const baseName = path.basename(targetPath, ext)
      const backupFile = path.join(this.backupDir, `${baseName}-${Date.now()}-${uuidv4().slice(0, 8)}${ext}`)
      fs.copyFileSync(targetPath, backupFile)
      return backupFile
    } catch (err) {
      console.error('[RecoveryService] Failed to snapshot file:', err)
      return null
    }
  }

  /**
   * Record a recoverable action in the database
   */
  recordAction(entry: {
    operationType: 'file_edit' | 'file_move' | 'file_copy' | 'file_rename' | 'config_change' | 'other'
    target: string
    beforeState: string
    afterState: string
    reversible?: boolean
    details?: string
  }): RecoveryAction {
    return memoryDatabase.recordRecoveryAction({
      timestamp: Date.now(),
      operationType: entry.operationType,
      target: entry.target,
      beforeState: entry.beforeState,
      afterState: entry.afterState,
      reversible: entry.reversible !== undefined ? entry.reversible : true,
      rolledBack: false,
      details: entry.details
    })
  }

  /**
   * Undo the most recent reversible action or a specific actionId
   */
  async undo(actionId?: string): Promise<{ success: boolean; message: string; action?: RecoveryAction }> {
    const actions = memoryDatabase.listRecoveryActions(20)
    const targetAction = actionId
      ? actions.find((a) => a.actionId === actionId)
      : actions.find((a) => a.reversible && !a.rolledBack)

    if (!targetAction) {
      return {
        success: false,
        message: 'No reversible actions available to undo.'
      }
    }

    if (!targetAction.reversible) {
      return {
        success: false,
        message: 'That action cannot be automatically undone.'
      }
    }

    try {
      if (targetAction.operationType === 'file_edit' || targetAction.operationType === 'file_rename') {
        if (!fs.existsSync(targetAction.beforeState)) {
          return { success: false, message: 'Backup file snapshot was not found on disk.' }
        }
        // Restore beforeState back to target
        fs.copyFileSync(targetAction.beforeState, targetAction.target)
      } else if (targetAction.operationType === 'file_copy' || targetAction.operationType === 'file_move') {
        // Safe remove copied destination or move back
        if (fs.existsSync(targetAction.target)) {
          fs.unlinkSync(targetAction.target)
        }
      }

      memoryDatabase.markRecoveryRolledBack(targetAction.actionId, true)

      taskHistoryService.record({
        timestamp: Date.now(),
        userRequest: 'Undo action',
        intent: 'recovery.undo',
        skill: 'system',
        target: targetAction.target,
        status: 'SUCCESS',
        startTime: Date.now(),
        endTime: Date.now(),
        durationMs: 10,
        category: 'FILES',
        recoveryInfo: `Undone ${targetAction.operationType} on ${targetAction.target}`
      })

      return {
        success: true,
        message: `Successfully rolled back ${targetAction.operationType} on ${targetAction.target}.`,
        action: targetAction
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Undo failed: ${err.message}`
      }
    }
  }

  /**
   * Redo an undone action
   */
  async redo(actionId?: string): Promise<{ success: boolean; message: string; action?: RecoveryAction }> {
    const actions = memoryDatabase.listRecoveryActions(20)
    const targetAction = actionId
      ? actions.find((a) => a.actionId === actionId)
      : actions.find((a) => a.rolledBack)

    if (!targetAction) {
      return { success: false, message: 'No rolled-back actions available to redo.' }
    }

    try {
      if (targetAction.afterState && fs.existsSync(targetAction.afterState)) {
        fs.copyFileSync(targetAction.afterState, targetAction.target)
      }
      memoryDatabase.markRecoveryRolledBack(targetAction.actionId, false)
      return {
        success: true,
        message: `Successfully reapplied ${targetAction.operationType} on ${targetAction.target}.`,
        action: targetAction
      }
    } catch (err: any) {
      return { success: false, message: `Redo failed: ${err.message}` }
    }
  }

  listActions(limit = 20): RecoveryAction[] {
    return memoryDatabase.listRecoveryActions(limit)
  }
}

export const recoveryService = new RecoveryService()
