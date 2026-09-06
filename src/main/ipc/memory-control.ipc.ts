import { ipcMain } from 'electron'
import { memoryControlService } from '../services/memory-control.service'

export function registerMemoryControlIpc(): void {
  ipcMain.handle('memoryControl:search', async (_, filter) => memoryControlService.search(filter))
  ipcMain.handle('memoryControl:forget', async (_, { id, createBackup }) => memoryControlService.forgetMemory(id, createBackup))
  ipcMain.handle('memoryControl:archive', async (_, { id, archived }) => memoryControlService.setArchived(id, archived))
  ipcMain.handle('memoryControl:export', async (_, scope) => memoryControlService.exportSnapshot(scope))
  ipcMain.handle('memoryControl:clearScope', async (_, scope) => memoryControlService.clearScope(scope))
}
