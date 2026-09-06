// src/main/services/window-intelligence.service.ts — Window Intelligence for ULTRON V1.0.8
import { memoryDatabase } from '../database/memory.db'
import { WindowStateRecord } from '../../shared/types'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class WindowIntelligenceService {
  /**
   * Safely query open application windows using Windows PowerShell
   */
  async inspectOpenWindows(): Promise<WindowStateRecord[]> {
    const psScript = `Get-Process | Where-Object { $_.MainWindowTitle } | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json -Compress`

    try {
      const { stdout } = await execAsync(`powershell.exe -NoProfile -NonInteractive -Command "${psScript.replace(/\r?\n/g, ' ')}"`, {
        timeout: 5000
      })

      if (!stdout || !stdout.trim()) return []

      const parsed = JSON.parse(stdout.trim())
      const list = Array.isArray(parsed) ? parsed : [parsed]

      const records: WindowStateRecord[] = list.map(item => ({
        id: `win-${item.Id}`,
        windowId: String(item.Id),
        processName: String(item.ProcessName || 'Unknown'),
        title: String(item.MainWindowTitle || 'Window'),
        isActive: true,
        updatedAt: Date.now()
      }))

      // Persist snapshot to database
      memoryDatabase.saveWindowState(records)
      return records
    } catch (err) {
      console.warn('[WindowIntelligence] Window inspection warning:', err)
      return memoryDatabase.getWindowsByWorkspace()
    }
  }

  /**
   * Find windows matching a title query (e.g. "Where is my project?", "VS Code")
   */
  async findWindowsByTitle(titleFragment: string): Promise<WindowStateRecord[]> {
    const windows = await this.inspectOpenWindows()
    const query = titleFragment.toLowerCase().trim()
    return windows.filter(w => w.title.toLowerCase().includes(query) || w.processName.toLowerCase().includes(query))
  }
}

export const windowIntelligenceService = new WindowIntelligenceService()