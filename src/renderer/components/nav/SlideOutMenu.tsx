import React from 'react'
import {
  Plus,
  MessageSquare,
  Activity,
  Brain,
  Boxes,
  Code2,
  Smartphone,
  ShieldCheck,
  Settings,
  Info,
  X,
  Search,
  HeartPulse,
  ListTodo,
  Compass,
  History,
  BookOpen,
  Wrench,
  Sliders,
  Target,
  KeyRound,
  FolderGit2,
  BarChart3,
  Layout,
  Bug,
  UploadCloud,
  Sunrise,
  Focus,
  Layers,
  Inbox,
  Workflow,
  Database,
  FlaskConical,
  RefreshCw
} from 'lucide-react'
import { NavPage } from '../../../shared/types'
import { useUIStore } from '../../stores/uiStore'
import { useChatStore } from '../../stores/chatStore'

interface SlideOutMenuProps {
  isOpen: boolean
  onClose: () => void
  onOpenSettings: (section?: string) => void
  onOpenMemory: () => void
  onOpenPhone: () => void
  onOpenSkills: () => void
  onOpenDeveloper: () => void
  onOpenPermissions: () => void
  onOpenActivity?: () => void
  onOpenAbout?: () => void
  onOpenSearch?: () => void
  onOpenDiagnostics?: () => void
  onOpenTasks?: () => void
  onOpenMissions?: () => void
  onOpenHistory?: () => void
  onOpenDocuments?: () => void
  onOpenSecurity?: () => void
  onOpenSafeRepair?: () => void
  onOpenPreferences?: () => void
  onOpenGoals?: () => void
  onOpenVault?: () => void
  onOpenSkillStore?: () => void
  onOpenProjectIntel?: () => void
  onOpenWindows?: () => void
  onOpenProductivity?: () => void
  onOpenDebugger?: () => void
  onOpenImportExport?: () => void
  // V1.0.7 Operating Layer
  onOpenBriefing?: () => void
  onOpenFocus?: () => void
  onOpenWorkspaces?: () => void
  onOpenInbox?: () => void
  onOpenAutomations?: () => void
  onOpenMemoryControl?: () => void
  onOpenSimulation?: () => void
  onOpenUpdates?: () => void
}

export function SlideOutMenu({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenMemory,
  onOpenPhone,
  onOpenSkills,
  onOpenDeveloper,
  onOpenPermissions,
  onOpenActivity,
  onOpenAbout,
  onOpenSearch,
  onOpenDiagnostics,
  onOpenTasks,
  onOpenMissions,
  onOpenHistory,
  onOpenDocuments,
  onOpenSecurity,
  onOpenSafeRepair,
  onOpenPreferences,
  onOpenGoals,
  onOpenVault,
  onOpenSkillStore,
  onOpenProjectIntel,
  onOpenWindows,
  onOpenProductivity,
  onOpenDebugger,
  onOpenImportExport,
  onOpenBriefing,
  onOpenFocus,
  onOpenWorkspaces,
  onOpenInbox,
  onOpenAutomations,
  onOpenMemoryControl,
  onOpenSimulation,
  onOpenUpdates
}: SlideOutMenuProps) {
  const { currentPage, setCurrentPage } = useUIStore()
  const clearMessages = useChatStore((s) => s.clearMessages)
  const addMessage = useChatStore((s) => s.addMessage)

  const handleNewChat = () => {
    clearMessages()
    addMessage({
      id: `welcome-${Date.now()}`,
      role: 'assistant',
      content: 'New session initiated. ULTRON Neural Core ready. How may I assist you today, Sukesh?',
      timestamp: Date.now()
    })
    setCurrentPage('home')
    onClose()
  }

  const handleSelectNav = (page: NavPage) => {
    switch (page) {
      case 'settings':
        onOpenSettings()
        break
      case 'memory':
        onOpenMemory()
        break
      case 'phone':
        onOpenPhone()
        break
      case 'skills':
        onOpenSkills()
        break
      case 'developer':
        onOpenDeveloper()
        break
      case 'permissions':
        onOpenPermissions()
        break
      case 'activity':
        if (onOpenActivity) onOpenActivity()
        else setCurrentPage('activity')
        break
      case 'about':
        if (onOpenAbout) onOpenAbout()
        else onOpenSettings('about')
        break
      default:
        setCurrentPage(page)
        break
    }
    onClose()
  }

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`slide-menu-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Slide-out drawer */}
      <aside className={`slide-menu-drawer ${isOpen ? 'open' : ''}`}>
        <div className="slide-menu-header">
          <div className="slide-menu-title-wrap">
            <span className="slide-menu-tag">SYSTEM NAVIGATION</span>
            <h3 className="slide-menu-title">MENU</h3>
          </div>
          <button
            className="slide-menu-close-btn"
            onClick={onClose}
            title="Close menu"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        {/* 10 Items as specified in Requirement 31 */}
        <div className="slide-menu-section custom-scrollbar">
          {/* 1. New Chat */}
          <button className="slide-menu-item new-chat-btn" onClick={handleNewChat}>
            <span className="slide-menu-item-icon">
              <Plus size={16} />
            </span>
            <span className="slide-menu-item-label">New Chat</span>
          </button>

          {/* 2. Chats */}
          <button
            className={`slide-menu-item ${currentPage === 'home' ? 'active' : ''}`}
            onClick={() => handleSelectNav('home')}
          >
            <span className="slide-menu-item-icon">
              <MessageSquare size={16} />
            </span>
            <span className="slide-menu-item-label">Chats</span>
          </button>

          {/* 3. Activity */}
          <button
            className={`slide-menu-item ${currentPage === 'activity' ? 'active' : ''}`}
            onClick={() => handleSelectNav('activity')}
          >
            <span className="slide-menu-item-icon">
              <Activity size={16} />
            </span>
            <span className="slide-menu-item-label">Activity</span>
          </button>

          {/* 4. Memory */}
          <button
            className={`slide-menu-item ${currentPage === 'memory' ? 'active' : ''}`}
            onClick={() => handleSelectNav('memory')}
          >
            <span className="slide-menu-item-icon">
              <Brain size={16} />
            </span>
            <span className="slide-menu-item-label">Memory</span>
          </button>

          {/* 5. Skills */}
          <button
            className={`slide-menu-item ${currentPage === 'skills' ? 'active' : ''}`}
            onClick={() => handleSelectNav('skills')}
          >
            <span className="slide-menu-item-icon">
              <Boxes size={16} />
            </span>
            <span className="slide-menu-item-label">Skills</span>
          </button>

          {/* 6. Developer Mode */}
          <button
            className={`slide-menu-item ${currentPage === 'developer' ? 'active' : ''}`}
            onClick={() => handleSelectNav('developer')}
          >
            <span className="slide-menu-item-icon">
              <Code2 size={16} />
            </span>
            <span className="slide-menu-item-label">Developer Mode</span>
          </button>

          {/* 7. Phone */}
          <button
            className={`slide-menu-item ${currentPage === 'phone' ? 'active' : ''}`}
            onClick={() => handleSelectNav('phone')}
          >
            <span className="slide-menu-item-icon">
              <Smartphone size={16} />
            </span>
            <span className="slide-menu-item-label">Phone</span>
          </button>

          {/* 8. Permissions */}
          <button
            className={`slide-menu-item ${currentPage === 'permissions' ? 'active' : ''}`}
            onClick={() => handleSelectNav('permissions')}
          >
            <span className="slide-menu-item-icon">
              <ShieldCheck size={16} />
            </span>
            <span className="slide-menu-item-label">Permissions</span>
          </button>

          {/* Search */}
          {onOpenSearch && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenSearch()
              }}
            >
              <span className="slide-menu-item-icon">
                <Search size={16} />
              </span>
              <span className="slide-menu-item-label">Universal Search</span>
              <span className="text-[10px] font-mono text-cyan-400 ml-auto border border-cyan-500/30 px-1 py-0.5 rounded bg-cyan-950/20">
                Ctrl+K
              </span>
            </button>
          )}

          {/* Diagnostics */}
          {onOpenDiagnostics && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenDiagnostics()
              }}
            >
              <span className="slide-menu-item-icon">
                <HeartPulse size={16} />
              </span>
              <span className="slide-menu-item-label">Diagnostics</span>
            </button>
          )}

          {/* Background Tasks */}
          {onOpenTasks && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenTasks()
              }}
            >
              <span className="slide-menu-item-icon">
                <ListTodo size={16} />
              </span>
              <span className="slide-menu-item-label">Background Tasks</span>
            </button>
          )}

          {/* V1.0.5: Agent Missions */}
          {onOpenMissions && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenMissions()
              }}
            >
              <span className="slide-menu-item-icon">
                <Compass size={16} className="text-[#00d4ff]" />
              </span>
              <span className="slide-menu-item-label">Agent Missions</span>
            </button>
          )}

          {/* V1.0.5: Task History */}
          {onOpenHistory && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenHistory()
              }}
            >
              <span className="slide-menu-item-icon">
                <History size={16} className="text-[#00d4ff]" />
              </span>
              <span className="slide-menu-item-label">Task History</span>
            </button>
          )}

          {/* V1.0.5: Document Intelligence */}
          {onOpenDocuments && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenDocuments()
              }}
            >
              <span className="slide-menu-item-icon">
                <BookOpen size={16} className="text-[#a855f7]" />
              </span>
              <span className="slide-menu-item-label">Document Intelligence</span>
            </button>
          )}

          {/* V1.0.5: Security Center */}
          {onOpenSecurity && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenSecurity()
              }}
            >
              <span className="slide-menu-item-icon">
                <ShieldCheck size={16} className="text-[#00ff88]" />
              </span>
              <span className="slide-menu-item-label">Security Center</span>
            </button>
          )}

          {/* V1.0.5: One-Click Safe Repair */}
          {onOpenSafeRepair && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenSafeRepair()
              }}
            >
              <span className="slide-menu-item-icon">
                <Wrench size={16} className="text-[#00d4ff]" />
              </span>
              <span className="slide-menu-item-label">Safe Diagnostics Repair</span>
            </button>
          )}

          {/* V1.0.5: Preferences */}
          {onOpenPreferences && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenPreferences()
              }}
            >
              <span className="slide-menu-item-icon">
                <Sliders size={16} className="text-[#00d4ff]" />
              </span>
              <span className="slide-menu-item-label">Preferences</span>
            </button>
          )}

          {/* V1.0.6: Goal Memory */}
          {onOpenGoals && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenGoals()
              }}
            >
              <span className="slide-menu-item-icon">
                <Target size={16} className="text-[#00d4ff]" />
              </span>
              <span className="slide-menu-item-label">Goal Memory</span>
            </button>
          )}

          {/* V1.0.6: Credential Vault */}
          {onOpenVault && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenVault()
              }}
            >
              <span className="slide-menu-item-icon">
                <KeyRound size={16} className="text-[#ffd700]" />
              </span>
              <span className="slide-menu-item-label">Credential Vault</span>
            </button>
          )}

          {/* V1.0.6: Skill Store & Plugins */}
          {onOpenSkillStore && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenSkillStore()
              }}
            >
              <span className="slide-menu-item-icon">
                <Boxes size={16} className="text-[#a855f7]" />
              </span>
              <span className="slide-menu-item-label">Skill Store & Plugins</span>
            </button>
          )}

          {/* V1.0.6: Project Intelligence */}
          {onOpenProjectIntel && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenProjectIntel()
              }}
            >
              <span className="slide-menu-item-icon">
                <FolderGit2 size={16} className="text-[#38bdf8]" />
              </span>
              <span className="slide-menu-item-label">Project Intelligence</span>
            </button>
          )}

          {/* V1.0.6: Window Manager */}
          {onOpenWindows && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenWindows()
              }}
            >
              <span className="slide-menu-item-icon">
                <Layout size={16} className="text-[#06b6d4]" />
              </span>
              <span className="slide-menu-item-label">Window Manager</span>
            </button>
          )}

          {/* V1.0.6: Productivity Analytics */}
          {onOpenProductivity && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenProductivity()
              }}
            >
              <span className="slide-menu-item-icon">
                <BarChart3 size={16} className="text-[#22c55e]" />
              </span>
              <span className="slide-menu-item-label">Productivity Analytics</span>
            </button>
          )}

          {/* V1.0.6: Agent Debugger */}
          {onOpenDebugger && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenDebugger()
              }}
            >
              <span className="slide-menu-item-icon">
                <Bug size={16} className="text-[#ec4899]" />
              </span>
              <span className="slide-menu-item-label">Agent Debugger</span>
            </button>
          )}

          {/* V1.0.6: Import / Export */}
          {onOpenImportExport && (
            <button
              className="slide-menu-item"
              onClick={() => {
                onClose()
                onOpenImportExport()
              }}
            >
              <span className="slide-menu-item-icon">
                <UploadCloud size={16} className="text-[#818cf8]" />
              </span>
              <span className="slide-menu-item-label">Import / Export</span>
            </button>
          )}

          {/* ──── V1.0.7 OPERATING LAYER ──── */}
          <div className="slide-menu-divider" />
          <span className="slide-menu-section-label">OPERATING LAYER</span>

          {onOpenBriefing && (
            <button className="slide-menu-item" onClick={() => { onClose(); onOpenBriefing(); }}>
              <span className="slide-menu-item-icon"><Sunrise size={16} className="text-[#f59e0b]" /></span>
              <span className="slide-menu-item-label">Daily Briefing</span>
            </button>
          )}

          {onOpenFocus && (
            <button className="slide-menu-item" onClick={() => { onClose(); onOpenFocus(); }}>
              <span className="slide-menu-item-icon"><Focus size={16} className="text-[#8b5cf6]" /></span>
              <span className="slide-menu-item-label">Focus Mode</span>
            </button>
          )}

          {onOpenWorkspaces && (
            <button className="slide-menu-item" onClick={() => { onClose(); onOpenWorkspaces(); }}>
              <span className="slide-menu-item-icon"><Layers size={16} className="text-[#06b6d4]" /></span>
              <span className="slide-menu-item-label">Workspaces</span>
            </button>
          )}

          {onOpenInbox && (
            <button className="slide-menu-item" onClick={() => { onClose(); onOpenInbox(); }}>
              <span className="slide-menu-item-icon"><Inbox size={16} className="text-[#3b82f6]" /></span>
              <span className="slide-menu-item-label">Universal Inbox</span>
            </button>
          )}

          {onOpenAutomations && (
            <button className="slide-menu-item" onClick={() => { onClose(); onOpenAutomations(); }}>
              <span className="slide-menu-item-icon"><Workflow size={16} className="text-[#10b981]" /></span>
              <span className="slide-menu-item-label">Automations</span>
            </button>
          )}

          {onOpenMemoryControl && (
            <button className="slide-menu-item" onClick={() => { onClose(); onOpenMemoryControl(); }}>
              <span className="slide-menu-item-icon"><Database size={16} className="text-[#f472b6]" /></span>
              <span className="slide-menu-item-label">Memory Control</span>
            </button>
          )}

          {onOpenSimulation && (
            <button className="slide-menu-item" onClick={() => { onClose(); onOpenSimulation(); }}>
              <span className="slide-menu-item-icon"><FlaskConical size={16} className="text-[#a78bfa]" /></span>
              <span className="slide-menu-item-label">Mission Simulation</span>
            </button>
          )}

          {onOpenUpdates && (
            <button className="slide-menu-item" onClick={() => { onClose(); onOpenUpdates(); }}>
              <span className="slide-menu-item-icon"><RefreshCw size={16} className="text-[#22d3ee]" /></span>
              <span className="slide-menu-item-label">Update Manager</span>
            </button>
          )}

          {/* 9. Settings */}
          <button
            className={`slide-menu-item ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => handleSelectNav('settings')}
          >
            <span className="slide-menu-item-icon">
              <Settings size={16} />
            </span>
            <span className="slide-menu-item-label">Settings</span>
          </button>

          {/* 10. About */}
          <button
            className={`slide-menu-item ${currentPage === 'about' ? 'active' : ''}`}
            onClick={() => handleSelectNav('about')}
          >
            <span className="slide-menu-item-icon">
              <Info size={16} />
            </span>
            <span className="slide-menu-item-label">About</span>
          </button>
        </div>

        {/* Bottom Core Status Badge */}
        <div className="slide-menu-footer">
          <div className="core-status-pill">
            <span className="pulse-indicator-green" />
            <div className="core-status-text">
              <span className="core-status-primary">ULTRON CORE</span>
              <span className="core-status-tag">V1.0.7 ACTIVE</span>
            </div>
          </div>
          <div className="zero-trust-label">
            <ShieldCheck size={12} color="#00e676" />
            <span>Zero-Trust Mode <strong>ENFORCED</strong></span>
          </div>
        </div>
      </aside>
    </>
  )
}
