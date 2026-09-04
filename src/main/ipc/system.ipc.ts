// src/main/ipc/system.ipc.ts — Controlled System & Windows Control IPC API
import { ipcMain } from 'electron'
import { commandRegistry } from '../services/command.registry'
import { appsService } from '../services/apps.service'
import { filesystemService } from '../services/filesystem.service'
import { powershellService } from '../services/powershell.service'

export interface ControlledExecutionResult {
  success: boolean
  action: string
  durationMs: number
  exitCode?: number
  output?: any
  error?: string
}

export function registerSystemIPC(): void {
  // ── System Queries ─────────────────────────────────────────────
  ipcMain.handle('system:getTime', async (): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    const res = await commandRegistry.execute('system.time')
    const durationMs = parseFloat((performance.now() - start).toFixed(2))
    return {
      success: res.success,
      action: 'system.time',
      durationMs,
      output: res.data?.time,
      error: res.error
    }
  })

  ipcMain.handle('system:getDate', async (): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    const res = await commandRegistry.execute('system.date')
    const durationMs = parseFloat((performance.now() - start).toFixed(2))
    return {
      success: res.success,
      action: 'system.date',
      durationMs,
      output: res.data?.date,
      error: res.error
    }
  })

  ipcMain.handle('system:getCpu', async (): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    const res = await commandRegistry.execute('system.cpu')
    const durationMs = parseFloat((performance.now() - start).toFixed(2))
    return {
      success: res.success,
      action: 'system.cpu',
      durationMs,
      output: res.data,
      error: res.error
    }
  })

  ipcMain.handle('system:getMemory', async (): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    const res = await commandRegistry.execute('system.memory')
    const durationMs = parseFloat((performance.now() - start).toFixed(2))
    return {
      success: res.success,
      action: 'system.memory',
      durationMs,
      output: res.data,
      error: res.error
    }
  })

  ipcMain.handle('system:getDisk', async (): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    const res = await commandRegistry.execute('system.disk')
    const durationMs = parseFloat((performance.now() - start).toFixed(2))
    return {
      success: res.success,
      action: 'system.disk',
      durationMs,
      output: res.data,
      error: res.error
    }
  })

  ipcMain.handle('system:getProcesses', async (_event, limit: number = 10): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    const res = await commandRegistry.execute('system.processes', { limit })
    const durationMs = parseFloat((performance.now() - start).toFixed(2))
    return {
      success: res.success,
      action: 'system.processes',
      durationMs,
      output: res.data?.processes,
      error: res.error
    }
  })

  ipcMain.handle('system:getBrightness', async (): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    const res = await commandRegistry.execute('system.brightness.get')
    const durationMs = parseFloat((performance.now() - start).toFixed(2))
    return {
      success: res.success,
      action: 'system.brightness.get',
      durationMs,
      output: res.data,
      error: res.error
    }
  })

  ipcMain.handle('system:setBrightness', async (_event, value: number): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    const res = await commandRegistry.execute('system.brightness.set', { value })
    const durationMs = parseFloat((performance.now() - start).toFixed(2))
    return {
      success: res.success,
      action: 'system.brightness.set',
      durationMs,
      output: res.data,
      error: res.error
    }
  })

  // ── Application Launcher ─────────────────────────────────────────
  ipcMain.handle('apps:open', async (_event, appName: string): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    try {
      if (!appName || typeof appName !== 'string') {
        throw new Error('Application name is required.')
      }
      const res = await appsService.launch(appName.trim())
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: res.success,
        action: `apps.open: ${appName}`,
        durationMs,
        output: { app: res.app, pid: res.pid },
        exitCode: 0
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: false,
        action: `apps.open: ${appName}`,
        durationMs,
        error: err.message,
        exitCode: 1
      }
    }
  })

  // ── Filesystem Operations ────────────────────────────────────────
  ipcMain.handle('files:create', async (_event, targetPath: string, content: string = ''): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    try {
      const res = await filesystemService.createFile(targetPath, content)
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: true,
        action: 'files.create',
        durationMs,
        output: res
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: false,
        action: 'files.create',
        durationMs,
        error: err.message
      }
    }
  })

  ipcMain.handle('files:createFolder', async (_event, targetPath: string): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    try {
      const res = await filesystemService.createFolder(targetPath)
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: true,
        action: 'files.createFolder',
        durationMs,
        output: res
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: false,
        action: 'files.createFolder',
        durationMs,
        error: err.message
      }
    }
  })

  ipcMain.handle('files:read', async (_event, targetPath: string): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    try {
      const res = await filesystemService.readFile(targetPath)
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: true,
        action: 'files.read',
        durationMs,
        output: res
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: false,
        action: 'files.read',
        durationMs,
        error: err.message
      }
    }
  })

  ipcMain.handle('files:copy', async (_event, src: string, dest: string): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    try {
      const res = await filesystemService.copyItem(src, dest)
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: true,
        action: 'files.copy',
        durationMs,
        output: res
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: false,
        action: 'files.copy',
        durationMs,
        error: err.message
      }
    }
  })

  ipcMain.handle('files:move', async (_event, src: string, dest: string): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    try {
      const res = await filesystemService.moveItem(src, dest)
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: true,
        action: 'files.move',
        durationMs,
        output: res
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: false,
        action: 'files.move',
        durationMs,
        error: err.message
      }
    }
  })

  ipcMain.handle('files:search', async (_event, query: string, root?: string): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    try {
      const res = await filesystemService.searchFiles(query, root)
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: true,
        action: 'files.search',
        durationMs,
        output: res
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: false,
        action: 'files.search',
        durationMs,
        error: err.message
      }
    }
  })

  ipcMain.handle('files:delete', async (_event, targetPath: string): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    try {
      const res = await commandRegistry.execute('filesystem.delete', { path: targetPath })
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: res.success,
        action: 'files.delete',
        durationMs,
        output: res.data,
        error: res.error
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: false,
        action: 'files.delete',
        durationMs,
        error: err.message
      }
    }
  })

  // ── Network Operations ───────────────────────────────────────────
  ipcMain.handle('network:getWifiStatus', async (): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    const res = await commandRegistry.execute('network.wifi.status')
    const durationMs = parseFloat((performance.now() - start).toFixed(2))
    return {
      success: res.success,
      action: 'network.wifi.status',
      durationMs,
      output: res.data,
      error: res.error
    }
  })

  ipcMain.handle('network:getAdapters', async (): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    const res = await commandRegistry.execute('network.adapters')
    const durationMs = parseFloat((performance.now() - start).toFixed(2))
    return {
      success: res.success,
      action: 'network.adapters',
      durationMs,
      output: res.data,
      error: res.error
    }
  })

  ipcMain.handle('network:getIp', async (): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    const res = await commandRegistry.execute('network.ip')
    const durationMs = parseFloat((performance.now() - start).toFixed(2))
    return {
      success: res.success,
      action: 'network.ip',
      durationMs,
      output: res.data,
      error: res.error
    }
  })

  // ── Settings ─────────────────────────────────────────────────────
  ipcMain.handle('settings:open', async (_event, target: string = 'main'): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    const commandId = target.startsWith('settings.') ? target : `settings.${target}`
    const res = await commandRegistry.execute(commandId)
    const durationMs = parseFloat((performance.now() - start).toFixed(2))
    return {
      success: res.success,
      action: commandId,
      durationMs,
      output: res.data,
      error: res.error
    }
  })

  // ── Controlled Safe PowerShell Execution ─────────────────────────
  ipcMain.handle('powershell:executeSafeAction', async (_event, script: string): Promise<ControlledExecutionResult> => {
    const start = performance.now()
    try {
      if (!script || typeof script !== 'string') {
        throw new Error('PowerShell script string is required.')
      }
      const res = await powershellService.execute(script, { commandType: 'custom.powershell' })
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: res.success,
        action: 'powershell.executeSafeAction',
        durationMs,
        exitCode: res.exitCode,
        output: res.stdout,
        error: res.stderr || (res.success ? undefined : 'Execution failed')
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: false,
        action: 'powershell.executeSafeAction',
        durationMs,
        error: err.message,
        exitCode: 1
      }
    }
  })
}
