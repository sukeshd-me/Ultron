import { ipcMain } from 'electron'
import { windowManagerService } from '../services/window-manager.service'

export function registerWindowsIpc(): void {
  ipcMain.handle('windows:list', async () => {
    return windowManagerService.listWindows()
  })

  ipcMain.handle('windows:focus', async (_, appName) => {
    return windowManagerService.focusApplication(appName)
  })

  ipcMain.handle('windows:listPresets', async () => {
    return windowManagerService.listWorkspacePresets()
  })

  ipcMain.handle('windows:savePreset', async (_, { name, layout }) => {
    return windowManagerService.saveWorkspacePreset(name, layout)
  })
}
