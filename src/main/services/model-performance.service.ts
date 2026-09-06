// src/main/services/model-performance.service.ts — Agent Cost & Performance Intelligence for ULTRON V1.0.8
import { memoryDatabase } from '../database/memory.db'
import { ModelPerformanceRecord, ModelPerformanceStats, ModelTier } from '../../shared/types'

export class ModelPerformanceService {
  /**
   * Record real execution metrics for model call
   */
  recordExecution(params: {
    modelId: string
    tier: ModelTier
    taskCategory: string
    latencyMs: number
    firstTokenMs?: number
    success: boolean
    retryCount?: number
    verificationStatus?: string
  }): ModelPerformanceRecord {
    return memoryDatabase.recordModelPerformance({
      ...params,
      taskCategory: params.taskCategory || (params as any).taskType || 'GENERAL',
      retryCount: params.retryCount || 0
    })
  }

  /**
   * Get dynamic performance stats and ranking weights
   */
  getStats(modelId?: string): ModelPerformanceStats[] {
    return memoryDatabase.getModelPerformanceStats(modelId)
  }

  /**
   * Compute dynamic priority boost/penalty for AUTO routing
   */
  getPriorityAdjustment(modelId: string): number {
    const stats = this.getStats(modelId)
    if (!stats || stats.length === 0) return 1.0
    return stats[0].priorityWeight
  }

  getRecentLogs(limit = 50): ModelPerformanceRecord[] {
    return memoryDatabase.getRecentModelPerformance(limit)
  }
}

export const modelPerformanceService = new ModelPerformanceService()