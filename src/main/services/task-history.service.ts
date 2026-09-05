// src/main/services/task-history.service.ts — Detailed Task History for ULTRON V1.0.5
import { memoryDatabase } from '../database/memory.db'
import { TaskHistoryRecord } from '../../shared/types'

export class TaskHistoryService {
  record(entry: Omit<TaskHistoryRecord, 'id'> & { id?: string }): TaskHistoryRecord {
    return memoryDatabase.recordTaskHistory(entry)
  }

  list(filter?: { category?: string; status?: string; query?: string; limit?: number; offset?: number }): TaskHistoryRecord[] {
    return memoryDatabase.listTaskHistory(filter)
  }

  get(id: string): TaskHistoryRecord | null {
    return memoryDatabase.getTaskHistoryRecord(id)
  }

  clear(): boolean {
    return memoryDatabase.clearTaskHistory()
  }
}

export const taskHistoryService = new TaskHistoryService()
