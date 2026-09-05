// src/main/services/model.service.ts — Unified Model Provider Manager & Hybrid AI Engine
import * as dotenv from 'dotenv'
import { join } from 'path'
import { ModelProvider, CloudModelProvider, LocalModelProvider, OfflineCapabilityRouter } from './providers/model.provider'
import { AgentPlan } from '../../shared/tools/tool.types'
import { ULTRON_SYSTEM_PROMPT } from '../../shared/prompts/ultron.system'

// Ensure .env is loaded
dotenv.config({ path: join(process.cwd(), '.env') })
dotenv.config()

export type ModelMode = 'AUTO' | 'ONLINE' | 'OFFLINE'

export interface ModelProviderStatus {
  statusLabel: string
  mode: ModelMode
  providerId: string
  modelName: string
  online: boolean
  isLocalModel: boolean
  isOfflineFallback: boolean
}

interface StreamCallbacks {
  onChunk: (chunk: string) => void
  onDone: (fullText: string) => void
  onError: (error: string) => void
}

class ModelService {
  private mode: ModelMode = 'AUTO'
  private cloudProvider: CloudModelProvider
  private localProvider: LocalModelProvider
  private offlineRouter: OfflineCapabilityRouter
  private abortController: AbortController | null = null

  constructor() {
    const endpoint = process.env.NVIDIA_ENDPOINT || 'https://integrate.api.nvidia.com/v1'
    let apiKey = process.env.NVIDIA_API_KEY || null
    try {
      const { credentialService } = require('./credential.service')
      apiKey = credentialService.getNvidiaApiKeyTransientSync() || apiKey
    } catch {}
    const model = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct'

    this.cloudProvider = new CloudModelProvider(endpoint, apiKey, model)
    this.localProvider = new LocalModelProvider()
    this.offlineRouter = new OfflineCapabilityRouter()
  }

  setMode(mode: ModelMode): void {
    this.mode = mode
  }

  getMode(): ModelMode {
    return this.mode
  }

  setApiKey(key: string | null): void {
    this.cloudProvider.setApiKey(key)
  }

  getApiKey(): string | null {
    if (this.cloudProvider['apiKey']) return this.cloudProvider['apiKey']
    try {
      const { credentialService } = require('./credential.service')
      const vaultKey = credentialService.getNvidiaApiKeyTransientSync()
      if (vaultKey) return vaultKey
    } catch {}
    return process.env.NVIDIA_API_KEY || null
  }

  setEndpoint(endpoint: string): void {
    this.cloudProvider['endpoint'] = endpoint
  }

  getEndpoint(): string {
    return this.cloudProvider['endpoint']
  }

  setModel(model: string): void {
    this.cloudProvider.setModel(model)
  }

  getModel(): string {
    return this.cloudProvider.getModel()
  }

  isConfigured(): boolean {
    const key = this.getApiKey()
    return typeof key === 'string' && key.trim().length > 0
  }

  /**
   * Determine the current active provider and UI status indicator
   */
  async getProviderStatus(): Promise<ModelProviderStatus> {
    if (this.mode === 'OFFLINE') {
      const localAvail = await this.localProvider.isAvailable()
      if (localAvail) {
        return {
          statusLabel: 'OFFLINE — Local Model',
          mode: 'OFFLINE',
          providerId: this.localProvider.id,
          modelName: this.localProvider.name,
          online: false,
          isLocalModel: true,
          isOfflineFallback: false
        }
      }
      return {
        statusLabel: 'OFFLINE — Local Tools',
        mode: 'OFFLINE',
        providerId: this.offlineRouter.id,
        modelName: 'Deterministic Windows Controller',
        online: false,
        isLocalModel: false,
        isOfflineFallback: true
      }
    }

    if (this.mode === 'ONLINE') {
      const cloudAvail = await this.cloudProvider.isAvailable()
      if (cloudAvail) {
        return {
          statusLabel: 'ONLINE — NVIDIA',
          mode: 'ONLINE',
          providerId: this.cloudProvider.id,
          modelName: this.cloudProvider.getModel(),
          online: true,
          isLocalModel: false,
          isOfflineFallback: false
        }
      }
      // Fallback
      return {
        statusLabel: 'OFFLINE — Local Tools',
        mode: 'ONLINE',
        providerId: this.offlineRouter.id,
        modelName: 'Deterministic Windows Controller',
        online: false,
        isLocalModel: false,
        isOfflineFallback: true
      }
    }

    // AUTO Mode: Cloud if available -> Local Model -> Offline Local Tools
    const cloudAvail = await this.cloudProvider.isAvailable()
    if (cloudAvail) {
      return {
        statusLabel: 'ONLINE — NVIDIA',
        mode: 'AUTO',
        providerId: this.cloudProvider.id,
        modelName: this.cloudProvider.getModel(),
        online: true,
        isLocalModel: false,
        isOfflineFallback: false
      }
    }

    const localAvail = await this.localProvider.isAvailable()
    if (localAvail) {
      return {
        statusLabel: 'ONLINE — Local Model',
        mode: 'AUTO',
        providerId: this.localProvider.id,
        modelName: this.localProvider.name,
        online: true,
        isLocalModel: true,
        isOfflineFallback: false
      }
    }

    return {
      statusLabel: 'OFFLINE — Local Tools',
      mode: 'AUTO',
      providerId: this.offlineRouter.id,
      modelName: 'Deterministic Windows Controller',
      online: false,
      isLocalModel: false,
      isOfflineFallback: true
    }
  }

  /**
   * Resolve best provider according to current mode and runtime availability
   */
  async getActiveProvider(): Promise<ModelProvider> {
    if (this.mode === 'OFFLINE') {
      if (await this.localProvider.isAvailable()) return this.localProvider
      return this.offlineRouter
    }

    if (this.mode === 'ONLINE') {
      if (await this.cloudProvider.isAvailable()) return this.cloudProvider
      if (await this.localProvider.isAvailable()) return this.localProvider
      return this.offlineRouter
    }

    // AUTO
    if (await this.cloudProvider.isAvailable()) return this.cloudProvider
    if (await this.localProvider.isAvailable()) return this.localProvider
    return this.offlineRouter
  }

  /**
   * Plan request using the active provider with auto-fallback
   */
  async plan(
    prompt: string,
    history: Array<{ role: string; content: string }>,
    memoryContext: string,
    availableTools: string[]
  ): Promise<{ plan: AgentPlan; providerId: string; modelName: string }> {
    const provider = await this.getActiveProvider()

    try {
      const result = await provider.plan(prompt, history, memoryContext, availableTools)
      return {
        plan: result,
        providerId: provider.id,
        modelName: provider.name
      }
    } catch (err: any) {
      console.warn(`[ULTRON] Provider '${provider.name}' failed (${err.message}). Falling back to OfflineCapabilityRouter...`)
      const fallbackResult = await this.offlineRouter.plan(prompt)
      return {
        plan: fallbackResult,
        providerId: this.offlineRouter.id,
        modelName: this.offlineRouter.name
      }
    }
  }

  /**
   * Streaming conversational chat
   */
  async chat(
    messages: Array<{ role: string; content: string }>,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const effectiveApiKey = this.getApiKey()
    const provider = await this.getActiveProvider()

    if (provider.id === 'offline-router' || !effectiveApiKey) {
      // Offline conversational response
      const lastMsg = messages[messages.length - 1]?.content || ''
      const offlinePlan = await this.offlineRouter.plan(lastMsg)
      callbacks.onDone(offlinePlan.directResponse || '⚡ ULTRON is in offline mode with full local PC tools available.')
      return
    }

    this.abortController = new AbortController()

    const body = {
      model: this.cloudProvider.getModel(),
      messages: [
        { role: 'system', content: ULTRON_SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.6,
      max_tokens: 4096,
      stream: true
    }

    let fullText = ''
    try {
      let response = await fetch(`${this.getEndpoint()}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveApiKey.trim()}`
        },
        body: JSON.stringify(body),
        signal: this.abortController.signal
      })

      if (!response.ok) {
        const errorText = await response.text()
        callbacks.onError(`Cloud API error (${response.status}): ${errorText.replace(effectiveApiKey.trim(), '[REDACTED]')}`)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        callbacks.onError('No response body stream received from AI API.')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue
          if (!trimmed.startsWith('data: ')) continue

          try {
            const json = JSON.parse(trimmed.slice(6))
            const delta = json.choices?.[0]?.delta
            const content = delta?.content
            if (content) {
              fullText += content
              callbacks.onChunk(content)
            }
          } catch {}
        }
      }

      if (!fullText.trim()) {
        fullText = 'ULTRON response received with no text content.'
      }

      callbacks.onDone(fullText)
    } catch (error: any) {
      if (error.name === 'AbortError') {
        callbacks.onDone(fullText || '')
      } else {
        callbacks.onError(`Model request failed: ${error.message.replace(effectiveApiKey?.trim() || '', '[REDACTED]')}`)
      }
    } finally {
      this.abortController = null
    }
  }

  cancel(): void {
    this.abortController?.abort()
    this.abortController = null
  }
}

export const modelService = new ModelService()