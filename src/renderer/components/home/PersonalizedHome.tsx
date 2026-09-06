// src/renderer/components/home/PersonalizedHome.tsx — V1.0.5 Minimal Personalized Home
import React, { useEffect, useState } from 'react'
import {
  Compass,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FolderGit2,
  Smartphone,
  Cpu,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react'
import { Mission, TaskHistoryRecord } from '../../../shared/types'

interface PersonalizedHomeProps {
  onOpenMissions: () => void
  onOpenHistory: () => void
  onOpenDocuments: () => void
  onOpenSecurity: () => void
  onOpenDiagnostics: () => void
}

export function PersonalizedHome({
  onOpenMissions,
  onOpenHistory,
  onOpenDocuments,
  onOpenSecurity,
  onOpenDiagnostics
}: PersonalizedHomeProps) {
  const [greeting, setGreeting] = useState('Good day')
  const [activeMissionsCount, setActiveMissionsCount] = useState(0)
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0)
  const [recentWorkspace, setRecentWorkspace] = useState('ULTRON')
  const [systemHealthy, setSystemHealthy] = useState(true)
  const [aiOnline, setAiOnline] = useState(true)
  const [androidConnected, setAndroidConnected] = useState(false)
  const [recentActivities, setRecentActivities] = useState<TaskHistoryRecord[]>([])

  useEffect(() => {
    // Determine dynamic greeting based on hour
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')

    // Fetch real metrics from window.ultron
    const ultron = (window as any).ultron
    if (!ultron) return

    // Missions
    if (ultron.missions?.list) {
      ultron.missions.list().then((list: Mission[]) => {
        if (list) {
          const active = list.filter((m) => m.status === 'RUNNING' || m.status === 'PLANNED').length
          const pending = list.filter((m) => m.status === 'WAITING_PERMISSION').length
          setActiveMissionsCount(active)
          setPendingApprovalsCount(pending)
        }
      }).catch(() => {})
    }

    // Workspace
    if (ultron.workspace?.getContext) {
      ultron.workspace.getContext().then((ctx: any) => {
        if (ctx?.currentPath) {
          const base = ctx.currentPath.split(/[\\/]/).pop() || 'ULTRON'
          setRecentWorkspace(base)
        }
      }).catch(() => {})
    }

    // Diagnostics / System health
    if (ultron.diagnostics?.getLatest) {
      ultron.diagnostics.getLatest().then((rep: any) => {
        if (rep) {
          setSystemHealthy(rep.status !== 'FAIL')
        }
      }).catch(() => {})
    }

    // AI Provider status
    if (ultron.provider?.getStatus) {
      ultron.provider.getStatus().then((st: any) => {
        if (st) setAiOnline(Boolean(st.online))
      }).catch(() => {})
    }

    // Android phone connection
    if (ultron.adb?.getDevices) {
      ultron.adb.getDevices().then((res: any) => {
        const devs = res?.devices || []
        setAndroidConnected(devs.length > 0)
      }).catch(() => {})
    }

    // Recent task history
    if (ultron.history?.list) {
      ultron.history.list({ limit: 4 }).then((records: TaskHistoryRecord[]) => {
        if (records) setRecentActivities(records)
      }).catch(() => {})
    }
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 text-white space-y-6 animate-fadeIn">
      {/* Greeting Header */}
      <div className="flex items-center justify-between border-b border-[#1f1f28] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00d4ff] to-[#a855f7]">
            {greeting}, Sukesh
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse"></span>
            <span className="text-xs font-semibold tracking-wider text-[#00ff88] uppercase">ULTRON READY</span>
            <span className="text-xs text-gray-500">• V1.0.6 Intelligent Agent Core</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#0d0d12] border border-[#1f1f28] px-3 py-1.5 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-[#00d4ff]" />
          <span>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Active Missions */}
        <button
          onClick={onOpenMissions}
          className="text-left p-3.5 rounded-xl bg-[#0d0d14] border border-[#1f1f28] hover:border-[#00d4ff]/50 transition group"
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Active Missions</span>
            <Compass className="w-4 h-4 text-[#00d4ff] group-hover:rotate-45 transition" />
          </div>
          <div className="text-2xl font-bold text-white">{activeMissionsCount}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {pendingApprovalsCount > 0 ? `${pendingApprovalsCount} pending approval` : 'Running smoothly'}
          </div>
        </button>

        {/* Recent Workspace */}
        <div className="p-3.5 rounded-xl bg-[#0d0d14] border border-[#1f1f28]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Workspace</span>
            <FolderGit2 className="w-4 h-4 text-[#a855f7]" />
          </div>
          <div className="text-base font-bold text-white truncate">{recentWorkspace}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Active Project</div>
        </div>

        {/* System & AI Health */}
        <button
          onClick={onOpenDiagnostics}
          className="text-left p-3.5 rounded-xl bg-[#0d0d14] border border-[#1f1f28] hover:border-[#00ff88]/50 transition group"
        >
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">System / AI</span>
            <Activity className="w-4 h-4 text-[#00ff88] group-hover:scale-110 transition" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{systemHealthy ? 'Healthy' : 'Warning'}</span>
            <span className="text-[10px] text-gray-500">/</span>
            <span className="text-sm font-bold text-[#00d4ff]">{aiOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Full Diagnostics Available</div>
        </button>

        {/* Android Phone State */}
        <div className="p-3.5 rounded-xl bg-[#0d0d14] border border-[#1f1f28]">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-medium">Android Phone</span>
            <Smartphone className={`w-4 h-4 ${androidConnected ? 'text-[#00ff88]' : 'text-gray-600'}`} />
          </div>
          <div className="text-base font-bold text-white">
            {androidConnected ? 'Connected' : 'Not Connected'}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {androidConnected ? 'ADB Active' : 'Connect via USB/Wi-Fi'}
          </div>
        </div>
      </div>

      {/* Quick Launch & Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={onOpenMissions}
          className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#00d4ff]/10 to-transparent border border-[#00d4ff]/30 hover:border-[#00d4ff] transition group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00d4ff]/20 text-[#00d4ff]">
              <Compass className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-white">Agent Missions</div>
              <div className="text-[10px] text-gray-400">Multi-step autonomous goals</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#00d4ff] group-hover:translate-x-0.5 transition" />
        </button>

        <button
          onClick={onOpenDocuments}
          className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#a855f7]/10 to-transparent border border-[#a855f7]/30 hover:border-[#a855f7] transition group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#a855f7]/20 text-[#a855f7]">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-white">Documents</div>
              <div className="text-[10px] text-gray-400">Index & grounded analysis</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#a855f7] group-hover:translate-x-0.5 transition" />
        </button>

        <button
          onClick={onOpenSecurity}
          className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#00ff88]/10 to-transparent border border-[#00ff88]/30 hover:border-[#00ff88] transition group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#00ff88]/20 text-[#00ff88]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-white">Security Center</div>
              <div className="text-[10px] text-gray-400">Defender, ports & audit</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#00ff88] group-hover:translate-x-0.5 transition" />
        </button>
      </div>

      {/* Recent Activity Timeline */}
      <div className="rounded-xl bg-[#0a0a0e] border border-[#1f1f28] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Recent Activity</span>
          <button
            onClick={onOpenHistory}
            className="text-xs text-[#00d4ff] hover:underline flex items-center gap-1 font-medium"
          >
            View Task History <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-500">
            No recent agent operations recorded. Ask ULTRON a question or trigger a mission.
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#111116] border border-[#1f1f28] text-xs"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      act.status === 'SUCCESS' ? 'bg-[#00ff88]' : act.status === 'FAILED' ? 'bg-red-500' : 'bg-amber-400'
                    }`}
                  />
                  <span className="font-medium text-white truncate max-w-[280px] sm:max-w-md">
                    {act.userRequest}
                  </span>
                  {act.skill && (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] bg-[#1f1f2a] text-gray-400">
                      {act.skill}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-400 text-[11px] flex-shrink-0">
                  <span>{act.durationMs ? `${act.durationMs}ms` : ''}</span>
                  <span className="text-gray-500">
                    {new Date(act.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
