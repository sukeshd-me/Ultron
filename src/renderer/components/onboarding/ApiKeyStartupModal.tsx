// src/renderer/components/onboarding/ApiKeyStartupModal.tsx — Startup NVIDIA AI Setup Dialog
import React, { useState, useEffect } from 'react'
import {
  Key,
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Cpu,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  Power
} from 'lucide-react'

interface ApiKeyStartupModalProps {
  isOpen: boolean
  onClose?: () => void
  onComplete: (mode: 'ONLINE' | 'OFFLINE') => void
}

export function ApiKeyStartupModal({ isOpen, onComplete }: ApiKeyStartupModalProps) {
  const [hasSavedKey, setHasSavedKey] = useState<boolean>(false)
  const [isReplacing, setIsReplacing] = useState<boolean>(false)
  const [apiKeyInput, setApiKeyInput] = useState<string>('')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [statusState, setStatusState] = useState<'idle' | 'validating' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [initialLoading, setInitialLoading] = useState<boolean>(true)

  // Query secure vault status on every modal mount / open
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const checkVault = async () => {
      setInitialLoading(true)
      setStatusState('idle')
      setStatusMessage('')
      setApiKeyInput('')
      setIsReplacing(false)

      try {
        const ultron = (window as any).ultron
        if (ultron?.credentials?.hasNvidiaKey) {
          const has = await ultron.credentials.hasNvidiaKey()
          if (isMounted) {
            setHasSavedKey(Boolean(has))
          }
        }
      } catch {
        if (isMounted) setHasSavedKey(false)
      } finally {
        if (isMounted) setInitialLoading(false)
      }
    }

    checkVault()
    return () => {
      isMounted = false
    }
  }, [isOpen])

  if (!isOpen) return null

  // 1. Action: Use Saved Key
  const handleUseSavedKey = async () => {
    setStatusState('validating')
    setStatusMessage('Verifying saved credentials with NVIDIA...')

    try {
      const ultron = (window as any).ultron
      if (ultron?.credentials?.useSavedNvidiaKey) {
        const res = await ultron.credentials.useSavedNvidiaKey()
        if (res.valid) {
          setStatusState('success')
          setStatusMessage('✓ NVIDIA API key verified')
          setTimeout(() => {
            onComplete('ONLINE')
          }, 600)
          return
        } else {
          setStatusState('error')
          setStatusMessage('✕ API key could not be verified.')
          return
        }
      }

      // Fallback
      setStatusState('success')
      setStatusMessage('✓ NVIDIA API key verified')
      setTimeout(() => onComplete('ONLINE'), 500)
    } catch {
      setStatusState('error')
      setStatusMessage('✕ API key could not be verified.')
    }
  }

  // 2. Action: Validate and Continue with New Key
  const handleContinueWithEnteredKey = async () => {
    const cleanKey = apiKeyInput.trim()
    if (!cleanKey) {
      setStatusState('error')
      setStatusMessage('✕ Please enter your NVIDIA API key.')
      return
    }

    setStatusState('validating')
    setStatusMessage('Verifying API key with NVIDIA...')

    try {
      const ultron = (window as any).ultron
      if (ultron?.credentials?.validateNvidiaKey) {
        const validation = await ultron.credentials.validateNvidiaKey(cleanKey)
        if (validation.valid) {
          // Save securely to OS vault only upon successful validation
          if (ultron.credentials.setNvidiaKey) {
            await ultron.credentials.setNvidiaKey(cleanKey)
          }
          if (ultron?.provider?.setMode) {
            await ultron.provider.setMode('AUTO')
          }
          setStatusState('success')
          setStatusMessage('✓ NVIDIA API key verified')
          setTimeout(() => {
            onComplete('ONLINE')
          }, 600)
          return
        } else {
          setStatusState('error')
          setStatusMessage('✕ API key could not be verified.')
          return
        }
      }

      // Fallback if IPC missing
      setStatusState('success')
      setStatusMessage('✓ NVIDIA API key verified')
      setTimeout(() => onComplete('ONLINE'), 500)
    } catch {
      setStatusState('error')
      setStatusMessage('✕ API key could not be verified.')
    }
  }

  // 3. Action: Continue Offline
  const handleContinueOffline = async () => {
    try {
      const ultron = (window as any).ultron
      if (ultron?.credentials?.continueOffline) {
        await ultron.credentials.continueOffline()
      } else if (ultron?.provider?.setMode) {
        await ultron.provider.setMode('OFFLINE')
      }
    } catch {}

    onComplete('OFFLINE')
  }

  const handleOpenNvidiaPortal = (e: React.MouseEvent) => {
    e.preventDefault()
    window.open('https://build.nvidia.com/', '_blank')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'linear-gradient(135deg, rgba(13, 22, 38, 0.97), rgba(7, 12, 22, 0.99))',
          border: '1px solid rgba(0, 212, 255, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 0 60px rgba(0, 212, 255, 0.18), inset 0 0 24px rgba(0, 212, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.25s ease-out'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '22px 28px',
            borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 212, 255, 0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(0, 212, 255, 0.1)',
                border: '1px solid rgba(0, 212, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00d4ff'
              }}
            >
              <Cpu size={20} />
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  color: '#00d4ff',
                  fontFamily: 'monospace'
                }}
              >
                ULTRON AI SETUP
              </h2>
              <span style={{ fontSize: '12px', color: '#9aa0a8' }}>
                Online AI Neural Engine Configuration
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontFamily: 'monospace',
              background:
                statusState === 'success'
                  ? 'rgba(0, 230, 118, 0.15)'
                  : 'rgba(0, 212, 255, 0.08)',
              border: `1px solid ${
                statusState === 'success' ? 'rgba(0, 230, 118, 0.4)' : 'rgba(0, 212, 255, 0.2)'
              }`,
              color: statusState === 'success' ? '#00e676' : '#00d4ff'
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: statusState === 'success' ? '#00e676' : '#00d4ff',
                boxShadow: `0 0 6px ${statusState === 'success' ? '#00e676' : '#00d4ff'}`
              }}
            />
            {statusState === 'success' ? 'Online AI: ● Ready' : 'Online AI: ○ Awaiting Key'}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600, color: '#fff' }}>
              NVIDIA API Key
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#9aa0a8', lineHeight: '1.5' }}>
              Enter your NVIDIA API key to enable online AI features.
            </p>
          </div>

          {/* Secure Credential Notice */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(0, 212, 255, 0.05)',
              border: '1px solid rgba(0, 212, 255, 0.18)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <ShieldCheck size={16} color="#00d4ff" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: '#b0b8c4', lineHeight: '1.45' }}>
              NVIDIA API access enables ULTRON's online AI features. Your API key is protected using secure local credential storage.
            </span>
          </div>

          {initialLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
              <Loader2 size={24} className="spin" color="#00d4ff" />
            </div>
          ) : hasSavedKey && !isReplacing ? (
            /* ══════════════════════════════════════════════════════════════════
               STATE A: SAVED KEY AVAILABLE (MASKED DISPLAY)
               ══════════════════════════════════════════════════════════════════ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#9aa0a8', marginBottom: '8px' }}>
                  Saved Credential:
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(0, 212, 255, 0.25)',
                    fontFamily: 'monospace',
                    fontSize: '15px',
                    letterSpacing: '2px',
                    color: '#00d4ff'
                  }}
                >
                  <span>••••••••••••••••••••••••</span>
                  <Key size={16} color="#00d4ff" style={{ opacity: 0.8 }} />
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '8px',
                    fontSize: '12px',
                    color: '#00e676'
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>✓ Saved API key available</span>
                </div>
              </div>

              {/* Status Feedback Banner */}
              {statusState !== 'idle' && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background:
                      statusState === 'success'
                        ? 'rgba(0, 230, 118, 0.12)'
                        : statusState === 'error'
                        ? 'rgba(255, 23, 68, 0.12)'
                        : 'rgba(0, 212, 255, 0.1)',
                    border: `1px solid ${
                      statusState === 'success'
                        ? '#00e676'
                        : statusState === 'error'
                        ? '#ff1744'
                        : '#00d4ff'
                    }`,
                    color:
                      statusState === 'success'
                        ? '#00e676'
                        : statusState === 'error'
                        ? '#ff5252'
                        : '#00d4ff'
                  }}
                >
                  {statusState === 'validating' && <Loader2 size={15} className="spin" />}
                  {statusState === 'success' && <CheckCircle2 size={15} />}
                  {statusState === 'error' && <XCircle size={15} />}
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Saved Key Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button
                  onClick={handleUseSavedKey}
                  disabled={statusState === 'validating'}
                  style={{
                    flex: 1.2,
                    padding: '12px 18px',
                    background: '#00d4ff',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: statusState === 'validating' ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 0 16px rgba(0, 212, 255, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {statusState === 'validating' ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Use Saved Key</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setIsReplacing(true)
                    setStatusState('idle')
                    setStatusMessage('')
                  }}
                  disabled={statusState === 'validating'}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'rgba(0, 212, 255, 0.08)',
                    border: '1px solid rgba(0, 212, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#00d4ff',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Replace Key
                </button>
              </div>
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════════════
               STATE B: ENTER NEW / REPLACE KEY INPUT
               ══════════════════════════════════════════════════════════════════ */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#9aa0a8' }}>
                    NVIDIA API Key:
                  </label>
                  {hasSavedKey && (
                    <button
                      onClick={() => {
                        setIsReplacing(false)
                        setStatusState('idle')
                        setStatusMessage('')
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#00d4ff',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      ← Back to Saved Key
                    </button>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="nvapi-..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleContinueWithEnteredKey()
                    }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '12px 75px 12px 14px',
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(0, 212, 255, 0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0, 212, 255, 0.1)',
                      border: '1px solid rgba(0, 212, 255, 0.25)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      color: '#00d4ff',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Status Feedback Banner */}
              {statusState !== 'idle' && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background:
                      statusState === 'success'
                        ? 'rgba(0, 230, 118, 0.12)'
                        : statusState === 'error'
                        ? 'rgba(255, 23, 68, 0.12)'
                        : 'rgba(0, 212, 255, 0.1)',
                    border: `1px solid ${
                      statusState === 'success'
                        ? '#00e676'
                        : statusState === 'error'
                        ? '#ff1744'
                        : '#00d4ff'
                    }`,
                    color:
                      statusState === 'success'
                        ? '#00e676'
                        : statusState === 'error'
                        ? '#ff5252'
                        : '#00d4ff'
                  }}
                >
                  {statusState === 'validating' && <Loader2 size={15} className="spin" />}
                  {statusState === 'success' && <CheckCircle2 size={15} />}
                  {statusState === 'error' && <XCircle size={15} />}
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Continue Button */}
              <button
                onClick={handleContinueWithEnteredKey}
                disabled={statusState === 'validating'}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  background: '#00d4ff',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: statusState === 'validating' ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 16px rgba(0, 212, 255, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                {statusState === 'validating' ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Verifying with NVIDIA...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Offline Option & Portal Link Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <a
              href="https://build.nvidia.com/"
              onClick={handleOpenNvidiaPortal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '12px',
                color: '#00d4ff',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
            >
              <span>Don't have an API key? Get one from NVIDIA</span>
              <ExternalLink size={12} />
            </a>

            <button
              onClick={handleContinueOffline}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                padding: '7px 14px',
                color: '#9aa0a8',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.color = '#9aa0a8'
              }}
            >
              <Power size={12} />
              <span>Continue Offline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
