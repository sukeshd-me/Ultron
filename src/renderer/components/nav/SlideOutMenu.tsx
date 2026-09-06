import React, { useEffect } from 'react'
import {
  Plus,
  History,
  Compass,
  FolderGit2,
  Boxes,
  Settings,
  X,
  Network,
  GitBranch,
  Users,
  Layers,
  Workflow,
  Sunrise,
  Focus,
  Inbox,
  Database,
  FlaskConical,
  ListTodo,
  HeartPulse,
  KeyRound,
  ShieldCheck,
  Search,
  RefreshCw
} from 'lucide-react'

interface SlideOutMenuProps {
  isOpen: boolean
  onClose: () => void
  onNewChat?: () => void
  onOpenHistory?: () => void
  onOpenMissions?: () => void
  onOpenProjects?: () => void
  onOpenSkills?: () => void
  onOpenSettings: (section?: string) => void
  onOpenContextGraph?: () => void
  onOpenRepoGit?: () => void
  onOpenAgentTeams?: () => void
  onOpenWorkspaces?: () => void
  onOpenAutomations?: () => void
  onOpenBriefing?: () => void
  onOpenFocus?: () => void
  onOpenInbox?: () => void
  onOpenMemoryControl?: () => void
  onOpenSimulation?: () => void
  onOpenTasks?: () => void
  onOpenDiagnostics?: () => void
  onOpenVault?: () => void
  onOpenSecurity?: () => void
  onOpenSearch?: () => void
  onOpenUpdates?: () => void
  [key: string]: any
}

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  iconColor?: string
  action: () => void
  description: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

export function SlideOutMenu({
  isOpen,
  onClose,
  onNewChat,
  onOpenHistory,
  onOpenMissions,
  onOpenProjects,
  onOpenSkills,
  onOpenSettings,
  onOpenContextGraph,
  onOpenRepoGit,
  onOpenAgentTeams,
  onOpenWorkspaces,
  onOpenAutomations,
  onOpenBriefing,
  onOpenFocus,
  onOpenInbox,
  onOpenMemoryControl,
  onOpenSimulation,
  onOpenTasks,
  onOpenDiagnostics,
  onOpenVault,
  onOpenSecurity,
  onOpenSearch,
  onOpenUpdates,
  ...props
}: SlideOutMenuProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sections: MenuSection[] = [
    {
      title: 'CORE AGENT',
      items: [
        {
          id: 'missions',
          label: 'Agent Missions',
          icon: Compass,
          iconColor: 'text-cyan-400',
          action: () => {
            onClose()
            if (onOpenMissions) onOpenMissions()
            else if (props.onOpenMissions) props.onOpenMissions()
          },
          description: 'Autonomous goal execution with verification'
        },
        {
          id: 'history',
          label: 'Task History',
          icon: History,
          iconColor: 'text-sky-400',
          action: () => {
            onClose()
            if (onOpenHistory) onOpenHistory()
            else if (props.onOpenHistory) props.onOpenHistory()
          },
          description: 'Audit past tasks, tools & durations'
        },
        {
          id: 'projects',
          label: 'Project Intelligence',
          icon: FolderGit2,
          iconColor: 'text-emerald-400',
          action: () => {
            onClose()
            if (onOpenProjects) onOpenProjects()
            else if (props.onOpenProjectIntel) props.onOpenProjectIntel()
          },
          description: 'Decisions, git milestones & memory'
        },
        {
          id: 'context-graph',
          label: 'Context Graph',
          icon: Network,
          iconColor: 'text-blue-400',
          action: () => {
            onClose()
            if (onOpenContextGraph) onOpenContextGraph()
          },
          description: 'Connected entities, files & tasks'
        },
        {
          id: 'repo-git',
          label: 'Repo & Git Intelligence',
          icon: GitBranch,
          iconColor: 'text-emerald-400',
          action: () => {
            onClose()
            if (onOpenRepoGit) onOpenRepoGit()
          },
          description: 'Architecture mapping & pre-flight impact'
        },
        {
          id: 'agent-teams',
          label: 'Agent Teams & Telemetry',
          icon: Users,
          iconColor: 'text-amber-400',
          action: () => {
            onClose()
            if (onOpenAgentTeams) onOpenAgentTeams()
          },
          description: 'Internal roles & model latency benchmarks'
        }
      ]
    },
    {
      title: 'OPERATING LAYER',
      items: [
        {
          id: 'workspaces',
          label: 'Smart Workspaces',
          icon: Layers,
          iconColor: 'text-cyan-400',
          action: () => {
            onClose()
            if (onOpenWorkspaces) onOpenWorkspaces()
          },
          description: 'Multi-folder context & environment binding'
        },
        {
          id: 'automations',
          label: 'Automations',
          icon: Workflow,
          iconColor: 'text-emerald-400',
          action: () => {
            onClose()
            if (onOpenAutomations) onOpenAutomations()
          },
          description: 'Scheduled recurring autonomous tasks'
        },
        {
          id: 'briefing',
          label: 'Daily Briefing',
          icon: Sunrise,
          iconColor: 'text-amber-400',
          action: () => {
            onClose()
            if (onOpenBriefing) onOpenBriefing()
          },
          description: 'Morning agenda & task status synthesis'
        },
        {
          id: 'focus',
          label: 'Focus Mode',
          icon: Focus,
          iconColor: 'text-violet-400',
          action: () => {
            onClose()
            if (onOpenFocus) onOpenFocus()
          },
          description: 'Distraction-free deep work session'
        },
        {
          id: 'inbox',
          label: 'Universal Inbox',
          icon: Inbox,
          iconColor: 'text-blue-400',
          action: () => {
            onClose()
            if (onOpenInbox) onOpenInbox()
          },
          description: 'Cross-platform notifications & alerts'
        },
        {
          id: 'memory',
          label: 'Memory Control Center',
          icon: Database,
          iconColor: 'text-pink-400',
          action: () => {
            onClose()
            if (onOpenMemoryControl) onOpenMemoryControl()
            else if (props.onOpenMemory) props.onOpenMemory()
          },
          description: 'Long-term episodic & semantic recall'
        },
        {
          id: 'simulation',
          label: 'Mission Simulation',
          icon: FlaskConical,
          iconColor: 'text-purple-400',
          action: () => {
            onClose()
            if (onOpenSimulation) onOpenSimulation()
          },
          description: 'Pre-flight dry-run of destructive actions'
        },
        {
          id: 'tasks',
          label: 'Background Tasks',
          icon: ListTodo,
          iconColor: 'text-cyan-400',
          action: () => {
            onClose()
            if (onOpenTasks) onOpenTasks()
          },
          description: 'Active daemons & background processes'
        }
      ]
    },
    {
      title: 'SYSTEM & TOOLS',
      items: [
        {
          id: 'diagnostics',
          label: 'System Diagnostics',
          icon: HeartPulse,
          iconColor: 'text-rose-400',
          action: () => {
            onClose()
            if (onOpenDiagnostics) onOpenDiagnostics()
          },
          description: 'Self-diagnostics and subsystem health'
        },
        {
          id: 'search',
          label: 'Universal Search',
          icon: Search,
          iconColor: 'text-cyan-400',
          action: () => {
            onClose()
            if (onOpenSearch) onOpenSearch()
          },
          description: 'Fast cross-system indexing (Ctrl+K)'
        },
        {
          id: 'vault',
          label: 'Credential Vault',
          icon: KeyRound,
          iconColor: 'text-amber-400',
          action: () => {
            onClose()
            if (onOpenVault) onOpenVault()
          },
          description: 'Secure encrypted secrets management'
        },
        {
          id: 'skills',
          label: 'Skills Catalog',
          icon: Boxes,
          iconColor: 'text-blue-400',
          action: () => {
            onClose()
            if (onOpenSkills) onOpenSkills()
            else if (props.onOpenSkillStore) props.onOpenSkillStore()
          },
          description: 'Installed tools & external capabilities'
        },
        {
          id: 'updates',
          label: 'Update Manager',
          icon: RefreshCw,
          iconColor: 'text-teal-400',
          action: () => {
            onClose()
            if (onOpenUpdates) onOpenUpdates()
          },
          description: 'Check for new releases & integrity'
        },
        {
          id: 'settings',
          label: 'Settings',
          icon: Settings,
          iconColor: 'text-zinc-400',
          action: () => {
            onClose()
            onOpenSettings('ai')
          },
          description: 'AI model parameters, API keys & risk'
        }
      ]
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Pure Obsidian Slide-Out Drawer */}
      <div className="relative w-84 max-w-[85vw] bg-[#08080a] border-r border-cyan-500/20 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col h-full z-10 animate-in slide-in-from-left duration-200 select-none">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/15 flex items-center justify-center border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d4ff]" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-widest font-mono">ULTRON</span>
              <span className="text-[10px] text-cyan-400 font-mono ml-2 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">v1.0.8</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
            title="Close Menu (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Top Action: New Chat */}
        <div className="p-3 border-b border-white/10 bg-black/20">
          <button
            type="button"
            onClick={() => {
              onClose()
              if (onNewChat) onNewChat()
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white font-semibold text-xs border border-cyan-500/40 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(0,212,255,0.15)]"
          >
            <Plus size={14} className="text-cyan-400" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Categorized Menu Sections */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <div className="px-2 text-[10px] font-mono font-semibold tracking-wider text-cyan-400/80">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.action}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.1] transition-all group border border-transparent hover:border-white/10"
                    >
                      <div className={`p-1.5 rounded-md bg-black/60 border border-white/10 group-hover:border-cyan-500/30 transition-colors shrink-0 ${item.iconColor || 'text-zinc-400'}`}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 truncate">
                        <div className="text-xs font-medium text-zinc-200 group-hover:text-white leading-snug">{item.label}</div>
                        <div className="text-[10px] text-zinc-500 truncate leading-snug">{item.description}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Drawer Footer */}
        <div className="p-3.5 border-t border-white/10 bg-black/50 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-semibold text-zinc-300">UPAI Technologies</span>
            <span className="font-mono text-[10px] text-zinc-500">Sukesh D.</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck size={12} className="text-emerald-400" /> Zero-Trust Active
            </span>
            <span className="text-zinc-500">Ctrl+K for palette</span>
          </div>
        </div>
      </div>
    </div>
  )
}
