import { ipcMain, dialog } from 'electron'
import { importExportService } from '../services/import-export.service'

export function registerImportExportIpc(): void {
  ipcMain.handle('importExport:exportConfig', async (_, options) => {
    const saveDialog = await dialog.showSaveDialog({
      title: 'Export ULTRON Configuration',
      defaultPath: 'ultron_config_backup.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    })
    if (saveDialog.canceled || !saveDialog.filePath) {
      return { success: false, message: 'Export cancelled by user.' }
    }
    return importExportService.exportConfiguration(
      saveDialog.filePath,
      options?.includePreferences,
      options?.includeSkills,
      options?.includeWorkspaces
    )
  })

  ipcMain.handle('importExport:importConfig', async () => {
    const openDialog = await dialog.showOpenDialog({
      title: 'Import ULTRON Configuration',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    })
    if (openDialog.canceled || openDialog.filePaths.length === 0) {
      return { success: false, message: 'Import cancelled by user.' }
    }
    return importExportService.importConfiguration(openDialog.filePaths[0])
  })
}
