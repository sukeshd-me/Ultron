// src/renderer/components/DiagnosticsModal.tsx — V1.0.4 Health Check & Diagnostics Modal
import React, { useState, useEffect } from 'react'
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Copy,
  RefreshCw,
  X,
  Clock,
  Shield,
  Database,
  Cpu,
  Smartphone,
  Eye,
  Layers
} from 'lucide-react'
import { DiagnosticsReport, DiagnosticCheckItem, DiagnosticStatus } from '../../shared/types'

interface DiagnosticsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function DiagnosticsModal({ isOpen, onClose }: DiagnosticsModalProps) {
  const [report, setReport] = useState<DiagnosticsReport | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const ultron = (window as any).ultron
    if (!ultron?.diagnostics?.run) {
      setIsRunning(false)
      return
    }

    try {
      const res = await ultron.diagnostics.run()
      setReport(res)
    } catch (err) {
      console.error('[Diagnostics] Run error:', err)
    } finally {
      setIsRunning(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      runDiagnostics()
    }
  }, [isOpen])

  const handleCopy = async () => {
    if (!report) return
    const ultron = (window as any).ultron
    try {
      let text = ''
      if (ultron?.diagnostics?.copyReport) {
        text = await ultron.diagnostics.copyReport(report)
      } else {
        text = JSON.stringify(report, null, 2)
      }
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('[Diagnostics] Copy failed:', err)
    }
  }

  if (!isOpen) return null

  const getStatusIcon = (status: DiagnosticStatus) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
      case 'warning':
        return <AlertTriangle size={15} className="text-amber-400 shrink-0" />
      case 'critical':
        return <AlertOctagon size={15} className="text-rose-400 shrink-0" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'runtime':
        return <Cpu size={15} className="text-cyan-400" />
      case 'database':
        return <Database size={15} className="text-blue-400" />
      case 'ai':
        return <Activity size={15} className="text-purple-400" />
      case 'peripherals':
        return <Smartphone size={15} className="text-amber-400" />
      case 'security':
        return <Shield size={15} className="text-emerald-400" />
      case 'subsystems':
        return <Layers size={15} className="text-indigo-400" />
      default:
        return <Activity size={15} className="text-gray-400" />
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-black border border-cyan-500/30 rounded-xl shadow-[0_0_50px_rgba(0,212,255,0.15)] overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-[#050505]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30">
              <Activity size={18} className="text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 tracking-wider">ULTRON CORE HEALTH</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                  V1.0.4
                </span>
              </div>
              <h2 className="text-base font-semibold text-white tracking-wide">System Self-Diagnostics</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-cyan-500/30 bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 font-mono transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={isRunning ? 'animate-spin' : ''} />
              <span>{isRunning ? 'Running...' : 'Re-Run Diagnostics'}</span>
            </button>

            <button
              onClick={handleCopy}
              disabled={!report}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-gray-300 font-mono transition-all disabled:opacity-50"
            >
              <Copy size={13} />
              <span>{copied ? 'Copied Markdown!' : 'Copy Report'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Overview Status Bar */}
        {report && (
          <div className="px-6 py-3 border-b border-white/5 bg-[#030303] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">System Health Status:</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded font-mono uppercase font-bold flex items-center gap-1.5 ${
                  report.overallStatus === 'healthy'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40'
                    : report.overallStatus === 'warning'
                    ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-500/40'
                }`}
              >
                {getStatusIcon(report.overallStatus)}
                {report.overallStatus}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-cyan-400" />
                Latency: {report.totalLatencyMs}ms
              </span>
              <span>Checks: {report.allChecks.length} subsystems</span>
              <span>{new Date(report.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        {/* Body: Category Breakdown */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {!report && isRunning ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <RefreshCw size={24} className="animate-spin text-cyan-400" />
              <span className="text-xs font-mono text-gray-400">Inspecting 19+ ULTRON subsystems...</span>
            </div>
          ) : !report ? (
            <div className="py-24 text-center text-gray-500 text-xs font-mono">
              Click "Re-Run Diagnostics" to assess system integrity.
            </div>
          ) : (
            report.categories.map((catGroup) => (
              <div
                key={catGroup.category}
                className="border border-white/10 rounded-lg bg-[#050505] overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border-b border-white/5">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(catGroup.category)}
                    <span className="text-xs font-mono uppercase font-bold text-gray-200">
                      {catGroup.category}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${
                      catGroup.status === 'healthy'
                        ? 'text-emerald-400 bg-emerald-950/30'
                        : catGroup.status === 'warning'
                        ? 'text-amber-400 bg-amber-950/30'
                        : 'text-rose-400 bg-rose-950/30'
                    }`}
                  >
                    {catGroup.status}
                  </span>
                </div>

                {/* Subsystem Check Items */}
                <div className="divide-y divide-white/5">
                  {catGroup.checks.map((item) => (
                    <div key={item.id} className="p-3 hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          {getStatusIcon(item.status)}
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-gray-200 flex items-center gap-2">
                              <span>{item.name}</span>
                              <span className="text-[10px] font-mono text-gray-500">
                                ({item.latencyMs}ms)
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 font-mono mt-0.5 break-all">
                              {item.details}
                            </div>
                            {item.recommendation && (
                              <div className="mt-1 text-[11px] text-amber-300/90 font-mono bg-amber-950/20 px-2 py-1 rounded border border-amber-500/20">
                                💡 {item.recommendation}
                              </div>
                            )}
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            item.status === 'healthy'
                              ? 'text-emerald-400 border border-emerald-500/30'
                              : item.status === 'warning'
                              ? 'text-amber-400 border border-amber-500/30'
                              : 'text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 bg-[#030303] flex items-center justify-between text-[11px] text-gray-500 font-mono">
          <span>Zero-Trust Local Subsystem Audit</span>
          <span className="text-cyan-400/80">AUTHENTIC GROUND-TRUTH VERIFIED</span>
        </div>
      </div>
    </div>
  )
}
