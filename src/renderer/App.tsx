import React, { useEffect, useState } from 'react'
import { SlideOutMenu } from './components/nav/SlideOutMenu'
import { UltronCore } from './components/core3d/UltronCore'
import { ChatPanel } from './components/chat/ChatPanel'
import { RightPanel } from './components/status/RightPanel'
import { SettingsPanel, SettingsTabId } from './components/settings/SettingsPanel'
import { MemoryInspector } from './components/memory/MemoryInspector'
import { DeveloperModal } from './components/developer/DeveloperModal'
import { SkillsModal } from './components/skills/SkillsModal'
import { ApiKeyStartupModal } from './components/onboarding/ApiKeyStartupModal'
import { PhoneSecurityModal } from './components/phone/PhoneSecurityModal'
import { UniversalSearchModal } from './components/UniversalSearchModal'
import { DiagnosticsModal } from './components/DiagnosticsModal'
import { TaskCenterDrawer } from './components/TaskCenterDrawer'
import { SmartWorkspaceBar } from './components/SmartWorkspaceBar'
import { MissionsModal } from './components/missions/MissionsModal'
import { ActionPreviewModal } from './components/missions/ActionPreviewModal'
import { TaskHistoryModal } from './components/history/TaskHistoryModal'
import { DocumentsModal } from './components/documents/DocumentsModal'
import { SecurityCenterModal } from './components/security/SecurityCenterModal'
import { SafeRepairModal } from './components/repair/SafeRepairModal'
import { PreferencesModal } from './components/preferences/PreferencesModal'
import { NotificationToastContainer } from './components/notifications/NotificationToast'
import { CommandPalette } from './components/nav/CommandPalette'
import { GoalMemoryModal } from './components/goals/GoalMemoryModal'
import { CredentialVaultModal } from './components/security/CredentialVaultModal'
import { SkillStoreModal } from './components/skills/SkillStoreModal'
import { ProjectIntelligenceModal } from './components/project/ProjectIntelligenceModal'
import { AgentDebuggerModal } from './components/developer/AgentDebuggerModal'
import { ProductivityModal } from './components/productivity/ProductivityModal'
import { WindowWorkspaceModal } from './components/windows/WindowWorkspaceModal'
import { ImportExportModal } from './components/settings/ImportExportModal'
import { Menu, Settings, X, Search, HeartPulse, ListTodo, Compass, History, Command } from 'lucide-react'
import { useUIStore } from './stores/uiStore'
import { useChatStore } from './stores/chatStore'
import { useSettingsStore } from './stores/settingsStore'
import { v4 as uuidv4 } from 'uuid'

export default function App() {
  const currentPage = useUIStore((s) => s.currentPage)
  const setCurrentPage = useUIStore((s) => s.setCurrentPage)

  // Drawer / Modal states
  const [isSlideMenuOpen, setIsSlideMenuOpen] = useState(false)
  const [isApiKeyStartupOpen, setIsApiKeyStartupOpen] = useState(true)
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
  const [isSettingsFlyoutOpen, setIsSettingsFlyoutOpen] = useState(false)
  const [isMemoryFlyoutOpen, setIsMemoryFlyoutOpen] = useState(false)
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false)
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false)
  const [isUniversalSearchOpen, setIsUniversalSearchOpen] = useState(false)
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false)
  const [isTaskCenterOpen, setIsTaskCenterOpen] = useState(false)
  const [isMissionsModalOpen, setIsMissionsModalOpen] = useState(false)
  const [isTaskHistoryModalOpen, setIsTaskHistoryModalOpen] = useState(false)
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false)
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false)
  const [isSafeRepairModalOpen, setIsSafeRepairModalOpen] = useState(false)
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTabId>('ai')

  // V1.0.6 Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false)
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false)
  const [isSkillStoreOpen, setIsSkillStoreOpen] = useState(false)
  const [isProjectIntelOpen, setIsProjectIntelOpen] = useState(false)
  const [isDebuggerOpen, setIsDebuggerOpen] = useState(false)
  const [isProductivityOpen, setIsProductivityOpen] = useState(false)
  const [isWindowsModalOpen, setIsWindowsModalOpen] = useState(false)
  const [isImportExportOpen, setIsImportExportOpen] = useState(false)

  // Global keyboard shortcut for Command Palette (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const handlePaletteAction = (actionId: string) => {
    switch (actionId) {
      case 'open_missions':
        setIsMissionsModalOpen(true)
        break
      case 'open_goals':
        setIsGoalsModalOpen(true)
        break
      case 'open_history':
        setIsTaskHistoryModalOpen(true)
        break
      case 'open_security':
        setIsSecurityModalOpen(true)
        break
      case 'open_vault':
        setIsVaultModalOpen(true)
        break
      case 'open_documents':
        setIsDocumentsModalOpen(true)
        break
      case 'open_plugins':
        setIsSkillStoreOpen(true)
        break
      case 'open_project':
        setIsProjectIntelOpen(true)
        break
      case 'open_windows':
        setIsWindowsModalOpen(true)
        break
      case 'open_productivity':
        setIsProductivityOpen(true)
        break
      case 'open_debugger':
        setIsDebuggerOpen(true)
        break
      case 'open_repair':
        setIsSafeRepairModalOpen(true)
        break
      case 'open_settings':
        setIsSettingsFlyoutOpen(true)
        break
      case 'forget_screen':
        ;(window as any).ultron?.screen?.forgetContext?.()
        break
      case 'undo_action':
        ;(window as any).ultron?.recovery?.undoRecentAction?.()
        break
      default:
        break
    }
  }

  const {
    addMessage,
    updateStreamingChunk,
    finalizeMessage,
    setErrorMessage,
    setOrbState
  } = useChatStore()
  const loadSettings = useSettingsStore((s) => s.loadSettings)

  const [providerStatus, setProviderStatus] = React.useState<{
    statusLabel: string
    modelName: string
    online: boolean
    mode: string
  }>({
    statusLabel: 'ONLINE — NVIDIA',
    modelName: 'google/gemini-3.8-flash',
    online: true,
    mode: 'AUTO'
  })

  const refreshProviderStatus = async () => {
    const ultron = (window as any).ultron
    if (ultron?.provider?.getStatus) {
      try {
        const s = await ultron.provider.getStatus()
        if (s) setProviderStatus(s)
      } catch {}
    }
  }

  // Initialize electron IPC listeners
  useEffect(() => {
    loadSettings()
    refreshProviderStatus()

    const interval = setInterval(refreshProviderStatus, 5000)

    const ultron = (window as any).ultron
    if (!ultron?.chat) return () => clearInterval(interval)

    const unsubChunk = ultron.chat.onChunk(({ id, chunk }: { id: string; chunk: string }) => {
      updateStreamingChunk(id, chunk)
    })

    const unsubDone = ultron.chat.onDone(({ id, confirmationCard, timeline }: { id: string; confirmationCard?: any; timeline?: any }) => {
      finalizeMessage(id, confirmationCard, timeline)
    })

    const unsubError = ultron.chat.onError(({ id, error }: { id: string; error: string }) => {
      setErrorMessage(id, error)
    })

    const unsubState = ultron.chat.onStateChange((state: any) => {
      setOrbState(state)
    })

    const unsubTasks = ultron.chat.onTasksUpdate?.((tasks: any) => {
      useUIStore.getState().setTasks(tasks)
    })

    const unsubMetrics = ultron.chat.onMetricsUpdate?.((metrics: any) => {
      useUIStore.getState().setPerformanceMetrics(metrics)
    })

    return () => {
      unsubChunk?.()
      unsubDone?.()
      unsubError?.()
      unsubState?.()
      unsubTasks?.()
      unsubMetrics?.()
    }
  }, [])

  const handleSendMessage = async (text: string) => {
    // Add user message
    const userMsg = {
      id: uuidv4(),
      role: 'user' as const,
      content: text,
      timestamp: Date.now()
    }
    addMessage(userMsg)

    // Add empty assistant streaming placeholder
    const asstId = uuidv4()
    const asstMsg = {
      id: asstId,
      role: 'assistant' as const,
      content: '',
      timestamp: Date.now(),
      streaming: true
    }
    addMessage(asstMsg)

    // Send to Electron Main IPC
    const ultron = (window as any).ultron
    if (ultron?.chat?.send) {
      try {
        const res = await ultron.chat.send(text, asstId)
        if (res && res.success === false) {
          setErrorMessage(asstId, res.error || 'Failed to send message to AI engine')
        }
      } catch (err: any) {
        setErrorMessage(asstId, err.message || 'IPC communication error')
      }
    } else {
      setErrorMessage(asstId, 'ULTRON Electron context bridge is not ready')
    }
  }

  const handleWindowControl = (action: 'minimize' | 'maximize' | 'close') => {
    const ultron = (window as any).ultron
    if (ultron?.window?.[action]) {
      ultron.window[action]()
    }
  }

  return (
    <div className="app-layout v103-layout">
      {/* 1. Slide-out Navigation Drawer */}
      <SlideOutMenu
        isOpen={isSlideMenuOpen}
        onClose={() => setIsSlideMenuOpen(false)}
        onOpenSettings={(tab?: string) => {
          setIsSlideMenuOpen(false)
          setSettingsInitialTab((tab as SettingsTabId) || 'ai')
          setIsSettingsFlyoutOpen(true)
        }}
        onOpenMemory={() => {
          setIsSlideMenuOpen(false)
          setIsMemoryFlyoutOpen(true)
        }}
        onOpenPhone={() => {
          setIsSlideMenuOpen(false)
          setIsPhoneModalOpen(true)
        }}
        onOpenSkills={() => {
          setIsSlideMenuOpen(false)
          setIsSkillsModalOpen(true)
        }}
        onOpenDeveloper={() => {
          setIsSlideMenuOpen(false)
          setIsDeveloperModalOpen(true)
        }}
        onOpenPermissions={() => {
          setIsSlideMenuOpen(false)
          setSettingsInitialTab('permissions')
          setIsSettingsFlyoutOpen(true)
        }}
        onOpenAbout={() => {
          setIsSlideMenuOpen(false)
          setSettingsInitialTab('about')
          setIsSettingsFlyoutOpen(true)
        }}
        onOpenSearch={() => {
          setIsSlideMenuOpen(false)
          setIsUniversalSearchOpen(true)
        }}
        onOpenDiagnostics={() => {
          setIsSlideMenuOpen(false)
          setIsDiagnosticsModalOpen(true)
        }}
        onOpenTasks={() => {
          setIsSlideMenuOpen(false)
          setIsTaskCenterOpen(true)
        }}
        onOpenMissions={() => {
          setIsSlideMenuOpen(false)
          setIsMissionsModalOpen(true)
        }}
        onOpenHistory={() => {
          setIsSlideMenuOpen(false)
          setIsTaskHistoryModalOpen(true)
        }}
        onOpenDocuments={() => {
          setIsSlideMenuOpen(false)
          setIsDocumentsModalOpen(true)
        }}
        onOpenSecurity={() => {
          setIsSlideMenuOpen(false)
          setIsSecurityModalOpen(true)
        }}
        onOpenSafeRepair={() => {
          setIsSlideMenuOpen(false)
          setIsSafeRepairModalOpen(true)
        }}
        onOpenPreferences={() => {
          setIsSlideMenuOpen(false)
          setIsPreferencesModalOpen(true)
        }}
        onOpenGoals={() => {
          setIsSlideMenuOpen(false)
          setIsGoalsModalOpen(true)
        }}
        onOpenVault={() => {
          setIsSlideMenuOpen(false)
          setIsVaultModalOpen(true)
        }}
        onOpenSkillStore={() => {
          setIsSlideMenuOpen(false)
          setIsSkillStoreOpen(true)
        }}
        onOpenProjectIntel={() => {
          setIsSlideMenuOpen(false)
          setIsProjectIntelOpen(true)
        }}
        onOpenWindows={() => {
          setIsSlideMenuOpen(false)
          setIsWindowsModalOpen(true)
        }}
        onOpenProductivity={() => {
          setIsSlideMenuOpen(false)
          setIsProductivityOpen(true)
        }}
        onOpenDebugger={() => {
          setIsSlideMenuOpen(false)
          setIsDebuggerOpen(true)
        }}
        onOpenImportExport={() => {
          setIsSlideMenuOpen(false)
          setIsImportExportOpen(true)
        }}
      />


      {/* 2. Top Titlebar */}
      <header className="titlebar titlebar-v103">
        {/* Left: Hamburger + Logo + Version */}
        <div className="titlebar-left">
          <button
            className="hamburger-menu-btn"
            onClick={() => setIsSlideMenuOpen(true)}
            title="Open Menu"
            aria-label="Toggle navigation menu"
          >
            <Menu size={16} />
          </button>

          <div className="ultron-brand-logo">
            <span className="brand-dot" />
            <span className="brand-text">ULTRON</span>
          </div>

          <span className="version-pill">v1.0.6</span>

          <div className="titlebar-system-name">
            | ULTRON AI COMMAND CENTER
          </div>
        </div>

        {/* Center: Smart Workspace Bar */}
        <div className="titlebar-center flex items-center justify-center">
          <SmartWorkspaceBar />
        </div>

        {/* Right: Search + Health + Tasks + Connection Status + Settings + Window Controls */}
        <div className="titlebar-right flex items-center gap-2">
          {/* Command Palette trigger pill */}
          <button
            className="quick-action-pill flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all text-xs"
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Command Palette (Ctrl+K)"
          >
            <Command size={12} className="text-cyan-400" />
            <span>Commands</span>
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 px-1 rounded border border-cyan-500/20">
              Ctrl+K
            </span>
          </button>

          {/* Diagnostics Health trigger pill */}
          <button
            className="quick-action-pill flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all text-xs"
            onClick={() => setIsDiagnosticsModalOpen(true)}
            title="System Self-Diagnostics"
          >
            <HeartPulse size={12} className="text-cyan-400" />
            <span>Health</span>
          </button>

          {/* Missions trigger pill */}
          <button
            className="quick-action-pill flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all text-xs"
            onClick={() => setIsMissionsModalOpen(true)}
            title="Agent Missions"
          >
            <Compass size={12} className="text-cyan-400" />
            <span>Missions</span>
          </button>

          {/* Task History trigger pill */}
          <button
            className="quick-action-pill flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all text-xs"
            onClick={() => setIsTaskHistoryModalOpen(true)}
            title="Task History Audit"
          >
            <History size={12} className="text-cyan-400" />
            <span>History</span>
          </button>

          {/* Background Task trigger pill */}
          <button
            className="quick-action-pill flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all text-xs"
            onClick={() => setIsTaskCenterOpen(true)}
            title="Background Task Engine"
          >
            <ListTodo size={12} className="text-cyan-400" />
            <span>Tasks</span>
          </button>

          <div className={`titlebar-connection-badge ${providerStatus.online ? 'online' : 'offline'}`}>
            <span className="connection-dot" />
            <span>{providerStatus.online ? 'Online' : 'Offline'}</span>
          </div>

          <button
            className="quick-action-pill settings-btn"
            onClick={() => setIsSettingsFlyoutOpen(true)}
            title="Open Settings"
            aria-label="Settings"
          >
            <Settings size={13} />
            <span>Settings</span>
          </button>

          <div className="titlebar-controls">
            <button
              className="titlebar-btn minimize"
              onClick={() => handleWindowControl('minimize')}
              title="Minimize"
              aria-label="Minimize"
            />
            <button
              className="titlebar-btn maximize"
              onClick={() => handleWindowControl('maximize')}
              title="Maximize"
              aria-label="Maximize"
            />
            <button
              className="titlebar-btn close"
              onClick={() => handleWindowControl('close')}
              title="Close"
              aria-label="Close"
            />
          </div>
        </div>
      </header>

      {/* 3. Center Main Stage: Full Chat & 3D Neural Environment */}
      <main className="center-stage-v103">
        {/* Central 3D Neural Particle Sphere */}
        <UltronCore mode="full" className="ultron-bg-canvas" />

        {/* Floating Chat Container */}
        <div className="chat-viewport-wrapper">
          <ChatPanel onSendMessage={handleSendMessage} />
        </div>
      </main>

      {/* 4. Right Status & Telemetry Panel (25-30% Width) */}
      <RightPanel />

      {/* 5. Flyout Panels: Settings Drawer */}
      {isSettingsFlyoutOpen && (
        <div className="flyout-overlay" onClick={() => setIsSettingsFlyoutOpen(false)}>
          <div className="flyout-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="flyout-header">
              <div className="flyout-title-group">
                <span className="flyout-tag">SYSTEM CONFIGURATION</span>
                <h2 className="flyout-title">SETTINGS</h2>
              </div>
              <button
                className="flyout-close-btn"
                onClick={() => setIsSettingsFlyoutOpen(false)}
                title="Close settings"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flyout-body custom-scrollbar">
              <SettingsPanel initialTab={settingsInitialTab} />
            </div>
          </div>
        </div>
      )}

      {/* 6. Flyout Panels: Memory Inspector Drawer */}
      {isMemoryFlyoutOpen && (
        <div className="flyout-overlay" onClick={() => setIsMemoryFlyoutOpen(false)}>
          <div className="flyout-drawer large-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="flyout-header">
              <div className="flyout-title-group">
                <span className="flyout-tag">NEURAL DATABASE</span>
                <h2 className="flyout-title">MEMORY INSPECTOR</h2>
              </div>
              <button
                className="flyout-close-btn"
                onClick={() => setIsMemoryFlyoutOpen(false)}
                title="Close memory"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flyout-body custom-scrollbar">
              <MemoryInspector />
            </div>
          </div>
        </div>
      )}

      {/* 7. Startup / Security Modals */}
      <ApiKeyStartupModal
        isOpen={isApiKeyStartupOpen}
        onClose={() => setIsApiKeyStartupOpen(false)}
        onComplete={async () => {
          setIsApiKeyStartupOpen(false)
          await refreshProviderStatus()
        }}
      />

      <PhoneSecurityModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
      />

      {/* 8. Developer Mode Modal */}
      <DeveloperModal
        isOpen={isDeveloperModalOpen}
        onClose={() => setIsDeveloperModalOpen(false)}
      />

      {/* 9. Skills Architecture Modal */}
      <SkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
      />

      {/* 10. V1.0.4 Modals & Drawers */}
      <UniversalSearchModal
        isOpen={isUniversalSearchOpen}
        onClose={() => setIsUniversalSearchOpen(false)}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsModalOpen}
        onClose={() => setIsDiagnosticsModalOpen(false)}
      />

      <TaskCenterDrawer
        isOpen={isTaskCenterOpen}
        onClose={() => setIsTaskCenterOpen(false)}
      />

      {/* 11. V1.0.5 Agent System Modals & Overlays */}
      <MissionsModal
        isOpen={isMissionsModalOpen}
        onClose={() => setIsMissionsModalOpen(false)}
      />

      <ActionPreviewModal />

      <TaskHistoryModal
        isOpen={isTaskHistoryModalOpen}
        onClose={() => setIsTaskHistoryModalOpen(false)}
      />

      <DocumentsModal
        isOpen={isDocumentsModalOpen}
        onClose={() => setIsDocumentsModalOpen(false)}
      />

      <SecurityCenterModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <SafeRepairModal
        isOpen={isSafeRepairModalOpen}
        onClose={() => setIsSafeRepairModalOpen(false)}
      />

      <PreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
      />

      {/* 12. V1.0.6 Intelligent Agent Core Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onAction={handlePaletteAction}
      />

      <GoalMemoryModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
      />

      <CredentialVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />

      <SkillStoreModal
        isOpen={isSkillStoreOpen}
        onClose={() => setIsSkillStoreOpen(false)}
      />

      <ProjectIntelligenceModal
        isOpen={isProjectIntelOpen}
        onClose={() => setIsProjectIntelOpen(false)}
      />

      <AgentDebuggerModal
        isOpen={isDebuggerOpen}
        onClose={() => setIsDebuggerOpen(false)}
      />

      <ProductivityModal
        isOpen={isProductivityOpen}
        onClose={() => setIsProductivityOpen(false)}
      />

      <WindowWorkspaceModal
        isOpen={isWindowsModalOpen}
        onClose={() => setIsWindowsModalOpen(false)}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
      />

      <NotificationToastContainer />
    </div>
  )
}