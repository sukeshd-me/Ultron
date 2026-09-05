// src/main/ipc/notifications.ipc.ts — V1.0.5 Smart Notifications IPC Handlers
import { ipcMain } from 'electron'
import { notificationService } from '../services/notification.service'

export function registerNotificationsIPC(): void {
  ipcMain.handle('notifications:list', async (_event, limit?: number) => {
    return notificationService.listNotifications(limit)
  })

  ipcMain.handle('notifications:dismiss', async (_event, id: string) => {
    return notificationService.dismiss(id)
  })

  ipcMain.handle('notifications:clearAll', async () => {
    return notificationService.clearAll()
  })
}
