// src/main/ipc/recovery.ipc.ts — V1.0.5 Undo/Recovery IPC Handlers
import { ipcMain } from 'electron'
import { recoveryService } from '../services/recovery.service'

export function registerRecoveryIPC(): void {
  ipcMain.handle('recovery:list', async (_event, limit?: number) => {
    return recoveryService.listRecentActions(limit)
  })

  ipcMain.handle('recovery:undo', async (_event, actionId?: string) => {
    return recoveryService.undo(actionId)
  })

  ipcMain.handle('recovery:redo', async (_event, actionId?: string) => {
    return recoveryService.redo(actionId)
  })
}
