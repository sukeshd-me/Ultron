// src/shared/models.registry.ts — Single Authoritative Model Registry for ULTRON V1.0.8
export type ModelTier = 'FAST' | 'MEDIUM' | 'HIGH'

export type ModelStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'DEPRECATED' | 'DISABLED' | 'UNKNOWN'

export interface ModelDefinition {
  id: string
  name: string
  provider: 'nvidia' | 'local' | 'custom'
  tier: ModelTier
  contextWindow: number
  supportsVision: boolean
  supportsTools: boolean
  description: string
  targetLatency: string
  status: ModelStatus
  isDefault?: boolean
  isDeprecated?: boolean
}

/**
 * SINGLE AUTHORITATIVE SOURCE OF TRUTH for all models across ULTRON.
 * Powers:
 * - Model Selector
 * - Settings (AI & Models)
 * - AI Service & Smart Router
 * - FAST / MEDIUM / HIGH / AUTO Routing
 * - Multi-model verification & telemetry
 * 
 * All models listed below are verified against the real provider endpoint (NVIDIA Integrate API).
 * Deprecated or unsupported models are explicitly marked and excluded from AUTO selection.
 */
export const MODEL_REGISTRY: ModelDefinition[] = [
  // ── FAST TIER (100–600ms Target) ──
  // Best for: rapid commands, greetings, quick tool classification, low-latency reasoning
  {
    id: 'nvidia/nemotron-3.5-lightning-30b-a3b',
    name: 'NVIDIA Nemotron 3.5 Lightning (30B)',
    provider: 'nvidia',
    tier: 'FAST',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    description: 'High-throughput ultra-low-latency model optimized for rapid reasoning, terminal commands, and fast tool routing.',
    targetLatency: '150–500ms',
    status: 'AVAILABLE'
  },
  {
    id: 'deepseek-ai/deepseek-v4-flash-0731',
    name: 'DeepSeek V4 Flash (0731)',
    provider: 'nvidia',
    tier: 'FAST',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    description: 'Fast MoE architecture designed for instantaneous conversational feedback and immediate task dispatch.',
    targetLatency: '100–400ms',
    status: 'AVAILABLE'
  },
  {
    id: 'nvidia/mistral-nemo-minitron-8b-8k-instruct',
    name: 'Mistral-NeMo Minitron (8B)',
    provider: 'nvidia',
    tier: 'FAST',
    contextWindow: 8192,
    supportsVision: false,
    supportsTools: true,
    description: 'Lightweight, agile open-weights model for fast execution and single-step queries.',
    targetLatency: '200–600ms',
    status: 'AVAILABLE'
  },

  // ── MEDIUM TIER (1–4s Target) ──
  // Best for: general reasoning, multimodal vision, research synthesis, normal analysis
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Meta Llama 3.2 (11B - Vision & Multimodal)',
    provider: 'nvidia',
    tier: 'MEDIUM',
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
    description: 'Multimodal vision and reasoning foundation model. Capable of analyzing local screenshots, documents, and UI elements.',
    targetLatency: '1–3s',
    isDefault: true,
    status: 'AVAILABLE'
  },
  {
    id: 'mistralai/mistral-7b-instruct-v0.3',
    name: 'Mistral 7B Instruct (v0.3)',
    provider: 'nvidia',
    tier: 'MEDIUM',
    contextWindow: 32768,
    supportsVision: false,
    supportsTools: true,
    description: 'Balanced model for web research synthesis, document analysis, and general multi-step tasks.',
    targetLatency: '1–3s',
    status: 'AVAILABLE'
  },
  {
    id: 'mistralai/codestral-22b-instruct-v0.1',
    name: 'Codestral (22B - Code & Logic)',
    provider: 'nvidia',
    tier: 'MEDIUM',
    contextWindow: 32768,
    supportsVision: false,
    supportsTools: true,
    description: 'Specialized code generation, script repair, and structured logic instruction model.',
    targetLatency: '1–4s',
    status: 'AVAILABLE'
  },

  // ── HIGH TIER (3–18s Target) ──
  // Best for: complex reasoning, large codebase analysis, architectural planning, deep missions
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'NVIDIA Nemotron 3.1 (70B - Reasoning & Code)',
    provider: 'nvidia',
    tier: 'HIGH',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    description: 'Flagship deep reasoning and coding model for architectural analysis, TypeScript error repair, and complex missions.',
    targetLatency: '3–10s',
    status: 'AVAILABLE'
  },
  {
    id: 'deepseek-ai/deepseek-v4-pro-0813',
    name: 'DeepSeek V4 Pro (0813)',
    provider: 'nvidia',
    tier: 'HIGH',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    description: 'Heavyweight reasoning and mathematics model for difficult algorithmic problems and multi-step agent planning.',
    targetLatency: '4–12s',
    status: 'AVAILABLE'
  },
  {
    id: 'meta/llama-3.2-90b-vision-instruct',
    name: 'Meta Llama 3.2 (90B - Heavy Vision & Reasoning)',
    provider: 'nvidia',
    tier: 'HIGH',
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
    description: 'Flagship multimodal vision model for massive document synthesis and high-precision visual inspection.',
    targetLatency: '5–18s',
    status: 'AVAILABLE'
  },

  // ── DEPRECATED / RETIRED MODELS (Explicitly tracked, never selected by AUTO) ──
  {
    id: 'meta/llama-3.2-3b-instruct',
    name: 'Meta Llama 3.2 (3B - Deprecated)',
    provider: 'nvidia',
    tier: 'FAST',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    description: 'Deprecated by upstream provider. Maintained only for legacy configuration compatibility.',
    targetLatency: 'N/A',
    status: 'DEPRECATED',
    isDeprecated: true
  },
  {
    id: 'meta/llama-3.1-70b-instruct',
    name: 'Meta Llama 3.1 (70B - Deprecated)',
    provider: 'nvidia',
    tier: 'HIGH',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    description: 'Deprecated by upstream provider. Superseded by Nemotron 3.1 70B.',
    targetLatency: 'N/A',
    status: 'DEPRECATED',
    isDeprecated: true
  }
]

export function getModelById(id: string): ModelDefinition | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id)
}

export function getDefaultModel(): ModelDefinition {
  // Never default to a deprecated model
  return (
    MODEL_REGISTRY.find((m) => m.isDefault && !m.isDeprecated && m.status === 'AVAILABLE') ||
    MODEL_REGISTRY.find((m) => !m.isDeprecated && m.status === 'AVAILABLE') ||
    MODEL_REGISTRY[0]
  )
}

export function getModelsByTier(tier: ModelTier): ModelDefinition[] {
  // Exclude deprecated models from normal tier listings
  return MODEL_REGISTRY.filter((m) => m.tier === tier && !m.isDeprecated)
}

export function getAllActiveModels(): ModelDefinition[] {
  return MODEL_REGISTRY.filter((m) => !m.isDeprecated && m.status !== 'DISABLED')
}

export function getVisionModel(): ModelDefinition {
  return (
    MODEL_REGISTRY.find((m) => m.supportsVision && !m.isDeprecated && m.status === 'AVAILABLE') ||
    getDefaultModel()
  )
}
