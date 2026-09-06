import React, { useState, useEffect } from 'react'
import { DailyBriefing } from '../../../shared/types'

interface DailyBriefingModalProps {
  isOpen: boolean
  onClose: () => void
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({ isOpen, onClose }) => {
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null)
  const [loading, setLoading] = useState(false)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const generateBriefing = async () => {
    setLoading(true)
    try {
      if (bridge?.briefing) {
        const b = await bridge.briefing.generate()
        setBriefing(b)
      }
    } catch (err) {
      console.warn('Failed to generate briefing:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      generateBriefing()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🌅</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">ULTRON Daily Briefing</h2>
              <p className="text-[11px] text-gray-400">{briefing?.dateString || 'Real-time personal summary'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateBriefing}
              disabled={loading}
              className="text-xs text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Greeting & Summary */}
          {briefing && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/30 to-indigo-950/20 border border-cyan-500/30 space-y-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wide font-bold">{briefing.greeting}, Sukesh</span>
              <p className="text-xs text-gray-200 leading-relaxed">{briefing.summary}</p>
            </div>
          )}

          {/* System & Phone Status Row */}
          {briefing && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-mono">Workstation Health</span>
                <div className="text-xs text-white">RAM Usage: <strong className="text-cyan-400">{briefing.systemHealth.ramUsage}%</strong></div>
                <div className="text-[11px] text-gray-400">Status: Operational (Windows 11)</div>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-gray-400 uppercase font-mono">Android Companion</span>
                <div className="text-xs text-white">
                  {briefing.androidStatus.connected ? (
                    <>Connected: <strong className="text-emerald-400">{briefing.androidStatus.deviceName || 'Online'}</strong></>
                  ) : (
                    <span className="text-gray-500">Device Offline</span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400">
                  {briefing.androidStatus.connected && briefing.androidStatus.batteryLevel !== undefined
                    ? `Battery Level: ${briefing.androidStatus.batteryLevel}%`
                    : 'Operating in PC-Only mode'}
                </div>
              </div>
            </div>
          )}

          {/* Active Goals */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono text-cyan-400 uppercase">Active Goals ({briefing?.activeGoals?.length || 0})</h3>
            <div className="space-y-1.5">
              {briefing?.activeGoals && briefing.activeGoals.length > 0 ? (
                briefing.activeGoals.map((g, i) => (
                  <div key={i} className="text-xs bg-black/30 border border-white/5 rounded-lg p-2.5 text-gray-300 flex items-center gap-2">
                    <span className="text-cyan-400">🎯</span> {g}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No active goals in progress.</p>
              )}
            </div>
          </div>

          {/* Upcoming Scheduled Missions */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono text-cyan-400 uppercase">Upcoming Scheduled Missions</h3>
            <div className="space-y-1.5">
              {briefing?.scheduledMissions && briefing.scheduledMissions.length > 0 ? (
                briefing.scheduledMissions.map((m, i) => (
                  <div key={i} className="text-xs bg-black/30 border border-white/5 rounded-lg p-2.5 text-gray-300 flex items-center gap-2">
                    <span className="text-indigo-400">⏰</span> {m}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No scheduled missions for today.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
