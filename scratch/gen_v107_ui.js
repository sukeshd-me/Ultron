// scratch/gen_v107_ui.js
const fs = require('fs')
const path = require('path')

const compDir = path.resolve(__dirname, '../src/renderer/components')

// Ensure directories exist
const dirs = ['inbox', 'briefing', 'focus', 'workspaces', 'automations', 'memory', 'simulation', 'updates']
for (const d of dirs) {
  const target = path.join(compDir, d)
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true })
}

// 1. UniversalInboxModal.tsx
fs.writeFileSync(path.join(compDir, 'inbox', 'UniversalInboxModal.tsx'), `import React, { useState, useEffect } from 'react'
import { InboxItem, InboxSummary } from '../../../shared/types'

interface UniversalInboxModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UniversalInboxModal: React.FC<UniversalInboxModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<InboxItem[]>([])
  const [summary, setSummary] = useState<InboxSummary | null>(null)
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'URGENT'>('ALL')
  const [loading, setLoading] = useState(false)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const loadInbox = async () => {
    setLoading(true)
    try {
      if (bridge?.inbox) {
        const sum = await bridge.inbox.getSummary()
        setSummary(sum)
        const unreadOnly = activeTab === 'UNREAD'
        const importance = activeTab === 'URGENT' ? 'URGENT' : undefined
        const list = await bridge.inbox.getItems({ unreadOnly, importance })
        setItems(list || [])
      }
    } catch (err) {
      console.warn('Failed to load inbox:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) loadInbox()
  }, [isOpen, activeTab])

  const handleMarkRead = async (id: string) => {
    if (bridge?.inbox?.markRead) {
      await bridge.inbox.markRead(id)
      loadInbox()
    }
  }

  const handleClearLow = async () => {
    if (bridge?.inbox?.clearLowPriority) {
      await bridge.inbox.clearLowPriority()
      loadInbox()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">📥</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Universal Inbox</h2>
              <p className="text-[11px] text-gray-400">Aggregated notifications, Android messages, and priority alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
        </div>

        {/* Summary Banner */}
        {summary && (
          <div className="px-6 py-3 bg-cyan-950/20 border-b border-cyan-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-gray-300">Total: <strong className="text-white">{summary.totalCount}</strong></span>
              <span className="text-gray-300">Unread: <strong className="text-cyan-400">{summary.unreadCount}</strong></span>
              {summary.urgentCount > 0 && (
                <span className="text-red-400 font-bold animate-pulse">⚠️ {summary.urgentCount} Urgent</span>
              )}
            </div>
            <button
              onClick={handleClearLow}
              className="text-[11px] text-gray-400 hover:text-cyan-300 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded transition"
            >
              Clear Low Priority
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 px-6 pt-4">
          {(['ALL', 'UNREAD', 'URGENT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={\`px-3 py-1 rounded-lg text-xs font-mono transition \${activeTab === tab ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-gray-400 hover:text-white bg-white/5'}\`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="text-center py-12 text-gray-500 text-xs font-mono">Syncing inbox items...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs font-mono">No notifications matching filter.</div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className={\`p-4 rounded-xl border transition flex items-start justify-between gap-4 \${
                  item.isRead ? 'bg-black/30 border-white/5 opacity-70' : 'bg-black/60 border-cyan-500/20 shadow-lg'
                }\`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={\`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold \${
                      item.importance === 'URGENT' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      item.importance === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-cyan-500/10 text-cyan-400'
                    }\`}>
                      {item.importance}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">[{item.source}]</span>
                    <span className="text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                  <p className="text-[11px] text-gray-300 leading-relaxed">{item.content}</p>
                </div>
                {!item.isRead && (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-200 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30 whitespace-nowrap"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
`)

// 2. DailyBriefingModal.tsx
fs.writeFileSync(path.join(compDir, 'briefing', 'DailyBriefingModal.tsx'), `import React, { useState, useEffect } from 'react'
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
                    ? \`Battery Level: \${briefing.androidStatus.batteryLevel}%\`
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
`)

// 3. FocusModeModal.tsx
fs.writeFileSync(path.join(compDir, 'focus', 'FocusModeModal.tsx'), `import React, { useState, useEffect } from 'react'
import { FocusModeType, FocusSession } from '../../../shared/types'

interface FocusModeModalProps {
  isOpen: boolean
  onClose: () => void
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({ isOpen, onClose }) => {
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null)
  const [selectedMode, setSelectedMode] = useState<FocusModeType>('Coding')
  const [duration, setDuration] = useState(45)
  const [feedback, setFeedback] = useState<string | null>(null)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const checkActive = async () => {
    try {
      if (bridge?.focus) {
        const session = await bridge.focus.getActive()
        setActiveSession(session)
      }
    } catch {}
  }

  useEffect(() => {
    if (isOpen) {
      checkActive()
      const interval = setInterval(checkActive, 2000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  const handleStart = async () => {
    try {
      if (bridge?.focus) {
        const res = await bridge.focus.start(selectedMode, duration)
        setActiveSession(res.session)
        setFeedback(res.message)
      }
    } catch (err: any) {
      setFeedback(\`Error: \${err.message}\`)
    }
  }

  const handleEnd = async () => {
    try {
      if (bridge?.focus) {
        const res = await bridge.focus.end()
        setActiveSession(null)
        setFeedback(res.message)
      }
    } catch (err: any) {
      setFeedback(\`Error: \${err.message}\`)
    }
  }

  if (!isOpen) return null

  const modes: FocusModeType[] = ['Coding', 'Research', 'Study', 'Writing', 'General Focus']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🧘</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">ULTRON Focus Mode</h2>
              <p className="text-[11px] text-gray-400">Dedicated workspace focus, timer control, and distraction suppression</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {activeSession ? (
            /* Active Focus Timer View */
            <div className="text-center py-8 space-y-4">
              <div className="w-28 h-28 rounded-full border-4 border-cyan-500/40 border-t-cyan-400 mx-auto flex items-center justify-center animate-pulse">
                <span className="text-xl font-mono text-cyan-400 font-bold">
                  {Math.floor(activeSession.elapsedSeconds / 60)}:
                  {String(activeSession.elapsedSeconds % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase">{activeSession.mode} Focus Active</h3>
                <p className="text-xs text-gray-400">Target duration: {activeSession.durationMinutes} minutes</p>
              </div>
              <button
                onClick={handleEnd}
                className="px-6 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition text-xs font-semibold"
              >
                End Focus Mode
              </button>
            </div>
          ) : (
            /* Setup Focus View */
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono text-cyan-400 uppercase">Select Focus Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {modes.map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className={\`p-3 rounded-xl border text-xs font-medium text-left transition \${
                        selectedMode === mode ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
                      }\`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-cyan-400 uppercase">Duration (Minutes)</label>
                <div className="flex gap-3">
                  {[15, 25, 45, 60, 90].map(m => (
                    <button
                      key={m}
                      onClick={() => setDuration(m)}
                      className={\`px-4 py-2 rounded-xl border text-xs font-mono transition \${
                        duration === m ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 font-bold' : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
                      }\`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStart}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition shadow-lg"
              >
                Begin Focus Session
              </button>
            </div>
          )}

          {feedback && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300">
              {feedback}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
`)

// 4. WorkspacesModal.tsx
fs.writeFileSync(path.join(compDir, 'workspaces', 'WorkspacesModal.tsx'), `import React, { useState, useEffect } from 'react'
import { WorkspaceProfile, WorkspaceItem } from '../../../shared/types'

interface WorkspacesModalProps {
  isOpen: boolean
  onClose: () => void
}

export const WorkspacesModal: React.FC<WorkspacesModalProps> = ({ isOpen, onClose }) => {
  const [workspaces, setWorkspaces] = useState<Array<WorkspaceProfile & { items: WorkspaceItem[] }>>([])
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const loadWorkspaces = async () => {
    setLoading(true)
    try {
      if (bridge?.workspaces) {
        const list = await bridge.workspaces.list()
        setWorkspaces(list || [])
      }
    } catch (err) {
      console.warn('Failed to load workspaces:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) loadWorkspaces()
  }, [isOpen])

  const handleSwitch = async (id: string) => {
    try {
      if (bridge?.workspaces) {
        const res = await bridge.workspaces.switch(id)
        setStatusMsg(res.message)
        loadWorkspaces()
      }
    } catch (err: any) {
      setStatusMsg(\`Error: \${err.message}\`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🏢</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Multiple Workspaces</h2>
              <p className="text-[11px] text-gray-400">Environment profiles (Development, Research, Study, Security Lab)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
        </div>

        {statusMsg && (
          <div className="px-6 py-2.5 bg-cyan-950/30 border-b border-cyan-500/20 text-xs text-cyan-300">
            {statusMsg}
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            {workspaces.map(ws => (
              <div
                key={ws.id}
                className={\`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 \${
                  ws.isActive ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg' : 'bg-black/40 border-white/10'
                }\`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{ws.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">{ws.category}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{ws.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 font-mono">
                    {ws.items?.length || 0} configured items
                  </span>
                  {ws.isActive ? (
                    <span className="text-[10px] text-cyan-400 font-mono font-bold flex items-center gap-1">
                      ● Active Workspace
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitch(ws.id)}
                      className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-[11px] transition"
                    >
                      Switch To
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
`)

// 5. AutomationsModal.tsx
fs.writeFileSync(path.join(compDir, 'automations', 'AutomationsModal.tsx'), `import React, { useState, useEffect } from 'react'
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
      setFeedback(\`Run failed: \${err.message}\`)
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
            className={\`text-xs font-mono px-3 py-1 rounded-lg transition \${
              tab === 'AUTOMATIONS' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-gray-400 hover:text-white'
            }\`}
          >
            Automations ({automations.length})
          </button>
          <button
            onClick={() => setTab('SCHEDULED')}
            className={\`text-xs font-mono px-3 py-1 rounded-lg transition \${
              tab === 'SCHEDULED' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-gray-400 hover:text-white'
            }\`}
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
                    className={\`text-[11px] font-mono px-3 py-1 rounded-lg border transition \${
                      auto.enabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-white/5 text-gray-400 border-white/10'
                    }\`}
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
                      <span className={\`text-[10px] font-mono px-1.5 py-0.5 rounded \${
                        m.status === 'SCHEDULED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-400'
                      }\`}>{m.status}</span>
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
`)

// 6. MemoryControlCenterModal.tsx
fs.writeFileSync(path.join(compDir, 'memory', 'MemoryControlCenterModal.tsx'), `import React, { useState, useEffect } from 'react'
import { MemoryItemView, MemoryControlCategory } from '../../../shared/types'

interface MemoryControlCenterModalProps {
  isOpen: boolean
  onClose: () => void
}

export const MemoryControlCenterModal: React.FC<MemoryControlCenterModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<MemoryItemView[]>([])
  const [category, setCategory] = useState<MemoryControlCategory>('Personal preferences')
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const categories: MemoryControlCategory[] = [
    'Personal preferences',
    'Projects',
    'Goals',
    'Conversations',
    'Tasks',
    'Workspace preferences',
    'Temporary memory',
    'Archived memory'
  ]

  const loadMemories = async () => {
    try {
      if (bridge?.memoryControl) {
        const list = await bridge.memoryControl.search({ category, query })
        setItems(list || [])
      }
    } catch (err) {
      console.warn('Failed to load memory:', err)
    }
  }

  useEffect(() => {
    if (isOpen) loadMemories()
  }, [isOpen, category, query])

  const handleForget = async (id: string) => {
    try {
      if (bridge?.memoryControl) {
        const res = await bridge.memoryControl.forget(id, true)
        if (res.success) {
          setFeedback('Memory removed safely. Recovery backup registered.')
          loadMemories()
        }
      }
    } catch (err: any) {
      setFeedback(\`Error: \${err.message}\`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🧠</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Memory Control Center</h2>
              <p className="text-[11px] text-gray-400">Scoped memory control, search, and safe deletion with recovery</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 overflow-x-auto border-b border-white/5 pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={\`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition \${
                category === cat ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-gray-400 hover:text-white bg-white/5'
              }\`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="px-6 pt-3">
          <input
            type="text"
            placeholder="Search memories by keyword or scope..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/40"
          />
        </div>

        {feedback && (
          <div className="px-6 py-2 text-xs text-emerald-400 bg-emerald-950/20">
            {feedback}
          </div>
        )}

        {/* Items */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs font-mono">
              No memories found in {category}.
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                      Scope: {item.scope}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed">{item.value}</p>
                </div>
                <button
                  onClick={() => handleForget(item.id)}
                  className="text-[11px] text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1 rounded border border-red-500/30 whitespace-nowrap"
                >
                  Forget
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
`)

// 7. MissionSimulationModal.tsx
fs.writeFileSync(path.join(compDir, 'simulation', 'MissionSimulationModal.tsx'), `import React, { useState } from 'react'
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
                  <span className={\`text-xs font-mono font-bold px-2 py-0.5 rounded \${
                    result.overallRisk === 'IRREVERSIBLE' ? 'bg-red-500/20 text-red-400' :
                    result.overallRisk === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }\`}>
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
`)

// 8. UpdateManagerModal.tsx
fs.writeFileSync(path.join(compDir, 'updates', 'UpdateManagerModal.tsx'), `import React, { useState, useEffect } from 'react'
import { UpdateCheckResult } from '../../../shared/types'

interface UpdateManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UpdateManagerModal: React.FC<UpdateManagerModalProps> = ({ isOpen, onClose }) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [backupMsg, setBackupMsg] = useState<string | null>(null)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const checkForUpdates = async () => {
    setLoading(true)
    try {
      if (bridge?.updates) {
        const res = await bridge.updates.check()
        setUpdateInfo(res)
      }
    } catch (err) {
      console.warn('Update check failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) checkForUpdates()
  }, [isOpen])

  const handlePrepareBackup = async () => {
    try {
      if (bridge?.updates) {
        const res = await bridge.updates.prepareBackup()
        setBackupMsg(res.message)
      }
    } catch (err: any) {
      setBackupMsg(\`Backup failed: \${err.message}\`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🚀</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">ULTRON Update Manager</h2>
              <p className="text-[11px] text-gray-400">Official Release Authority: UPAI Technologies / Ultron</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status Panel */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">Current Version</span>
              <span className="text-xs font-mono font-bold text-cyan-400">v{updateInfo?.currentVersion || '1.0.7'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">Latest Stable Release</span>
              <span className="text-xs font-mono font-bold text-emerald-400">v{updateInfo?.latestVersion || '1.0.7'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">Official GitHub Authority</span>
              <span className="text-xs font-mono text-gray-300">{updateInfo?.officialRepo || 'upai-technologies/ultron'}</span>
            </div>
          </div>

          {/* Release Notes */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase">Release Notes & Verification</span>
            <div className="p-4 rounded-xl bg-black/60 border border-white/5 text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
              {updateInfo?.releaseNotes || 'Running official release v1.0.7.'}
            </div>
          </div>

          {/* Safety Action */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
            <span className="text-xs font-semibold text-white">Data Preservation Guarantee</span>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Updates preserve all local SQLite memory, credentials, and configurations. You can create a pre-update snapshot below at any time.
            </p>
            <button
              onClick={handlePrepareBackup}
              className="text-xs text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition"
            >
              Create Pre-Update Backup
            </button>
            {backupMsg && <p className="text-xs text-emerald-400">{backupMsg}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={checkForUpdates}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
            >
              {loading ? 'Checking GitHub...' : 'Check For Updates'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:text-white text-xs font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
`)

console.log('Successfully generated all 8 V1.0.7 UI components')
