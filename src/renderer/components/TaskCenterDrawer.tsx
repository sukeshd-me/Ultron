// src/renderer/components/TaskCenterDrawer.tsx — V1.0.4 Background Task Engine Center
import React, { useState, useEffect } from 'react'
import {
  ListTodo,
  Play,
  Pause,
  XCircle,
  Clock,
  Terminal,
  RefreshCw,
  X,
  CheckCircle2,
  AlertOctagon,
  ChevronRight,
  FileText
} from 'lucide-react'
import { BackgroundTask, TaskStatus, TaskLogEntry } from '../../shared/types'

interface TaskCenterDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function TaskCenterDrawer({ isOpen, onClose }: TaskCenterDrawerProps) {
  const [tasks, setTasks] = useState<BackgroundTask[]>([])
  const [selectedTask, setSelectedTask] = useState<BackgroundTask | null>(null)
  const [taskLogs, setTaskLogs] = useState<TaskLogEntry[]>([])
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [loading, setLoading] = useState(false)

  const fetchTasks = async () => {
    const ultron = (window as any).ultron
    if (!ultron?.tasks?.list) return

    try {
      const filter = statusFilter === 'all' ? undefined : { status: statusFilter }
      const res = await ultron.tasks.list(filter)
      setTasks(res || [])
    } catch (err) {
      console.error('[Tasks] Fetch error:', err)
    }
  }

  const fetchLogs = async (taskId: string) => {
    const ultron = (window as any).ultron
    if (!ultron?.tasks?.getLogs) return
    try {
      const logs = await ultron.tasks.getLogs(taskId)
      setTaskLogs(logs || [])
    } catch (err) {
      console.error('[Tasks] Fetch logs error:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchTasks()
      const interval = setInterval(fetchTasks, 3000)
      return () => clearInterval(interval)
    }
  }, [isOpen, statusFilter])

  useEffect(() => {
    if (selectedTask) {
      fetchLogs(selectedTask.id)
      const interval = setInterval(() => fetchLogs(selectedTask.id), 2000)
      return () => clearInterval(interval)
    } else {
      setTaskLogs([])
    }
  }, [selectedTask])

  const handlePause = async (taskId: string) => {
    const ultron = (window as any).ultron
    if (ultron?.tasks?.pause) {
      await ultron.tasks.pause(taskId)
      fetchTasks()
    }
  }

  const handleResume = async (taskId: string) => {
    const ultron = (window as any).ultron
    if (ultron?.tasks?.resume) {
      await ultron.tasks.resume(taskId)
      fetchTasks()
    }
  }

  const handleCancel = async (taskId: string) => {
    const ultron = (window as any).ultron
    if (ultron?.tasks?.cancel) {
      await ultron.tasks.cancel(taskId)
      fetchTasks()
    }
  }

  if (!isOpen) return null

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'running':
        return (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
            <RefreshCw size={10} className="animate-spin" /> running
          </span>
        )
      case 'paused':
        return (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-500/40 flex items-center gap-1">
            <Pause size={10} /> paused
          </span>
        )
      case 'completed':
        return (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
            <CheckCircle2 size={10} /> completed
          </span>
        )
      case 'cancelled':
        return (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10 flex items-center gap-1">
            <XCircle size={10} /> cancelled
          </span>
        )
      case 'failed':
        return (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-500/40 flex items-center gap-1">
            <AlertOctagon size={10} /> failed
          </span>
        )
      default:
        return (
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-gray-400">
            {status}
          </span>
        )
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl h-full bg-black border-l border-cyan-500/30 shadow-[0_0_50px_rgba(0,212,255,0.15)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#050505]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
              <ListTodo size={18} className="text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 tracking-wider">ASYNC TASK ENGINE</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                  V1.0.4
                </span>
              </div>
              <h2 className="text-base font-semibold text-white tracking-wide">Background Task Manager</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 border-b border-white/5 bg-[#030303]">
          {(['all', 'running', 'paused', 'completed', 'failed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`text-xs px-2.5 py-1 rounded font-medium transition-all uppercase font-mono ${
                statusFilter === filter
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {filter}
            </button>
          ))}
          <button
            onClick={fetchTasks}
            className="ml-auto text-xs text-gray-400 hover:text-cyan-400 flex items-center gap-1"
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Task List & Detail View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Task List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {tasks.length === 0 ? (
              <div className="py-24 text-center text-gray-500 text-xs font-mono">
                No {statusFilter === 'all' ? '' : statusFilter} tasks currently recorded in persistent store.
              </div>
            ) : (
              tasks.map((task) => {
                const isSelected = selectedTask?.id === task.id
                return (
                  <div
                    key={task.id}
                    className={`border rounded-lg p-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/20 border-cyan-500/40'
                        : 'bg-[#050505] border-white/10 hover:border-white/20'
                    }`}
                    onClick={() => setSelectedTask(isSelected ? null : task)}
                  >
                    {/* Top Row: Title, Badge, Controls */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-gray-200 truncate flex items-center gap-2">
                          <span>{task.title}</span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/5 text-gray-400">
                            {task.category}
                          </span>
                        </div>
                        {task.description && (
                          <div className="text-[11px] text-gray-400 truncate mt-0.5 font-mono">
                            {task.description}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(task.status)}

                        {/* Controls */}
                        {task.status === 'running' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePause(task.id)
                            }}
                            title="Pause task"
                            className="p-1 rounded bg-white/5 hover:bg-amber-500/20 text-gray-300 hover:text-amber-300 border border-white/10"
                          >
                            <Pause size={12} />
                          </button>
                        )}
                        {task.status === 'paused' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleResume(task.id)
                            }}
                            title="Resume task"
                            className="p-1 rounded bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-white/10"
                          >
                            <Play size={12} />
                          </button>
                        )}
                        {(task.status === 'running' || task.status === 'paused') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancel(task.id)
                            }}
                            title="Cancel task"
                            className="p-1 rounded bg-white/5 hover:bg-rose-500/20 text-gray-300 hover:text-rose-300 border border-white/10"
                          >
                            <XCircle size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full transition-all duration-300 ${
                            task.status === 'completed'
                              ? 'bg-emerald-400'
                              : task.status === 'failed'
                              ? 'bg-rose-400'
                              : 'bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.6)]'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-gray-400 shrink-0 w-8 text-right">
                        {task.progress}%
                      </span>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-gray-500">
                      <span>Started: {new Date(task.startedAt).toLocaleTimeString()}</span>
                      <span className="flex items-center gap-1">
                        <FileText size={10} />
                        {isSelected ? 'Hide telemetry logs' : 'Click to inspect logs'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Telemetry Log Panel (When Task is selected) */}
          {selectedTask && (
            <div className="h-48 border-t border-cyan-500/20 bg-black flex flex-col">
              <div className="px-4 py-2 bg-[#050505] border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal size={12} className="text-cyan-400" />
                  <span className="text-xs font-mono text-gray-300">
                    Live Telemetry: <strong className="text-cyan-300">{selectedTask.title}</strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-500">{taskLogs.length} events</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 font-mono text-[11px]">
                {taskLogs.length === 0 ? (
                  <div className="text-gray-600 italic">No console logs emitted yet for this task.</div>
                ) : (
                  taskLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2">
                      <span className="text-gray-500 text-[10px] shrink-0">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold shrink-0 ${
                          log.level === 'warn'
                            ? 'text-amber-400'
                            : log.level === 'error'
                            ? 'text-rose-400'
                            : 'text-cyan-400'
                        }`}
                      >
                        {log.level}:
                      </span>
                      <span className="text-gray-300 break-all">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-[#030303] flex items-center justify-between text-[11px] text-gray-500 font-mono">
          <span>Active Task Engine</span>
          <span className="text-cyan-400/80">PERSISTENT CONCURRENT RUNTIME</span>
        </div>
      </div>
    </div>
  )
}
