// src/shared/types.ts — ULTRON shared type definitions

// ── Agent States ──────────────────────────────────────────────
export type OrbState =
  | 'IDLE' | 'LISTENING' | 'THINKING' | 'PLANNING'
  | 'EXECUTING' | 'CALLING' | 'MESSAGING' | 'RESEARCHING'
  | 'SCANNING' | 'ALERT' | 'SUCCESS' | 'ERROR' | 'BLOCKED'

// ── Risk Levels ───────────────────────────────────────────────
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// ── Claude-Style Activity Timeline ─────────────────────────────
export type TimelineItemStatus =
  | 'UNDERSTANDING'
  | 'SEARCHING'
  | 'PLANNING'
  | 'WAITING'
  | 'PERMISSION'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED'

export interface ActivityTimelineItem {
  id: string
  icon?: string
  title: string
  status: TimelineItemStatus
  durationMs: number
  detail?: string
}

export interface ActivityTimeline {
  items: ActivityTimelineItem[]
  totalDurationMs: number
  status: 'running' | 'completed' | 'failed'
}

// ── Screen Sharing & Multimodal Vision ──────────────────────────
export interface ScreenSource {
  id: string
  name: string
  thumbnail: string
  display_id?: string
  appIcon?: string
}

export interface ScreenShareState {
  isSharing: boolean
  selectedSource?: ScreenSource
  previewUrl?: string
  lastCaptureTime?: number
}

// ── Visual Computer Control ──────────────────────────────────
export interface VisualElementBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface VisualElement {
  id: string
  role: 'button' | 'input' | 'window' | 'menu' | 'link' | 'text' | 'icon' | 'error_dialog' | 'dialog' | 'unknown'
  label: string
  bounds: VisualElementBounds
  confidence: number
  enabled: boolean
  action?: 'click' | 'type' | 'focus' | 'read'
  verified?: boolean
}

// ── Chat Messages ─────────────────────────────────────────────
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  streaming?: boolean
  actionCard?: ActionCard
  confirmationCard?: ConfirmationCard
  activityTimeline?: ActivityTimeline
  selectedModel?: string
  latencyMs?: number
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
  confirmLabel?: string
  cancelLabel?: string
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
  | 'activity' | 'skills' | 'developer' | 'permissions' | 'about'
  | 'tasks' | 'diagnostics' | 'search'

// ── V1.0.4 Universal PC Search Types ─────────────────────────
export type SearchCategory = 'all' | 'app' | 'file' | 'project' | 'memory' | 'conversation' | 'task' | 'git'

export interface SearchSafeAction {
  type: 'open_app' | 'open_file' | 'switch_workspace' | 'recall_memory' | 'view_task' | 'run_command'
  target: string
}

export interface UniversalSearchResult {
  id: string
  type: 'app' | 'file' | 'project' | 'memory' | 'conversation' | 'task' | 'git'
  title: string
  subtitle?: string
  path?: string
  relevance: number // 0 - 100
  timestamp?: number
  safeAction: SearchSafeAction
}

// ── V1.0.4 Self-Diagnostics / Health Check Types ─────────────
export type DiagnosticStatus = 'PASS' | 'WARN' | 'FAIL' | 'UNAVAILABLE'

export interface DiagnosticCheckItem {
  id: string
  name: string
  category: 'system' | 'runtime' | 'ai' | 'hardware' | 'network' | 'services'
  status: DiagnosticStatus
  message: string
  details?: string
  latencyMs?: number
}

export interface DiagnosticsReport {
  timestamp: number
  ultronVersion: string
  platform: string
  arch: string
  nodeVersion: string
  electronVersion: string
  totalChecks: number
  passedChecks: number
  warnedChecks: number
  failedChecks: number
  unavailableChecks: number
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
  items: DiagnosticCheckItem[]
}

// ── V1.0.4 Smart Workspace Types ─────────────────────────────
export interface WorkspaceProjectInfo {
  id: string
  name: string
  path: string
  isGit: boolean
  branch?: string
  packageJson?: {
    name?: string
    version?: string
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  recentFiles?: string[]
  lastOpened: number
}

export interface WorkspaceContext {
  activeProject?: WorkspaceProjectInfo
  allProjects: WorkspaceProjectInfo[]
}

// ── V1.0.4 Background Task System Types ───────────────────────
export type BackgroundTaskStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'PAUSED'
  | 'WAITING_PERMISSION'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export interface BackgroundTaskLog {
  timestamp: number
  level: 'info' | 'warn' | 'error'
  message: string
}

export interface BackgroundTask {
  id: string
  title: string
  description?: string
  category: 'APP' | 'FILESYSTEM' | 'ADB' | 'RESEARCH' | 'SECURITY' | 'POWERSHELL' | 'AI' | 'BUILD' | 'DIAGNOSTICS'
  status: BackgroundTaskStatus
  progress: number // 0 - 100
  logs: BackgroundTaskLog[]
  startTime: number
  endTime?: number
  durationMs: number
  error?: string
  result?: unknown
}

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
  | 'personal'
  | 'conversation'
  | 'project'
  | 'task'
  | 'action'
  | 'fact'
  | 'preference'
  | 'tool_execution'
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
    onDone: (callback: (data: { id: string; report?: TaskExecutionReport; timeline?: ActivityTimeline }) => void) => () => void
    onError: (callback: (data: { id: string; error: string }) => void) => () => void
    onStateChange: (callback: (state: OrbState) => void) => () => void
    onTasksUpdate?: (callback: (tasks: ConcurrentTask[]) => void) => () => void
    onTimelineUpdate?: (callback: (data: { messageId: string; item: ActivityTimelineItem }) => void) => () => void
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
  screen?: {
    getSources: (types?: ('screen' | 'window')[]) => Promise<ScreenSource[]>
    captureFrame: (sourceId?: string) => Promise<{ success: boolean; dataUrl?: string; error?: string }>
    analyzeScreen: (prompt?: string, sourceId?: string) => Promise<{ success: boolean; description?: string; error?: string }>
    setSharingState: (active: boolean, sourceId?: string) => Promise<{ success: boolean; active: boolean; error?: string }>
    getSharingState: () => Promise<ScreenShareState>
  }
  permissions?: {
    getAll: () => Promise<Record<string, any>>
    set: (category: string, level: string) => Promise<boolean>
    reset: () => Promise<boolean>
    getAudit: (limit?: number) => Promise<any[]>
    grantTemporary: (category: string, action: string, durationMs?: number) => Promise<boolean>
  }
  developer?: {
    inspectProject: (rootPath?: string) => Promise<any>
    checkTypescript: (rootPath?: string) => Promise<{ success: boolean; clean: boolean; errors: string[]; count: number }>
    checkBuild: (rootPath?: string) => Promise<{ success: boolean; output: string }>
    gitStatus: (rootPath?: string) => Promise<{ branch: string; status: string; recentCommits: string[] }>
  }
  skills?: {
    list: () => Promise<any[]>
    get: (skillId: string) => Promise<any>
  }
  models?: {
    getAll: () => Promise<any[]>
    getByTier: (tier: string) => Promise<any[]>
  }
  router?: {
    getTelemetry: () => Promise<any[]>
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
  search?: {
    query: (text: string, category?: SearchCategory) => Promise<UniversalSearchResult[]>
    executeAction: (action: SearchSafeAction) => Promise<{ success: boolean; message?: string; error?: string }>
  }
  diagnostics?: {
    run: () => Promise<DiagnosticsReport>
    getLatest: () => Promise<DiagnosticsReport | null>
    copyReport: () => Promise<boolean>
  }
  workspace?: {
    getActive: () => Promise<WorkspaceProjectInfo | null>
    listRecent: () => Promise<WorkspaceProjectInfo[]>
    setActive: (projectPath: string) => Promise<WorkspaceProjectInfo>
    inspectCurrent: () => Promise<WorkspaceContext>
  }
  tasks?: {
    list: () => Promise<BackgroundTask[]>
    get: (id: string) => Promise<BackgroundTask | null>
    cancel: (id: string) => Promise<boolean>
    pause: (id: string) => Promise<boolean>
    resume: (id: string) => Promise<boolean>
    getLogs: (id: string) => Promise<BackgroundTaskLog[]>
    onUpdate?: (callback: (tasks: BackgroundTask[]) => void) => () => void
  }
}