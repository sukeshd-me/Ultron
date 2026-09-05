// src/renderer/components/permissions/PermissionCenter.tsx — ULTRON V1.0.3 Permission Center
import React, { useEffect, useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  RotateCcw,
  Smartphone,
  FolderTree,
  Monitor,
  Globe,
  Network,
  Brain,
  Code2,
  Cpu,
  Laptop
} from 'lucide-react'
import {
  PermissionCategory,
  PermissionLevel,
  PermissionAuditEntry
} from '../../../shared/permissions.types'

const CATEGORY_META: Record<
  PermissionCategory,
  { label: string; icon: React.ReactNode; desc: string }
> = {
  WINDOWS: {
    label: 'Windows System',
    icon: <Laptop size={16} color="#00d4ff" />,
    desc: 'Launch desktop apps, monitor processes, and system telemetry.'
  },
  ANDROID: {
    label: 'Android Companion',
    icon: <Smartphone size={16} color="#00e676" />,
    desc: 'ADB device commands, phone calls, app launch, and battery telemetry.'
  },
  FILES: {
    label: 'Filesystem',
    icon: <FolderTree size={16} color="#ffd600" />,
    desc: 'Read and write local workspace files and configuration.'
  },
  SCREEN: {
    label: 'Screen & Vision',
    icon: <Monitor size={16} color="#a855f7" />,
    desc: 'Local desktop frame capture and multimodal visual comprehension.'
  },
  BROWSER: {
    label: 'Web & Browser',
    icon: <Globe size={16} color="#3b82f6" />,
    desc: 'Open browser tabs and perform external web research.'
  },
  NETWORK: {
    label: 'Network',
    icon: <Network size={16} color="#06b6d4" />,
    desc: 'Network telemetry, adapter status, and API communication.'
  },
  MEMORY: {
    label: 'Neural Memory',
    icon: <Brain size={16} color="#ec4899" />,
    desc: 'Read and persist scoped facts, preferences, and project memory.'
  },
  DEVELOPER: {
    label: 'Developer Mode',
    icon: <Code2 size={16} color="#f97316" />,
    desc: 'Codebase inspection, TypeScript checks, and Git status queries.'
  },
  AUTOMATION: {
    label: 'Autonomous Automation',
    icon: <Cpu size={16} color="#10b981" />,
    desc: 'Multi-step agent plan execution and complex compound tasks.'
  }
}

export function PermissionCenter() {
  const [permissions, setPermissions] = useState<Record<string, { level: PermissionLevel; description: string }>>({})
  const [auditLog, setAuditLog] = useState<PermissionAuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'rules' | 'audit'>('rules')
  const [feedback, setFeedback] = useState<string | null>(null)

  const loadData = async () => {
    const ultron = (window as any).ultron
    if (!ultron?.permissions) return
    try {
      setLoading(true)
      const [perms, audit] = await Promise.all([
        ultron.permissions.getAll(),
        ultron.permissions.getAudit(30)
      ])
      if (perms) setPermissions(perms)
      if (audit) setAuditLog(audit)
    } catch (err: any) {
      console.error('[Permissions] Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSetLevel = async (category: PermissionCategory, level: PermissionLevel) => {
    const ultron = (window as any).ultron
    if (ultron?.permissions?.set) {
      await ultron.permissions.set(category, level)
      setPermissions((prev) => ({
        ...prev,
        [category]: { ...prev[category], level }
      }))
      setFeedback(`Updated ${CATEGORY_META[category]?.label || category} to ${level}`)
      setTimeout(() => setFeedback(null), 2500)
    }
  }

  const handleReset = async () => {
    const ultron = (window as any).ultron
    if (ultron?.permissions?.reset) {
      await ultron.permissions.reset()
      await loadData()
      setFeedback('All permissions restored to default zero-trust policies.')
      setTimeout(() => setFeedback(null), 2500)
    }
  }

  return (
    <div className="permission-center-wrapper custom-scrollbar">
      {/* Top Banner */}
      <div className="perm-center-header">
        <div className="perm-header-left">
          <div className="perm-shield-icon">
            <ShieldCheck size={20} color="#00e676" />
          </div>
          <div>
            <h3 className="perm-header-title">PERMISSION CENTER</h3>
            <p className="perm-header-sub">
              Granular access control across 9 security categories. High-risk actions always
              require explicit user confirmation.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="perm-reset-btn"
          onClick={handleReset}
          title="Restore factory default permissions"
        >
          <RotateCcw size={13} />
          <span>Reset Defaults</span>
        </button>
      </div>

      {feedback && (
        <div className="perm-feedback-banner animate-fadeIn">
          <span>{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="perm-tabs-row">
        <button
          className={`perm-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          Security Policies (9)
        </button>
        <button
          className={`perm-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Audit History ({auditLog.length})
        </button>
      </div>

      {/* Policies View */}
      {activeTab === 'rules' && (
        <div className="perm-categories-grid">
          {(Object.keys(CATEGORY_META) as PermissionCategory[]).map((cat) => {
            const meta = CATEGORY_META[cat]
            const currentLevel: PermissionLevel = permissions[cat]?.level || 'ASK'

            return (
              <div key={cat} className="perm-category-card">
                <div className="perm-card-header">
                  <div className="perm-card-icon-wrap">{meta.icon}</div>
                  <div className="perm-card-info">
                    <span className="perm-card-label">{meta.label}</span>
                    <span className="perm-card-desc">{meta.desc}</span>
                  </div>
                </div>

                {/* Level selector */}
                <div className="perm-level-selector">
                  <button
                    type="button"
                    className={`perm-level-btn allow ${currentLevel === 'ALLOW' ? 'selected' : ''}`}
                    onClick={() => handleSetLevel(cat, 'ALLOW')}
                  >
                    <ShieldCheck size={12} />
                    <span>ALLOW</span>
                  </button>
                  <button
                    type="button"
                    className={`perm-level-btn ask ${currentLevel === 'ASK' ? 'selected' : ''}`}
                    onClick={() => handleSetLevel(cat, 'ASK')}
                  >
                    <ShieldAlert size={12} />
                    <span>ASK</span>
                  </button>
                  <button
                    type="button"
                    className={`perm-level-btn deny ${currentLevel === 'DENY' ? 'selected' : ''}`}
                    onClick={() => handleSetLevel(cat, 'DENY')}
                  >
                    <ShieldX size={12} />
                    <span>DENY</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Audit Log View */}
      {activeTab === 'audit' && (
        <div className="perm-audit-container">
          {auditLog.length === 0 ? (
            <div className="perm-empty-audit">No audit records logged yet.</div>
          ) : (
            <div className="perm-audit-table">
              <div className="perm-audit-row header">
                <span>TIME</span>
                <span>CATEGORY</span>
                <span>ACTION</span>
                <span>RISK</span>
                <span>DECISION</span>
              </div>
              {auditLog.map((entry) => (
                <div key={entry.id} className="perm-audit-row">
                  <span className="time-col">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="cat-col">{entry.category}</span>
                  <span className="action-col" title={entry.action}>
                    {entry.action}
                  </span>
                  <span className={`risk-col risk-${entry.riskLevel.toLowerCase()}`}>
                    {entry.riskLevel}
                  </span>
                  <span className={`decision-col ${entry.granted ? 'granted' : 'denied'}`}>
                    {entry.granted ? 'GRANTED' : 'DENIED'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
