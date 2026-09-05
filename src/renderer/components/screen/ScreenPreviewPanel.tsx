// src/renderer/components/screen/ScreenPreviewPanel.tsx — Compact Live Screen Preview Panel
import React, { useEffect, useState, useRef } from 'react'
import { ScreenSource } from '../../../shared/types'
import { Monitor, Square, Eye, ShieldCheck } from 'lucide-react'

interface ScreenPreviewPanelProps {
  source: ScreenSource
  onStopSharing: () => void
  onAskAboutScreen?: () => void
}

export function ScreenPreviewPanel({
  source,
  onStopSharing,
  onAskAboutScreen
}: ScreenPreviewPanelProps) {
  const [frameDataUrl, setFrameDataUrl] = useState<string | null>(source.thumbnail || null)
  const [isSampling, setIsSampling] = useState(false)
  const isMountedRef = useRef(true)

  // Periodic controlled frame sampling (every 3 seconds, lightweight thumbnail preview)
  useEffect(() => {
    isMountedRef.current = true
    const ultron = (window as any).ultron

    const sampleFrame = async () => {
      if (!ultron?.screen?.captureFrame || !isMountedRef.current) return
      try {
        setIsSampling(true)
        const res = await ultron.screen.captureFrame(source.id)
        if (isMountedRef.current && res?.success && res.dataUrl) {
          setFrameDataUrl(res.dataUrl)
        }
      } catch (e) {
        console.warn('[ScreenPreview] Frame capture error:', e)
      } finally {
        if (isMountedRef.current) setIsSampling(false)
      }
    }

    // Initial capture
    sampleFrame()

    // 3s interval for preview freshness without choking the main process or GPU
    const interval = setInterval(sampleFrame, 3000)

    return () => {
      isMountedRef.current = false
      clearInterval(interval)
    }
  }, [source.id])

  return (
    <div className="screen-preview-card animate-slideUp">
      {/* Header with active pulse */}
      <div className="screen-preview-header">
        <div className="screen-active-badge">
          <span className="screen-active-dot animate-pulse" />
          <span className="screen-active-text">SCREEN SHARING ACTIVE</span>
        </div>
        <div className="screen-source-name" title={source.name}>
          {source.name.length > 20 ? `${source.name.slice(0, 18)}…` : source.name}
        </div>
      </div>

      {/* Live Preview Viewport */}
      <div className="screen-preview-viewport">
        {frameDataUrl ? (
          <img
            src={frameDataUrl}
            alt="Live Screen Preview"
            className="screen-preview-image"
          />
        ) : (
          <div className="screen-preview-placeholder">
            <Monitor size={28} color="#00d4ff" />
            <span>Establishing live stream…</span>
          </div>
        )}

        {isSampling && <div className="screen-sampling-indicator" />}
      </div>

      {/* Compact Controls */}
      <div className="screen-preview-controls">
        {onAskAboutScreen && (
          <button
            type="button"
            className="screen-ask-btn"
            onClick={onAskAboutScreen}
            title="Ask ULTRON to inspect visible screen"
          >
            <Eye size={12} />
            <span>Inspect Screen</span>
          </button>
        )}

        <button
          type="button"
          className="screen-stop-btn"
          onClick={onStopSharing}
          title="Stop screen sharing and release stream"
        >
          <Square size={11} fill="currentColor" />
          <span>Stop Sharing</span>
        </button>
      </div>

      {/* Privacy Guarantee Note */}
      <div className="screen-preview-footer">
        <ShieldCheck size={11} color="#00e676" />
        <span>Local capture only • No cloud broadcast</span>
      </div>
    </div>
  )
}
