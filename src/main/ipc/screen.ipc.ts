// src/main/ipc/screen.ipc.ts — Native Screen Share & Multimodal Vision IPC Handlers
import { ipcMain } from 'electron'
import { screenService } from '../services/screen.service'

export function registerScreenIPC(): void {
  ipcMain.handle('screen:getSources', async () => {
    return screenService.getSources()
  })

  ipcMain.handle('screen:captureFrame', async (_event, sourceId?: string) => {
    return screenService.captureFrame(sourceId)
  })

  ipcMain.handle('screen:analyzeScreen', async (_event, prompt?: string, sourceId?: string) => {
    return screenService.analyzeScreen(prompt, sourceId)
  })

  ipcMain.handle('screen:setSharingState', async (_event, active: boolean, sourceId?: string) => {
    screenService.setSharingState(active, sourceId)
    return screenService.getSharingState()
  })

  ipcMain.handle('screen:getSharingState', async () => {
    return screenService.getSharingState()
  })
}
