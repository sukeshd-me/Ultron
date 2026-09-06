import { ipcMain } from 'electron'
import { workspaceManagerService } from '../services/workspace-manager.service'

export function registerWorkspacesV2Ipc(): void {
  ipcMain.handle('workspaces:list', async () => workspaceManagerService.listWorkspaces())
  ipcMain.handle('workspaces:getActive', async () => workspaceManagerService.getActiveWorkspace())
  ipcMain.handle('workspaces:switch', async (_, idOrName) => workspaceManagerService.switchWorkspace(idOrName))
  ipcMain.handle('workspaces:save', async (_, { profile, items }) => workspaceManagerService.saveWorkspace(profile, items))
  ipcMain.handle('workspaces:delete', async (_, id) => workspaceManagerService.deleteWorkspace(id))
}
