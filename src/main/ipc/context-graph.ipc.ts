// src/main/ipc/context-graph.ipc.ts — Personal Context Graph IPC for ULTRON V1.0.8
import { ipcMain } from 'electron'
import { contextGraphService } from '../services/context-graph.service'

export function registerContextGraphIpc(): void {
  ipcMain.handle('contextGraph:query', async (_, queryText: string) => {
    return contextGraphService.query(queryText)
  })

  ipcMain.handle('contextGraph:getConnected', async (_, entityTypeOrNodeId: string, entityId?: string) => {
    return contextGraphService.getConnected(entityTypeOrNodeId, entityId)
  })

  ipcMain.handle('contextGraph:sync', async () => {
    return contextGraphService.syncExistingEntities()
  })
}