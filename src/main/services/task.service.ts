// src/main/services/task.service.ts — Concurrent Multitasking Engine & Millisecond Telemetry
import {
  ConcurrentTask,
  PerformanceMetrics,
  TaskStatus,
  BackgroundTask,
  BackgroundTaskStatus,
  BackgroundTaskCategory,
  BackgroundTaskLog
} from '../../shared/types'
import { v4 as uuidv4 } from 'uuid'
import { memoryDatabase } from '../database/memory.db'

type TaskListener = (tasks: ConcurrentTask[]) => void
type BackgroundTaskListener = (tasks: BackgroundTask[]) => void

export class TaskService {
  private tasks: Map<string, ConcurrentTask> = new Map()
  private listeners: Set<TaskListener> = new Set()
  private executionLatencies: number[] = []
  private peakConcurrentCount: number = 0
  private totalCommands: number = 0

  subscribe(listener: TaskListener): () => void {
    this.listeners.add(listener)
    listener(this.getAllTasks())
    return () => this.listeners.delete(listener)
  }

  private notify() {
    const list = this.getAllTasks()
    const activeCount = list.filter((t) => t.status === 'RUNNING').length
    if (activeCount > this.peakConcurrentCount) {
      this.peakConcurrentCount = activeCount
    }
    this.listeners.forEach((fn) => {
      try {
        fn(list)
      } catch (err) {
        console.error('[TaskService] Listener error:', err)
      }
    })
  }

  getAllTasks(): ConcurrentTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.startTime - a.startTime)
  }

  getActiveTasks(): ConcurrentTask[] {
    return this.getAllTasks().filter((t) => t.status === 'RUNNING' || t.status === 'QUEUED')
  }

  addTaskBatch(tasks: Partial<ConcurrentTask>[]): void {
    const now = Date.now()
    for (const t of tasks) {
      const fullTask: ConcurrentTask = {
        id: t.id || uuidv4(),
        name: t.name || 'Agent Action',
        category: (t.category as any) || 'AI',
        command: t.command || t.name || 'Action',
        status: t.status || 'QUEUED',
        startTime: t.startTime || now,
        durationMs: t.durationMs || 0,
        result: t.result,
        error: t.error
      }
      this.tasks.set(fullTask.id, fullTask)
    }
    this.notify()
  }

  updateTask(id: string, updates: Partial<ConcurrentTask>): void {
    const existing = this.tasks.get(id)
    if (existing) {
      Object.assign(existing, updates)
      if (updates.status === 'COMPLETED' || updates.status === 'FAILED') {
        if (!existing.endTime) existing.endTime = Date.now()
        if (existing.startTime && !existing.durationMs) {
          existing.durationMs = parseFloat((existing.endTime - existing.startTime).toFixed(2))
        }
        if (existing.durationMs > 0) {
          this.executionLatencies.push(existing.durationMs)
        }
      }
      this.notify()
    }
  }

  getMetrics(): PerformanceMetrics {
    const active = this.getActiveTasks().length
    const recent = this.executionLatencies.slice(-50)
    const avg = recent.length > 0 ? recent.reduce((a, b) => a + b, 0) / recent.length : 0
    const last = this.executionLatencies.length > 0 ? this.executionLatencies[this.executionLatencies.length - 1] : 0

    return {
      lastExecutionMs: parseFloat(last.toFixed(2)),
      averageLatencyMs: parseFloat(avg.toFixed(2)),
      activeConcurrentTasks: active,
      peakTasksCount: this.peakConcurrentCount,
      totalCommandsExecuted: this.totalCommands
    }
  }

  async executeTask<T>(
    name: string,
    category: ConcurrentTask['category'],
    command: string,
    runner: () => Promise<T>
  ): Promise<{ task: ConcurrentTask; result?: T; error?: string }> {
    const id = uuidv4()
    const startMs = performance.now()
    this.totalCommands++

    const task: ConcurrentTask = {
      id,
      name,
      category,
      command,
      status: 'RUNNING',
      startTime: Date.now(),
      durationMs: 0
    }

    this.tasks.set(id, task)
    this.notify()

    try {
      const result = await runner()
      const endMs = performance.now()
      const durationMs = parseFloat((endMs - startMs).toFixed(2))

      task.status = 'COMPLETED'
      task.endTime = Date.now()
      task.durationMs = durationMs
      task.result = result

      this.executionLatencies.push(durationMs)
      this.notify()

      return { task, result }
    } catch (err: any) {
      const endMs = performance.now()
      const durationMs = parseFloat((endMs - startMs).toFixed(2))

      task.status = 'FAILED'
      task.endTime = Date.now()
      task.durationMs = durationMs
      task.error = err.message || String(err)

      this.executionLatencies.push(durationMs)
      this.notify()

      return { task, error: task.error }
    }
  }

  /**
   * Execute multiple tasks in parallel with millisecond tracking
   */
  async executeParallel(
    taskDefinitions: Array<{
      name: string
      category: ConcurrentTask['category']
      command: string
      runner: () => Promise<any>
    }>
  ): Promise<{
    tasks: ConcurrentTask[]
    totalDurationMs: number
    successCount: number
    failCount: number
  }> {
    const startAll = performance.now()

    const promises = taskDefinitions.map((def) =>
      this.executeTask(def.name, def.category, def.command, def.runner)
    )

    const outcomes = await Promise.allSettled(promises)
    const endAll = performance.now()
    const totalDurationMs = parseFloat((endAll - startAll).toFixed(2))

    const executedTasks: ConcurrentTask[] = outcomes.map((o) => {
      if (o.status === 'fulfilled') {
        return o.value.task
      } else {
        return {
          id: uuidv4(),
          name: 'Unknown Parallel Task',
          category: 'AI',
          command: 'Parallel Batch',
          status: 'FAILED',
          startTime: Date.now(),
          durationMs: totalDurationMs,
          error: o.reason?.message || 'Execution error'
        }
      }
    })

    const successCount = executedTasks.filter((t) => t.status === 'COMPLETED').length
    const failCount = executedTasks.filter((t) => t.status === 'FAILED').length

    return {
      tasks: executedTasks,
      totalDurationMs,
      successCount,
      failCount
    }
  }

  /**
   * Execute multiple tasks sequentially when dependencies exist
   */
  async executeSequence(
    taskDefinitions: Array<{
      name: string
      category: ConcurrentTask['category']
      command: string
      runner: () => Promise<any>
    }>
  ): Promise<{
    tasks: ConcurrentTask[]
    totalDurationMs: number
    successCount: number
    failCount: number
  }> {
    const startAll = performance.now()
    const executedTasks: ConcurrentTask[] = []

    for (const def of taskDefinitions) {
      const outcome = await this.executeTask(def.name, def.category, def.command, def.runner)
      executedTasks.push(outcome.task)
    }

    const endAll = performance.now()
    const totalDurationMs = parseFloat((endAll - startAll).toFixed(2))
    const successCount = executedTasks.filter((t) => t.status === 'COMPLETED').length
    const failCount = executedTasks.filter((t) => t.status === 'FAILED').length

    return {
      tasks: executedTasks,
      totalDurationMs,
      successCount,
      failCount
    }
  }

  // ═════════════════════════════════════════════════════════════
  // V1.0.4 Background Task System
  // ═════════════════════════════════════════════════════════════
  private bgTasks: Map<string, BackgroundTask> = new Map()
  private abortControllers: Map<string, AbortController> = new Map()
  private bgListeners: Set<BackgroundTaskListener> = new Set()

  subscribeBackgroundTasks(listener: BackgroundTaskListener): () => void {
    this.bgListeners.add(listener)
    listener(this.listBackgroundTasks())
    return () => this.bgListeners.delete(listener)
  }

  private notifyBgTasks(): void {
    const all = this.listBackgroundTasks()
    this.bgListeners.forEach((fn) => {
      try {
        fn(all)
      } catch (err) {
        console.error('[TaskService] BgTask listener error:', err)
      }
    })
  }

  createBackgroundTask(opts: {
    title: string
    description?: string
    category: BackgroundTaskCategory
    metadata?: Record<string, unknown>
  }): BackgroundTask {
    const id = uuidv4()
    const now = Date.now()
    const controller = new AbortController()
    this.abortControllers.set(id, controller)

    const task: BackgroundTask = {
      id,
      title: opts.title,
      description: opts.description,
      category: opts.category,
      status: 'RUNNING',
      progress: 0,
      logs: [
        {
          timestamp: now,
          level: 'info',
          message: `Background task "${opts.title}" initiated.`
        }
      ],
      startTime: now,
      metadata: opts.metadata
    }

    this.bgTasks.set(id, task)
    try {
      memoryDatabase.saveTask(task)
    } catch (err) {
      console.warn('[TaskService] Failed to persist task to SQLite:', err)
    }

    this.notifyBgTasks()
    return task
  }

  listBackgroundTasks(filter?: { status?: BackgroundTaskStatus; category?: BackgroundTaskCategory }): BackgroundTask[] {
    // Merge memory cache with database
    const memTasks = Array.from(this.bgTasks.values())
    let dbTasks: BackgroundTask[] = []
    try {
      dbTasks = memoryDatabase.listTasks(50)
    } catch {
      // ignore
    }

    const taskMap = new Map<string, BackgroundTask>()
    for (const t of dbTasks) {
      taskMap.set(t.id, t)
    }
    for (const t of memTasks) {
      taskMap.set(t.id, t)
    }

    let result = Array.from(taskMap.values()).sort((a, b) => b.startTime - a.startTime)
    if (filter?.status) {
      result = result.filter((t) => t.status === filter.status)
    }
    if (filter?.category) {
      result = result.filter((t) => t.category === filter.category)
    }

    return result
  }

  getBackgroundTask(id: string): BackgroundTask | null {
    if (this.bgTasks.has(id)) {
      return this.bgTasks.get(id)!
    }
    try {
      const fromDb = memoryDatabase.getTask(id)
      if (fromDb) {
        this.bgTasks.set(id, fromDb)
        return fromDb
      }
    } catch {
      // ignore
    }
    return null
  }

  getAbortSignal(id: string): AbortSignal | undefined {
    return this.abortControllers.get(id)?.signal
  }

  updateBackgroundTask(id: string, updates: Partial<BackgroundTask>): void {
    const task = this.getBackgroundTask(id)
    if (!task) return

    Object.assign(task, updates)
    if (updates.status === 'COMPLETED' || updates.status === 'FAILED' || updates.status === 'CANCELLED') {
      if (!task.endTime) task.endTime = Date.now()
      if (task.startTime) {
        task.durationMs = task.endTime - task.startTime
      }
      this.abortControllers.delete(id)
    }

    this.bgTasks.set(id, task)
    try {
      memoryDatabase.saveTask(task)
    } catch (err) {
      console.warn('[TaskService] Failed to update task in SQLite:', err)
    }

    this.notifyBgTasks()
  }

  appendBackgroundTaskLog(
    id: string,
    message: string,
    level: 'info' | 'warn' | 'error' | 'debug' = 'info'
  ): void {
    const task = this.getBackgroundTask(id)
    if (!task) return

    if (!task.logs) task.logs = []
    task.logs.push({
      timestamp: Date.now(),
      level,
      message
    })

    if (task.logs.length > 500) {
      task.logs = task.logs.slice(-500)
    }

    this.bgTasks.set(id, task)
    try {
      memoryDatabase.saveTask(task)
    } catch {
      // ignore
    }

    this.notifyBgTasks()
  }

  cancelBackgroundTask(id: string): boolean {
    const task = this.getBackgroundTask(id)
    if (!task) return false

    if (task.status === 'COMPLETED' || task.status === 'FAILED' || task.status === 'CANCELLED') {
      return true
    }

    const controller = this.abortControllers.get(id)
    if (controller) {
      controller.abort()
      this.abortControllers.delete(id)
    }

    this.updateBackgroundTask(id, {
      status: 'CANCELLED',
      endTime: Date.now()
    })
    this.appendBackgroundTaskLog(id, 'Task cancelled by user request.', 'warn')
    return true
  }

  pauseBackgroundTask(id: string): boolean {
    const task = this.getBackgroundTask(id)
    if (!task || task.status !== 'RUNNING') return false

    this.updateBackgroundTask(id, { status: 'PAUSED' })
    this.appendBackgroundTaskLog(id, 'Task execution paused.', 'info')
    return true
  }

  resumeBackgroundTask(id: string): boolean {
    const task = this.getBackgroundTask(id)
    if (!task || task.status !== 'PAUSED') return false

    this.updateBackgroundTask(id, { status: 'RUNNING' })
    this.appendBackgroundTaskLog(id, 'Task execution resumed.', 'info')
    return true
  }

  getBackgroundTaskLogs(id: string): BackgroundTaskLog[] {
    const task = this.getBackgroundTask(id)
    return task?.logs || []
  }
}

export const taskService = new TaskService()
