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
  | 'RECOVERING'
  | 'RETRYING'
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
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'IRREVERSIBLE' | 'CRITICAL'

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

// ── V1.0.6: Goal Memory ─────────────────────────────────────────
export type GoalStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED'

export interface GoalLink {
  id: string
  goalId: string
  linkType: 'mission' | 'task' | 'file' | 'git' | 'decision'
  targetId: string
  title: string
  createdAt: number
}

export interface Goal {
  id: string
  title: string
  project: string
  status: GoalStatus
  createdAt: number
  updatedAt: number
  completedAt?: number
  metadata?: Record<string, any>
  links?: GoalLink[]
}

// ── V1.0.6: Verification Engine ─────────────────────────────────
export type VerificationStrategy =
  | 'process_window'
  | 'filesystem'
  | 'build_artifact'
  | 'web_navigation'
  | 'adb_device'
  | 'research_source'
  | 'mission_steps'
  | 'custom'

export interface VerificationRecord {
  id: string
  actionId: string
  strategy: VerificationStrategy
  status: 'VERIFIED' | 'FAILED' | 'SKIPPED'
  target: string
  durationMs: number
  details?: string
  timestamp: number
}

// ── V1.0.6: Plugin & Skill Store Foundation ─────────────────────
export type PluginTrustState = 'BUILT_IN' | 'VERIFIED' | 'USER_CREATED' | 'UNVERIFIED' | 'BLOCKED'

export type PluginCategory =
  | 'Featured'
  | 'Productivity'
  | 'Developer'
  | 'Research'
  | 'Windows'
  | 'Android'
  | 'Education'
  | 'Utilities'
  | 'Creative'

export interface PluginManifest {
  id: string
  name: string
  version: string
  publisher: string
  description: string
  category: PluginCategory
  permissions: string[]
  skills: string[]
  tools: string[]
  minimumUltronVersion: string
  trustState: PluginTrustState
  enabled: boolean
  installedAt: number
  updatedAt: number
}

// ── V1.0.6: Project Intelligence ────────────────────────────────
export interface ProjectDecision {
  id: string
  projectName: string
  title: string
  context: string
  decision: string
  rationale: string
  timestamp: number
}

export interface ProjectTimelineItem {
  id: string
  projectName: string
  type: 'git_commit' | 'build' | 'mission' | 'decision' | 'document'
  title: string
  summary: string
  timestamp: number
  metadata?: Record<string, any>
}

// ── V1.0.6: Productivity Analytics ──────────────────────────────
export interface ProductivitySummary {
  missionsCompleted: number
  tasksCompleted: number
  failedTasks: number
  avgTaskDurationMs: number
  activeProjectsCount: number
  mostUsedTools: Array<{ tool: string; count: number }>
  mostUsedSkills: Array<{ skill: string; count: number }>
  modelPerformance: Array<{ model: string; avgLatencyMs: number; successRate: number }>
  enabled: boolean
}

// ── V1.0.6: Proactive Suggestions ───────────────────────────────
export interface ProactiveSuggestion {
  id: string
  triggerEvent: string
  suggestion: string
  actionPayload?: Record<string, any>
  status: 'PENDING' | 'ACCEPTED' | 'DISMISSED'
  createdAt: number
}

// ── V1.0.6: Window Workspace Manager ────────────────────────────
export interface WindowInfo {
  handle: string
  processName: string
  title: string
  bounds?: { x: number; y: number; width: number; height: number }
}

export interface WindowWorkspacePreset {
  id: string
  name: string
  description?: string
  layout: Array<{ appName: string; action: 'focus' | 'maximize' | 'tile_left' | 'tile_right' }>
  updatedAt: number
}

// ── V1.0.6: Developer Mode Agent Debugger ───────────────────────
export interface AgentDebugEvent {
  id: string
  requestId: string
  timestamp: number
  stage: 'UNDERSTAND' | 'CONTEXT' | 'PLAN' | 'RISK' | 'PERMISSION' | 'EXECUTE' | 'VERIFY' | 'RECOVERY' | 'RESULT'
  intent?: string
  model?: string
  skill?: string
  tools?: string[]
  risk?: RiskLevel
  permission?: string
  execution?: string
  verification?: string
  recovery?: string
  result?: string
}

// ── V1.0.6: Credential Vault ────────────────────────────────────
export interface CredentialItem {
  id: string
  name: string
  service: string
  configured: boolean
  lastTested?: number
  testStatus?: 'SUCCESS' | 'FAILED' | 'UNTESTED'
}

// ── V1.0.6: Import / Export ─────────────────────────────────────
export interface ImportExportData {
  version: string
  exportedAt: number
  included: string[]
  excluded: string[]
  preferences?: Record<string, any>
  customSkills?: any[]
  workspaces?: any[]
  memories?: any[]
  missionTemplates?: any[]
}

// ════════════════════════════════════════════════════════════════
// ── V1.0.7: INTELLIGENT AGENT OPERATING LAYER ───────────────────
// ════════════════════════════════════════════════════════════════

// ── 1. Communication Center ─────────────────────────────────────
export type CommunicationType = 'sms' | 'call' | 'contact' | 'notification' | 'system'
export type CommunicationStatus = 'received' | 'sent' | 'missed' | 'draft'

export interface CommunicationItem {
  id: string
  type: CommunicationType
  source: string
  target?: string
  sender?: string
  title: string
  content: string
  timestamp: number
  status: CommunicationStatus
  metadata?: Record<string, any>
}

export interface CommunicationSummary {
  totalCount: number
  unreadCount: number
  recentItems: CommunicationItem[]
  lastSync: number
}

// ── 2. Universal Inbox ──────────────────────────────────────────
export type InboxItemSource = 'android_sms' | 'android_notification' | 'system' | 'mission' | 'automation' | 'workflow'
export type InboxImportance = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'

export interface InboxItem {
  id: string
  source: InboxItemSource
  title: string
  content: string
  importance: InboxImportance
  timestamp: number
  isRead: boolean
  actionAvailable: boolean
  actionLabel?: string
  actionPayload?: Record<string, any>
}

export interface InboxSummary {
  totalCount: number
  unreadCount: number
  urgentCount: number
  highCount: number
  items: InboxItem[]
}

// ── 3. Daily Briefing ───────────────────────────────────────────
export interface DailyBriefing {
  id: string
  timestamp: number
  dateString: string
  greeting: string
  summary: string
  activeGoals: string[]
  scheduledMissions: string[]
  pendingTasks: string[]
  systemHealth: {
    cpuUsage?: number
    ramUsage?: number
    battery?: number
    isCharging?: boolean
  }
  androidStatus: {
    connected: boolean
    deviceName?: string
    batteryLevel?: number
  }
  projectActivity: string[]
  recentCompletedWork: string[]
  pendingWork: string[]
}

// ── 4. Focus Mode ───────────────────────────────────────────────
export type FocusModeType = 'Coding' | 'Research' | 'Study' | 'Writing' | 'General Focus' | 'Custom'

export interface FocusSession {
  id: string
  mode: FocusModeType
  durationMinutes: number
  elapsedSeconds: number
  startedAt: number
  endedAt?: number
  active: boolean
  targetApps: string[]
  notificationsMuted: boolean
}

// ── 5. Multiple Workspaces ──────────────────────────────────────
export type WorkspaceCategory = 'Development' | 'Research' | 'Study' | 'Personal' | 'Security Lab' | 'Custom'

export interface WorkspaceProfile {
  id: string
  name: string
  description: string
  category: WorkspaceCategory
  defaultModel?: string
  preferredSkills: string[]
  layoutPreset?: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface WorkspaceItem {
  id: string
  workspaceId: string
  itemType: 'app' | 'folder' | 'project' | 'window' | 'url'
  targetPath: string
  launchArgs?: string
  windowAction?: 'focus' | 'maximize' | 'tile_left' | 'tile_right'
}

// ── 6. Cross-Device Continuity ──────────────────────────────────
export interface ContinuitySession {
  id: string
  deviceId: string
  deviceName: string
  activeMissionId?: string
  lastSyncTimestamp: number
  stateSummary: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNCING'
}

export interface DeviceCompanionStatus {
  connected: boolean
  deviceName?: string
  batteryLevel?: number
  isCharging?: boolean
  adbAvailable: boolean
  permissionsGranted: string[]
}

// ── 7. Android Agent 2.0 ────────────────────────────────────────
export interface AndroidContact {
  id: string
  name: string
  phoneNumber: string
  email?: string
}

export interface AndroidCallState {
  state: 'IDLE' | 'RINGING' | 'OFFHOOK'
  incomingNumber?: string
}

export interface AndroidAppInfo {
  packageName: string
  appName: string
  isSystem: boolean
}

// ── 8. Memory Control Center ────────────────────────────────────
export type MemoryControlCategory =
  | 'Personal preferences'
  | 'Projects'
  | 'Goals'
  | 'Conversations'
  | 'Tasks'
  | 'Workspace preferences'
  | 'Temporary memory'
  | 'Archived memory'

export interface MemoryItemView {
  id: string
  category: MemoryControlCategory
  scope: string
  key: string
  value: string
  source: string
  confidence: number
  createdAt: number
  updatedAt: number
  isArchived: boolean
}

export interface MemoryControlFilter {
  category?: MemoryControlCategory
  scope?: string
  query?: string
  showArchived?: boolean
}

// ── 9. Agent Personality Profiles ───────────────────────────────
export type PersonalityType =
  | 'Balanced'
  | 'Professional'
  | 'Technical'
  | 'Minimal'
  | 'Tutor'
  | 'Developer'
  | 'Researcher'
  | 'Custom'

export interface PersonalityProfile {
  id: PersonalityType
  name: string
  description: string
  verbosity: 'concise' | 'balanced' | 'detailed'
  tone: 'neutral' | 'technical' | 'instructive' | 'minimalist'
  statusPrefix: string
  isActive: boolean
}

// ── 10. Automation Builder & Event Triggers ─────────────────────
export type AutomationTriggerType = 'time' | 'event' | 'webhook' | 'shortcut'
export type AutomationEventType =
  | 'ultron_start'
  | 'pc_start'
  | 'android_connect'
  | 'android_disconnect'
  | 'workspace_change'
  | 'mission_complete'
  | 'task_fail'
  | 'network_change'

export interface AutomationCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface AutomationAction {
  tool: string
  args: Record<string, any>
  riskLevel: RiskLevel
  requiresPermission: boolean
}

export interface AutomationDefinition {
  id: string
  name: string
  description: string
  triggerType: AutomationTriggerType
  eventType?: AutomationEventType
  cronExpression?: string
  timeSchedule?: string
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  enabled: boolean
  createdAt: number
  updatedAt: number
  lastRunAt?: number
  lastRunStatus?: 'SUCCESS' | 'FAILED' | 'SKIPPED'
}

export interface AutomationRun {
  id: string
  automationId: string
  executedAt: number
  status: 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'WAITING_PERMISSION'
  actionsCount: number
  error?: string
  durationMs: number
}

// ── 11. Scheduled Missions ──────────────────────────────────────
export interface ScheduledMission {
  id: string
  missionId?: string
  title: string
  goal: string
  recurrence: 'one_time' | 'daily' | 'weekly' | 'custom'
  cronOrSchedule: string
  nextRunAt: number
  lastRunAt?: number
  status: 'SCHEDULED' | 'PAUSED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED'
  createdAt: number
}

// ── 12. Event Trigger ───────────────────────────────────────────
export interface EventTrigger {
  id: string
  eventType: AutomationEventType
  automationId: string
  enabled: boolean
}

// ── 13. Explainability Mode ─────────────────────────────────────
export interface ExecutionExplanation {
  id: string
  requestId: string
  request: string
  intent: string
  selectedCapability: string
  toolsUsed: string[]
  permission: string
  risk: RiskLevel
  execution: string
  verification: string
  result: string
  timestamp: number
}

// ── 14. Mission Simulation ──────────────────────────────────────
export interface MissionSimulationStep {
  index: number
  description: string
  tool: string
  predictedArgs: Record<string, any>
  risk: RiskLevel
  requiresPermission: boolean
  possibleFailures: string[]
  rollbackOption?: string
}

export interface MissionSimulationResult {
  missionTitle: string
  goal: string
  totalSteps: number
  overallRisk: RiskLevel
  steps: MissionSimulationStep[]
  estimatedDurationSeconds: number
  simulatedAt: number
}

// ── 15. Workspace Backup ────────────────────────────────────────
export interface WorkspaceBackupMeta {
  id: string
  name: string
  createdAt: number
  ultronVersion: string
  workspaceCount: number
  automationCount: number
  sizeBytes: number
}

export interface WorkspaceBackupBundle {
  meta: WorkspaceBackupMeta
  workspaces: WorkspaceProfile[]
  items: WorkspaceItem[]
  automations: AutomationDefinition[]
  scheduledMissions: ScheduledMission[]
  preferences: Record<string, any>
}

// ── 16. GitHub Update Manager ───────────────────────────────────
export interface UpdateCheckResult {
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  releaseDate?: string
  releaseNotes?: string
  downloadUrl?: string
  updateSizeBytes?: number
  checkedAt: number
  officialRepo: string
}