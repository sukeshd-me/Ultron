// src/main/ipc/workspace.ipc.ts — V1.0.4 Smart Workspace IPC Handlers
import { ipcMain } from 'electron'
import { workspaceService } from '../services/workspace.service'

export function registerWorkspaceIPC(): void {
  ipcMain.handle('workspace:getContext', async () => {
    return workspaceService.getContext()
  })

  ipcMain.handle('workspace:switchProject', async (_event, path: string) => {
    return workspaceService.switchWorkspace(path)
  })

  ipcMain.handle('workspace:getRecentWorkspaces', async () => {
    return workspaceService.listWorkspaces()
  })
}
