// src/main/ipc/history.ipc.ts — V1.0.5 Task History IPC Handlers
import { ipcMain } from 'electron'
import { taskHistoryService } from '../services/task-history.service'

export function registerHistoryIPC(): void {
  ipcMain.handle('history:list', async (_event, filter?: any) => {
    return taskHistoryService.list(filter)
  })

  ipcMain.handle('history:get', async (_event, id: string) => {
    return taskHistoryService.getById(id)
  })

  ipcMain.handle('history:clear', async () => {
    return taskHistoryService.clear()
  })
}
