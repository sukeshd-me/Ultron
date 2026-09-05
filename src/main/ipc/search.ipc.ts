// src/main/ipc/search.ipc.ts — V1.0.4 Universal Search IPC Handlers
import { ipcMain } from 'electron'
import { searchService } from '../services/search.service'
import { SearchCategory, SearchSafeAction } from '../../shared/types'

export function registerSearchIPC(): void {
  ipcMain.handle('search:query', async (_event, query: string, categories?: SearchCategory[]) => {
    return searchService.query(query, categories)
  })

  ipcMain.handle('search:executeAction', async (_event, action: SearchSafeAction) => {
    return searchService.executeAction(action)
  })
}
