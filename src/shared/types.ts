// src/shared/types.ts — ULTRON shared type definitions

// ── Agent States ──────────────────────────────────────────────
export type OrbState =
  | 'IDLE' | 'LISTENING' | 'THINKING' | 'PLANNING'
  | 'EXECUTING' | 'CALLING' | 'MESSAGING' | 'RESEARCHING'
  | 'SCANNING' | 'ALERT' | 'SUCCESS' | 'ERROR' | 'BLOCKED'

// ── Risk Levels ───────────────────────────────────────────────
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// ── Chat Messages ─────────────────────────────────────────────
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  streaming?: boolean
  actionCard?: ActionCard
  confirmationCard?: ConfirmationCard
}

export interface ActionCard {
  id: string
  tool: string
  action: string
  target: string
  status: 'pending' | 'running' | 'success' | 'error'
  result?: string
  error?: string
}

export interface ConfirmationCard {
  id: string
  action: string
  target: string
  risk: RiskLevel
  description: string
  confirmed?: boolean
}

// ── Tool System ───────────────────────────────────────────────
export interface ToolCall {
  id: string
  tool: string
  action: string
  args: Record<string, unknown>
}

export interface ToolResult {
  id: string
  success: boolean
  data?: unknown
  error?: string
  duration_ms: number
}

// ── Action Audit ──────────────────────────────────────────────
export interface AuditEntry {
  action_id: string
  session_id: string
  intent: string
  tool: string
  target: string
  args: Record<string, unknown>
  risk: RiskLevel
  confirmation: boolean
  timestamp: number
  start_ms: number
  end_ms: number
  duration_ms: number
  result: 'success' | 'error' | 'cancelled' | 'blocked'
  error?: string
  rollback_available: boolean
}

// ── Sidebar Navigation ────────────────────────────────────────
export type NavPage =
  | 'home' | 'ai' | 'phone' | 'calls' | 'messages'
  | 'contacts' | 'research' | 'cybersecurity' | 'logs'
  | 'vulnerability-scanner' | 'threat-intel' | 'incidents'
  | 'network' | 'files' | 'apps' | 'powershell'
  | 'memory' | 'settings' | 'plugins'

// ── Settings ──────────────────────────────────────────────────
export interface UltronSettings {
  ai: {
    model: string
    endpoint: string
    temperature: number
    maxTokens: number
    systemPrompt: string
  }
  voice: {
    enabled: boolean
    pushToTalk: boolean
    wakeWord: boolean
    inputDevice: string
  }
  tts: {
    enabled: boolean
    voice: string
    speed: number
    volume: number
    outputDevice: string
  }
  appearance: {
    theme: 'dark' | 'midnight' | 'abyss'
    orbIntensity: number
    reducedMotion: boolean
    fontSize: number
  }
  security: {
    confirmationPolicy: 'always' | 'medium-and-above' | 'high-and-above' | 'never'
    trustedContacts: string[]
  }
  adb: {
    executablePath: string
    autoConnect: boolean
    wifiDebugging: boolean
  }
}

// ── Concurrent Multitasking & Millisecond Telemetry ─────────
export type TaskStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface ConcurrentTask {
  id: string
  name: string
  category: 'APP' | 'FILESYSTEM' | 'ADB' | 'RESEARCH' | 'SECURITY' | 'POWERSHELL' | 'AI'
  command: string
  status: TaskStatus
  startTime: number
  endTime?: number
  durationMs: number
  result?: any
  error?: string
}

export interface TaskExecutionReport {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  totalDurationMs: number
  tasks: ConcurrentTask[]
}

export interface PerformanceMetrics {
  lastExecutionMs: number
  averageLatencyMs: number
  activeConcurrentTasks: number
  peakTasksCount: number
  totalCommandsExecuted: number
}

// ── Memory Subsystem Types ────────────────────────────────────
export type MemoryCategory =
  | 'conversation'
  | 'fact'
  | 'preference'
  | 'task'
  | 'tool_execution'
  | 'action'
  | 'research'
  | 'context'

export interface MemoryRecord {
  id: string
  category: MemoryCategory
  key?: string
  content: string
  metadata?: Record<string, unknown>
  tags?: string[]
  created_at: number
  updated_at: number
}

export interface MemorySearchParams {
  query?: string
  category?: MemoryCategory | string
  limit?: number
  offset?: number
}

export interface MemoryStats {
  total: number
  byCategory: Record<string, number>
  lastUpdated: number
}

// ── Preload API ───────────────────────────────────────────────
export interface UltronAPI {
  chat: {
    send: (message: string, clientMessageId?: string) => Promise<any>
    onChunk: (callback: (data: { id: string; chunk: string }) => void) => () => void
    onDone: (callback: (data: { id: string; report?: TaskExecutionReport }) => void) => () => void
    onError: (callback: (data: { id: string; error: string }) => void) => () => void
    onStateChange: (callback: (state: OrbState) => void) => () => void
    onTasksUpdate?: (callback: (tasks: ConcurrentTask[]) => void) => () => void
    cancel: () => Promise<void>
  }
  tools: {
    execute: (call: ToolCall) => Promise<ToolResult>
    confirm: (id: string, confirmed: boolean) => Promise<void>
  }
  memory: {
    list: (options?: { category?: string; limit?: number; offset?: number }) => Promise<{ records: MemoryRecord[]; total: number }>
    search: (params: MemorySearchParams) => Promise<MemoryRecord[]>
    save: (entry: { category: MemoryCategory; key?: string; content: string; metadata?: Record<string, unknown>; tags?: string[] }) => Promise<MemoryRecord>
    delete: (id: string) => Promise<boolean>
    clear: () => Promise<boolean>
    getStats: () => Promise<MemoryStats>
  }
  settings: {
    get: () => Promise<UltronSettings>
    set: (settings: Partial<UltronSettings>) => Promise<void>
  }
  system: {
    getVersion: () => Promise<string>
    getPlatform: () => Promise<string>
    getTasks?: () => Promise<ConcurrentTask[]>
  }
  voice?: {
    transcribe: (audioBase64: string, language?: string) => Promise<any>
    processCommand: (audioBase64: string, language?: string) => Promise<any>
    getStatus: () => Promise<any>
    switchModel: (modelName: string) => Promise<any>
    warmup: () => Promise<any>
    onState: (callback: (state: string) => void) => void
    onTranscript: (callback: (text: string) => void) => void
  }
}