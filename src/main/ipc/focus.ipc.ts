import { ipcMain } from 'electron'
import { focusService } from '../services/focus.service'

export function registerFocusIpc(): void {
  ipcMain.handle('focus:start', async (_, { mode, durationMinutes, customApps }) => focusService.startFocus(mode, durationMinutes, customApps))
  ipcMain.handle('focus:end', async () => focusService.endFocus())
  ipcMain.handle('focus:getActive', async () => focusService.getActiveSession())
  ipcMain.handle('focus:list', async (_, limit) => focusService.listSessions(limit))
}
