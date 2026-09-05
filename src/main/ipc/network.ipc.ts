// src/main/ipc/network.ipc.ts — V1.0.5 Network Awareness IPC Handlers
import { ipcMain } from 'electron'
import { networkService } from '../services/network.service'

export function registerNetworkIPC(): void {
  ipcMain.handle('network:getStatus', async () => {
    return networkService.getNetworkStatus()
  })

  ipcMain.handle('network:ping', async (_event, host?: string) => {
    return networkService.pingDestination(host)
  })
}
