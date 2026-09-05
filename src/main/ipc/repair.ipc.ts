// src/main/ipc/repair.ipc.ts — V1.0.5 Safe Diagnostics Repair IPC Handlers
import { ipcMain } from 'electron'
import { safeRepairService } from '../services/repair.service'

export function registerRepairIPC(): void {
  ipcMain.handle('repair:listKnownFixes', async () => {
    return safeRepairService.getKnownFixes()
  })

  ipcMain.handle('repair:executeRepair', async (_event, repairId: string) => {
    return safeRepairService.executeRepair(repairId)
  })
}
