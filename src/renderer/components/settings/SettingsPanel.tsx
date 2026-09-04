import React, { useState, useEffect } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { Key, Shield, Bot, Volume2, Smartphone, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react'

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

  useEffect(() => {
    loadSettings()
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

      {/* About ULTRON & Production Release */}
      <div className="panel-card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#00d4ff' }}>
          <Shield size={18} />
          <span style={{ fontWeight: 600 }}>About ULTRON</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '4px 0' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.08em' }}>
            ULTRON
          </span>
          <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>
            Personal AI Command Center
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '4px',
              background: 'rgba(0, 212, 255, 0.15)',
              color: '#00d4ff',
              border: '1px solid rgba(0, 212, 255, 0.3)'
            }}>
              v1.0.0
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '3px 10px',
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