import React from 'react'

interface MissionStep {
  id: string
  stepNumber: number
  title: string
  description?: string
  status: 'PLANNED' | 'READY' | 'RUNNING' | 'WAITING_PERMISSION' | 'COMPLETED' | 'FAILED' | 'SKIPPED' | 'CANCELLED'
  durationMs?: number
  dependencies?: string[]
  result?: string
  error?: string
}

interface MissionVisualMapProps {
  missionTitle: string
  steps: MissionStep[]
  activeStepId?: string
  onSelectStep?: (step: MissionStep) => void
}

export const MissionVisualMap: React.FC<MissionVisualMapProps> = ({
  missionTitle,
  steps,
  activeStepId,
  onSelectStep
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', icon: '✓' }
      case 'RUNNING':
        return { bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', text: 'text-cyan-400', icon: '●' }
      case 'FAILED':
        return { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', icon: '✕' }
      case 'WAITING_PERMISSION':
        return { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', icon: '⏸' }
      default:
        return { bg: 'bg-white/5', border: 'border-white/10', text: 'text-gray-400', icon: '○' }
    }
  }

  return (
    <div className="bg-black/60 border border-white/10 rounded-xl p-4 overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-mono text-xs">VISUAL MISSION GRAPH</span>
          <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded font-mono">
            {steps.length} NODES
          </span>
        </div>
        <div className="text-[11px] text-gray-400 truncate max-w-xs">{missionTitle}</div>
      </div>

      {/* DAG Flowchart Layout */}
      <div className="relative flex flex-col space-y-3">
        {steps.map((step, idx) => {
          const badge = getStatusBadge(step.status)
          const isSelected = step.id === activeStepId

          return (
            <div key={step.id} className="relative">
              {/* Connector line to next node */}
              {idx < steps.length - 1 && (
                <div className="absolute left-5 top-10 bottom--3 w-0.5 bg-gradient-to-b from-white/20 to-white/5 -z-0 h-6" />
              )}

              <div
                onClick={() => onSelectStep?.(step)}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all z-10 relative ${badge.bg} ${badge.border} ${
                  isSelected ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20' : 'hover:border-white/30'
                }`}
              >
                {/* Node icon */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${badge.text} border ${badge.border}`}>
                  {badge.icon}
                </div>

                {/* Node Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate">
                      {step.stepNumber}. {step.title}
                    </span>
                    <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${badge.text}`}>
                      {step.status}
                    </span>
                  </div>

                  {step.description && (
                    <div className="text-[11px] text-gray-400 mt-1 line-clamp-1">{step.description}</div>
                  )}

                  {step.durationMs !== undefined && step.durationMs > 0 && (
                    <div className="mt-1 flex items-center gap-3 text-[10px] font-mono text-gray-500">
                      <span>Duration: {step.durationMs.toFixed(0)}ms</span>
                      {step.error && <span className="text-red-400 truncate max-w-xs">Error: {step.error}</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
