import { ipcMain } from 'electron'
import { continuityService } from '../services/continuity.service'

export function registerContinuityIpc(): void {
  ipcMain.handle('continuity:getStatus', async () => continuityService.getStatus())
  ipcMain.handle('continuity:getActive', async () => continuityService.getActiveSession())
  ipcMain.handle('continuity:sync', async (_, { missionId, stateSummary }) => continuityService.syncMissionState(missionId, stateSummary))
}
