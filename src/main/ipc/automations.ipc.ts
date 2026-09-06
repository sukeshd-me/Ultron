import { ipcMain } from 'electron'
import { automationService } from '../services/automation.service'
import { schedulerService } from '../services/scheduler.service'

export function registerAutomationsIpc(): void {
  ipcMain.handle('automations:list', async () => automationService.listAutomations())
  ipcMain.handle('automations:get', async (_, id) => automationService.getAutomation(id))
  ipcMain.handle('automations:save', async (_, def) => automationService.saveAutomation(def))
  ipcMain.handle('automations:delete', async (_, id) => automationService.deleteAutomation(id))
  ipcMain.handle('automations:toggle', async (_, { id, enabled }) => automationService.toggleAutomation(id, enabled))
  ipcMain.handle('automations:execute', async (_, { id, contextData, permissionGranted }) => automationService.executeAutomation(id, contextData, permissionGranted))
  ipcMain.handle('automations:listRuns', async (_, { limit, automationId }) => automationService.listRuns(limit, automationId))

  ipcMain.handle('missions:listScheduled', async () => schedulerService.listScheduledMissions())
  ipcMain.handle('missions:schedule', async (_, params) => schedulerService.scheduleMission(params))
  ipcMain.handle('missions:pauseScheduled', async (_, id) => schedulerService.pauseMission(id))
  ipcMain.handle('missions:resumeScheduled', async (_, id) => schedulerService.resumeMission(id))
  ipcMain.handle('missions:cancelScheduled', async (_, id) => schedulerService.cancelMission(id))
  ipcMain.handle('missions:deleteScheduled', async (_, id) => schedulerService.deleteMission(id))
  ipcMain.handle('missions:runScheduledNow', async (_, id) => schedulerService.runNow(id))
}
