import React, { useEffect } from 'react'
import {
  Plus,
  History,
  Compass,
  FolderGit2,
  Boxes,
  Settings,
  X,
  Sparkles,
  Command,
  Activity
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
  // Legacy / optional callbacks for backward compatibility
  [key: string]: any
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
  ...props
}: SlideOutMenuProps) {
  // Support Escape key to close menu
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

  const menuItems = [
    {
      id: 'history',
      label: 'History',
      icon: History,
      action: () => {
        onClose()
        if (onOpenHistory) onOpenHistory()
        else if (props.onOpenHistory) props.onOpenHistory()
      },
      description: 'Audit past tasks and actions'
    },
    {
      id: 'missions',
      label: 'Missions',
      icon: Compass,
      action: () => {
        onClose()
        if (onOpenMissions) onOpenMissions()
        else if (props.onOpenMissions) props.onOpenMissions()
      },
      description: 'Autonomous goal execution'
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderGit2,
      action: () => {
        onClose()
        if (onOpenProjects) onOpenProjects()
        else if (props.onOpenProjectIntel) props.onOpenProjectIntel()
      },
      description: 'Repository & context intelligence'
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: Boxes,
      action: () => {
        onClose()
        if (onOpenSkills) onOpenSkills()
        else if (props.onOpenSkills) props.onOpenSkills()
      },
      description: 'Installed tools & capabilities'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: () => {
        onClose()
        onOpenSettings('menu')
      },
      description: 'System preferences & AI models'
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Pure Black Slide-Out Drawer */}
      <div className="relative w-80 max-w-[85vw] bg-[#090909] border-r border-[#1a1a1a] shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-left duration-200 select-none">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[#1a1a1a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
              <span className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-widest">ULTRON</span>
              <span className="text-[10px] text-zinc-500 font-mono ml-2">v1.0.8</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition"
            title="Close Menu (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Top Action: New Chat */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <button
            type="button"
            onClick={() => {
              onClose()
              if (onNewChat) onNewChat()
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 active:scale-[0.98] transition-all shadow-md"
          >
            <Plus size={15} />
            <span>New Chat</span>
          </button>
        </div>

        {/* Clean Menu Items (Requirement 13) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-zinc-300 hover:text-white hover:bg-white/5 active:bg-white/10 transition-all group"
              >
                <div className="p-1.5 rounded-lg bg-[#141414] border border-[#222222] text-zinc-400 group-hover:text-white group-hover:border-zinc-700 transition-colors">
                  <Icon size={15} />
                </div>
                <div className="flex-1 truncate">
                  <div className="text-xs font-medium text-zinc-200 group-hover:text-white">{item.label}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{item.description}</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#1a1a1a] bg-[#0c0c0c] space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>UPAI Technologies</span>
            <span className="font-mono text-[10px]">Founder: Sukesh D.</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono">
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> V1.0.8 Active
            </span>
            <span>Ctrl+K for palette</span>
          </div>
        </div>
      </div>
    </div>
  )
}
