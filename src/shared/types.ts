// src/shared/types.ts — ULTRON shared type definitions

// ── Agent States ──────────────────────────────────────────────
export type OrbState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SEARCHING'
  | 'ANALYZING'
  | 'PLANNING'
  | 'WAITING_PERMISSION'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'SUCCESS'
  | 'ERROR'
  | 'OFFLINE'
  | 'PHONE_CONNECTED'
  | 'SCREEN_ANALYZING'
  | 'MISSION_RUNNING'
  | 'CALLING'
  | 'MESSAGING'
  | 'RESEARCHING'
  | 'SCANNING'
  | 'ALERT'
  | 'BLOCKED'

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
  screenMemory?: {
    getLatest: () => Promise<ScreenMemoryEntry | null>
    list: (limit?: number) => Promise<ScreenMemoryEntry[]>
    forget: () => Promise<boolean>
  }
  missions?: {
    list: () => Promise<Mission[]>
    get: (id: string) => Promise<Mission | null>
    create: (data: { title: string; description: string; steps?: Array<{ title: string; description: string; tool?: string; args?: any; requiredPermission?: string }> }) => Promise<Mission>
    start: (id: string) => Promise<Mission>
    pause: (id: string) => Promise<boolean>
    resume: (id: string) => Promise<boolean>
    cancel: (id: string) => Promise<boolean>
    retryStep: (missionId: string, stepId: string) => Promise<boolean>
    onUpdate?: (callback: (missions: Mission[]) => void) => () => void
  }
  workflows?: {
    plan: (goal: string) => Promise<Workflow>
    execute: (workflowId: string) => Promise<Workflow>
    list: () => Promise<Workflow[]>
    cancel: (id: string) => Promise<boolean>
  }
  documents?: {
    index: (filePath: string) => Promise<DocumentMeta>
    query: (query: string, docId?: string) => Promise<DocumentQueryResult>
    list: () => Promise<DocumentMeta[]>
    delete: (docId: string) => Promise<boolean>
  }
  recovery?: {
    list: (limit?: number) => Promise<RecoveryAction[]>
    undo: (actionId?: string) => Promise<{ success: boolean; message: string; action?: RecoveryAction }>
    redo: (actionId?: string) => Promise<{ success: boolean; message: string; action?: RecoveryAction }>
  }
  preferences?: {
    getAll: () => Promise<UserPreference[]>
    get: (key: string) => Promise<any>
    set: (key: string, value: any, category?: string) => Promise<boolean>
    delete: (key: string) => Promise<boolean>
    reset: () => Promise<boolean>
  }
  history?: {
    list: (filter?: { category?: string; status?: string; query?: string; limit?: number; offset?: number }) => Promise<TaskHistoryRecord[]>
    get: (id: string) => Promise<TaskHistoryRecord | null>
    clear: () => Promise<boolean>
  }
  securityCenter?: {
    getReport: () => Promise<any>
    getAudit: (limit?: number) => Promise<any[]>
  }
  network?: {
    getStatus: () => Promise<NetworkStatus>
    ping: (host?: string) => Promise<{ reachable: boolean; latencyMs?: number }>
  }
  repair?: {
    listKnownFixes: () => Promise<SafeRepairItem[]>
    executeRepair: (repairId: string) => Promise<{ success: boolean; message: string; diagnosticBefore: any; diagnosticAfter: any }>
  }
  notifications?: {
    list: (limit?: number) => Promise<UltronNotification[]>
    dismiss: (id: string) => Promise<boolean>
    clearAll: () => Promise<boolean>
    onNotification?: (callback: (notification: UltronNotification) => void) => () => void
  }
  customSkills?: {
    list: () => Promise<CustomSkillDefinition[]>
    create: (skill: Omit<CustomSkillDefinition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CustomSkillDefinition>
    update: (id: string, updates: Partial<CustomSkillDefinition>) => Promise<CustomSkillDefinition>
    delete: (id: string) => Promise<boolean>
    toggle: (id: string, enabled: boolean) => Promise<boolean>
  }
  actionPreview?: {
    onPreview?: (callback: (preview: ActionPreview) => void) => () => void
    respond: (previewId: string, approved: boolean, modifications?: any) => Promise<boolean>
  }
}

// ══════════════════════════════════════════════════════════════════
// V1.0.5 TYPES & INTERFACES
// ══════════════════════════════════════════════════════════════════

// ── Screen Memory ───────────────────────────────────────────────
export interface ScreenMemoryEntry {
  screenContextId: string
  timestamp: number
  application: string
  window: string
  detectedElements: VisualElement[]
  recognizedText: string
  taskId?: string
  confidence: number
  summary: string
  sourceId?: string
}

// ── Mission Mode ────────────────────────────────────────────────
export type MissionStatus =
  | 'PLANNED'
  | 'READY'
  | 'RUNNING'
  | 'WAITING_PERMISSION'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'
  | 'CANCELLED'
  | 'PAUSED'

export type MissionStepStatus =
  | 'PLANNED'
  | 'READY'
  | 'RUNNING'
  | 'WAITING_PERMISSION'
  | 'COMPLETED'
  | 'FAILED'
  | 'SKIPPED'
  | 'CANCELLED'

export interface MissionStep {
  id: string
  missionId: string
  stepNumber: number
  title: string
  description: string
  status: MissionStepStatus
  dependencies: string[]
  tool?: string
  args?: Record<string, any>
  requiredPermission?: string
  startedAt?: number
  completedAt?: number
  durationMs?: number
  result?: any
  error?: string
  retryCount: number
  maxRetries: number
}

export interface Mission {
  id: string
  title: string
  description: string
  status: MissionStatus
  steps: MissionStep[]
  startedAt?: number
  completedAt?: number
  totalDurationMs?: number
  createdAt: number
  updatedAt: number
}

// ── Multi-App Workflows ─────────────────────────────────────────
export type WorkflowStatus = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface WorkflowStep {
  id: string
  workflowId: string
  stepIndex: number
  app: string
  action: string
  params: Record<string, any>
  verification: {
    check: 'process_running' | 'port_active' | 'window_open' | 'file_exists' | 'custom'
    expected?: any
    timeoutMs?: number
  }
  status: 'PENDING' | 'RUNNING' | 'VERIFYING' | 'SUCCESS' | 'FAILED'
  durationMs?: number
  error?: string
}

export interface Workflow {
  id: string
  name: string
  description: string
  status: WorkflowStatus
  steps: WorkflowStep[]
  createdAt: number
  updatedAt: number
}

// ── Document Intelligence ───────────────────────────────────────
export interface DocumentMeta {
  id: string
  path: string
  fileName: string
  fileType: 'pdf' | 'txt' | 'md' | 'code' | 'image' | 'unknown'
  sizeBytes: number
  pageCount?: number
  indexedAt: number
  summary?: string
  topics?: string[]
}

export interface DocumentChunk {
  id: string
  docId: string
  fileName: string
  pageNumber?: number
  sectionTitle?: string
  chunkIndex: number
  text: string
  tokenCount?: number
}

export interface DocumentQueryResult {
  answer: string
  confidence: number
  citations: Array<{
    docId: string
    fileName: string
    pageNumber?: number
    sectionTitle?: string
    snippet: string
  }>
  queryDurationMs: number
}

// ── Agent Sandbox / Action Preview ──────────────────────────────
export interface PlannedActionItem {
  id: string
  type: string
  target: string
  description: string
  reversible: boolean
  requiredPermission?: string
}

export interface ActionPreview {
  id: string
  missionId?: string
  workflowId?: string
  title: string
  description: string
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  plannedActions: PlannedActionItem[]
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED'
  createdAt: number
}

// ── Undo / Recovery System ──────────────────────────────────────
export interface RecoveryAction {
  actionId: string
  timestamp: number
  operationType: 'file_edit' | 'file_move' | 'file_copy' | 'file_rename' | 'config_change' | 'other'
  target: string
  beforeState: string // file backup path or serialized state
  afterState: string
  reversible: boolean
  rolledBack: boolean
  details?: string
}

// ── Custom Skills ───────────────────────────────────────────────
export interface CustomSkillDefinition {
  id: string
  name: string
  description: string
  version: string
  capabilities: string[]
  tools: string[]
  permissions: string[]
  triggers: string[]
  workflow?: any
  enabled: boolean
  createdAt: number
  updatedAt: number
}

// ── Personal Preference Engine ──────────────────────────────────
export interface UserPreference {
  key: string
  value: any
  category: 'model' | 'workspace' | 'style' | 'app' | 'general' | 'notifications'
  updatedAt: number
}

// ── Detailed Task History ───────────────────────────────────────
export type HistoryCategory =
  | 'ALL'
  | 'MISSIONS'
  | 'WINDOWS'
  | 'ANDROID'
  | 'FILES'
  | 'BROWSER'
  | 'RESEARCH'
  | 'CODING'
  | 'SECURITY'
  | 'SYSTEM'
  | 'AI'

export interface TaskHistoryRecord {
  id: string
  timestamp: number
  missionId?: string
  taskId?: string
  actionId?: string
  userRequest: string
  intent: string
  skill: string
  tool?: string
  target?: string
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'BLOCKED' | 'WAITING' | 'PARTIAL'
  startTime: number
  endTime: number
  durationMs: number
  modelUsed?: string
  modelLatencyMs?: number
  toolLatencyMs?: number
  permissionState?: string
  resultSummary?: string
  error?: string
  recoveryInfo?: string
  verificationResult?: string
  category: HistoryCategory
}

// ── Local Network Awareness ─────────────────────────────────────
export interface NetworkStatus {
  status: 'ONLINE' | 'OFFLINE' | 'LIMITED' | 'UNKNOWN'
  activeInterface: string
  localIp: string
  gateway: string
  dns: string[]
  internetReachable: boolean
  latencyMs?: number
}

// ── One-Click Safe Repair ───────────────────────────────────────
export interface SafeRepairItem {
  id: string
  subsystem: string
  problem: string
  possibleFix: string
  whatWillChange: string
  canAutomate: boolean
  repairAction: string
}

// ── Smart Notifications ─────────────────────────────────────────
export interface UltronNotification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: number
  read: boolean
  dismissed: boolean
  actionUrl?: string
}

// ── Multi-Model Verification ────────────────────────────────────
export interface MultiModelVerificationResult {
  primaryModel: string
  reviewModel: string
  primaryResult: string
  reviewResult: string
  agreement: boolean
  consensusResult: string
  verificationLatencyMs: number
}