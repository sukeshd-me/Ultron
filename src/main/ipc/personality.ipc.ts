import { ipcMain } from 'electron'
import { personalityService } from '../services/personality.service'

export function registerPersonalityIpc(): void {
  ipcMain.handle('personality:list', async () => personalityService.listProfiles())
  ipcMain.handle('personality:getActive', async () => personalityService.getActiveProfile())
  ipcMain.handle('personality:setActive', async (_, id) => personalityService.setActiveProfile(id))
}
