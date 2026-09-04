// src/main/ipc/memory.ipc.ts — Electron IPC handlers for ULTRON Memory Subsystem
import { ipcMain } from 'electron'
import { memoryService } from '../services/memory.service'
import { MemorySearchParams, MemoryCategory } from '../../shared/types'

export function registerMemoryIPC(): void {
  ipcMain.handle('memory:list', async (_event, options?: { category?: string; limit?: number; offset?: number }) => {
    try {
      return await memoryService.listMemories(options)
    } catch (err: any) {
      console.error('[IPC:memory:list] Error:', err)
      return { records: [], total: 0, error: err.message }
    }
  })

  ipcMain.handle('memory:search', async (_event, params: MemorySearchParams) => {
    try {
      return await memoryService.searchMemories(params)
    } catch (err: any) {
      console.error('[IPC:memory:search] Error:', err)
      return []
    }
  })

  ipcMain.handle(
    'memory:save',
    async (
      _event,
      entry: {
        category: MemoryCategory
        key?: string
        content: string
        metadata?: Record<string, unknown>
        tags?: string[]
      }
    ) => {
      try {
        if (!entry || !entry.category || !entry.content) {
          throw new Error('Invalid memory entry: category and content are required.')
        }
        return await memoryService.saveMemory(entry)
      } catch (err: any) {
        console.error('[IPC:memory:save] Error:', err)
        throw err
      }
    }
  )

  ipcMain.handle('memory:delete', async (_event, id: string) => {
    try {
      if (!id || typeof id !== 'string') {
        throw new Error('Valid memory ID is required.')
      }
      return await memoryService.deleteMemory(id)
    } catch (err: any) {
      console.error('[IPC:memory:delete] Error:', err)
      return false
    }
  })

  ipcMain.handle('memory:clear', async () => {
    try {
      return await memoryService.clearMemories()
    } catch (err: any) {
      console.error('[IPC:memory:clear] Error:', err)
      return false
    }
  })

  ipcMain.handle('memory:stats', async () => {
    try {
      return await memoryService.getStats()
    } catch (err: any) {
      console.error('[IPC:memory:stats] Error:', err)
      return { total: 0, byCategory: {}, lastUpdated: Date.now() }
    }
  })
}
