// src/main/services/router.service.ts — Smart Model Router with Real Timing Metrics
import { MODEL_REGISTRY, ModelDefinition, ModelTier, getModelById, getDefaultModel } from '../../shared/models.registry'

export interface RouteDecision {
  tier: ModelTier
  selectedModel: ModelDefinition
  reason: string
  isMultimodal: boolean
  isComplexCoding: boolean
  isLightweight: boolean
}

export interface RoutingTelemetry {
  requestStart: number
  firstTokenMs?: number
  streamCompleteMs?: number
  toolStartMs?: number
  toolCompleteMs?: number
  totalDurationMs: number
  tier: ModelTier
  modelId: string
}

export class SmartModelRouter {
  /**
   * Determine the optimal model tier and model instance based on task characteristics
   */
  route(params: {
    userInput: string
    hasImageOrVision?: boolean
    toolCount?: number
    contextLength?: number
    userSelectedModel?: string
    isDeveloperTask?: boolean
  }): RouteDecision {
    const {
      userInput,
      hasImageOrVision = false,
      toolCount = 0,
      contextLength = 0,
      userSelectedModel,
      isDeveloperTask = false
    } = params

    // If user explicitly chose a model, honor their selection
    if (userSelectedModel && userSelectedModel !== 'AUTO') {
      const explicitModel = getModelById(userSelectedModel)
      if (explicitModel) {
        return {
          tier: explicitModel.tier,
          selectedModel: explicitModel,
          reason: `User explicitly configured model: ${explicitModel.name}`,
          isMultimodal: explicitModel.supportsVision,
          isComplexCoding: explicitModel.tier === 'HIGH',
          isLightweight: explicitModel.tier === 'FAST'
        }
      }
    }

    const lower = userInput.toLowerCase().trim()

    // 1. Vision / Multimodal Requirement -> MEDIUM Vision-capable Model
    if (
      hasImageOrVision ||
      lower.includes('screen') ||
      lower.includes('screenshot') ||
      lower.includes('what am i looking at') ||
      lower.includes('what is on my screen') ||
      lower.includes('what is visible') ||
      lower.includes('image')
    ) {
      const visionModel = MODEL_REGISTRY.find((m) => m.supportsVision) || getDefaultModel()
      return {
        tier: 'MEDIUM',
        selectedModel: visionModel,
        reason: 'Vision or screen comprehension required for multimodal analysis.',
        isMultimodal: true,
        isComplexCoding: false,
        isLightweight: false
      }
    }

    // 2. Complex Coding, Large Codebase Analysis, or Developer Debugging -> HIGH Tier
    if (
      isDeveloperTask ||
      lower.includes('typescript') ||
      lower.includes('codebase') ||
      lower.includes('refactor') ||
      lower.includes('architecture') ||
      lower.includes('debug') ||
      lower.includes('fix the error') ||
      lower.includes('fix the typescript errors') ||
      lower.includes('check typescript') ||
      lower.includes('analyze this project') ||
      lower.includes('interface') ||
      lower.includes('syntax error') ||
      lower.includes('compiler') ||
      lower.includes('coding') ||
      contextLength > 20000
    ) {
      const highModel = MODEL_REGISTRY.find((m) => m.tier === 'HIGH') || getDefaultModel()

      return {
        tier: 'HIGH',
        selectedModel: highModel,
        reason: 'Complex coding, codebase analysis, or long-context reasoning detected.',
        isMultimodal: false,
        isComplexCoding: true,
        isLightweight: false
      }
    }

    // 3. Simple Greetings, Casual Dialogue, or Fast Single Lookups -> FAST Tier
    const isGreeting = /^(hi|hello|hey|good morning|good evening|good afternoon|how are you|who are you|thanks|thank you)\b/i.test(lower)
    const isShortQuery = lower.split(/\s+/).length <= 4 && !lower.includes('and then') && toolCount <= 1

    if (isGreeting || (isShortQuery && toolCount === 0)) {
      const fastModel = MODEL_REGISTRY.find((m) => m.tier === 'FAST') || getDefaultModel()
      return {
        tier: 'FAST',
        selectedModel: fastModel,
        reason: 'Lightweight conversational dialogue or short query suited for low-latency fast tier.',
        isMultimodal: false,
        isComplexCoding: false,
        isLightweight: true
      }
    }

    // 4. Default / Standard Actions & Multi-Step Tasks -> MEDIUM Tier
    const defaultModel = getDefaultModel()
    return {
      tier: 'MEDIUM',
      selectedModel: defaultModel,
      reason: 'General task or multi-step execution handled by balanced medium-tier reasoning model.',
      isMultimodal: defaultModel.supportsVision,
      isComplexCoding: false,
      isLightweight: false
    }
  }

  /**
   * Helper to create real telemetry stopwatch for request lifecycle
   */
  startTelemetry(tier: ModelTier, modelId: string): {
    recordFirstToken: () => number
    recordStreamComplete: () => number
    recordToolStart: () => number
    recordToolComplete: () => number
    finish: () => RoutingTelemetry
  } {
    const startMs = performance.now()
    let firstTokenMs: number | undefined
    let streamCompleteMs: number | undefined
    let toolStartMs: number | undefined
    let toolCompleteMs: number | undefined

    return {
      recordFirstToken: () => {
        firstTokenMs = parseFloat((performance.now() - startMs).toFixed(2))
        return firstTokenMs
      },
      recordStreamComplete: () => {
        streamCompleteMs = parseFloat((performance.now() - startMs).toFixed(2))
        return streamCompleteMs
      },
      recordToolStart: () => {
        toolStartMs = parseFloat((performance.now() - startMs).toFixed(2))
        return toolStartMs
      },
      recordToolComplete: () => {
        toolCompleteMs = parseFloat((performance.now() - startMs).toFixed(2))
        return toolCompleteMs
      },
      finish: (): RoutingTelemetry => {
        const totalDurationMs = parseFloat((performance.now() - startMs).toFixed(2))
        return {
          requestStart: startMs,
          firstTokenMs,
          streamCompleteMs,
          toolStartMs,
          toolCompleteMs,
          totalDurationMs,
          tier,
          modelId
        }
      }
    }
  }
}

export const modelRouter = new SmartModelRouter()
