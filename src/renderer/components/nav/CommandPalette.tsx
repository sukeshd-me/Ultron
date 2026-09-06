import React, { useState, useEffect } from 'react'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onAction: (actionId: string) => void
}

interface PaletteItem {
  id: string
  title: string
  subtitle: string
  category: string
  icon: string
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onAction }) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const items: PaletteItem[] = [
    { id: 'open_missions', title: 'Open Missions', subtitle: 'View multi-step agent goals & visual mission map', category: 'Navigation', icon: '🎯' },
    { id: 'open_goals', title: 'Open Goal Memory', subtitle: 'Manage long-running persistent goals and projects', category: 'Goals', icon: '🌟' },
    { id: 'open_history', title: 'Open Task History', subtitle: 'Audit sub-millisecond execution logs & latency', category: 'Auditing', icon: '📜' },
    { id: 'open_security', title: 'Open Security Center', subtitle: 'Windows Defender, Firewall, and port inspection', category: 'Security', icon: '🛡️' },
    { id: 'open_vault', title: 'Open Credential Vault', subtitle: 'DPAPI encrypted API keys and token vault', category: 'Security', icon: '🔐' },
    { id: 'open_documents', title: 'Open Documents', subtitle: 'Grounded PDF, markdown, and code knowledge index', category: 'Knowledge', icon: '📄' },
    { id: 'open_plugins', title: 'Open Skill Store & Plugins', subtitle: 'Browse verified skills and plugin manifests', category: 'Plugins', icon: '🧩' },
    { id: 'open_project', title: 'Open Project Intelligence', subtitle: 'Git commits, build history, and architecture decisions', category: 'Project', icon: '🧠' },
    { id: 'open_windows', title: 'Open Window Manager', subtitle: 'Focus and arrange desktop applications and workspaces', category: 'Windows', icon: '🪟' },
    { id: 'open_productivity', title: 'Open Productivity Analytics', subtitle: 'Local task completion stats and duration telemetry', category: 'Analytics', icon: '📊' },
    { id: 'open_debugger', title: 'Open Agent Debugger', subtitle: 'Observable decision pipeline (Risk, Permission, Verify)', category: 'Developer', icon: '🐞' },
    { id: 'open_repair', title: 'Open Safe Repair', subtitle: 'One-click verified diagnostic remediation', category: 'Diagnostics', icon: '⚡' },
    { id: 'open_settings', title: 'Open Settings', subtitle: 'Configure AI models, preferences, and permissions', category: 'Settings', icon: '⚙️' },
    { id: 'forget_screen', title: 'Forget Screen Context', subtitle: 'Discard temporary task visual memory immediately', category: 'Privacy', icon: '👁️' },
    { id: 'undo_action', title: 'Undo Recent Action', subtitle: 'Rollback previous reversible file mutation', category: 'Recovery', icon: '↩️' },
    // V1.0.7 Actions
    { id: 'open_briefing', title: 'Daily Briefing', subtitle: 'Personal status, active goals, and system health', category: 'Operating Layer', icon: '🌅' },
    { id: 'open_focus', title: 'Focus Mode', subtitle: 'Start dedicated coding, research, or study session', category: 'Operating Layer', icon: '🧘' },
    { id: 'open_workspaces', title: 'Multiple Workspaces', subtitle: 'Switch between Development, Research, Study', category: 'Operating Layer', icon: '🏢' },
    { id: 'open_inbox', title: 'Universal Inbox', subtitle: 'Notifications, Android messages, and priority alerts', category: 'Communication', icon: '📥' },
    { id: 'open_automations', title: 'Automations & Scheduling', subtitle: 'Visual automation builder and scheduled missions', category: 'Automation', icon: '⚙️' },
    { id: 'open_memory_control', title: 'Memory Control Center', subtitle: 'Scoped memory browser and safe forget with backup', category: 'Memory', icon: '🧠' },
    { id: 'open_updates', title: 'Update Manager', subtitle: 'Check official GitHub repository for ULTRON updates', category: 'System', icon: '🚀' },
    // V1.0.8 Actions
    { id: 'open_context_graph', title: 'Personal Context Graph', subtitle: 'Explore connected entities: projects, workspaces, repos, files', category: 'Context Graph', icon: '🕸️' },
    { id: 'open_repo_git', title: 'Repo & Git Intelligence', subtitle: 'Repository architecture map, uncommitted diffs & pre-flight impact', category: 'Repository', icon: '🌿' },
    { id: 'open_agent_teams', title: 'Agent Teams & Model Telemetry', subtitle: 'Planner, Research, Coding, PC, Android agents & tier performance', category: 'Agent Teams', icon: '👥' },
    { id: 'open_command_bar', title: 'Global Command Bar', subtitle: 'Lightweight overlay prompt (Ctrl+Space)', category: 'Navigation', icon: '⌘' },
    { id: 'check_contradictions', title: 'Audit Contradictions', subtitle: 'Scan memories, automations, and goals for conflicting instructions', category: 'Integrity', icon: '⚖️' }
  ]

  const filtered = items.filter(i =>
    i.title.toLowerCase().includes(query.toLowerCase()) ||
    i.subtitle.toLowerCase().includes(query.toLowerCase()) ||
    i.category.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % (filtered.length || 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filtered.length) % (filtered.length || 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[selectedIndex]) {
          onAction(filtered[selectedIndex].id)
          onClose()
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filtered, onAction, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#09090b] border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3 border-b border-white/10 gap-3">
          <span className="text-cyan-400 text-lg">⚡</span>
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search capabilities... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          <span className="text-[10px] font-mono text-gray-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded">ESC</span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">No matching capabilities found.</div>
          ) : (
            filtered.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => {
                  onAction(item.id)
                  onClose()
                }}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                  idx === selectedIndex
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200'
                    : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <div>
                    <div className="text-xs font-semibold">{item.title}</div>
                    <div className="text-[11px] text-gray-400">{item.subtitle}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 border border-white/5 px-2 py-0.5 rounded bg-black/40">
                  {item.category}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
