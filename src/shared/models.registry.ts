// src/shared/models.registry.ts — Central Model Registry for ULTRON V1.0.3
export type ModelTier = 'FAST' | 'MEDIUM' | 'HIGH'

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
  isDefault?: boolean
}

/**
 * Single source of truth for all models across ULTRON.
 * Powers: Model Selector, Settings, Smart Model Router, Model Service.
 */
export const MODEL_REGISTRY: ModelDefinition[] = [
  // ── FAST TIER (100–700ms Target) ──
  // Best for: greetings, quick lookups, casual conversation, lightweight tool routing
  {
    id: 'meta/llama-3.2-3b-instruct',
    name: 'Meta Llama 3.2 (3B - Fast)',
    provider: 'nvidia',
    tier: 'FAST',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    description: 'Ultra-low latency model for conversational dialogue, greetings, and simple queries.',
    targetLatency: '100–700ms'
  },
  {
    id: 'meta/llama-3.1-8b-instruct',
    name: 'Meta Llama 3.1 (8B - Lightweight)',
    provider: 'nvidia',
    tier: 'FAST',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    description: 'Fast, responsive model for high-throughput commands and single-step queries.',
    targetLatency: '300–900ms'
  },

  // ── MEDIUM TIER (1–5s Target) ──
  // Best for: moderate reasoning, research, multi-step actions, vision, normal analysis
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Meta Llama 3.2 (11B - Vision & Multimodal)',
    provider: 'nvidia',
    tier: 'MEDIUM',
    contextWindow: 128000,
    supportsVision: true,
    supportsTools: true,
    description: 'Multimodal vision and reasoning model. Capable of analyzing local screenshots and UI elements.',
    targetLatency: '1–4s',
    isDefault: true
  },
  {
    id: 'mistralai/mistral-7b-instruct-v0.3',
    name: 'Mistral (7B - Balanced)',
    provider: 'nvidia',
    tier: 'MEDIUM',
    contextWindow: 32768,
    supportsVision: false,
    supportsTools: true,
    description: 'Balanced model for web research synthesis, document analysis, and general tasks.',
    targetLatency: '1–3s'
  },

  // ── HIGH TIER (5–30s Target) ──
  // Best for: complex coding, large codebase analysis, deep reasoning, difficult multi-tool planning
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'NVIDIA Nemotron 3.1 (70B - Reasoning & Code)',
    provider: 'nvidia',
    tier: 'HIGH',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    description: 'Deep reasoning and coding model for architectural analysis, TypeScript error repair, and complex tasks.',
    targetLatency: '4–15s'
  },
  {
    id: 'meta/llama-3.1-70b-instruct',
    name: 'Meta Llama 3.1 (70B - Heavy Reasoning)',
    provider: 'nvidia',
    tier: 'HIGH',
    contextWindow: 128000,
    supportsVision: false,
    supportsTools: true,
    description: 'Heavyweight reasoning model for difficult logic problems and large codebase comprehension.',
    targetLatency: '5–20s'
  }
]

export function getModelById(id: string): ModelDefinition | undefined {
  return MODEL_REGISTRY.find((m) => m.id === id)
}

export function getDefaultModel(): ModelDefinition {
  return MODEL_REGISTRY.find((m) => m.isDefault) || MODEL_REGISTRY[0]
}

export function getModelsByTier(tier: ModelTier): ModelDefinition[] {
  return MODEL_REGISTRY.filter((m) => m.tier === tier)
}

export function getVisionModel(): ModelDefinition {
  return MODEL_REGISTRY.find((m) => m.supportsVision) || MODEL_REGISTRY[1]
}
