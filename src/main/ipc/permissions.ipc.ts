// src/main/ipc/permissions.ipc.ts — Permission Center IPC Handlers
import { ipcMain } from 'electron'
import { permissionsService } from '../services/permissions.service'
import { PermissionCategory, PermissionLevel } from '../../shared/permissions.types'

export function registerPermissionsIPC(): void {
  ipcMain.handle('permissions:getAll', async () => {
    return permissionsService.getPermissions()
  })

  ipcMain.handle('permissions:set', async (_event, category: PermissionCategory, level: PermissionLevel) => {
    permissionsService.setPermission(category, level)
    return true
  })

  ipcMain.handle('permissions:reset', async () => {
    permissionsService.resetPermissions()
    return true
  })

  ipcMain.handle('permissions:getAudit', async (_event, limit?: number) => {
    return permissionsService.getAuditLog(limit)
  })

  ipcMain.handle('permissions:grantTemporary', async (_event, actionToken: string) => {
    permissionsService.grantTemporary(actionToken)
    return true
  })
}
