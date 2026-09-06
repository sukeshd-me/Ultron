// src/main/ipc/model-perf.ipc.ts — Model Performance Intelligence IPC for ULTRON V1.0.8
import { ipcMain } from 'electron'
import { modelPerformanceService } from '../services/model-performance.service'

export function registerModelPerfIpc(): void {
  ipcMain.handle('modelPerf:getStats', async (_, modelId?: string) => {
    return modelPerformanceService.getStats(modelId)
  })

  ipcMain.handle('modelPerf:getLogs', async (_, limit?: number) => {
    return modelPerformanceService.getRecentLogs(limit)
  })
}