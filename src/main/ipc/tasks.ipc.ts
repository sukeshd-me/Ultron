// src/main/ipc/tasks.ipc.ts — V1.0.4 Background Task System IPC Handlers
import { ipcMain } from 'electron'
import { taskService } from '../services/task.service'
import { BackgroundTaskCategory, BackgroundTaskStatus } from '../../shared/types'

export function registerTasksIPC(): void {
  ipcMain.handle(
    'tasks:list',
    async (_event, filter?: { status?: BackgroundTaskStatus; category?: BackgroundTaskCategory }) => {
      return taskService.listBackgroundTasks(filter)
    }
  )

  ipcMain.handle('tasks:get', async (_event, id: string) => {
    return taskService.getBackgroundTask(id)
  })

  ipcMain.handle('tasks:cancel', async (_event, id: string) => {
    return taskService.cancelBackgroundTask(id)
  })

  ipcMain.handle('tasks:pause', async (_event, id: string) => {
    return taskService.pauseBackgroundTask(id)
  })

  ipcMain.handle('tasks:resume', async (_event, id: string) => {
    return taskService.resumeBackgroundTask(id)
  })

  ipcMain.handle('tasks:getLogs', async (_event, id: string) => {
    return taskService.getBackgroundTaskLogs(id)
  })
}
