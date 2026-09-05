// src/main/ipc/missions.ipc.ts — V1.0.5 Agent Mission IPC Handlers
import { ipcMain } from 'electron'
import { missionService } from '../services/mission.service'

export function registerMissionsIPC(): void {
  ipcMain.handle('missions:create', async (_event, title: string, description: string, steps: any[]) => {
    return missionService.createMission(title, description, steps)
  })

  ipcMain.handle('missions:list', async () => {
    return missionService.listMissions()
  })

  ipcMain.handle('missions:get', async (_event, id: string) => {
    return missionService.getMission(id)
  })

  ipcMain.handle('missions:start', async (_event, id: string) => {
    return missionService.startMission(id)
  })

  ipcMain.handle('missions:pause', async (_event, id: string) => {
    return missionService.pauseMission(id)
  })

  ipcMain.handle('missions:resume', async (_event, id: string) => {
    return missionService.resumeMission(id)
  })

  ipcMain.handle('missions:cancel', async (_event, id: string) => {
    return missionService.cancelMission(id)
  })

  ipcMain.handle('missions:retryStep', async (_event, missionId: string, stepId: string) => {
    return missionService.retryStep(missionId, stepId)
  })

  ipcMain.handle('actionPreview:respond', async (_event, previewId: string, approved: boolean) => {
    if (approved) {
      return missionService.approveActionPreview(previewId)
    } else {
      return missionService.rejectActionPreview(previewId)
    }
  })
}
