import React, { useState, useRef, useEffect } from 'react'
import { Sparkles, ChevronDown, Check, Zap, Cpu, Flame, X } from 'lucide-react'
import { useSettingsStore } from '../../stores/settingsStore'

export type ModelTier = 'FAST' | 'MID' | 'HIGH'

export interface ModelOption {
  id: string
  name: string
  shortName: string
  provider: string
  tier: ModelTier
  specs: string
  description: string
}

export const CATALOG_MODELS: ModelOption[] = [
  // FAST TIER (4 models)
  {
    id: 'nvidia/nemotron-3.5-lightning-30b-a3b',
    name: 'NVIDIA Nemotron 3.5 Lightning 30B A3B',
    shortName: 'Nemotron 3.5 Lightning',
    provider: 'NVIDIA',
    tier: 'FAST',
    specs: '30B A3B • Ultra-Low Latency',
    description: 'High-throughput low-latency inference optimized for rapid reasoning and immediate agent execution.'
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'OpenAI GPT-OSS 20B',
    shortName: 'GPT-OSS 20B',
    provider: 'OpenAI',
    tier: 'FAST',
    specs: '20B Dense • Rapid Instruction Flow',
    description: 'Lightweight frontier-distilled model optimized for quick conversational feedback and scripting.'
  },
  {
    id: 'google/gemma-4-31b-it',
    name: 'Google Gemma 4 31B IT',
    shortName: 'Gemma 4 31B',
    provider: 'Google DeepMind',
    tier: 'FAST',
    specs: '31B Instruction • High Efficiency',
    description: 'Fast Google open-weights architecture with balanced instruction following and coding agility.'
  },
  {
    id: 'deepseek-ai/deepseek-v4-flash-0731',
    name: 'DeepSeek V4 Flash 0731',
    shortName: 'DeepSeek V4 Flash',
    provider: 'DeepSeek AI',
    tier: 'FAST',
    specs: 'MoE Flash • Instant Response',
    description: 'Extremely rapid MoE model designed for instantaneous terminal commands and agent routing.'
  },

  // MID TIER (4 models)
  {
    id: 'meta/muse-glimmer-30b',
    name: 'Meta Muse Glimmer 30B',
    shortName: 'Muse Glimmer 30B',
    provider: 'Meta AI',
    tier: 'MID',
    specs: '30B Dense • Balanced Reasoning',
    description: 'Versatile general-purpose model balancing nuanced multi-turn conversation and complex tool planning.'
  },
  {
    id: 'thinking-machines/inkling',
    name: 'Thinking Machines Inkling',
    shortName: 'Inkling',
    provider: 'Thinking Machines',
    tier: 'MID',
    specs: 'Reasoning Synthesis • Tool Chaining',
    description: 'Specialized intermediate reasoner optimized for structured JSON outputs and desktop tool workflows.'
  },
  {
    id: 'poolside/laguna-xs-2.1',
    name: 'Poolside Laguna XS 2.1',
    shortName: 'Laguna XS 2.1',
    provider: 'Poolside',
    tier: 'MID',
    specs: 'Code Specialist • High Precision',
    description: 'Code-centric reasoning model designed for PowerShell automation, script generation, and software inspection.'
  },
  {
    id: 'thudm/glm-5.2',
    name: 'GLM-5.2',
    shortName: 'GLM-5.2',
    provider: 'Zhipu AI',
    tier: 'MID',
    specs: 'Bilingual Frontier • Broad Context',
    description: 'Advanced multilingual foundation model with deep semantic comprehension and general task execution.'
  },

  // HIGH TIER (3 models)
  {
    id: 'deepseek-ai/deepseek-v4-pro-0813',
    name: 'DeepSeek V4 Pro 0813',
    shortName: 'DeepSeek V4 Pro',
    provider: 'DeepSeek AI',
    tier: 'HIGH',
    specs: 'Frontier MoE • Deep Chain-of-Thought',
    description: 'Frontier-grade reasoning model with deep self-reflection, math/logic synthesis, and autonomous planning.'
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    name: 'NVIDIA Nemotron 3 Ultra 550B A55B',
    shortName: 'Nemotron 3 Ultra 550B',
    provider: 'NVIDIA',
    tier: 'HIGH',
    specs: '550B A55B • Flagship Frontier Intelligence',
    description: 'NVIDIA flagship intelligence engine designed for massive context comprehension and multi-step complex workflows.'
  },
  {
    id: 'moonshotai/kimi-k3',
    name: 'Moonshot Kimi K3',
    shortName: 'Kimi K3',
    provider: 'Moonshot AI',
    tier: 'HIGH',
    specs: 'Long Context • Ultra Reasoning',
    description: 'High-capability frontier model with exceptional long-context retention and architectural analysis.'
  }
]

interface ModelSelectorMorphProps {
  className?: string
  compact?: boolean
}

export function ModelSelectorMorph({ className = '', compact = false }: ModelSelectorMorphProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTier, setSelectedTier] = useState<ModelTier>('FAST')
  const { settings, updateSettings } = useSettingsStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentModelId = settings.ai?.model || 'nvidia/nemotron-3.5-lightning-30b-a3b'
  const activeModel = CATALOG_MODELS.find((m) => m.id === currentModelId) || CATALOG_MODELS[0]

  useEffect(() => {
    if (activeModel?.tier) {
      setSelectedTier(activeModel.tier)
    }
  }, [activeModel?.tier])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelectModel = async (model: ModelOption) => {
    updateSettings({
      ai: {
        ...settings.ai,
        model: model.id
      }
    })

    try {
      if (window.ultron?.settings?.set) {
        await window.ultron.settings.set({
          ai: {
            model: model.id
          }
        })
      }
    } catch (e) {
      console.warn('Failed to sync model choice with backend:', e)
    }

    setIsOpen(false)
  }

  const filteredModels = CATALOG_MODELS.filter((m) => m.tier === selectedTier)

  const getTierColor = (tier: ModelTier) => {
    switch (tier) {
      case 'FAST':
        return '#00e676'
      case 'MID':
        return '#00d4ff'
      case 'HIGH':
        return '#ff7043'
    }
  }

  return (
    <div className={`model-morph-container bottom-composer-morph ${className}`} ref={dropdownRef}>
      {/* Morph Button (Bottom-Left Pill) */}
      <button
        className={`model-morph-button bottom-pill ${isOpen ? 'expanded' : ''} ${compact ? 'compact' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Select AI Model"
        aria-label="Select AI Model"
        type="button"
      >
        <div className="model-morph-icon-wrap">
          <Sparkles size={13} color={getTierColor(activeModel.tier)} />
        </div>
        <div className="model-morph-details">
          <span className="model-morph-name">
            {activeModel ? activeModel.shortName : 'Select model'}
          </span>
          <span
            className="model-morph-tier-badge"
            style={{
              color: getTierColor(activeModel.tier),
              borderColor: `${getTierColor(activeModel.tier)}44`
            }}
          >
            {activeModel.tier}
          </span>
        </div>
        <ChevronDown
          size={13}
          className={`model-morph-chevron ${isOpen ? 'rotate' : ''}`}
        />
      </button>

      {/* Floating Morph Expansion Panel (Opens Upward) */}
      {isOpen && (
        <div className="model-morph-panel upward-panel animate-fade-in" role="dialog" aria-label="AI Model Selection">
          {/* Header */}
          <div className="model-panel-header">
            <div className="model-panel-title-group">
              <span className="model-panel-tag">INTELLIGENCE ENGINE</span>
              <h3 className="model-panel-title">SELECT MODEL</h3>
            </div>
            <button
              className="model-panel-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              type="button"
            >
              <X size={15} />
            </button>
          </div>

          {/* Tier Tabs: FAST | MID | HIGH */}
          <div className="model-tier-tabs">
            <button
              className={`tier-tab ${selectedTier === 'FAST' ? 'active fast' : ''}`}
              onClick={() => setSelectedTier('FAST')}
              type="button"
            >
              <Zap size={13} />
              <span>FAST</span>
              <span className="tier-count">4</span>
            </button>
            <button
              className={`tier-tab ${selectedTier === 'MID' ? 'active mid' : ''}`}
              onClick={() => setSelectedTier('MID')}
              type="button"
            >
              <Cpu size={13} />
              <span>MID</span>
              <span className="tier-count">4</span>
            </button>
            <button
              className={`tier-tab ${selectedTier === 'HIGH' ? 'active high' : ''}`}
              onClick={() => setSelectedTier('HIGH')}
              type="button"
            >
              <Flame size={13} />
              <span>HIGH</span>
              <span className="tier-count">3</span>
            </button>
          </div>

          {/* Model Options List */}
          <div className="model-items-list custom-scrollbar">
            {filteredModels.map((model) => {
              const isSelected = model.id === activeModel.id
              return (
                <div
                  key={model.id}
                  className={`model-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectModel(model)}
                >
                  <div className="model-card-top">
                    <div className="model-card-info">
                      <span className="model-card-name">{model.name}</span>
                      <span className="model-card-provider">{model.provider}</span>
                    </div>
                    {isSelected && (
                      <div className="model-card-check">
                        <Check size={14} color="#00d4ff" />
                      </div>
                    )}
                  </div>
                  <div className="model-card-specs">{model.specs}</div>
                  <p className="model-card-desc">{model.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
