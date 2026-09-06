import { WindowInfo, WindowWorkspacePreset } from '../../shared/types'
import { powerShellService } from './powershell.service'
import { memoryDatabase } from '../database/memory.db'

export class WindowManagerService {
  async listWindows(): Promise<WindowInfo[]> {
    try {
      const script = `
        Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object Id, ProcessName, MainWindowTitle | ConvertTo-Json -Compress
      `
      const res = await powerShellService.execute(script)
      if (res.success && res.stdout) {
        const parsed = JSON.parse(res.stdout)
        const arr = Array.isArray(parsed) ? parsed : [parsed]
        return arr.map((item: any) => ({
          handle: String(item.Id),
          processName: item.ProcessName,
          title: item.MainWindowTitle
        }))
      }
    } catch (err) {
      console.warn('[WindowManager] List windows error:', err)
    }
    return []
  }

  async focusApplication(appName: string): Promise<{ success: boolean; message: string }> {
    try {
      const script = `
        $proc = Get-Process -Name "*${appName}*" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
        if ($proc) {
          $wscript = New-Object -ComObject Wscript.Shell
          $wscript.AppActivate($proc.Id)
          "SUCCESS"
        } else {
          "NOT_FOUND"
        }
      `
      const res = await powerShellService.execute(script)
      if (res.stdout && res.stdout.includes('SUCCESS')) {
        return { success: true, message: `Focused ${appName} window.` }
      }
      return { success: false, message: `Application ${appName} was not running with an active window.` }
    } catch (err: any) {
      return { success: false, message: err.message || 'Focus failed.' }
    }
  }

  saveWorkspacePreset(name: string, layout: any[]): WindowWorkspacePreset {
    return memoryDatabase.saveWindowWorkspace(name, layout)
  }

  listWorkspacePresets(): WindowWorkspacePreset[] {
    const list = memoryDatabase.listWindowWorkspaces()
    if (list.length === 0) {
      return [
        {
          id: 'preset-dev',
          name: 'Coding Workspace',
          description: 'VS Code on primary screen and terminal ready',
          layout: [
            { appName: 'Code', action: 'maximize' },
            { appName: 'WindowsTerminal', action: 'focus' }
          ],
          updatedAt: Date.now()
        },
        {
          id: 'preset-research',
          name: 'Research Workspace',
          description: 'Browser side-by-side with notes',
          layout: [
            { appName: 'chrome', action: 'tile_left' },
            { appName: 'notepad', action: 'tile_right' }
          ],
          updatedAt: Date.now()
        }
      ]
    }
    return list
  }
}

export const windowManagerService = new WindowManagerService()
