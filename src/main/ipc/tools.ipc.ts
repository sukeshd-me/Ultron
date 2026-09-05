// src/main/ipc/tools.ipc.ts — Tools IPC handlers connected to Command Registry
import { ipcMain } from 'electron'
import { commandRegistry } from '../services/command.registry'
import { toolsRegistry } from '../services/tools.registry'
import { intentService } from '../services/intent.service'
import { memoryService } from '../services/memory.service'

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

  ipcMain.handle('tools:confirm', async (_event, id: string, confirmed: boolean) => {
    const pending = intentService.getPendingConfirmation(id)
    if (!pending) {
      return { success: false, confirmed, message: 'Confirmation expired or action not found.' }
    }
    intentService.removePendingConfirmation(id)

    if (!confirmed) {
      // Action cancelled
      memoryService.saveMemory({
        category: 'action',
        content: `Intent: ${pending.intent} - Cancelled by user`,
        metadata: {
          intent: pending.intent,
          source: 'chat',
          status: 'cancelled',
          timestamp: Date.now(),
          duration_ms: 0
        }
      }).catch(() => {})
      return { success: true, confirmed: false, message: 'Action cancelled.' }
    }

    // Action confirmed: execute tool safely
    const startMs = performance.now()
    const res = await toolsRegistry.execute(pending.tool, pending.args)
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))

    memoryService.saveMemory({
      category: 'action',
      content: `Intent: ${pending.intent} - ${res.success ? 'Executed successfully' : 'Execution failed'}`,
      metadata: {
        intent: pending.intent,
        source: 'chat',
        status: res.success ? 'success' : 'failed',
        timestamp: Date.now(),
        duration_ms
      }
    }).catch(() => {})

    let message = res.success ? `Action ${pending.action} completed successfully.` : (res.error || 'Execution failed.')
    if (pending.intent === 'android.power_off') {
      message = res.success
        ? 'Phone power off command sent.'
        : (res.error || 'Failed to power off phone. Check if phone is connected via ADB.')
    } else if (pending.intent === 'android.restart') {
      message = res.success
        ? 'Phone restart command sent.'
        : (res.error || 'Failed to restart phone. Check if phone is connected via ADB.')
    }

    return {
      success: res.success,
      confirmed: true,
      data: res.data,
      error: res.error,
      message,
      duration_ms
    }
  })
}