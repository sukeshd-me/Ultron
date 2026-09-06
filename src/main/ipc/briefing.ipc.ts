import { ipcMain } from 'electron'
import { briefingService } from '../services/briefing.service'

export function registerBriefingIpc(): void {
  ipcMain.handle('briefing:generate', async () => briefingService.generateBriefing())
  ipcMain.handle('briefing:getLatest', async () => briefingService.getLatest())
  ipcMain.handle('briefing:list', async (_, limit) => briefingService.listBriefings(limit))
}
