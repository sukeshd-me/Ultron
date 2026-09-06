import { ipcMain } from 'electron'
import { workspaceBackupService } from '../services/workspace-backup.service'

export function registerBackupIpc(): void {
  ipcMain.handle('backup:create', async (_, name) => workspaceBackupService.createBackup(name))
  ipcMain.handle('backup:list', async () => workspaceBackupService.listBackups())
  ipcMain.handle('backup:restore', async (_, id) => workspaceBackupService.restoreBackup(id))
  ipcMain.handle('backup:delete', async (_, id) => workspaceBackupService.deleteBackup(id))
  ipcMain.handle('backup:export', async (_, { id, filePath }) => workspaceBackupService.exportToFile(id, filePath))
  ipcMain.handle('backup:import', async (_, filePath) => workspaceBackupService.importFromFile(filePath))
}
