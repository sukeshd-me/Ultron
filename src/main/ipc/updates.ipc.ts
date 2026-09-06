import { ipcMain } from 'electron'
import { updateService } from '../services/update.service'

export function registerUpdatesIpc(): void {
  ipcMain.handle('updates:check', async () => updateService.checkForUpdates())
  ipcMain.handle('updates:getCurrentVersion', async () => updateService.getCurrentVersion())
  ipcMain.handle('updates:prepareBackup', async () => updateService.prepareUpdateBackup())
}
