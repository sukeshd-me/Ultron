import React, { useState, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { Key, Shield, Bot, Volume2, Smartphone, CheckCircle, XCircle, Loader2, RefreshCw, Lock, Trash2 } from 'lucide-react'

const AVAILABLE_MODELS = [
  { id: 'nvidia/nemotron-3.5-lightning-30b-a3b', label: 'NVIDIA Nemotron 3.5 Lightning (30B - Reasoning)' },
  { id: 'meta/llama-3.2-11b-vision-instruct', label: 'Meta Llama 3.2 (11B - Vision Instruct)' },
  { id: 'meta/llama-3.1-8b-instruct', label: 'Meta Llama 3.1 (8B - Lightweight)' }
]

export function SettingsPanel() {
  const { settings, updateSettings, loadSettings } = useSettingsStore()
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; latencyMs?: number; error?: string } | null>(null)
  
  // Secure Phone PIN Vault state
  const [hasPhonePin, setHasPhonePin] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinFeedback, setPinFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [unlocking, setUnlocking] = useState(false)

  const checkPinStatus = async () => {
    try {
      const ultron = (window as any).ultron
      if (ultron?.credentials?.hasPhonePin) {
        const has = await ultron.credentials.hasPhonePin()
        setHasPhonePin(Boolean(has))
      }
    } catch {}
  }

  useEffect(() => {
    loadSettings()
    checkPinStatus()
  }, [])

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      if ((window as any).ultron?.chat?.setApiKey) {
        (window as any).ultron.chat.setApiKey(apiKeyInput.trim())
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  const handleModelChange = (newModel: string) => {
    updateSettings({
      ai: {
        ...settings.ai,
        model: newModel
      }
    })
  }

  const handleTestConnection = async () => {
    setTestStatus({ loading: true })
    const ultron = (window as any).ultron
    if (ultron?.chat?.testConnection) {
      try {
        const res = await ultron.chat.testConnection()
        if (res.success) {
          setTestStatus({ loading: false, success: true, latencyMs: res.latencyMs })
        } else {
          setTestStatus({ loading: false, success: false, error: res.error })
        }
      } catch (err: any) {
        setTestStatus({ loading: false, success: false, error: err.message })
      }
    } else {
      setTestStatus({ loading: false, success: false, error: 'IPC testConnection not available' })
    }
  }

  const handleSavePin = async () => {
    if (!pinInput.trim()) return
    const ultron = (window as any).ultron
    if (ultron?.credentials?.setPhonePin) {
      const res = await ultron.credentials.setPhonePin(pinInput.trim())
      if (res.success) {
        setPinFeedback({ type: 'success', text: res.message })
        setPinInput('')
        checkPinStatus()
      } else {
        setPinFeedback({ type: 'error', text: res.message })
      }
      setTimeout(() => setPinFeedback(null), 4000)
    }
  }

  const handleClearPin = async () => {
    const ultron = (window as any).ultron
    if (ultron?.credentials?.clearPhonePin) {
      const res = await ultron.credentials.clearPhonePin()
      if (res.success) {
        setPinFeedback({ type: 'success', text: 'Phone PIN removed.' })
        checkPinStatus()
      }
      setTimeout(() => setPinFeedback(null), 3000)
    }
  }

  const handleTestUnlock = async () => {
    setUnlocking(true)
    const ultron = (window as any).ultron
    if (ultron?.credentials?.unlockPhone) {
      try {
        const res = await ultron.credentials.unlockPhone()
        if (res.success) {
          setPinFeedback({ type: 'success', text: res.message || 'Phone unlocked.' })
        } else {
          setPinFeedback({ type: 'error', text: res.message || 'Failed to unlock phone.' })
        }
      } catch (err: any) {
        setPinFeedback({ type: 'error', text: err.message })
      } finally {
        setUnlocking(false)
        setTimeout(() => setPinFeedback(null), 4000)
      }
    } else {
      setUnlocking(false)
    }
  }

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#00d4ff', marginBottom: '20px' }}>
        ULTRON Settings & Configuration
      </h2>

      {/* AI Settings */}
      <div className="panel-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d4ff' }}>
            <Bot size={18} />
            <span style={{ fontWeight: 600 }}>NVIDIA AI Server & Model Configuration</span>
          </div>

          <button
            onClick={handleTestConnection}
            disabled={testStatus?.loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid #00d4ff',
              borderRadius: '6px',
              color: '#00d4ff',
              fontSize: '12px',
              fontWeight: 500,
              cursor: testStatus?.loading ? 'wait' : 'pointer'
            }}
          >
            {testStatus?.loading ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />}
            Test API Server
          </button>
        </div>

        {/* Test Connection Status Banner */}
        {testStatus && !testStatus.loading && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              background: testStatus.success ? 'rgba(0, 230, 118, 0.1)' : 'rgba(255, 23, 68, 0.1)',
              border: `1px solid ${testStatus.success ? '#00e676' : '#ff1744'}`,
              color: testStatus.success ? '#00e676' : '#ff5252'
            }}
          >
            {testStatus.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
            <span>
              {testStatus.success
                ? `API Server Connected Successfully! Latency: ${testStatus.latencyMs}ms (${settings.ai.model})`
                : `API Error: ${testStatus.error}`}
            </span>
          </div>
        )}
        
        {/* API Key Input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#9aa0a8', marginBottom: '6px' }}>
            NVIDIA Cloud API Key (Loaded from environment or enter override)
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="password"
              placeholder="Enter nvapi-..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}
            />
            <button
              onClick={handleSaveApiKey}
              style={{
                padding: '8px 16px',
                background: '#00d4ff',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Save Key
            </button>
          </div>
          {saveSuccess && (
            <span style={{ color: '#00e676', fontSize: '12px', marginTop: '4px', display: 'inline-block' }}>
              ✓ API key updated and active!
            </span>
          )}
        </div>

        {/* Model Selection Dropdown */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#9aa0a8', marginBottom: '6px' }}>
            Active AI Model
          </label>
          <select
            value={settings.ai.model}
            onChange={(e) => handleModelChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#0e111a',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              borderRadius: '6px',
              color: '#00d4ff',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {AVAILABLE_MODELS.map((m) => (
              <option key={m.id} value={m.id} style={{ background: '#0e111a', color: '#fff' }}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="panel-card-row">
          <span className="label">Endpoint</span>
          <span className="value" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
            {settings.ai.endpoint}
          </span>
        </div>
      </div>

      {/* Voice & TTS */}
      <div className="panel-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#00d4ff' }}>
          <Volume2 size={18} />
          <span style={{ fontWeight: 600 }}>Voice & Robotic TTS</span>
        </div>
        <div className="panel-card-row">
          <span className="label">Text-to-Speech</span>
          <span className="value">{settings.tts.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
        <div className="panel-card-row">
          <span className="label">Push to Talk</span>
          <span className="value">{settings.voice.pushToTalk ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>

      {/* Android & ADB */}
      <div className="panel-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#00d4ff' }}>
          <Smartphone size={18} />
          <span style={{ fontWeight: 600 }}>Android ADB Toolchain</span>
        </div>
        <div className="panel-card-row">
          <span className="label">ADB Executable</span>
          <span className="value" style={{ fontFamily: 'monospace' }}>{settings.adb.executablePath}</span>
        </div>
      </div>

      {/* Phone Security & Zero-Leakage Credential Vault */}
      <div className="panel-card" style={{ marginBottom: '16px', border: '1px solid rgba(0, 212, 255, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d4ff' }}>
            <Lock size={18} />
            <span style={{ fontWeight: 600 }}>Phone Unlock PIN & Security Vault</span>
          </div>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: hasPhonePin ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: hasPhonePin ? '#10b981' : '#f87171',
            border: `1px solid ${hasPhonePin ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {hasPhonePin ? 'Vaulted & Encrypted (DPAPI)' : 'No PIN Configured'}
          </span>
        </div>

        <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)', marginBottom: '12px', lineHeight: 1.5 }}>
          ULTRON protects sensitive phone credentials using OS hardware-backed encryption (DPAPI).
          Your PIN is <strong>never stored in normal database memory</strong>, never written to log files, and never transmitted to AI models.
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="password"
            maxLength={8}
            placeholder={hasPhonePin ? "•••• (Enter new PIN to replace)" : "Enter 4-8 digit phone PIN"}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '14px',
              letterSpacing: '0.2em'
            }}
          />
          <button
            onClick={handleSavePin}
            disabled={!pinInput.trim()}
            className="action-btn"
            style={{
              padding: '8px 16px',
              background: 'rgba(0, 212, 255, 0.2)',
              border: '1px solid rgba(0, 212, 255, 0.4)',
              borderRadius: '6px',
              color: '#00d4ff',
              cursor: pinInput.trim() ? 'pointer' : 'not-allowed',
              opacity: pinInput.trim() ? 1 : 0.5,
              fontWeight: 600,
              fontSize: '12px'
            }}
          >
            Save PIN
          </button>
          {hasPhonePin && (
            <button
              onClick={handleClearPin}
              title="Remove vaulted PIN"
              style={{
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#f87171',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
            Quick Phone Diagnostic
          </span>
          <button
            onClick={handleTestUnlock}
            disabled={unlocking}
            style={{
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              color: '#ffffff',
              cursor: unlocking ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {unlocking ? <Loader2 size={14} className="spin" /> : <Smartphone size={14} />}
            Test Phone Unlock
          </button>
        </div>

        {pinFeedback && (
          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            background: pinFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: pinFeedback.type === 'success' ? '#10b981' : '#f87171',
            border: `1px solid ${pinFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}>
            {pinFeedback.text}
          </div>
        )}
      </div>

      {/* Voice Engine Settings (v1.0.2) */}
      <div className="panel-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '16px' }}>🎤</span>
          <span style={{ fontWeight: 600 }}>Voice Engine</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#7a8ba5' }}>Local Whisper STT</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            className="settings-action-btn"
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'rgba(0, 212, 255, 0.08)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              color: '#00d4ff',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            onClick={async () => {
              const ultron = (window as any).ultron
              if (ultron?.voice?.warmup) {
                const result = await ultron.voice.warmup()
                alert(result?.success ? `Whisper engine warm — ${result.duration_ms}ms` : 'Whisper engine could not initialize. Check Python and faster-whisper installation.')
              }
            }}
          >
            🔥 Warm Up Engine
          </button>
          <button
            className="settings-action-btn"
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'rgba(40, 40, 75, 0.6)',
              border: '1px solid rgba(100, 100, 140, 0.3)',
              color: '#b0bec5',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            onClick={async () => {
              const ultron = (window as any).ultron
              if (ultron?.voice?.getStatus) {
                const status = await ultron.voice.getStatus()
                alert(`Whisper Status:\nAvailable: ${status?.available}\nReady: ${status?.ready}\nModel: ${status?.model || 'not loaded'}\nEngine: ${status?.engine || 'unknown'}`)
              }
            }}
          >
            📊 Engine Status
          </button>
        </div>

        <p style={{ fontSize: '11px', color: '#6a7b90', margin: '6px 0 0 0' }}>
          Powered by <strong>faster-whisper</strong> (CTranslate2). All voice processing stays local — nothing is sent to the cloud.
        </p>
      </div>

      {/* About ULTRON & Production Release */}
      <div className="panel-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#00d4ff' }}>
          <Shield size={18} />
          <span style={{ fontWeight: 600 }}>About ULTRON</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 0' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.08em' }}>
            ULTRON
          </span>
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 500 }}>
            Personal AI Command Center
          </span>
          <div style={{ marginTop: '4px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>
            Developed by <strong>UPAI Technologies</strong> • Founder: <strong>Sukesh D.</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '4px',
              background: 'rgba(0, 212, 255, 0.15)',
              color: '#00d4ff',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              letterSpacing: '0.05em'
            }}>
              v1.0.2
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '4px 12px',
              borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              Production Release
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}