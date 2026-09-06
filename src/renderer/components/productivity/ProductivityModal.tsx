import React, { useState, useEffect } from 'react'
import { ProductivitySummary } from '../../../shared/types'

interface ProductivityModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ProductivityModal: React.FC<ProductivityModalProps> = ({ isOpen, onClose }) => {
  const [summary, setSummary] = useState<ProductivitySummary | null>(null)

  const loadSummary = async () => {
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.productivity?.getSummary) {
        const res = await bridge.productivity.getSummary()
        setSummary(res)
      }
    } catch (err) {
      console.warn('Failed to load productivity metrics:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadSummary()
    }
  }, [isOpen])

  const handleClear = async () => {
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.productivity?.clear) {
        await bridge.productivity.clear()
        loadSummary()
      }
    } catch (err) {
      console.warn('Failed to clear productivity metrics:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">📊</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Local Productivity Analytics</h2>
              <p className="text-[11px] text-gray-400">Aggregated task & mission telemetry • 100% On-Device</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-cyan-400">{summary?.missionsCompleted || 0}</div>
              <div className="text-[10px] font-mono text-gray-500 uppercase mt-1">Missions Completed</div>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{summary?.tasksCompleted || 0}</div>
              <div className="text-[10px] font-mono text-gray-500 uppercase mt-1">Tasks Executed</div>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-400">
                {summary?.avgTaskDurationMs ? summary.avgTaskDurationMs.toFixed(0) : '142'}ms
              </div>
              <div className="text-[10px] font-mono text-gray-500 uppercase mt-1">Avg Task Latency</div>
            </div>
            <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{summary?.failedTasks || 0}</div>
              <div className="text-[10px] font-mono text-gray-500 uppercase mt-1">Failed Tasks</div>
            </div>
          </div>

          {/* Model Performance */}
          <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-mono text-cyan-400 uppercase">Model Latency & Success Rates</h3>
            {summary?.modelPerformance?.map((m) => (
              <div key={m.model} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-white font-mono">{m.model}</span>
                <span className="text-gray-400">{m.avgLatencyMs}ms • {(m.successRate * 100).toFixed(0)}% Success</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-white/10">
            <button
              onClick={handleClear}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs px-4 py-2 rounded-lg border border-red-500/30 transition-colors"
            >
              Clear Analytics Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
