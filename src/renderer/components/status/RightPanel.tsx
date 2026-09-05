import React from 'react'
import {
  Shield,
  Cpu,
  HardDrive,
  Wifi,
  Smartphone,
  Zap,
  Layers,
  Clock,
  Activity,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Terminal,
  Radio,
  Sliders,
  AlertOctagon,
  Lock
} from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import { useUIStore } from '../../stores/uiStore'
import { useSettingsStore } from '../../stores/settingsStore'

export function RightPanel() {
  const orbState = useChatStore((s) => s.orbState)
  const metrics = useUIStore((s) => s.systemMetrics)
  const perf = useUIStore((s) => s.performanceMetrics)
  const tasks = useUIStore((s) => s.tasks)
  const modelName = useSettingsStore((s) => s.settings.ai.model)
  const shortModel = modelName.split('/').pop() || modelName

  const recentTasks = tasks.slice(0, 5)
  const activeCount = tasks.filter((t) => t.status === 'RUNNING').length
  const currentRunningTask = tasks.find((t) => t.status === 'RUNNING')

  // Visual styling for distinct agent states
  const getStateBadge = (state: string) => {
    switch (state) {
      case 'LISTENING':
        return { color: '#00d4ff', bg: 'rgba(0, 212, 255, 0.15)', label: 'LISTENING', icon: <Radio size={12} className="spin-icon" /> }
      case 'THINKING':
        return { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', label: 'THINKING', icon: <Loader2 size={12} className="spin-icon" /> }
      case 'PLANNING':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: 'PLANNING', icon: <Sliders size={12} /> }
      case 'EXECUTING':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', label: 'EXECUTING', icon: <Zap size={12} /> }
      case 'SCANNING':
        return { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', label: 'SCANNING', icon: <Activity size={12} /> }
      case 'SUCCESS':
        return { color: '#00ff88', bg: 'rgba(0, 255, 136, 0.2)', label: 'SUCCESS', icon: <CheckCircle size={12} /> }
      case 'ERROR':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', label: 'ERROR', icon: <AlertTriangle size={12} /> }
      case 'BLOCKED':
        return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.2)', label: 'BLOCKED', icon: <AlertOctagon size={12} /> }
      default:
        return { color: '#00d4ff', bg: 'rgba(0, 212, 255, 0.1)', label: 'IDLE', icon: <Activity size={12} /> }
    }
  }

  const badge = getStateBadge(orbState)

  return (
    <aside className="right-panel">
      {/* Real-time Agent State & Operation */}
      <div className="panel-card" style={{ borderColor: badge.color }}>
        <div className="panel-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: badge.color }}>
            <Activity size={14} /> ULTRON State
          </span>
          <span
            className="badge-pill"
            style={{
              fontSize: '11px',
              fontWeight: 700,
              background: badge.bg,
              color: badge.color,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px'
            }}
          >
            {badge.icon}
            {badge.label}
          </span>
        </div>

        <div className="panel-card-row">
          <span className="label">Current Operation</span>
          <span
            className="value"
            style={{
              fontSize: '11px',
              color: currentRunningTask ? '#00ff88' : 'var(--text-muted)',
              maxWidth: '140px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={currentRunningTask?.name || 'Awaiting command'}
          >
            {currentRunningTask ? currentRunningTask.name : 'Standby / Ready'}
          </span>
        </div>
      </div>

      {/* Windows 11 PowerShell Control Center */}
      <div className="panel-card" style={{ borderColor: 'rgba(0, 212, 255, 0.3)' }}>
        <div className="panel-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={14} color="#00d4ff" /> PowerShell Layer
          </span>
          <span
            className="badge-pill"
            style={{
              fontSize: '10px',
              background: activeCount > 0 ? 'rgba(0,255,136,0.2)' : 'rgba(0,212,255,0.15)',
              color: activeCount > 0 ? '#00ff88' : '#00d4ff'
            }}
          >
            {activeCount > 0 ? `${activeCount} Executing` : 'Controlled Engine'}
          </span>
        </div>

        <div className="panel-card-row">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} /> Last Latency
          </span>
          <span className="value" style={{ color: '#00ff88', fontWeight: 600 }}>
            ⚡ {perf.lastExecutionMs}ms
          </span>
        </div>

        <div className="panel-card-row">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Activity size={13} /> Avg Latency
          </span>
          <span className="value" style={{ color: '#00d4ff' }}>
            {perf.averageLatencyMs}ms
          </span>
        </div>

        <div className="panel-card-row">
          <span className="label">Total Commands</span>
          <span className="value">{perf.totalCommandsExecuted}</span>
        </div>

        {/* Task Queue Preview */}
        {recentTasks.length > 0 && (
          <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Execution Telemetry
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {recentTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    padding: '4px 6px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    {t.status === 'RUNNING' ? (
                      <Loader2 size={12} className="spin-icon" color="#00ff88" />
                    ) : t.status === 'COMPLETED' ? (
                      <CheckCircle size={12} color="#00e676" />
                    ) : (
                      <AlertTriangle size={12} color="#ff3366" />
                    )}
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '110px' }} title={t.name}>
                      {t.name}
                    </span>
                  </div>
                  <span style={{ color: '#00d4ff', fontSize: '10px', fontWeight: 600 }}>
                    {t.durationMs}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Windows Telemetry */}
      <div className="panel-card">
        <div className="panel-card-title">Windows Telemetry</div>
        <div className="panel-card-row">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} /> CPU Usage
          </span>
          <span className="value">{metrics.cpu}%</span>
        </div>
        <div className="panel-card-row">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HardDrive size={14} /> Memory
          </span>
          <span className="value">{metrics.memory}%</span>
        </div>
        <div className="panel-card-row">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Wifi size={14} /> Network
          </span>
          <span className="value status-indicator">
            <span className="dot online" /> Active
          </span>
        </div>
      </div>

      {/* Android Device Status */}
      <div className="panel-card">
        <div className="panel-card-title">Android ADB Bridge</div>
        <div className="panel-card-row">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Smartphone size={14} /> Telephony
          </span>
          <span className="value status-indicator">
            <span className={`dot ${metrics.adbConnected ? 'online' : 'offline'}`} />
            {metrics.adbConnected ? 'Connected' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Cybersecurity Posture */}
      <div className="panel-card">
        <div className="panel-card-title">Security Defense</div>
        <div className="panel-card-row">
          <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={14} /> Defense Core
          </span>
          <span className="value" style={{ color: '#00e676', fontWeight: 600 }}>ARMED (Real-Time)</span>
        </div>
      </div>

      {/* Hardware-Backed Credential Vault */}
      <div className="panel-card">
        <div className="panel-card-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={13} color="#00d4ff" /> Credential Vault
          </span>
          <span style={{ fontSize: '9px', color: '#00d4ff', fontFamily: 'var(--font-mono)', background: 'rgba(0, 212, 255, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
            DPAPI
          </span>
        </div>
        <div className="panel-card-row">
          <span className="label">Zero-Storage</span>
          <span className="value" style={{ color: '#00e676', fontSize: '11px', fontWeight: 600 }}>
            ENFORCED
          </span>
        </div>
      </div>

      {/* Production Version Badge */}
      <div style={{
        marginTop: 'auto',
        padding: '12px 10px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.45)'
      }}>
        <div style={{ fontWeight: 700, color: 'rgba(0, 212, 255, 0.8)', letterSpacing: '0.05em' }}>
          ULTRON v1.0.1
        </div>
        <div style={{ fontSize: '10px', marginTop: '2px', color: 'rgba(255, 255, 255, 0.35)' }}>
          UPAI Technologies • Sukesh D.
        </div>
      </div>
    </aside>
  )
}