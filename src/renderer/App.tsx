import React, { useEffect, useState } from 'react'
import { SlideOutMenu } from './components/nav/SlideOutMenu'
import { UltronCore } from './components/core3d/UltronCore'
import { ChatPanel } from './components/chat/ChatPanel'
import { RightPanel } from './components/status/RightPanel'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { MemoryInspector } from './components/memory/MemoryInspector'
import { ApiKeyStartupModal } from './components/onboarding/ApiKeyStartupModal'
import { PhoneSecurityModal } from './components/phone/PhoneSecurityModal'
import { Menu, Settings, X } from 'lucide-react'
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

    const unsubDone = ultron.chat.onDone(({ id, confirmationCard }: { id: string; confirmationCard?: any }) => {
      finalizeMessage(id, confirmationCard)
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
    <div className="app-layout v104-layout">
      {/* 1. Slide-out Navigation Drawer */}
      <SlideOutMenu
        isOpen={isSlideMenuOpen}
        onClose={() => setIsSlideMenuOpen(false)}
        onOpenSettings={() => {
          setIsSlideMenuOpen(false)
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
      />

      {/* 2. Top Titlebar */}
      <header className="titlebar titlebar-v104">
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

          <span className="version-pill">v1.0.4</span>

          <div className="titlebar-system-name">
            | ULTRON AI COMMAND CENTER
          </div>
        </div>

        {/* Center: Clean & Uncluttered */}
        <div className="titlebar-center" />

        {/* Right: Connection Status + Settings + Window Controls */}
        <div className="titlebar-right">
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
      <main className="center-stage-v104">
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
              <SettingsPanel />
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
    </div>
  )
}