import React from 'react'

export interface CheckpointData {
  id: string
  missionId: string
  stepTitle: string
  description: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  details?: Record<string, any>
  createdAt: number
}

interface CheckpointModalProps {
  checkpoint: CheckpointData | null
  onResolve: (id: string, approved: boolean) => void
}

export const CheckpointModal: React.FC<CheckpointModalProps> = ({ checkpoint, onResolve }) => {
  if (!checkpoint) return null

  const isHighRisk = checkpoint.riskLevel === 'HIGH' || checkpoint.riskLevel === 'CRITICAL'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#0d0f15] border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col p-6 space-y-4">
        {/* Header Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
              HUMAN-IN-THE-LOOP CHECKPOINT
            </span>
          </div>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
              isHighRisk
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}
          >
            Risk: {checkpoint.riskLevel}
          </span>
        </div>

        {/* Step Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-white font-mono">{checkpoint.stepTitle}</h3>
          <p className="text-xs text-gray-300 leading-relaxed">{checkpoint.description}</p>
        </div>

        {/* Detailed context / parameters */}
        {checkpoint.details && Object.keys(checkpoint.details).length > 0 && (
          <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
              Operation Details
            </div>
            <pre className="text-[11px] font-mono text-gray-400 overflow-x-auto max-h-32">
              {JSON.stringify(checkpoint.details, null, 2)}
            </pre>
          </div>
        )}

        <div className="text-[11px] text-gray-400 font-mono">
          ULTRON has halted mission execution at this safety checkpoint. Explicit approval is required before proceeding.
        </div>

        {/* Action Buttons: Continue, Cancel */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
          <button
            onClick={() => onResolve(checkpoint.id, false)}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono font-semibold transition-colors"
          >
            Cancel Mission ✕
          </button>
          <button
            onClick={() => onResolve(checkpoint.id, true)}
            className={`px-5 py-2 rounded-xl text-xs font-mono font-bold shadow-lg transition-all ${
              isHighRisk
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                : 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20'
            }`}
          >
            Authorize & Continue ✓
          </button>
        </div>
      </div>
    </div>
  )
}
