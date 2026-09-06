import React, { useState, useEffect } from 'react'
import { WindowInfo, WindowWorkspacePreset } from '../../../shared/types'

interface WindowWorkspaceModalProps {
  isOpen: boolean
  onClose: () => void
}

export const WindowWorkspaceModal: React.FC<WindowWorkspaceModalProps> = ({ isOpen, onClose }) => {
  const [windows, setWindows] = useState<WindowInfo[]>([])
  const [presets, setPresets] = useState<WindowWorkspacePreset[]>([])

  const loadData = async () => {
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.windows?.list) {
        const list = await bridge.windows.list()
        setWindows(list || [])
      }
      if (bridge?.windows?.listPresets) {
        const p = await bridge.windows.listPresets()
        setPresets(p || [])
      }
    } catch (err) {
      console.warn('Failed to load window data:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const handleFocus = async (appName: string) => {
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.windows?.focus) {
        await bridge.windows.focus(appName)
      }
    } catch (err) {
      console.warn('Failed to focus window:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-3xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🪟</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Window & Workspace Manager</h2>
              <p className="text-[11px] text-gray-400">Controlled desktop focus, layout presets, and arrangement</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Active Windows */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono text-cyan-400 uppercase">Running Applications ({windows.length})</h3>
            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {windows.map((w) => (
                <div key={w.handle} className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-white truncate">{w.title || w.processName}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{w.processName}</div>
                  </div>
                  <button
                    onClick={() => handleFocus(w.processName)}
                    className="bg-white/10 hover:bg-cyan-500 hover:text-black text-xs text-white px-2.5 py-1 rounded transition-colors"
                  >
                    Focus
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-xs font-mono text-cyan-400 uppercase">Workspace Layout Presets</h3>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => (
                <div key={preset.id} className="bg-black/40 border border-white/10 rounded-xl p-3">
                  <div className="text-xs font-bold text-white">{preset.name}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{preset.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
