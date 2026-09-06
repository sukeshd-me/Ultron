// src/main/services/memory-control.service.ts — Memory Control Center for ULTRON V1.0.7
import { MemoryItemView, MemoryControlFilter, MemoryControlCategory } from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'

export class MemoryControlService {
  /**
   * Search and filter memories by category, scope, and query string
   */
  search(filter: MemoryControlFilter & { limit?: number }): MemoryItemView[] {
    return memoryDatabase.scopedSearchMemories(filter)
  }

  /**
   * Safely forget/delete a single memory item
   * Automatically creates a reversible recovery backup before execution
   */
  forgetMemory(id: string, createBackup = true): { success: boolean; backupId?: string; error?: string } {
    return memoryDatabase.scopedDeleteMemory(id, createBackup)
  }

  /**
   * Archive or unarchive a memory item
   */
  setArchived(id: string, archived: boolean): boolean {
    return memoryDatabase.archiveMemory(id, archived)
  }

  /**
   * Export memory snapshot by scope or globally
   */
  exportSnapshot(scope?: string): { snapshot: any; count: number; exportedAt: number } {
    return memoryDatabase.exportMemorySnapshot(scope)
  }

  /**
   * Safely clear all memories belonging strictly to a specific project scope
   * Creates a batch recovery action so it can be restored
   */
  clearScope(scope: string): { success: boolean; deletedCount: number; message: string } {
    if (!scope || scope === 'Global' || scope.trim() === '') {
      throw new Error('Clearing Global or unspecified scope in bulk is prohibited for data safety.')
    }

    const items = memoryDatabase.scopedSearchMemories({ scope, limit: 500 })
    let deletedCount = 0

    for (const item of items) {
      const res = memoryDatabase.scopedDeleteMemory(item.id, true)
      if (res.success) deletedCount++
    }

    return {
      success: true,
      deletedCount,
      message: `Safely removed ${deletedCount} memories scoped to "${scope}". Recovery backups created.`
    }
  }
}

export const memoryControlService = new MemoryControlService()
