import React, { useEffect, useState } from 'react'
import { Sidebar } from './components/sidebar/Sidebar'
import { UltronCore } from './components/core3d/UltronCore'
import { ChatPanel } from './components/chat/ChatPanel'
import { RightPanel } from './components/status/RightPanel'
import { QuickBar } from './components/quickbar/QuickBar'
import { SettingsPanel } from './components/settings/SettingsPanel'
import { MemoryInspector } from './components/memory/MemoryInspector'
import { ApiKeyStartupModal } from './components/onboarding/ApiKeyStartupModal'
import { PhoneSecurityModal } from './components/phone/PhoneSecurityModal'
import { Lock, Sparkles } from 'lucide-react'
import { useUIStore } from './stores/uiStore'
import { useChatStore } from './stores/chatStore'
import { useSettingsStore } from './stores/settingsStore'
import { v4 as uuidv4 } from 'uuid'

export default function App() {
  const currentPage = useUIStore((s) => s.currentPage)
  // Requirement: API Key Prompt appears on EVERY launch
  const [isApiKeyStartupOpen, setIsApiKeyStartupOpen] = useState(true)
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false)
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
    modelName: 'meta/llama-3.2-11b-vision-instruct',
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
    <div className="app-layout">
      {/* Titlebar */}
      <header className="titlebar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', WebkitAppRegion: 'drag' as any }}>
          <span className="status-dot" style={{ width: '8px', height: '8px' }} />
          <span className="titlebar-title">ULTRON COMMAND CENTER</span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(0, 212, 255, 0.15)',
              color: '#00d4ff',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              marginLeft: '4px'
            }}
          >
            v1.0.2
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', marginLeft: '6px' }}>
            UPAI Technologies
          </span>
        </div>

        {/* Center Quick Access Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', WebkitAppRegion: 'no-drag' as any }}>
          <button
            onClick={() => setIsPhoneModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              borderRadius: '5px',
              background: 'rgba(0, 212, 255, 0.08)',
              border: '1px solid rgba(0, 212, 255, 0.25)',
              color: '#00d4ff',
              fontSize: '11px',
              cursor: 'pointer'
            }}
            title="Open Phone Security & Unlock"
          >
            <Lock size={11} />
            <span>Phone Security</span>
          </button>

          <button
            onClick={() => setIsOnboardingOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 9px',
              borderRadius: '5px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.85)',
              fontSize: '11px',
              cursor: 'pointer'
            }}
            title="Configure AI Neural Core"
          >
            <Sparkles size={11} color="#00d4ff" />
            <span>AI Core Setup</span>
          </button>
        </div>

        <div className="titlebar-controls" style={{ WebkitAppRegion: 'no-drag' as any }}>
          <button className="titlebar-btn minimize" onClick={() => handleWindowControl('minimize')} />
          <button className="titlebar-btn maximize" onClick={() => handleWindowControl('maximize')} />
          <button className="titlebar-btn close" onClick={() => handleWindowControl('close')} />
        </div>
      </header>

      {/* Left Sidebar */}
      <Sidebar />

      {/* Center Main Stage */}
      <main className="center-panel">
        <div className="status-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="status-dot"
              style={{
                backgroundColor: providerStatus.statusLabel.includes('ONLINE — NVIDIA')
                  ? '#00e676'
                  : providerStatus.statusLabel.includes('Local Model')
                  ? '#00d4ff'
                  : providerStatus.statusLabel.includes('OFFLINE')
                  ? '#f59e0b'
                  : '#ef4444'
              }}
            />
            <span style={{ fontWeight: 600, fontSize: '12px', letterSpacing: '0.3px' }}>
              {providerStatus.statusLabel}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>•</span>
            <span style={{ color: '#00d4ff', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
              {providerStatus.modelName}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span className="badge-pill" style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(255,255,255,0.06)' }}>
              MODE: {providerStatus.mode || 'AUTO'}
            </span>
            <span>Active Security Core</span>
          </div>
        </div>

        {currentPage === 'home' || currentPage === 'ai' ? (
          <>
            <UltronCore />
            <ChatPanel onSendMessage={handleSendMessage} />
          </>
        ) : currentPage === 'settings' ? (
          <SettingsPanel />
        ) : currentPage === 'memory' ? (
          <MemoryInspector />
        ) : (
          <div style={{ padding: '24px', overflowY: 'auto' }}>
            <h2 style={{ color: '#00d4ff', marginBottom: '12px', textTransform: 'capitalize' }}>
              {currentPage.replace('-', ' ')}
            </h2>
            <div className="panel-card">
              <div className="panel-card-title">Module Status</div>
              <p style={{ color: '#9aa0a8', fontSize: '13px' }}>
                {currentPage.replace('-', ' ')} module active and connected to ULTRON command chain.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Quick Action Bar (Bottom of Center) */}
      <QuickBar onAction={handleSendMessage} />

      {/* Right Telemetry & Status Panel */}
      <RightPanel />

      {/* Modals */}
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