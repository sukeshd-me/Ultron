// src/main/ipc/contradictions.ipc.ts — Contradictions & Checkpoints IPC for ULTRON V1.0.8
import { ipcMain } from 'electron'
import { contradictionDetectorService } from '../services/contradiction-detector.service'
import { missionService } from '../services/mission.service'

export function registerContradictionsIpc(): void {
  ipcMain.handle('contradictions:getActive', async () => {
    return contradictionDetectorService.getActiveConflicts()
  })

  ipcMain.handle('contradictions:resolve', async (_, id: string) => {
    return contradictionDetectorService.resolveConflict(id)
  })

  ipcMain.handle('missions:getCheckpoints', async (_, missionId: string) => {
    return missionService.getCheckpoints(missionId)
  })

  ipcMain.handle('missions:resolveCheckpoint', async (_, checkpointId: string, action: 'APPROVED' | 'EDITED' | 'CANCELLED') => {
    return missionService.resolveCheckpoint(checkpointId, action)
  })
}