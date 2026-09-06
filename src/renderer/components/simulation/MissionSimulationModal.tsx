import React, { useState } from 'react'
import { MissionSimulationResult } from '../../../shared/types'

interface MissionSimulationModalProps {
  isOpen: boolean
  onClose: () => void
}

export const MissionSimulationModal: React.FC<MissionSimulationModalProps> = ({ isOpen, onClose }) => {
  const [goal, setGoal] = useState('Prepare my development workspace and verify build')
  const [result, setResult] = useState<MissionSimulationResult | null>(null)
  const [loading, setLoading] = useState(false)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const handleSimulate = async () => {
    if (!goal.trim()) return
    setLoading(true)
    try {
      if (bridge?.simulation) {
        const sim = await bridge.simulation.simulate(goal)
        setResult(sim)
      }
    } catch (err) {
      console.warn('Simulation error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🔮</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Mission Simulation (Dry-Run)</h2>
              <p className="text-[11px] text-gray-400">Zero side-effect execution preview: tools, risk, and rollback options</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Enter mission goal to simulate..."
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/40"
            />
            <button
              onClick={handleSimulate}
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-xl text-xs font-bold text-white uppercase tracking-wider disabled:opacity-50"
            >
              {loading ? 'Simulating...' : 'Simulate'}
            </button>
          </div>

          {result && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{result.missionTitle}</h4>
                  <p className="text-[11px] text-gray-400">Predicted duration: ~{result.estimatedDurationSeconds}s</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    result.overallRisk === 'IRREVERSIBLE' ? 'bg-red-500/20 text-red-400' :
                    result.overallRisk === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    Risk: {result.overallRisk}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-cyan-400 uppercase">Predicted Execution Steps ({result.steps.length})</span>
                {result.steps.map(s => (
                  <div key={s.index} className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{s.index}. {s.description}</span>
                      <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">{s.tool}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                      <span>Rollback: <strong className="text-gray-300">{s.rollbackOption || 'None'}</strong></span>
                      <span className="font-mono text-[10px]">Permission: {s.requiresPermission ? 'Required' : 'Auto-Safe'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
