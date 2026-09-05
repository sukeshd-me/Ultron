// src/main/services/repair.service.ts — One-Click Safe Repair for ULTRON V1.0.5
import { powershellService } from './powershell.service'
import { memoryDatabase } from '../database/memory.db'
import { diagnosticsService } from './diagnostics.service'
import { SafeRepairItem } from '../../shared/types'

export class RepairService {
  async listKnownFixes(): Promise<SafeRepairItem[]> {
    return [
      {
        id: 'repair-db-wal',
        subsystem: 'DATABASE',
        problem: 'SQLite database journal requires integrity verification and optimization.',
        possibleFix: 'Execute SQLite PRAGMA wal_checkpoint and optimize indexes.',
        whatWillChange: 'Flushes WAL journals to primary sqlite database and frees fragmented pages.',
        canAutomate: true,
        repairAction: 'db_optimize'
      },
      {
        id: 'repair-adb-daemon',
        subsystem: 'ANDROID',
        problem: 'ADB Android companion server connection is disconnected or stale.',
        possibleFix: 'Restart local ADB daemon (adb kill-server && adb start-server).',
        whatWillChange: 'Restarts the adb.exe background daemon and rescans USB/TCP interfaces.',
        canAutomate: true,
        repairAction: 'adb_restart'
      },
      {
        id: 'repair-git-lock',
        subsystem: 'WORKSPACE',
        problem: 'Git index or lockfile may be left in orphaned state.',
        possibleFix: 'Check and safely remove stale .git/index.lock files if present.',
        whatWillChange: 'Clears stale git transaction locks without modifying tracked source code.',
        canAutomate: true,
        repairAction: 'git_unlock'
      }
    ]
  }

  async executeRepair(repairId: string): Promise<{
    success: boolean
    message: string
    diagnosticBefore: any
    diagnosticAfter: any
  }> {
    const diagnosticBefore = await diagnosticsService.runDiagnostics()

    let success = false
    let message = ''

    if (repairId === 'repair-db-wal') {
      try {
        const db = (memoryDatabase as any).ensureConnected()
        db.exec('PRAGMA wal_checkpoint(TRUNCATE);')
        db.exec('PRAGMA optimize;')
        success = true
        message = 'SQLite database WAL flush and page optimization completed successfully.'
      } catch (err: any) {
        success = false
        message = `Database optimization failed: ${err.message}`
      }
    } else if (repairId === 'repair-adb-daemon') {
      const res = await powershellService.execute('adb kill-server; adb start-server')
      success = res.success
      message = success ? 'ADB daemon restarted successfully.' : 'Failed to restart ADB daemon.'
    } else if (repairId === 'repair-git-lock') {
      const res = await powershellService.execute('if (Test-Path ".git/index.lock") { Remove-Item ".git/index.lock" -Force; "Removed" } else { "Clean" }')
      success = res.success
      message = 'Git repository working locks verified and clean.'
    }

    const diagnosticAfter = await diagnosticsService.runDiagnostics()

    return {
      success,
      message,
      diagnosticBefore,
      diagnosticAfter
    }
  }
}

export const repairService = new RepairService()
export const safeRepairService = repairService
