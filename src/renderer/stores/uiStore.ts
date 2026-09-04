import { create } from 'zustand'
import { NavPage, ConcurrentTask, PerformanceMetrics } from '../../shared/types'

interface UIState {
  currentPage: NavPage
  sidebarCollapsed: boolean
  systemMetrics: {
    cpu: number
    memory: number
    networkActive: boolean
    adbConnected: boolean
    securityStatus: 'SECURE' | 'SCANNING' | 'WARNING'
  }
  tasks: ConcurrentTask[]
  performanceMetrics: PerformanceMetrics
  setCurrentPage: (page: NavPage) => void
  toggleSidebar: () => void
  updateMetrics: (metrics: Partial<UIState['systemMetrics']>) => void
  setTasks: (tasks: ConcurrentTask[]) => void
  setPerformanceMetrics: (metrics: PerformanceMetrics) => void
}

export const useUIStore = create<UIState>((set) => ({
  currentPage: 'home',
  sidebarCollapsed: false,
  systemMetrics: {
    cpu: 18,
    memory: 42,
    networkActive: true,
    adbConnected: false,
    securityStatus: 'SECURE'
  },
  tasks: [],
  performanceMetrics: {
    lastExecutionMs: 12.4,
    averageLatencyMs: 16.8,
    activeConcurrentTasks: 0,
    peakTasksCount: 0,
    totalCommandsExecuted: 0
  },
  setCurrentPage: (currentPage) => set({ currentPage }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  updateMetrics: (metrics) =>
    set((state) => ({
      systemMetrics: { ...state.systemMetrics, ...metrics }
    })),
  setTasks: (tasks) => set({ tasks }),
  setPerformanceMetrics: (performanceMetrics) => set({ performanceMetrics })
}))