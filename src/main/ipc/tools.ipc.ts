// src/main/ipc/tools.ipc.ts — Tools IPC handlers connected to Command Registry
import { ipcMain } from 'electron'
import { commandRegistry } from '../services/command.registry'

export function registerToolsIPC(): void {
  ipcMain.handle('tools:execute', async (_event, toolCall: { id: string; tool: string; action: string; args?: any }) => {
    const start = performance.now()
    const commandId = toolCall.action || toolCall.tool
    const res = await commandRegistry.execute(commandId, toolCall.args)
    const duration_ms = parseFloat((performance.now() - start).toFixed(2))

    return {
      id: toolCall.id,
      success: res.success,
      data: res.data,
      error: res.error,
      duration_ms
    }
  })

  ipcMain.handle('tools:confirm', async (_event, _id: string, _confirmed: boolean) => {
    return { confirmed: _confirmed }
  })
}