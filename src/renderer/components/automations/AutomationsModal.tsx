import React, { useState, useEffect } from 'react'
import { AutomationDefinition, ScheduledMission } from '../../../shared/types'

interface AutomationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AutomationsModal: React.FC<AutomationsModalProps> = ({ isOpen, onClose }) => {
  const [tab, setTab] = useState<'AUTOMATIONS' | 'SCHEDULED'>('AUTOMATIONS')
  const [automations, setAutomations] = useState<AutomationDefinition[]>([])
  const [scheduled, setScheduled] = useState<ScheduledMission[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const loadData = async () => {
    try {
      if (bridge?.automations) {
        const aList = await bridge.automations.list()
        setAutomations(aList || [])
      }
      if (bridge?.scheduledMissions) {
        const sList = await bridge.scheduledMissions.list()
        setScheduled(sList || [])
      }
    } catch (err) {
      console.warn('Failed to load automation data:', err)
    }
  }

  useEffect(() => {
    if (isOpen) loadData()
  }, [isOpen, tab])

  const handleToggleAuto = async (id: string, current: boolean) => {
    try {
      if (bridge?.automations) {
        await bridge.automations.toggle(id, !current)
        loadData()
      }
    } catch {}
  }

  const handleRunScheduledNow = async (id: string) => {
    try {
      if (bridge?.scheduledMissions) {
        const res = await bridge.scheduledMissions.runNow(id)
        setFeedback(res.message)
        loadData()
      }
    } catch (err: any) {
      setFeedback(`Run failed: ${err.message}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">⚙️</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Automation & Scheduling Center</h2>
              <p className="text-[11px] text-gray-400">Event triggers, scheduled missions, and recurring tasks</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-3 px-6 pt-4 border-b border-white/5 pb-3">
          <button
            onClick={() => setTab('AUTOMATIONS')}
            className={`text-xs font-mono px-3 py-1 rounded-lg transition ${
              tab === 'AUTOMATIONS' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-gray-400 hover:text-white'
            }`}
          >
            Automations ({automations.length})
          </button>
          <button
            onClick={() => setTab('SCHEDULED')}
            className={`text-xs font-mono px-3 py-1 rounded-lg transition ${
              tab === 'SCHEDULED' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-gray-400 hover:text-white'
            }`}
          >
            Scheduled Missions ({scheduled.length})
          </button>
        </div>

        {feedback && (
          <div className="px-6 py-2.5 bg-cyan-950/30 text-xs text-cyan-300 border-b border-cyan-500/20">
            {feedback}
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {tab === 'AUTOMATIONS' ? (
            automations.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs font-mono">
                No active automations. Say "When my PC starts, prepare my workspace" to create one.
              </div>
            ) : (
              automations.map(auto => (
                <div key={auto.id} className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{auto.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">[{auto.triggerType}]</span>
                    </div>
                    <p className="text-[11px] text-gray-400">{auto.description}</p>
                    <div className="text-[10px] text-gray-500 font-mono">Actions: {auto.actions.length} tools configured</div>
                  </div>
                  <button
                    onClick={() => handleToggleAuto(auto.id, auto.enabled)}
                    className={`text-[11px] font-mono px-3 py-1 rounded-lg border transition ${
                      auto.enabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-white/5 text-gray-400 border-white/10'
                    }`}
                  >
                    {auto.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              ))
            )
          ) : (
            scheduled.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs font-mono">
                No scheduled missions. Say "Every Friday at 6 PM prepare my development workspace" to schedule one.
              </div>
            ) : (
              scheduled.map(m => (
                <div key={m.id} className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{m.title}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">[{m.recurrence}]</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        m.status === 'SCHEDULED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-400'
                      }`}>{m.status}</span>
                    </div>
                    <p className="text-[11px] text-gray-400">{m.goal}</p>
                    <div className="text-[10px] text-gray-500 font-mono">
                      Next Run: {new Date(m.nextRunAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRunScheduledNow(m.id)}
                    className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-[11px] transition"
                  >
                    Run Now
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  )
}
