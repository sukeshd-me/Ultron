// src/renderer/components/phone/PhoneSecurityModal.tsx — Phone Security & Vault Quick Action Modal
import React, { useState, useEffect } from 'react'
import {
  Smartphone,
  Lock,
  Unlock,
  Sun,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  PhoneCall,
  MessageSquare,
  ShieldCheck
} from 'lucide-react'

interface PhoneSecurityModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PhoneSecurityModal({ isOpen, onClose }: PhoneSecurityModalProps) {
  const [hasPin, setHasPin] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [devices, setDevices] = useState<any[]>([])

  const refreshState = async () => {
    const ultron = (window as any).ultron
    if (!ultron) return

    try {
      if (ultron.credentials?.hasPhonePin) {
        const has = await ultron.credentials.hasPhonePin()
        setHasPin(Boolean(has))
      }
      if (ultron.adb?.getDevices) {
        const devs = await ultron.adb.getDevices()
        setDevices(Array.isArray(devs) ? devs : [])
      }
    } catch {}
  }

  useEffect(() => {
    if (isOpen) {
      refreshState()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleUnlock = async () => {
    setActionLoading('unlock')
    setFeedback(null)
    const ultron = (window as any).ultron
    try {
      if (ultron?.credentials?.unlockPhone) {
        const res = await ultron.credentials.unlockPhone(pinInput.trim() || undefined)
        if (res.success) {
          setFeedback({ success: true, text: res.message || 'Phone unlocked.' })
        } else {
          setFeedback({ success: false, text: res.message || 'Failed to unlock phone.' })
        }
      }
    } catch (err: any) {
      setFeedback({ success: false, text: err.message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleWake = async () => {
    setActionLoading('wake')
    setFeedback(null)
    const ultron = (window as any).ultron
    try {
      if (ultron?.adb?.wakeScreen) {
        await ultron.adb.wakeScreen()
        setFeedback({ success: true, text: 'Screen awakened.' })
      }
    } catch (err: any) {
      setFeedback({ success: false, text: err.message })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSavePin = async () => {
    if (!pinInput.trim()) return
    const ultron = (window as any).ultron
    try {
      if (ultron?.credentials?.setPhonePin) {
        const res = await ultron.credentials.setPhonePin(pinInput.trim())
        if (res.success) {
          setFeedback({ success: true, text: res.message })
          setPinInput('')
          refreshState()
        } else {
          setFeedback({ success: false, text: res.message })
        }
      }
    } catch (err: any) {
      setFeedback({ success: false, text: err.message })
    }
  }

  const handleClearPin = async () => {
    const ultron = (window as any).ultron
    try {
      if (ultron?.credentials?.clearPhonePin) {
        await ultron.credentials.clearPhonePin()
        setFeedback({ success: true, text: 'Phone PIN removed from vault.' })
        refreshState()
      }
    } catch (err: any) {
      setFeedback({ success: false, text: err.message })
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 10, 20, 0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        padding: '20px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'linear-gradient(135deg, rgba(14, 23, 40, 0.96), rgba(8, 14, 26, 0.98))',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '14px',
          boxShadow: '0 0 40px rgba(0, 212, 255, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 212, 255, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone size={18} color="#00d4ff" />
            <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.08em', color: '#ffffff' }}>
              PHONE COMMAND & SECURITY VAULT
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Device status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                Connected Device
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginTop: '2px' }}>
                {devices.length > 0
                  ? `${devices[0].manufacturer || ''} ${devices[0].model || devices[0].id || 'Android Device'}`
                  : 'Ready via ADB (USB / Wi-Fi)'}
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: hasPin ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: hasPin ? '#10b981' : '#f87171',
                border: `1px solid ${hasPin ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}
            >
              {hasPin ? 'PIN Vaulted (DPAPI)' : 'No PIN Set'}
            </span>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={handleUnlock}
              disabled={actionLoading !== null}
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(0, 212, 255, 0.12)',
                border: '1px solid rgba(0, 212, 255, 0.35)',
                color: '#00d4ff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              {actionLoading === 'unlock' ? <Loader2 size={16} className="spin" /> : <Unlock size={16} />}
              Unlock Screen
            </button>

            <button
              onClick={handleWake}
              disabled={actionLoading !== null}
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              {actionLoading === 'wake' ? <Loader2 size={16} className="spin" /> : <Sun size={16} />}
              Wake Screen
            </button>
          </div>

          {/* PIN Setup Input */}
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#00d4ff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={13} /> {hasPin ? 'Update Hardware-Vaulted PIN' : 'Save Unlock PIN'}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="password"
                maxLength={8}
                placeholder="4-8 digit numerical PIN"
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
                style={{
                  padding: '8px 14px',
                  background: 'rgba(0, 212, 255, 0.2)',
                  border: '1px solid rgba(0, 212, 255, 0.4)',
                  borderRadius: '6px',
                  color: '#00d4ff',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: pinInput.trim() ? 'pointer' : 'not-allowed',
                  opacity: pinInput.trim() ? 1 : 0.5
                }}
              >
                Save
              </button>
              {hasPin && (
                <button
                  onClick={handleClearPin}
                  title="Remove PIN"
                  style={{
                    padding: '8px 10px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#f87171',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Privacy Note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
            <ShieldCheck size={14} color="#10b981" />
            <span>Zero-Storage Guarantee: Vaulted in OS DPAPI. Never stored in SQLite memory.</span>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: feedback.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: `1px solid ${feedback.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: feedback.success ? '#10b981' : '#f87171'
              }}
            >
              {feedback.success ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              <span>{feedback.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
