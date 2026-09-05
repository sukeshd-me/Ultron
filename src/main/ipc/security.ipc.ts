// src/main/ipc/security.ipc.ts — V1.0.5 Security Center IPC Handlers
import { ipcMain } from 'electron'
import { securityService } from '../services/security.service'

export function registerSecurityIPC(): void {
  ipcMain.handle('securityCenter:getReport', async () => {
    return securityService.getDefensiveReport()
  })

  ipcMain.handle('securityCenter:getAudit', async (_event, limit?: number) => {
    return securityService.getSecurityAudit(limit)
  })
}
