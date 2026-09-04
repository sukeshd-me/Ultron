// src/main/services/providers/model.provider.ts — Model Provider Abstraction & Implementations
import { AgentPlan, StructuredToolCall } from '../../../shared/tools/tool.types'
import { buildAgentPrompt } from '../../../shared/prompts/ultron.system'
import * as path from 'path'

export interface ModelProvider {
  id: string
  name: string
  type: 'cloud' | 'local' | 'offline'
  isAvailable(): Promise<boolean>
  plan(
    prompt: string,
    history: Array<{ role: string; content: string }>,
    memoryContext: string,
    availableTools: string[]
  ): Promise<AgentPlan>
}

// ══════════════════════════════════════════════════════════════════
// 1. CLOUD MODEL PROVIDER (NVIDIA Nemotron / Llama / Custom)
// ══════════════════════════════════════════════════════════════════
export class CloudModelProvider implements ModelProvider {
  id = 'cloud-nvidia'
  name = 'NVIDIA Nemotron 3.5'
  type = 'cloud' as const

  private endpoint: string
  private apiKey: string | null
  private model: string

  constructor(endpoint?: string, apiKey?: string | null, model?: string) {
    this.endpoint = endpoint || process.env.NVIDIA_ENDPOINT || 'https://integrate.api.nvidia.com/v1'
    this.apiKey = apiKey ?? (process.env.NVIDIA_API_KEY || null)
    this.model = model || process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct'
  }

  setApiKey(key: string | null): void {
    this.apiKey = key
  }

  setModel(model: string): void {
    this.model = model
  }

  getModel(): string {
    return this.model
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey || !this.apiKey.trim()) return false
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3500)
      const res = await fetch(`${this.endpoint}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey.trim()}` },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return res.status < 500
    } catch {
      return false
    }
  }

  async plan(
    prompt: string,
    history: Array<{ role: string; content: string }>,
    memoryContext: string,
    availableTools: string[]
  ): Promise<AgentPlan> {
    if (!this.apiKey || !this.apiKey.trim()) {
      throw new Error('Cloud AI provider API key is not configured.')
    }

    const systemPrompt = buildAgentPrompt({
      environment: `Windows 11 | Host: ${process.env.COMPUTERNAME || 'PC'} | Time: ${new Date().toLocaleString()}`,
      relevantMemory: memoryContext,
      availableTools
    })

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8),
      { role: 'user', content: prompt }
    ]

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 18000)

    try {
      const res = await fetch(`${this.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.2,
          max_tokens: 1024
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Cloud API returned ${res.status}: ${errText.slice(0, 200)}`)
      }

      const json = await res.json()
      const content = json.choices?.[0]?.message?.content || ''
      return parseModelOutput(content, prompt)
    } catch (err: any) {
      clearTimeout(timeoutId)
      throw err
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// 2. LOCAL MODEL PROVIDER (Ollama / LM Studio / Localhost Inference)
// ══════════════════════════════════════════════════════════════════
export class LocalModelProvider implements ModelProvider {
  id = 'local-model'
  name = 'Local Model'
  type = 'local' as const

  private endpoints = [
    'http://127.0.0.1:11434/v1', // Ollama
    'http://localhost:1234/v1'   // LM Studio
  ]
  private activeEndpoint: string = 'http://127.0.0.1:11434/v1'
  private activeModel: string = 'llama3.2'

  async isAvailable(): Promise<boolean> {
    for (const ep of this.endpoints) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1200)
        const res = await fetch(`${ep}/models`, { signal: controller.signal })
        clearTimeout(timeoutId)
        if (res.ok) {
          this.activeEndpoint = ep
          const data = await res.json()
          if (data.data && data.data[0]?.id) {
            this.activeModel = data.data[0].id
            this.name = `Local Model (${this.activeModel})`
          }
          return true
        }
      } catch {}
    }
    return false
  }

  async plan(
    prompt: string,
    history: Array<{ role: string; content: string }>,
    memoryContext: string,
    availableTools: string[]
  ): Promise<AgentPlan> {
    const systemPrompt = buildAgentPrompt({
      environment: `Windows 11 (Offline/Local) | Host: ${process.env.COMPUTERNAME || 'PC'} | Time: ${new Date().toLocaleString()}`,
      relevantMemory: memoryContext,
      availableTools
    })

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6),
      { role: 'user', content: prompt }
    ]

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)

    try {
      const res = await fetch(`${this.activeEndpoint}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.activeModel,
          messages,
          temperature: 0.2,
          max_tokens: 1024
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      if (!res.ok) throw new Error(`Local model returned HTTP ${res.status}`)

      const json = await res.json()
      const content = json.choices?.[0]?.message?.content || ''
      return parseModelOutput(content, prompt)
    } catch (err: any) {
      clearTimeout(timeoutId)
      throw err
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// 3. OFFLINE CAPABILITY ROUTER (Deterministic Local Tool Fallback)
// ══════════════════════════════════════════════════════════════════
export class OfflineCapabilityRouter implements ModelProvider {
  id = 'offline-router'
  name = 'Offline Local Tools'
  type = 'offline' as const

  public static lastCreatedFolder: string | null = null
  public static lastCreatedFile: string | null = null

  async isAvailable(): Promise<boolean> {
    // Local tools are ALWAYS available on the host PC
    return true
  }

  normalizeInput(raw: string): string {
    let s = raw.trim()
    s = s.replace(
      /\bopen(calculator|calc|notepad|chrome|explorer|settings|vscode|taskmanager|terminal|paint|spotify|edge|word|excel|powerpoint|vlc|steam|control|devmgmt)\b/gi,
      'open $1 '
    )
    s = s.replace(
      /\b(show|get|check)(cpu|memory|ram|disk|wifi|ip|ports|firewall|defender|brightness|battery|gpu)\b/gi,
      '$1 $2'
    )
    s = s.replace(
      /\bconnect(myphone|phone|android)\b/gi,
      'connect $1'
    )
    return s.replace(/\s+/g, ' ').trim()
  }

  async plan(prompt: string): Promise<AgentPlan> {
    const normalized = this.normalizeInput(prompt)
    const lower = normalized.toLowerCase()
    const plan: StructuredToolCall[] = []

    // ────────────────────────────────────────────────────────────
    // Compound splitting by connectors: and, then, also, commas
    // ────────────────────────────────────────────────────────────
    const segments = normalized
      .split(/\s*(?:,\s*and\s+then\s+|\s+and\s+then\s+|\s+as\s+well\s+as\s+|\s+and\s+also\s+|\s+also\s+|\s+plus\s+|\s+then\s+|\s*,\s*and\s+|\s+and\s+|\s*,\s*|\s*;\s*|\s*&\s*|\s*\+\s*|\n+)\s*/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const segment of segments) {
      const segLower = segment.toLowerCase().trim()

      // System Telemetry
      if (segLower.includes('time') && (segLower.includes('what') || segLower.includes('tell') || segLower.includes('current') || segLower.includes('show'))) {
        plan.push({ tool: 'system.getTime', arguments: {} })
        continue
      }
      if (segLower.includes('date') || segLower.includes('today') || segLower.includes('day')) {
        plan.push({ tool: 'system.getDate', arguments: {} })
        continue
      }
      if (segLower.includes('cpu') || segLower.includes('processor')) {
        plan.push({ tool: 'system.getCpu', arguments: {} })
        continue
      }
      if (segLower.includes('memory') || segLower.includes('ram')) {
        plan.push({ tool: 'system.getMemory', arguments: {} })
        continue
      }
      if (segLower.includes('disk') || segLower.includes('storage') || segLower.includes('drive space')) {
        plan.push({ tool: 'system.getDisk', arguments: {} })
        continue
      }
      if (segLower.includes('process') || segLower.includes('tasks running') || segLower.includes('running processes')) {
        plan.push({ tool: 'system.getProcesses', arguments: {} })
        continue
      }

      // Android ADB Phone Connection (STRICTLY ADB ONLY)
      if (
        segLower.includes('connect my phone') ||
        segLower.includes('connect phone') ||
        segLower.includes('connect to phone') ||
        segLower.includes('connect to my phone') ||
        segLower.includes('connect android') ||
        segLower.includes('link phone') ||
        segLower.includes('link my phone') ||
        segLower.includes('pair phone') ||
        segLower.includes('pair my phone') ||
        segLower.includes('detect phone') ||
        segLower.includes('detect my phone') ||
        segLower.includes('find my phone') ||
        segLower.includes('find phone') ||
        segLower.includes('check my phone') ||
        segLower.includes('check phone') ||
        segLower.includes('phone status') ||
        segLower.includes('adb connect') ||
        segLower === 'phone' ||
        (segLower.includes('phone') && (
          segLower.includes('connect') ||
          segLower.includes('check') ||
          segLower.includes('attached') ||
          segLower.includes('devices') ||
          segLower.includes('battery') ||
          segLower.includes('status') ||
          segLower.includes('link') ||
          segLower.includes('pair') ||
          segLower.includes('find') ||
          segLower.includes('detect')
        ))
      ) {
        const ipMatch = segment.match(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/)
        const target = ipMatch ? ipMatch[0] : undefined

        if (segLower.includes('battery') && !segLower.includes('connect')) {
          plan.push({ tool: 'adb.getDevices', arguments: {} })
        } else {
          plan.push({ tool: 'adb.connect', arguments: target ? { target } : {} })
        }
        continue
      }

      // Network & Wi-Fi
      if (segLower.includes('wifi') || segLower.includes('wi-fi')) {
        if (segLower.includes('turn on') || segLower.includes('enable') || segLower.includes('switch on')) {
          plan.push({ tool: 'network.enableWifi', arguments: {} })
        } else if (segLower.includes('turn off') || segLower.includes('disable') || segLower.includes('switch off')) {
          plan.push({ tool: 'network.disableWifi', arguments: {} })
        } else {
          plan.push({ tool: 'network.getWifiStatus', arguments: {} })
        }
        continue
      }
      if (segLower.includes('ip') || segLower.includes('ip address') || segLower.includes('my ip')) {
        plan.push({ tool: 'network.getIp', arguments: {} })
        continue
      }
      if (segLower.includes('adapter') || segLower.includes('network adapters')) {
        plan.push({ tool: 'network.getAdapters', arguments: {} })
        continue
      }
      if (segLower.includes('network status') || segLower.includes('internet status')) {
        plan.push({ tool: 'network.getStatus', arguments: {} })
        continue
      }

      // Applications
      if (
        segLower.startsWith('open ') ||
        segLower.startsWith('launch ') ||
        segLower.startsWith('start ') ||
        segLower.startsWith('run ') ||
        ['calculator', 'notepad', 'chrome', 'explorer', 'settings'].includes(segLower)
      ) {
        const rawApp = segLower.replace(/^(open|launch|start|run)\s+/i, '').trim() || segLower
        const cleanApp = rawApp.replace(/^(the|a)\s+/i, '').trim()

        if (cleanApp.includes('settings')) {
          const page = cleanApp.includes('wifi') ? 'wifi' : cleanApp.includes('bluetooth') ? 'bluetooth' : 'system'
          plan.push({ tool: 'settings.open', arguments: { page } })
        } else if (cleanApp.includes('explorer')) {
          plan.push({ tool: 'apps.open', arguments: { app: 'explorer' } })
        } else {
          plan.push({ tool: 'apps.open', arguments: { app: cleanApp } })
        }
        continue
      }

      // Windows Settings
      if (segLower.includes('settings')) {
        const page = segLower.includes('wifi') ? 'wifi' : segLower.includes('bluetooth') ? 'bluetooth' : 'system'
        plan.push({ tool: 'settings.open', arguments: { page } })
        continue
      }

      // Filesystem - Folder
      if (
        (segLower.includes('create') && segLower.includes('folder')) ||
        (segLower.includes('create') && segLower.includes('directory')) ||
        segLower.startsWith('mkdir')
      ) {
        let folderName = 'ULTRON_TEST'
        const calledMatch = segment.match(/(?:called|named)\s+([A-Za-z0-9_\-]+)/i)
        const prefixMatch = segment.match(/create\s+(?:a\s+)?([A-Za-z0-9_\-]+)\s+folder/i)
        const postfixMatch = segment.match(/folder\s+([A-Za-z0-9_\-]+)/i)

        if (calledMatch) {
          folderName = calledMatch[1].trim()
        } else if (prefixMatch && prefixMatch[1].toLowerCase() !== 'a' && prefixMatch[1].toLowerCase() !== 'new') {
          folderName = prefixMatch[1].trim()
        } else if (postfixMatch && !['called', 'named', 'on', 'in'].includes(postfixMatch[1].toLowerCase())) {
          folderName = postfixMatch[1].trim()
        }

        const base = (segLower.includes('documents') ? 'Documents' : segLower.includes('downloads') ? 'Downloads' : 'Desktop')
        const target = path.join(base, folderName)
        OfflineCapabilityRouter.lastCreatedFolder = target
        plan.push({ tool: 'filesystem.createDirectory', arguments: { path: target } })
        continue
      }

      // Filesystem - File
      if (
        segLower.includes('create a test file') ||
        segLower.includes('create test file') ||
        segLower.includes('create a file') ||
        segLower.includes('create file') ||
        segLower.startsWith('touch ')
      ) {
        let fileName = 'test.txt'
        const match = segment.match(/called\s+([A-Za-z0-9_\-\.]+)/i) || segment.match(/file\s+([A-Za-z0-9_\-\.]+)/i)
        if (match && !['test', 'a', 'the'].includes(match[1].toLowerCase())) {
          fileName = match[1].trim()
        }

        let baseLocation = OfflineCapabilityRouter.lastCreatedFolder || 'Desktop'
        const insideMatch = segment.match(/(?:inside|in)\s+([A-Za-z0-9_\-]+)/i)
        if (insideMatch && !['the', 'a', 'desktop', 'documents', 'downloads'].includes(insideMatch[1].toLowerCase())) {
          baseLocation = path.join('Desktop', insideMatch[1].trim())
        }

        const targetFile = path.join(baseLocation, fileName)
        OfflineCapabilityRouter.lastCreatedFile = targetFile
        OfflineCapabilityRouter.lastCreatedFolder = baseLocation

        plan.push({
          tool: 'filesystem.createFile',
          arguments: { path: targetFile, content: `# ULTRON VERIFICATION ${Date.now()}\n` }
        })
        continue
      }

      // Filesystem - Read
      if (segLower.startsWith('read ') || segLower.includes('read file') || segLower.includes('show content')) {
        let target = OfflineCapabilityRouter.lastCreatedFile || 'Desktop/ULTRON_TEST/test.txt'
        const rawTarget = segment.replace(/^(read file|read|show content of)\s+/i, '').trim()
        if (rawTarget && !rawTarget.includes('test file')) {
          if (!rawTarget.includes('/') && !rawTarget.includes('\\')) {
            target = OfflineCapabilityRouter.lastCreatedFolder
              ? path.join(OfflineCapabilityRouter.lastCreatedFolder, rawTarget)
              : path.join('Desktop', rawTarget)
          } else {
            target = rawTarget
          }
        }
        plan.push({ tool: 'filesystem.read', arguments: { path: target } })
        continue
      }

      // Filesystem - Copy
      if (segLower.startsWith('copy ') || segLower.includes('copy file')) {
        const folder = OfflineCapabilityRouter.lastCreatedFolder || 'Desktop/ULTRON_TEST'
        let src = OfflineCapabilityRouter.lastCreatedFile || path.join(folder, 'test.txt')
        let dest = path.join(folder, 'test_copy.txt')

        const copyMatch = segment.match(/copy\s+(?:file\s+)?(.+?)\s+to\s+(.+)$/i)
        if (copyMatch) {
          src = copyMatch[1].trim()
          dest = copyMatch[2].trim()
        }
        plan.push({ tool: 'filesystem.copy', arguments: { source: src, destination: dest } })
        continue
      }

      // Filesystem - Move
      if (segLower.startsWith('move ') || segLower.includes('move file')) {
        const folder = OfflineCapabilityRouter.lastCreatedFolder || 'Desktop/ULTRON_TEST'
        let src = path.join(folder, 'test.txt')
        let dest = path.join(folder, 'test_moved.txt')

        const moveMatch = segment.match(/move\s+(?:file\s+)?(.+?)\s+to\s+(.+)$/i)
        if (moveMatch) {
          src = moveMatch[1].trim()
          dest = moveMatch[2].trim()
        }
        plan.push({ tool: 'filesystem.move', arguments: { source: src, destination: dest } })
        continue
      }

      // Filesystem - Search / Find
      if (segLower.startsWith('find ') || segLower.startsWith('search file') || segLower.startsWith('locate ')) {
        let query = segment.replace(/^(find all|search file|find file|find files|locate|search for|find)\s+/i, '').trim()
        query = query.replace(/\s+(?:on|in)\s+(?:desktop|documents|downloads|c:).*$/i, '').trim()
        plan.push({ tool: 'filesystem.search', arguments: { query: query || 'test', root: OfflineCapabilityRouter.lastCreatedFolder || 'Desktop' } })
        continue
      }

      // Filesystem - Delete
      if (segLower.startsWith('delete ') || segLower.startsWith('remove ') || segLower.includes('test artifact')) {
        const isArtifactCleanup = segLower.includes('test artifact') || segLower.includes('test artifacts')
        let target = isArtifactCleanup
          ? (OfflineCapabilityRouter.lastCreatedFolder || 'Desktop/ULTRON_TEST')
          : segment.replace(/^(delete|remove|rm)\s+(?:file\s+|folder\s+)?/i, '').trim()

        if (target && !target.includes('/') && !target.includes('\\')) {
          if (OfflineCapabilityRouter.lastCreatedFolder && OfflineCapabilityRouter.lastCreatedFolder.endsWith(target)) {
            target = OfflineCapabilityRouter.lastCreatedFolder
          } else {
            target = path.join('Desktop', target)
          }
        }
        plan.push({ tool: 'filesystem.delete', arguments: { path: target } })
        continue
      }

      // Security
      if (segLower.includes('firewall')) {
        plan.push({ tool: 'security.getFirewallStatus', arguments: {} })
        continue
      }
      if (segLower.includes('defender') || segLower.includes('antivirus')) {
        plan.push({ tool: 'security.getDefenderStatus', arguments: {} })
        continue
      }
      if (segLower.includes('listening ports') || segLower.includes('ports')) {
        plan.push({ tool: 'security.getListeningPorts', arguments: {} })
        continue
      }

      // Web / Video Research
      if (segLower.startsWith('search youtube') || segLower.includes('youtube')) {
        const q = segment.replace(/^(search youtube for|search youtube|show on youtube|youtube)\s+/i, '').trim() || segment
        plan.push({ tool: 'research.youtube', arguments: { query: q } })
        continue
      }
      if (segLower.startsWith('search bing') || segLower.startsWith('search google') || segLower.startsWith('search web')) {
        const q = segment.replace(/^(search bing for|search google for|search web for|search bing|search google|search web)\s+/i, '').trim() || segment
        plan.push({ tool: 'research.search', arguments: { query: q } })
        continue
      }
    }

    if (plan.length > 0) {
      return {
        thought: 'Decomposed deterministic offline intent into registered tool calls',
        plan,
        needsClarification: false
      }
    }

    // Pure conversational fallback if no PC tools mapped
    return {
      thought: 'No local tool mapped for this query; providing offline status response',
      plan: [],
      needsClarification: false,
      directResponse: `⚡ **ULTRON (Offline Mode)**: I am in local tool mode. You can ask me to open apps (Calculator, Notepad, Chrome), inspect system telemetry (CPU, RAM, Disk, Time), control Wi-Fi/IP, manage files, or open Windows settings.`
    }
  }
}

// ══════════════════════════════════════════════════════════════════
// Helper: Parse structured plan from model output
// ══════════════════════════════════════════════════════════════════
function parseModelOutput(content: string, fallbackPrompt: string): AgentPlan {
  // Check for ```json block
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  const rawJson = jsonMatch ? jsonMatch[1].trim() : content.trim()

  try {
    const parsed = JSON.parse(rawJson)
    if (parsed && typeof parsed === 'object') {
      return {
        thought: parsed.thought || 'Model generated plan',
        plan: Array.isArray(parsed.plan) ? parsed.plan : [],
        needsClarification: Boolean(parsed.needsClarification),
        clarificationQuestion: parsed.clarificationQuestion || null,
        directResponse: parsed.directResponse || null
      }
    }
  } catch {}

  // Fallback: If model returned raw natural language without JSON
  return {
    thought: 'Model responded in natural text',
    plan: [],
    needsClarification: false,
    directResponse: content
  }
}
