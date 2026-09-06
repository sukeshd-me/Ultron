import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, ChevronDown, Check, Zap, Cpu, Flame } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'
import { MODEL_REGISTRY, ModelDefinition, ModelTier } from '../../../shared/models.registry'

// Re-export for any legacy imports
export const CATALOG_MODELS = MODEL_REGISTRY

interface ModelSelectorProps {
  className?: string
  compact?: boolean
}

export function ModelSelectorMorph({ className = '', compact = false }: ModelSelectorProps) {
  return <ModelSelector className={className} compact={compact} />
}

export function ModelSelector({ className = '', compact = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [models, setModels] = useState<ModelDefinition[]>(MODEL_REGISTRY)
  const [connectionStatus, setConnectionStatus] = useState<string>('Checking')
  const { settings, updateSettings } = useSettingsStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const ultron = (window as any).ultron

  // Load models from central authoritative registry via IPC
  useEffect(() => {
    let mounted = true
    if (ultron?.models?.getAll) {
      ultron.models.getAll().then((list: ModelDefinition[]) => {
        if (mounted && Array.isArray(list) && list.length > 0) {
          setModels(list)
        }
      }).catch(() => {})
    }
    if (ultron?.models?.getConnectionStatus) {
      ultron.models.getConnectionStatus().then((res: any) => {
        if (mounted && res?.status) {
          setConnectionStatus(res.status)
        }
      }).catch(() => {
        if (mounted) setConnectionStatus('Offline')
      })
    }
    return () => { mounted = false }
  }, [isOpen])

  // Close on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const currentModelId = settings.ai?.model || 'meta/llama-3.2-11b-vision-instruct'
  const isAutoMode = (settings.ai as any)?.mode === 'AUTO' || !settings.ai?.model

  const activeModel = models.find((m) => m.id === currentModelId) || models[0]

  const handleSelectAuto = async () => {
    updateSettings({
      ai: {
        ...settings.ai,
        mode: 'AUTO'
      } as any
    })
    try {
      if (ultron?.settings?.set) {
        await ultron.settings.set({
          ai: { ...settings.ai, mode: 'AUTO' }
        })
      }
    } catch {}
    setIsOpen(false)
  }

  const handleSelectModel = async (model: ModelDefinition) => {
    if (model.isDeprecated) return

    updateSettings({
      ai: {
        ...settings.ai,
        model: model.id,
        mode: 'MANUAL'
      } as any
    })

    try {
      if (ultron?.settings?.set) {
        await ultron.settings.set({
          ai: {
            ...settings.ai,
            model: model.id
          }
        })
      }
    } catch (e) {
      console.warn('Failed to sync model choice with backend:', e)
    }

    setIsOpen(false)
  }
  const fastModels = models.filter((m) => m.tier === 'FAST' && !m.isDeprecated)
  const mediumModels = models.filter((m) => m.tier === 'MEDIUM' && !m.isDeprecated)
  const highModels = models.filter((m) => m.tier === 'HIGH' && !m.isDeprecated)

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0e0e0e] hover:bg-[#161616] border border-[#222222] hover:border-[#333333] text-gray-200 transition-all text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-600 shadow-sm"
        title="Model Routing & Selection"
      >
        {isAutoMode ? (
          <Sparkles size={13} className="text-blue-400 shrink-0" />
        ) : activeModel?.tier === 'HIGH' ? (
          <Flame size={13} className="text-amber-400 shrink-0" />
        ) : activeModel?.tier === 'FAST' ? (
          <Zap size={13} className="text-emerald-400 shrink-0" />
        ) : (
          <Cpu size={13} className="text-blue-400 shrink-0" />
        )}

        <span className="truncate max-w-[140px] text-zinc-200">
          {isAutoMode ? 'AUTO (Smart)' : activeModel?.name?.split('(')[0]?.trim() || activeModel?.name}
        </span>

        <ChevronDown size={12} className={`text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Pure Black Minimal Dropdown Popover */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-80 rounded-xl bg-[#0a0a0a] border border-[#222222] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[460px] animate-in fade-in slide-in-from-bottom-2 duration-150">
          {/* Popover Header */}
          <div className="px-3.5 py-2.5 bg-[#111111] border-b border-[#222222] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-300 uppercase">Model Registry</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'Connected' ? 'bg-emerald-500' : connectionStatus === 'Not configured' ? 'bg-amber-500' : 'bg-red-500'}`} />
              <span>{connectionStatus}</span>
            </div>
          </div>

          {/* Model Options List */}
          <div className="p-2 space-y-3 overflow-y-auto custom-scrollbar flex-1">
            {/* 1. AUTO Selection Option */}
            <div>
              <button
                type="button"
                onClick={handleSelectAuto}
                className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start justify-between group ${
                  isAutoMode
                    ? 'bg-[#141414] border-blue-500/50 shadow-inner'
                    : 'bg-[#0e0e0e] border-[#1e1e1e] hover:bg-[#161616] hover:border-[#2e2e2e]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-md mt-0.5 ${isAutoMode ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">AUTO Routing</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50 font-mono">RECOMMENDED</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                      Dynamically chooses FAST, MEDIUM, or HIGH model based on task difficulty.
                    </p>
                  </div>
                </div>
                {isAutoMode && <Check size={14} className="text-blue-400 mt-1 shrink-0" />}
              </button>
            </div>

            {/* Separator */}
            <div className="h-px bg-[#1e1e1e]" />

            {/* FAST Tier */}
            <div>
              <div className="px-1 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider font-semibold text-emerald-400 flex items-center gap-1">
                  <Zap size={10} /> FAST TIER
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">100–600ms</span>
              </div>
              <div className="space-y-1">
                {fastModels.length > 0 ? (
                  fastModels.map((m) => {
                    const isSelected = !isAutoMode && currentModelId === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectModel(m)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#141414] border-emerald-500/50 text-white'
                            : 'bg-[#0e0e0e] border-transparent hover:bg-[#161616] hover:border-[#262626] text-zinc-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="text-xs font-medium truncate">{m.name}</div>
                          <div className="text-[10px] text-zinc-500 truncate">{m.description}</div>
                        </div>
                        {isSelected && <Check size={13} className="text-emerald-400 shrink-0" />}
                      </button>
                    )
                  })
                ) : (
                  <div className="text-[11px] text-zinc-500 px-2 py-1">Model information unavailable</div>
                )}
              </div>
            </div>

            {/* MEDIUM Tier */}
            <div>
              <div className="px-1 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider font-semibold text-blue-400 flex items-center gap-1">
                  <Cpu size={10} /> MEDIUM TIER
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">1–4s</span>
              </div>
              <div className="space-y-1">
                {mediumModels.length > 0 ? (
                  mediumModels.map((m) => {
                    const isSelected = !isAutoMode && currentModelId === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectModel(m)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#141414] border-blue-500/50 text-white'
                            : 'bg-[#0e0e0e] border-transparent hover:bg-[#161616] hover:border-[#262626] text-zinc-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-xs font-medium truncate">{m.name}</span>
                            {m.supportsVision && (
                              <span className="text-[9px] px-1 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40">Vision</span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-500 truncate">{m.description}</div>
                        </div>
                        {isSelected && <Check size={13} className="text-blue-400 shrink-0" />}
                      </button>
                    )
                  })
                ) : (
                  <div className="text-[11px] text-zinc-500 px-2 py-1">Model information unavailable</div>
                )}
              </div>
            </div>

            {/* HIGH Tier */}
            <div>
              <div className="px-1 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider font-semibold text-amber-400 flex items-center gap-1">
                  <Flame size={10} /> HIGH TIER
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">3–18s</span>
              </div>
              <div className="space-y-1">
                {highModels.length > 0 ? (
                  highModels.map((m) => {
                    const isSelected = !isAutoMode && currentModelId === m.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectModel(m)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#141414] border-amber-500/50 text-white'
                            : 'bg-[#0e0e0e] border-transparent hover:bg-[#161616] hover:border-[#262626] text-zinc-300'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="text-xs font-medium truncate">{m.name}</div>
                          <div className="text-[10px] text-zinc-500 truncate">{m.description}</div>
                        </div>
                        {isSelected && <Check size={13} className="text-amber-400 shrink-0" />}
                      </button>
                    )
                  })
                ) : (
                  <div className="text-[11px] text-zinc-500 px-2 py-1">Model information unavailable</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
