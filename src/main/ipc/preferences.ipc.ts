// src/main/ipc/preferences.ipc.ts — V1.0.5 User Preferences IPC Handlers
import { ipcMain } from 'electron'
import { preferenceService } from '../services/preference.service'

export function registerPreferencesIPC(): void {
  ipcMain.handle('preferences:getAll', async () => {
    return preferenceService.getAll()
  })

  ipcMain.handle('preferences:get', async (_event, key: string) => {
    return preferenceService.get(key)
  })

  ipcMain.handle('preferences:set', async (_event, key: string, value: any, category?: string) => {
    return preferenceService.set(key, value, category)
  })

  ipcMain.handle('preferences:delete', async (_event, key: string) => {
    return preferenceService.delete(key)
  })

  ipcMain.handle('preferences:reset', async () => {
    return preferenceService.reset()
  })
}
