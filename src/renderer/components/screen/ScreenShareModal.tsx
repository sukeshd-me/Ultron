// src/renderer/components/screen/ScreenShareModal.tsx — Explicit Source Selector for Screen Sharing
import React, { useEffect, useState } from 'react'
import { ScreenSource } from '../../../shared/types'
import { Monitor, AppWindow, X, Check, ShieldAlert } from 'lucide-react'

interface ScreenShareModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectSource: (source: ScreenSource) => void
}

export function ScreenShareModal({
  isOpen,
  onClose,
  onSelectSource
}: ScreenShareModalProps) {
  const [sources, setSources] = useState<ScreenSource[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'screen' | 'window'>('screen')
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    const ultron = (window as any).ultron
    if (ultron?.screen?.getSources) {
      ultron.screen
        .getSources(['screen', 'window'])
        .then((res: ScreenSource[]) => {
          setSources(res || [])
          if (res && res.length > 0) {
            setSelectedSourceId(res[0].id)
          }
        })
        .catch((err: any) => console.error('[ScreenShare] Error listing sources:', err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredSources = sources.filter((s) =>
    selectedTab === 'screen' ? s.id.startsWith('screen:') : s.id.startsWith('window:')
  )

  const handleConfirm = () => {
    const chosen = sources.find((s) => s.id === selectedSourceId) || filteredSources[0]
    if (chosen) {
      onSelectSource(chosen)
      onClose()
    }
  }

  return (
    <div className="flyout-overlay" onClick={onClose}>
      <div
        className="screen-share-dialog glass-panel animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="screen-dialog-header">
          <div className="screen-dialog-title-group">
            <span className="flyout-tag">LOCAL DISPLAY CAPTURE</span>
            <h3 className="screen-dialog-title">SHARE YOUR SCREEN</h3>
          </div>
          <button className="flyout-close-btn" onClick={onClose} title="Cancel">
            <X size={16} />
          </button>
        </div>

        <div className="screen-privacy-banner">
          <ShieldAlert size={14} color="#00d4ff" />
          <span>
            Screen capture is strictly <strong>local</strong> to your device. No video or
            frames are uploaded to cloud servers without explicit request.
          </span>
        </div>

        {/* Tab selection: Entire Screen vs Application Window */}
        <div className="screen-tabs-row">
          <button
            className={`screen-tab-btn ${selectedTab === 'screen' ? 'active' : ''}`}
            onClick={() => setSelectedTab('screen')}
          >
            <Monitor size={15} />
            <span>Entire Screen</span>
          </button>
          <button
            className={`screen-tab-btn ${selectedTab === 'window' ? 'active' : ''}`}
            onClick={() => setSelectedTab('window')}
          >
            <AppWindow size={15} />
            <span>Window</span>
          </button>
        </div>

        {/* Sources grid */}
        <div className="screen-sources-container custom-scrollbar">
          {loading ? (
            <div className="screen-sources-empty">Scanning display surfaces...</div>
          ) : filteredSources.length === 0 ? (
            <div className="screen-sources-empty">
              No {selectedTab === 'screen' ? 'displays' : 'application windows'} detected.
            </div>
          ) : (
            <div className="screen-sources-grid">
              {filteredSources.map((source) => (
                <div
                  key={source.id}
                  className={`screen-source-card ${
                    selectedSourceId === source.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedSourceId(source.id)}
                >
                  <div className="screen-source-thumb-wrap">
                    {source.thumbnail ? (
                      <img
                        src={source.thumbnail}
                        alt={source.name}
                        className="screen-source-thumbnail"
                      />
                    ) : (
                      <div className="screen-source-fallback-thumb">
                        {selectedTab === 'screen' ? (
                          <Monitor size={32} />
                        ) : (
                          <AppWindow size={32} />
                        )}
                      </div>
                    )}
                    {selectedSourceId === source.id && (
                      <div className="screen-source-check-overlay">
                        <Check size={16} color="#00e676" />
                      </div>
                    )}
                  </div>
                  <span className="screen-source-label" title={source.name}>
                    {source.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal actions */}
        <div className="screen-dialog-footer">
          <button className="screen-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="screen-start-btn"
            onClick={handleConfirm}
            disabled={filteredSources.length === 0}
          >
            Start Sharing
          </button>
        </div>
      </div>
    </div>
  )
}
