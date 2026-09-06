// src/main/database/memory.db.ts — Persistent SQLite Memory Subsystem for ULTRON
import { DatabaseSync } from 'node:sqlite'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import {
  MemoryRecord,
  MemoryCategory,
  MemorySearchParams,
  MemoryStats,
  BackgroundTask,
  BackgroundTaskStatus,
  BackgroundTaskLog,
  WorkspaceProjectInfo,
  ScreenMemoryEntry,
  Mission,
  MissionStep,
  Workflow,
  WorkflowStep,
  DocumentMeta,
  DocumentChunk,
  RecoveryAction,
  CustomSkillDefinition,
  UserPreference,
  TaskHistoryRecord,
  UltronNotification
} from '../../shared/types'

// Patterns to detect and redact credentials and secrets before storage
export function redactSecrets(input: string): string {
  if (!input || typeof input !== 'string') return input
  let sanitized = input

  const tokenPatterns = [
    /nvapi-[A-Za-z0-9_\-]{16,}/gi,
    /sk-[A-Za-z0-9_\-]{16,}/gi,
    /gh[pors]_[A-Za-z0-9]{36,}/gi,
    /glpat-[A-Za-z0-9_\-]{20,}/gi,
    /xox[baprs]-[A-Za-z0-9_\-]{10,}/gi,
    /Bearer\s+[A-Za-z0-9_\-\.]{15,}/gi,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/gi
  ]

  for (const regex of tokenPatterns) {
    sanitized = sanitized.replace(new RegExp(regex.source, regex.flags), '[REDACTED_SECRET]')
  }

  // Key-value pairs: password=..., api_key: "...", pin: "1234", phone_pin: "..."
  sanitized = sanitized.replace(
    /((?:password|passwd|secret|api[_-]?key|apikey|auth[_-]?token|phone[_-]?pin|pin|passcode|unlock[_-]?code)\s*[:=]\s*["']?)([^"'\s,;]+)(["']?)/gi,
    '$1[REDACTED_SECRET]$3'
  )

  // Explicit standalone PIN patterns (e.g. "my pin is 1234", "phone pin is 123456")
  sanitized = sanitized.replace(
    /(\b(?:my\s+)?(?:phone\s+)?(?:pin|passcode)\s+(?:is|was|to)\s+)(\d{4,8})\b/gi,
    '$1[REDACTED_PIN]'
  )

  return sanitized
}

export function sanitizeMetadata(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta || typeof meta !== 'object') return meta
  try {
    const jsonStr = JSON.stringify(meta)
    const redactedStr = redactSecrets(jsonStr)
    return JSON.parse(redactedStr)
  } catch {
    return meta
  }
}

export class MemoryDatabase {
  private db: DatabaseSync | null = null
  private dbPath: string

  constructor(customPath?: string) {
    if (customPath) {
      this.dbPath = customPath
    } else {
      let baseDir = ''
      try {
        baseDir = app?.getPath ? app.getPath('userData') : path.join(process.cwd(), 'data')
      } catch {
        baseDir = path.join(process.cwd(), 'data')
      }
      this.dbPath = path.join(baseDir, 'ultron_memory.sqlite')
    }

    this.init()
  }

  private init(): void {
    try {
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      this.db = new DatabaseSync(this.dbPath)

      // Pragmas for performance and data safety
      this.db.exec('PRAGMA journal_mode = WAL;')
      this.db.exec('PRAGMA synchronous = NORMAL;')
      this.db.exec('PRAGMA foreign_keys = ON;')

      // Create primary memories table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS memories (
          id TEXT PRIMARY KEY,
          category TEXT NOT NULL,
          key TEXT,
          content TEXT NOT NULL,
          metadata TEXT,
          tags TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `)

      // Create indices for memories
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
        CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key);
      `)

      // Create background_tasks table for V1.0.4 Task Management
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS background_tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          status TEXT NOT NULL,
          progress INTEGER DEFAULT 0,
          logs TEXT,
          start_time INTEGER NOT NULL,
          end_time INTEGER,
          duration_ms REAL DEFAULT 0,
          error TEXT,
          result TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON background_tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_start_time ON background_tasks(start_time DESC);
      `)

      // Create workspaces table for V1.0.4 Smart Workspace
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          path TEXT NOT NULL UNIQUE,
          is_git INTEGER DEFAULT 0,
          branch TEXT,
          package_json TEXT,
          recent_files TEXT,
          last_opened INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_workspaces_last_opened ON workspaces(last_opened DESC);
      `)

      // Create model_metrics table for V1.0.4 Telemetry
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS model_metrics (
          id TEXT PRIMARY KEY,
          model_id TEXT NOT NULL,
          task_category TEXT NOT NULL,
          latency_ms REAL NOT NULL,
          first_token_ms REAL,
          success INTEGER NOT NULL,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_model_metrics_model ON model_metrics(model_id);
      `)

      // ── V1.0.5: Missions & Mission Steps ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS missions (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL,
          started_at INTEGER,
          completed_at INTEGER,
          total_duration_ms REAL DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
        CREATE INDEX IF NOT EXISTS idx_missions_created ON missions(created_at DESC);

        CREATE TABLE IF NOT EXISTS mission_steps (
          id TEXT PRIMARY KEY,
          mission_id TEXT NOT NULL,
          step_number INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL,
          dependencies TEXT,
          tool TEXT,
          args TEXT,
          required_permission TEXT,
          started_at INTEGER,
          completed_at INTEGER,
          duration_ms REAL DEFAULT 0,
          result TEXT,
          error TEXT,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 2
        );
        CREATE INDEX IF NOT EXISTS idx_steps_mission ON mission_steps(mission_id);
        CREATE INDEX IF NOT EXISTS idx_steps_status ON mission_steps(status);
      `)

      // ── V1.0.5: Workflows & Workflow Steps ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS workflows (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);

        CREATE TABLE IF NOT EXISTS workflow_steps (
          id TEXT PRIMARY KEY,
          workflow_id TEXT NOT NULL,
          step_index INTEGER NOT NULL,
          app TEXT NOT NULL,
          action TEXT NOT NULL,
          params TEXT,
          verification TEXT,
          status TEXT NOT NULL,
          duration_ms REAL DEFAULT 0,
          error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_workflow_steps_wf ON workflow_steps(workflow_id);
      `)

      // ── V1.0.5: Personal Preferences ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS preferences (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          category TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_preferences_cat ON preferences(category);
      `)

      // ── V1.0.5: Task-Scoped Screen Memory ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS screen_context (
          id TEXT PRIMARY KEY,
          timestamp INTEGER NOT NULL,
          application TEXT,
          window TEXT,
          detected_elements TEXT,
          recognized_text TEXT,
          task_id TEXT,
          confidence REAL DEFAULT 1.0,
          summary TEXT,
          source_id TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_screen_context_ts ON screen_context(timestamp DESC);
      `)

      // ── V1.0.5: Document Intelligence Index & Chunks ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS document_index (
          id TEXT PRIMARY KEY,
          path TEXT NOT NULL UNIQUE,
          file_name TEXT NOT NULL,
          file_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          page_count INTEGER DEFAULT 1,
          indexed_at INTEGER NOT NULL,
          summary TEXT,
          topics TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_doc_name ON document_index(file_name);
        CREATE INDEX IF NOT EXISTS idx_doc_indexed ON document_index(indexed_at DESC);

        CREATE TABLE IF NOT EXISTS document_chunks (
          id TEXT PRIMARY KEY,
          doc_id TEXT NOT NULL,
          file_name TEXT NOT NULL,
          page_number INTEGER,
          section_title TEXT,
          chunk_index INTEGER NOT NULL,
          text TEXT NOT NULL,
          token_count INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_chunks_doc ON document_chunks(doc_id);
        CREATE INDEX IF NOT EXISTS idx_chunks_doc_idx ON document_chunks(doc_id, chunk_index);
      `)

      // ── V1.0.5: Custom Skills ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS custom_skills (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          version TEXT NOT NULL,
          capabilities TEXT,
          tools TEXT,
          permissions TEXT,
          triggers TEXT,
          workflow TEXT,
          enabled INTEGER DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_skills_enabled ON custom_skills(enabled);
      `)

      // ── V1.0.5: Detailed Task History ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS task_history (
          id TEXT PRIMARY KEY,
          timestamp INTEGER NOT NULL,
          mission_id TEXT,
          task_id TEXT,
          action_id TEXT,
          user_request TEXT NOT NULL,
          intent TEXT NOT NULL,
          skill TEXT NOT NULL,
          tool TEXT,
          target TEXT,
          status TEXT NOT NULL,
          start_time INTEGER NOT NULL,
          end_time INTEGER NOT NULL,
          duration_ms REAL NOT NULL,
          model_used TEXT,
          model_latency_ms REAL,
          tool_latency_ms REAL,
          permission_state TEXT,
          result_summary TEXT,
          error TEXT,
          recovery_info TEXT,
          verification_result TEXT,
          category TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_task_hist_ts ON task_history(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_task_hist_cat ON task_history(category);
        CREATE INDEX IF NOT EXISTS idx_task_hist_status ON task_history(status);
        CREATE INDEX IF NOT EXISTS idx_task_hist_mission ON task_history(mission_id);
      `)

      // ── V1.0.5: Undo / Recovery Actions ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS recovery_actions (
          action_id TEXT PRIMARY KEY,
          timestamp INTEGER NOT NULL,
          operation_type TEXT NOT NULL,
          target TEXT NOT NULL,
          before_state TEXT NOT NULL,
          after_state TEXT NOT NULL,
          reversible INTEGER DEFAULT 1,
          rolled_back INTEGER DEFAULT 0,
          details TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_recovery_ts ON recovery_actions(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_recovery_rev ON recovery_actions(reversible, rolled_back);
      `)

      // ── V1.0.5: Security Events ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS security_events (
          id TEXT PRIMARY KEY,
          timestamp INTEGER NOT NULL,
          event_type TEXT NOT NULL,
          severity TEXT NOT NULL,
          source TEXT NOT NULL,
          details TEXT NOT NULL,
          blocked INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_sec_events_ts ON security_events(timestamp DESC);
      `)

      // ── V1.0.5: Smart Notifications ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          read INTEGER DEFAULT 0,
          dismissed INTEGER DEFAULT 0,
          action_url TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_notif_ts ON notifications(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_notif_dismiss ON notifications(dismissed);
      `)

      
      // ── V1.0.6: Goal Memory ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS goals (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          project TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          completed_at INTEGER,
          metadata TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
        CREATE INDEX IF NOT EXISTS idx_goals_project ON goals(project);

        CREATE TABLE IF NOT EXISTS goal_links (
          id TEXT PRIMARY KEY,
          goal_id TEXT NOT NULL,
          link_type TEXT NOT NULL,
          target_id TEXT NOT NULL,
          title TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_goal_links_gid ON goal_links(goal_id);
      `)

      // ── V1.0.6: Verification Records ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS verification_records (
          id TEXT PRIMARY KEY,
          action_id TEXT NOT NULL,
          strategy TEXT NOT NULL,
          status TEXT NOT NULL,
          target TEXT NOT NULL,
          duration_ms REAL NOT NULL,
          details TEXT,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_verif_action ON verification_records(action_id);
        CREATE INDEX IF NOT EXISTS idx_verif_ts ON verification_records(timestamp DESC);
      `)

      // ── V1.0.6: Plugins & Skill Store ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS plugins (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          version TEXT NOT NULL,
          publisher TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          permissions TEXT,
          skills TEXT,
          tools TEXT,
          minimum_ultron_version TEXT,
          trust_state TEXT NOT NULL,
          enabled INTEGER DEFAULT 1,
          manifest TEXT NOT NULL,
          installed_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_plugins_enabled ON plugins(enabled);
        CREATE INDEX IF NOT EXISTS idx_plugins_category ON plugins(category);
      `)

      // ── V1.0.6: Project Intelligence & Decisions ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS project_intelligence (
          id TEXT PRIMARY KEY,
          project_name TEXT NOT NULL,
          workspace_path TEXT NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          metadata TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_proj_intel_name ON project_intelligence(project_name);
        CREATE INDEX IF NOT EXISTS idx_proj_intel_type ON project_intelligence(type);
      `)

      // ── V1.0.6: Productivity Metrics ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS productivity_metrics (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          missions_completed INTEGER DEFAULT 0,
          tasks_completed INTEGER DEFAULT 0,
          avg_duration_ms REAL DEFAULT 0,
          failed_tasks INTEGER DEFAULT 0,
          active_project TEXT,
          tools_used TEXT,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_prod_date ON productivity_metrics(date);
      `)

      // ── V1.0.6: Proactive Suggestions ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS proactive_suggestions (
          id TEXT PRIMARY KEY,
          trigger_event TEXT NOT NULL,
          suggestion TEXT NOT NULL,
          action_payload TEXT,
          status TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_sugg_status ON proactive_suggestions(status);
      `)

      // ── V1.0.6: Window Workspaces ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS window_workspaces (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          preset_data TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `)

      // ── V1.0.6: Action Risk Events ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS risk_events (
          id TEXT PRIMARY KEY,
          tool_name TEXT NOT NULL,
          target TEXT NOT NULL,
          risk_level TEXT NOT NULL,
          reason TEXT NOT NULL,
          approved INTEGER DEFAULT 0,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_risk_ts ON risk_events(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_risk_level ON risk_events(risk_level);
      `)

      // ── V1.0.6: Agent Debugger Events ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS agent_debug_events (
          id TEXT PRIMARY KEY,
          request_id TEXT NOT NULL,
          stage TEXT NOT NULL,
          intent TEXT,
          model TEXT,
          skill TEXT,
          tools TEXT,
          risk TEXT,
          permission TEXT,
          execution TEXT,
          verification TEXT,
          recovery TEXT,
          result TEXT,
          timestamp INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_debug_req ON agent_debug_events(request_id);
        CREATE INDEX IF NOT EXISTS idx_debug_ts ON agent_debug_events(timestamp DESC);
      `)

      // ── V1.0.6: Import / Export Records ──
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS import_export_records (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          included_sections TEXT NOT NULL,
          file_path TEXT NOT NULL,
          status TEXT NOT NULL,
          timestamp INTEGER NOT NULL
        );
      `)

      console.log(`[ULTRON Memory] SQLite database initialized at ${this.dbPath} (V1.0.6 schema active)`)
    } catch (err: any) {
      console.error('[ULTRON Memory] SQLite init error:', err)
      throw new Error(`Failed to initialize SQLite memory database: ${err.message}`)
    }
  }

  private ensureConnected(): DatabaseSync {
    if (!this.db) {
      this.init()
    }
    if (!this.db) {
      throw new Error('SQLite database is not accessible.')
    }
    return this.db
  }

  getDbPath(): string {
    return this.dbPath
  }

  save(entry: {
    id?: string
    category: MemoryCategory
    key?: string
    content: string
    metadata?: Record<string, unknown>
    tags?: string[]
  }): MemoryRecord {
    const db = this.ensureConnected()
    const now = Date.now()
    const sanitizedContent = redactSecrets(entry.content.trim())
    const sanitizedKey = entry.key ? redactSecrets(entry.key.trim().toLowerCase()) : undefined
    const sanitizedMeta = sanitizeMetadata(entry.metadata)

    // 1. Prevent duplicate key entries for facts, preferences, identity
    if (sanitizedKey) {
      const existingStmt = db.prepare(`
        SELECT * FROM memories WHERE category = ? AND key = ? LIMIT 1
      `)
      const existing = existingStmt.get(entry.category, sanitizedKey) as any

      if (existing) {
        const updateStmt = db.prepare(`
          UPDATE memories
          SET content = ?, metadata = ?, tags = ?, updated_at = ?
          WHERE id = ?
        `)
        const metaStr = sanitizedMeta ? JSON.stringify(sanitizedMeta) : existing.metadata
        const tagsStr = entry.tags ? JSON.stringify(entry.tags) : existing.tags
        updateStmt.run(sanitizedContent, metaStr, tagsStr, now, existing.id)

        return {
          id: existing.id,
          category: entry.category,
          key: sanitizedKey,
          content: sanitizedContent,
          metadata: sanitizedMeta,
          tags: entry.tags,
          created_at: Number(existing.created_at),
          updated_at: now
        }
      }
    }

    // 2. Prevent duplicate entries for identical content inserted within the last 3 seconds
    const recentDuplicateStmt = db.prepare(`
      SELECT * FROM memories 
      WHERE category = ? AND content = ? AND created_at > ?
      LIMIT 1
    `)
    const recentDuplicate = recentDuplicateStmt.get(entry.category, sanitizedContent, now - 3000) as any
    if (recentDuplicate) {
      return {
        id: recentDuplicate.id,
        category: recentDuplicate.category,
        key: recentDuplicate.key || undefined,
        content: recentDuplicate.content,
        metadata: recentDuplicate.metadata ? JSON.parse(recentDuplicate.metadata) : undefined,
        tags: recentDuplicate.tags ? JSON.parse(recentDuplicate.tags) : undefined,
        created_at: Number(recentDuplicate.created_at),
        updated_at: Number(recentDuplicate.updated_at)
      }
    }

    // 3. Insert new memory record
    const id = entry.id || uuidv4()
    const insertStmt = db.prepare(`
      INSERT INTO memories (id, category, key, content, metadata, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const metaStr = sanitizedMeta ? JSON.stringify(sanitizedMeta) : null
    const tagsStr = entry.tags && entry.tags.length > 0 ? JSON.stringify(entry.tags) : null

    insertStmt.run(
      id,
      entry.category,
      sanitizedKey || null,
      sanitizedContent,
      metaStr,
      tagsStr,
      now,
      now
    )

    return {
      id,
      category: entry.category,
      key: sanitizedKey,
      content: sanitizedContent,
      metadata: sanitizedMeta,
      tags: entry.tags,
      created_at: now,
      updated_at: now
    }
  }

  get(id: string): MemoryRecord | null {
    const db = this.ensureConnected()
    const stmt = db.prepare('SELECT * FROM memories WHERE id = ?')
    const row = stmt.get(id) as any
    if (!row) return null

    return {
      id: row.id,
      category: row.category,
      key: row.key || undefined,
      content: row.content,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      created_at: Number(row.created_at),
      updated_at: Number(row.updated_at)
    }
  }

  search(params: MemorySearchParams): MemoryRecord[] {
    const db = this.ensureConnected()
    const limit = Math.min(params.limit || 50, 200)
    const offset = params.offset || 0

    let sql = 'SELECT * FROM memories WHERE 1=1'
    const args: any[] = []

    if (params.category && params.category !== 'all') {
      sql += ' AND category = ?'
      args.push(params.category)
    }

    if (params.query && params.query.trim()) {
      const q = `%${params.query.trim().toLowerCase()}%`
      sql += " AND (LOWER(content) LIKE ? OR LOWER(IFNULL(key, '')) LIKE ? OR LOWER(IFNULL(tags, '')) LIKE ?)"
      args.push(q, q, q)
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    args.push(limit, offset)

    const stmt = db.prepare(sql)
    const rows = stmt.all(...args) as any[]

    return rows.map((r) => ({
      id: r.id,
      category: r.category,
      key: r.key || undefined,
      content: r.content,
      metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
      tags: r.tags ? JSON.parse(r.tags) : undefined,
      created_at: Number(r.created_at),
      updated_at: Number(r.updated_at)
    }))
  }

  list(options?: { category?: string; limit?: number; offset?: number }): {
    records: MemoryRecord[]
    total: number
  } {
    const db = this.ensureConnected()
    const limit = Math.min(options?.limit || 50, 200)
    const offset = options?.offset || 0

    let countSql = 'SELECT COUNT(*) as cnt FROM memories WHERE 1=1'
    let dataSql = 'SELECT * FROM memories WHERE 1=1'
    const countArgs: any[] = []
    const dataArgs: any[] = []

    if (options?.category && options.category !== 'all') {
      countSql += ' AND category = ?'
      countArgs.push(options.category)
      dataSql += ' AND category = ?'
      dataArgs.push(options.category)
    }

    dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    dataArgs.push(limit, offset)

    const totalRow = db.prepare(countSql).get(...countArgs) as any
    const total = totalRow ? Number(totalRow.cnt) : 0

    const rows = db.prepare(dataSql).all(...dataArgs) as any[]

    const records = rows.map((r) => ({
      id: r.id,
      category: r.category,
      key: r.key || undefined,
      content: r.content,
      metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
      tags: r.tags ? JSON.parse(r.tags) : undefined,
      created_at: Number(r.created_at),
      updated_at: Number(r.updated_at)
    }))

    return { records, total }
  }

  delete(id: string): boolean {
    const db = this.ensureConnected()
    const stmt = db.prepare('DELETE FROM memories WHERE id = ?')
    stmt.run(id)
    return true
  }

  clear(): boolean {
    const db = this.ensureConnected()
    db.exec('DELETE FROM memories;')
    db.exec('VACUUM;')
    return true
  }

  stats(): MemoryStats {
    const db = this.ensureConnected()
    const countStmt = db.prepare('SELECT category, COUNT(*) as cnt FROM memories GROUP BY category')
    const rows = countStmt.all() as any[]

    let total = 0
    const byCategory: Record<string, number> = {
      conversation: 0,
      fact: 0,
      preference: 0,
      task: 0,
      tool_execution: 0,
      research: 0,
      context: 0
    }

    for (const r of rows) {
      const cnt = Number(r.cnt)
      byCategory[r.category] = cnt
      total += cnt
    }

    const latestStmt = db.prepare('SELECT MAX(updated_at) as last_updated FROM memories')
    const latestRow = latestStmt.get() as any
    const lastUpdated = latestRow?.last_updated ? Number(latestRow.last_updated) : Date.now()

    return { total, byCategory, lastUpdated }
  }

  // ── V1.0.4 Background Task Operations ───────────────────────
  saveTask(task: BackgroundTask): void {
    const db = this.ensureConnected()
    const now = Date.now()
    const logsJson = JSON.stringify(task.logs || [])
    const resultJson = task.result !== undefined ? JSON.stringify(task.result) : null

    const stmt = db.prepare(`
      INSERT INTO background_tasks (
        id, title, description, category, status, progress, logs,
        start_time, end_time, duration_ms, error, result, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        status = excluded.status,
        progress = excluded.progress,
        logs = excluded.logs,
        end_time = excluded.end_time,
        duration_ms = excluded.duration_ms,
        error = excluded.error,
        result = excluded.result,
        updated_at = excluded.updated_at
    `)

    stmt.run(
      task.id,
      task.title,
      task.description || null,
      task.category,
      task.status,
      task.progress || 0,
      logsJson,
      task.startTime || now,
      task.endTime || null,
      task.durationMs || 0,
      task.error || null,
      resultJson,
      now,
      now
    )
  }

  getTask(id: string): BackgroundTask | null {
    const db = this.ensureConnected()
    const stmt = db.prepare('SELECT * FROM background_tasks WHERE id = ? LIMIT 1')
    const row = stmt.get(id) as any
    if (!row) return null

    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      category: row.category as any,
      status: row.status as BackgroundTaskStatus,
      progress: Number(row.progress || 0),
      logs: row.logs ? JSON.parse(row.logs) : [],
      startTime: Number(row.start_time),
      endTime: row.end_time ? Number(row.end_time) : undefined,
      durationMs: Number(row.duration_ms || 0),
      error: row.error || undefined,
      result: row.result ? JSON.parse(row.result) : undefined
    }
  }

  listTasks(limit: number = 50): BackgroundTask[] {
    const db = this.ensureConnected()
    const stmt = db.prepare('SELECT * FROM background_tasks ORDER BY start_time DESC LIMIT ?')
    const rows = stmt.all(limit) as any[]

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      category: row.category as any,
      status: row.status as BackgroundTaskStatus,
      progress: Number(row.progress || 0),
      logs: row.logs ? JSON.parse(row.logs) : [],
      startTime: Number(row.start_time),
      endTime: row.end_time ? Number(row.end_time) : undefined,
      durationMs: Number(row.duration_ms || 0),
      error: row.error || undefined,
      result: row.result ? JSON.parse(row.result) : undefined
    }))
  }

  // ── V1.0.4 Smart Workspace Operations ────────────────────────
  saveWorkspace(info: WorkspaceProjectInfo): void {
    const db = this.ensureConnected()
    const pkgJson = info.packageJson ? JSON.stringify(info.packageJson) : null
    const recentFilesJson = info.recentFiles ? JSON.stringify(info.recentFiles) : null

    const stmt = db.prepare(`
      INSERT INTO workspaces (
        id, name, path, is_git, branch, package_json, recent_files, last_opened
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(path) DO UPDATE SET
        name = excluded.name,
        is_git = excluded.is_git,
        branch = excluded.branch,
        package_json = excluded.package_json,
        recent_files = excluded.recent_files,
        last_opened = excluded.last_opened
    `)

    stmt.run(
      info.id,
      info.name,
      info.path,
      info.isGit ? 1 : 0,
      info.branch || null,
      pkgJson,
      recentFilesJson,
      info.lastOpened || Date.now()
    )
  }

  getWorkspace(idOrPath: string): WorkspaceProjectInfo | null {
    const db = this.ensureConnected()
    const stmt = db.prepare('SELECT * FROM workspaces WHERE id = ? OR path = ? LIMIT 1')
    const row = stmt.get(idOrPath, idOrPath) as any
    if (!row) return null

    return {
      id: row.id,
      name: row.name,
      path: row.path,
      isGit: Boolean(row.is_git),
      branch: row.branch || undefined,
      packageJson: row.package_json ? JSON.parse(row.package_json) : undefined,
      recentFiles: row.recent_files ? JSON.parse(row.recent_files) : undefined,
      lastOpened: Number(row.last_opened)
    }
  }

  listWorkspaces(limit: number = 20): WorkspaceProjectInfo[] {
    const db = this.ensureConnected()
    const stmt = db.prepare('SELECT * FROM workspaces ORDER BY last_opened DESC LIMIT ?')
    const rows = stmt.all(limit) as any[]

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      path: row.path,
      isGit: Boolean(row.is_git),
      branch: row.branch || undefined,
      packageJson: row.package_json ? JSON.parse(row.package_json) : undefined,
      recentFiles: row.recent_files ? JSON.parse(row.recent_files) : undefined,
      lastOpened: Number(row.last_opened)
    }))
  }

  // ── V1.0.4 Model Telemetry Metrics ──────────────────────────
  recordModelMetric(metric: {
    modelId: string
    taskCategory: string
    latencyMs: number
    firstTokenMs?: number
    success: boolean
  }): void {
    const db = this.ensureConnected()
    const id = uuidv4()
    const stmt = db.prepare(`
      INSERT INTO model_metrics (id, model_id, task_category, latency_ms, first_token_ms, success, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      id,
      metric.modelId,
      metric.taskCategory,
      metric.latencyMs,
      metric.firstTokenMs || null,
      metric.success ? 1 : 0,
      Date.now()
    )
  }

  getModelMetrics(modelId?: string): any[] {
    const db = this.ensureConnected()
    let sql = 'SELECT * FROM model_metrics'
    const args: any[] = []
    if (modelId) {
      sql += ' WHERE model_id = ?'
      args.push(modelId)
    }
    sql += ' ORDER BY timestamp DESC LIMIT 100'
    return db.prepare(sql).all(...args) as any[]
  }

  // ══════════════════════════════════════════════════════════════════
  // V1.0.5 CRUD METHODS
  // ══════════════════════════════════════════════════════════════════

  // ── Task-Scoped Screen Memory ──────────────────────────────────
  saveScreenContext(entry: {
    application: string
    window: string
    detectedElements: any[]
    recognizedText: string
    taskId?: string
    confidence?: number
    summary: string
    sourceId?: string
  }): ScreenMemoryEntry {
    const db = this.ensureConnected()
    const id = uuidv4()
    const timestamp = Date.now()
    const stmt = db.prepare(`
      INSERT INTO screen_context (id, timestamp, application, window, detected_elements, recognized_text, task_id, confidence, summary, source_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      id,
      timestamp,
      entry.application,
      entry.window,
      JSON.stringify(entry.detectedElements || []),
      entry.recognizedText || '',
      entry.taskId || null,
      entry.confidence ?? 1.0,
      entry.summary,
      entry.sourceId || null
    )
    return {
      screenContextId: id,
      timestamp,
      application: entry.application,
      window: entry.window,
      detectedElements: entry.detectedElements || [],
      recognizedText: entry.recognizedText || '',
      taskId: entry.taskId,
      confidence: entry.confidence ?? 1.0,
      summary: entry.summary,
      sourceId: entry.sourceId
    }
  }

  getLatestScreenContext(): ScreenMemoryEntry | null {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM screen_context ORDER BY timestamp DESC LIMIT 1').get() as any
    if (!row) return null
    return {
      screenContextId: row.id,
      timestamp: Number(row.timestamp),
      application: row.application,
      window: row.window,
      detectedElements: row.detected_elements ? JSON.parse(row.detected_elements) : [],
      recognizedText: row.recognized_text || '',
      taskId: row.task_id || undefined,
      confidence: Number(row.confidence),
      summary: row.summary,
      sourceId: row.source_id || undefined
    }
  }

  listScreenContext(limit = 10): ScreenMemoryEntry[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM screen_context ORDER BY timestamp DESC LIMIT ?').all(limit) as any[]
    return rows.map((row) => ({
      screenContextId: row.id,
      timestamp: Number(row.timestamp),
      application: row.application,
      window: row.window,
      detectedElements: row.detected_elements ? JSON.parse(row.detected_elements) : [],
      recognizedText: row.recognized_text || '',
      taskId: row.task_id || undefined,
      confidence: Number(row.confidence),
      summary: row.summary,
      sourceId: row.source_id || undefined
    }))
  }

  clearScreenContext(): boolean {
    const db = this.ensureConnected()
    db.exec('DELETE FROM screen_context;')
    return true
  }

  // ── Mission Mode ────────────────────────────────────────────────
  createMission(mission: {
    id?: string
    title: string
    description: string
    status?: any
  }): Mission {
    const db = this.ensureConnected()
    const id = mission.id || uuidv4()
    const now = Date.now()
    const status = mission.status || 'PLANNED'
    const stmt = db.prepare(`
      INSERT INTO missions (id, title, description, status, started_at, completed_at, total_duration_ms, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(id, mission.title, mission.description || '', status, null, null, 0, now, now)
    return {
      id,
      title: mission.title,
      description: mission.description || '',
      status,
      steps: [],
      createdAt: now,
      updatedAt: now
    }
  }

  updateMission(id: string, updates: Partial<Mission>): boolean {
    const db = this.ensureConnected()
    const fields: string[] = []
    const values: any[] = []

    if (updates.title !== undefined) {
      fields.push('title = ?')
      values.push(updates.title)
    }
    if (updates.description !== undefined) {
      fields.push('description = ?')
      values.push(updates.description)
    }
    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    if (updates.startedAt !== undefined) {
      fields.push('started_at = ?')
      values.push(updates.startedAt)
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?')
      values.push(updates.completedAt)
    }
    if (updates.totalDurationMs !== undefined) {
      fields.push('total_duration_ms = ?')
      values.push(updates.totalDurationMs)
    }

    fields.push('updated_at = ?')
    values.push(Date.now())
    values.push(id)

    const sql = `UPDATE missions SET ${fields.join(', ')} WHERE id = ?`
    db.prepare(sql).run(...values)
    return true
  }

  getMission(id: string): Mission | null {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM missions WHERE id = ?').get(id) as any
    if (!row) return null
    const steps = this.getMissionSteps(id)
    return {
      id: row.id,
      title: row.title,
      description: row.description || '',
      status: row.status,
      steps,
      startedAt: row.started_at ? Number(row.started_at) : undefined,
      completedAt: row.completed_at ? Number(row.completed_at) : undefined,
      totalDurationMs: Number(row.total_duration_ms || 0),
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at)
    }
  }

  listMissions(limit = 50): Mission[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM missions ORDER BY created_at DESC LIMIT ?').all(limit) as any[]
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || '',
      status: row.status,
      steps: this.getMissionSteps(row.id),
      startedAt: row.started_at ? Number(row.started_at) : undefined,
      completedAt: row.completed_at ? Number(row.completed_at) : undefined,
      totalDurationMs: Number(row.total_duration_ms || 0),
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at)
    }))
  }

  saveMissionStep(step: Omit<MissionStep, 'retryCount' | 'maxRetries'> & { retryCount?: number; maxRetries?: number }): MissionStep {
    const db = this.ensureConnected()
    const id = step.id || uuidv4()
    const retryCount = step.retryCount ?? 0
    const maxRetries = step.maxRetries ?? 2
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO mission_steps (
        id, mission_id, step_number, title, description, status, dependencies, tool, args,
        required_permission, started_at, completed_at, duration_ms, result, error, retry_count, max_retries
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      id,
      step.missionId,
      step.stepNumber,
      step.title,
      step.description || '',
      step.status,
      JSON.stringify(step.dependencies || []),
      step.tool || null,
      step.args ? JSON.stringify(step.args) : null,
      step.requiredPermission || null,
      step.startedAt || null,
      step.completedAt || null,
      step.durationMs || 0,
      step.result ? JSON.stringify(step.result) : null,
      step.error || null,
      retryCount,
      maxRetries
    )
    return {
      ...step,
      id,
      retryCount,
      maxRetries
    }
  }

  updateMissionStep(id: string, updates: Partial<MissionStep>): boolean {
    const db = this.ensureConnected()
    const fields: string[] = []
    const values: any[] = []

    if (updates.status !== undefined) {
      fields.push('status = ?')
      values.push(updates.status)
    }
    if (updates.startedAt !== undefined) {
      fields.push('started_at = ?')
      values.push(updates.startedAt)
    }
    if (updates.completedAt !== undefined) {
      fields.push('completed_at = ?')
      values.push(updates.completedAt)
    }
    if (updates.durationMs !== undefined) {
      fields.push('duration_ms = ?')
      values.push(updates.durationMs)
    }
    if (updates.result !== undefined) {
      fields.push('result = ?')
      values.push(JSON.stringify(updates.result))
    }
    if (updates.error !== undefined) {
      fields.push('error = ?')
      values.push(updates.error)
    }
    if (updates.retryCount !== undefined) {
      fields.push('retry_count = ?')
      values.push(updates.retryCount)
    }

    if (fields.length === 0) return true
    values.push(id)

    const sql = `UPDATE mission_steps SET ${fields.join(', ')} WHERE id = ?`
    db.prepare(sql).run(...values)
    return true
  }

  getMissionSteps(missionId: string): MissionStep[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM mission_steps WHERE mission_id = ? ORDER BY step_number ASC').all(missionId) as any[]
    return rows.map((row) => ({
      id: row.id,
      missionId: row.mission_id,
      stepNumber: Number(row.step_number),
      title: row.title,
      description: row.description || '',
      status: row.status,
      dependencies: row.dependencies ? JSON.parse(row.dependencies) : [],
      tool: row.tool || undefined,
      args: row.args ? JSON.parse(row.args) : undefined,
      requiredPermission: row.required_permission || undefined,
      startedAt: row.started_at ? Number(row.started_at) : undefined,
      completedAt: row.completed_at ? Number(row.completed_at) : undefined,
      durationMs: Number(row.duration_ms || 0),
      result: row.result ? JSON.parse(row.result) : undefined,
      error: row.error || undefined,
      retryCount: Number(row.retry_count || 0),
      maxRetries: Number(row.max_retries || 2)
    }))
  }

  // ── Multi-App Workflows ─────────────────────────────────────────
  createWorkflow(wf: { name: string; description: string; steps?: WorkflowStep[] }): Workflow {
    const db = this.ensureConnected()
    const id = uuidv4()
    const now = Date.now()
    const stmt = db.prepare('INSERT INTO workflows (id, name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
    stmt.run(id, wf.name, wf.description, 'IDLE', now, now)
    if (wf.steps && wf.steps.length > 0) {
      for (const step of wf.steps) {
        this.saveWorkflowStep({ ...step, workflowId: id })
      }
    }
    return {
      id,
      name: wf.name,
      description: wf.description,
      status: 'IDLE',
      steps: wf.steps || [],
      createdAt: now,
      updatedAt: now
    }
  }

  getWorkflow(id: string): Workflow | null {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM workflows WHERE id = ?').get(id) as any
    if (!row) return null
    const steps = this.getWorkflowSteps(id)
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      status: row.status,
      steps,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at)
    }
  }

  listWorkflows(): Workflow[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM workflows ORDER BY created_at DESC LIMIT 50').all() as any[]
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      status: row.status,
      steps: this.getWorkflowSteps(row.id),
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at)
    }))
  }

  saveWorkflowStep(step: Omit<WorkflowStep, 'id'> & { id?: string }): WorkflowStep {
    const db = this.ensureConnected()
    const id = step.id || uuidv4()
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO workflow_steps (id, workflow_id, step_index, app, action, params, verification, status, duration_ms, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      id,
      step.workflowId,
      step.stepIndex,
      step.app,
      step.action,
      JSON.stringify(step.params || {}),
      JSON.stringify(step.verification || {}),
      step.status,
      step.durationMs || 0,
      step.error || null
    )
    return { ...step, id }
  }

  getWorkflowSteps(workflowId: string): WorkflowStep[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM workflow_steps WHERE workflow_id = ? ORDER BY step_index ASC').all(workflowId) as any[]
    return rows.map((row) => ({
      id: row.id,
      workflowId: row.workflow_id,
      stepIndex: Number(row.step_index),
      app: row.app,
      action: row.action,
      params: row.params ? JSON.parse(row.params) : {},
      verification: row.verification ? JSON.parse(row.verification) : {},
      status: row.status,
      durationMs: Number(row.duration_ms || 0),
      error: row.error || undefined
    }))
  }

  // ── Personal Preference Engine ──────────────────────────────────
  setPreference(key: string, value: any, category = 'general'): boolean {
    const db = this.ensureConnected()
    const sanitizedKey = key.trim().toLowerCase()
    const stmt = db.prepare(`
      INSERT INTO preferences (key, value, category, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, category = excluded.category, updated_at = excluded.updated_at
    `)
    stmt.run(sanitizedKey, JSON.stringify(value), category, Date.now())
    return true
  }

  getPreference(key: string): any {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT value FROM preferences WHERE key = ?').get(key.trim().toLowerCase()) as any
    if (!row) return undefined
    try {
      return JSON.parse(row.value)
    } catch {
      return row.value
    }
  }

  getAllPreferences(): UserPreference[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM preferences ORDER BY category, key').all() as any[]
    return rows.map((row) => ({
      key: row.key,
      value: JSON.parse(row.value),
      category: row.category,
      updatedAt: Number(row.updated_at)
    }))
  }

  deletePreference(key: string): boolean {
    const db = this.ensureConnected()
    db.prepare('DELETE FROM preferences WHERE key = ?').run(key.trim().toLowerCase())
    return true
  }

  resetPreferences(): boolean {
    const db = this.ensureConnected()
    db.exec('DELETE FROM preferences;')
    return true
  }

  // ── Document Intelligence ───────────────────────────────────────
  saveDocumentMeta(doc: DocumentMeta): DocumentMeta {
    const db = this.ensureConnected()
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO document_index (id, path, file_name, file_type, size_bytes, page_count, indexed_at, summary, topics)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      doc.id,
      doc.path,
      doc.fileName,
      doc.fileType,
      doc.sizeBytes,
      doc.pageCount || 1,
      doc.indexedAt,
      doc.summary || null,
      doc.topics ? JSON.stringify(doc.topics) : null
    )
    return doc
  }

  getDocumentMeta(id: string): DocumentMeta | null {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM document_index WHERE id = ?').get(id) as any
    if (!row) return null
    return {
      id: row.id,
      path: row.path,
      fileName: row.file_name,
      fileType: row.file_type,
      sizeBytes: Number(row.size_bytes),
      pageCount: Number(row.page_count || 1),
      indexedAt: Number(row.indexed_at),
      summary: row.summary || undefined,
      topics: row.topics ? JSON.parse(row.topics) : undefined
    }
  }

  getDocumentMetaByPath(filePath: string): DocumentMeta | null {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM document_index WHERE path = ?').get(filePath) as any
    if (!row) return null
    return {
      id: row.id,
      path: row.path,
      fileName: row.file_name,
      fileType: row.file_type,
      sizeBytes: Number(row.size_bytes),
      pageCount: Number(row.page_count || 1),
      indexedAt: Number(row.indexed_at),
      summary: row.summary || undefined,
      topics: row.topics ? JSON.parse(row.topics) : undefined
    }
  }

  listDocumentMetas(): DocumentMeta[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM document_index ORDER BY indexed_at DESC LIMIT 100').all() as any[]
    return rows.map((row) => ({
      id: row.id,
      path: row.path,
      fileName: row.file_name,
      fileType: row.file_type,
      sizeBytes: Number(row.size_bytes),
      pageCount: Number(row.page_count || 1),
      indexedAt: Number(row.indexed_at),
      summary: row.summary || undefined,
      topics: row.topics ? JSON.parse(row.topics) : undefined
    }))
  }

  deleteDocument(docId: string): boolean {
    const db = this.ensureConnected()
    db.prepare('DELETE FROM document_chunks WHERE doc_id = ?').run(docId)
    db.prepare('DELETE FROM document_index WHERE id = ?').run(docId)
    return true
  }

  saveDocumentChunks(chunks: DocumentChunk[]): void {
    const db = this.ensureConnected()
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO document_chunks (id, doc_id, file_name, page_number, section_title, chunk_index, text, token_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const c of chunks) {
      stmt.run(c.id, c.docId, c.fileName, c.pageNumber || null, c.sectionTitle || null, c.chunkIndex, c.text, c.tokenCount || 0)
    }
  }

  queryDocumentChunks(query: string, docId?: string, limit = 5): DocumentChunk[] {
    const db = this.ensureConnected()
    const tokens = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2)
    let sql = 'SELECT * FROM document_chunks'
    const args: any[] = []
    const conditions: string[] = []

    if (docId) {
      conditions.push('doc_id = ?')
      args.push(docId)
    }

    if (tokens.length > 0) {
      const matchClauses = tokens.map(() => 'LOWER(text) LIKE ?')
      conditions.push(`(${matchClauses.join(' OR ')})`)
      for (const token of tokens) {
        args.push(`%${token}%`)
      }
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    sql += ' LIMIT ?'
    args.push(limit)

    const rows = db.prepare(sql).all(...args) as any[]
    return rows.map((row) => ({
      id: row.id,
      docId: row.doc_id,
      fileName: row.file_name,
      pageNumber: row.page_number ? Number(row.page_number) : undefined,
      sectionTitle: row.section_title || undefined,
      chunkIndex: Number(row.chunk_index),
      text: row.text,
      tokenCount: Number(row.token_count || 0)
    }))
  }

  // ── Custom Skills ───────────────────────────────────────────────
  saveCustomSkill(skill: CustomSkillDefinition): CustomSkillDefinition {
    const db = this.ensureConnected()
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO custom_skills (id, name, description, version, capabilities, tools, permissions, triggers, workflow, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      skill.id,
      skill.name,
      skill.description,
      skill.version,
      JSON.stringify(skill.capabilities || []),
      JSON.stringify(skill.tools || []),
      JSON.stringify(skill.permissions || []),
      JSON.stringify(skill.triggers || []),
      skill.workflow ? JSON.stringify(skill.workflow) : null,
      skill.enabled ? 1 : 0,
      skill.createdAt,
      skill.updatedAt
    )
    return skill
  }

  listCustomSkills(): CustomSkillDefinition[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM custom_skills ORDER BY name ASC').all() as any[]
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      version: row.version,
      capabilities: row.capabilities ? JSON.parse(row.capabilities) : [],
      tools: row.tools ? JSON.parse(row.tools) : [],
      permissions: row.permissions ? JSON.parse(row.permissions) : [],
      triggers: row.triggers ? JSON.parse(row.triggers) : [],
      workflow: row.workflow ? JSON.parse(row.workflow) : undefined,
      enabled: Boolean(row.enabled),
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at)
    }))
  }

  deleteCustomSkill(id: string): boolean {
    const db = this.ensureConnected()
    db.prepare('DELETE FROM custom_skills WHERE id = ?').run(id)
    return true
  }

  // ── Detailed Task History ───────────────────────────────────────
  recordTaskHistory(entry: Omit<TaskHistoryRecord, 'id'> & { id?: string }): TaskHistoryRecord {
    const db = this.ensureConnected()
    const id = entry.id || uuidv4()
    const stmt = db.prepare(`
      INSERT INTO task_history (
        id, timestamp, mission_id, task_id, action_id, user_request, intent, skill, tool, target,
        status, start_time, end_time, duration_ms, model_used, model_latency_ms, tool_latency_ms,
        permission_state, result_summary, error, recovery_info, verification_result, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      id,
      entry.timestamp,
      entry.missionId || null,
      entry.taskId || null,
      entry.actionId || null,
      entry.userRequest,
      entry.intent,
      entry.skill,
      entry.tool || null,
      entry.target || null,
      entry.status,
      entry.startTime,
      entry.endTime,
      entry.durationMs,
      entry.modelUsed || null,
      entry.modelLatencyMs || null,
      entry.toolLatencyMs || null,
      entry.permissionState || null,
      entry.resultSummary || null,
      entry.error || null,
      entry.recoveryInfo || null,
      entry.verificationResult || null,
      entry.category
    )
    return { ...entry, id }
  }

  listTaskHistory(filter?: { category?: string; status?: string; query?: string; limit?: number; offset?: number }): TaskHistoryRecord[] {
    const db = this.ensureConnected()
    let sql = 'SELECT * FROM task_history'
    const conditions: string[] = []
    const args: any[] = []

    if (filter?.category && filter.category !== 'ALL') {
      conditions.push('category = ?')
      args.push(filter.category)
    }
    if (filter?.status) {
      conditions.push('status = ?')
      args.push(filter.status)
    }
    if (filter?.query) {
      conditions.push('(LOWER(user_request) LIKE ? OR LOWER(intent) LIKE ? OR LOWER(tool) LIKE ?)')
      const q = `%${filter.query.toLowerCase()}%`
      args.push(q, q, q)
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`
    }
    sql += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?'
    args.push(filter?.limit || 50, filter?.offset || 0)

    const rows = db.prepare(sql).all(...args) as any[]
    return rows.map((row) => ({
      id: row.id,
      timestamp: Number(row.timestamp),
      missionId: row.mission_id || undefined,
      taskId: row.task_id || undefined,
      actionId: row.action_id || undefined,
      userRequest: row.user_request,
      intent: row.intent,
      skill: row.skill,
      tool: row.tool || undefined,
      target: row.target || undefined,
      status: row.status,
      startTime: Number(row.start_time),
      endTime: Number(row.end_time),
      durationMs: Number(row.duration_ms),
      modelUsed: row.model_used || undefined,
      modelLatencyMs: row.model_latency_ms ? Number(row.model_latency_ms) : undefined,
      toolLatencyMs: row.tool_latency_ms ? Number(row.tool_latency_ms) : undefined,
      permissionState: row.permission_state || undefined,
      resultSummary: row.result_summary || undefined,
      error: row.error || undefined,
      recoveryInfo: row.recovery_info || undefined,
      verificationResult: row.verification_result || undefined,
      category: row.category
    }))
  }

  getTaskHistoryRecord(id: string): TaskHistoryRecord | null {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM task_history WHERE id = ?').get(id) as any
    if (!row) return null
    return {
      id: row.id,
      timestamp: Number(row.timestamp),
      missionId: row.mission_id || undefined,
      taskId: row.task_id || undefined,
      actionId: row.action_id || undefined,
      userRequest: row.user_request,
      intent: row.intent,
      skill: row.skill,
      tool: row.tool || undefined,
      target: row.target || undefined,
      status: row.status,
      startTime: Number(row.start_time),
      endTime: Number(row.end_time),
      durationMs: Number(row.duration_ms),
      modelUsed: row.model_used || undefined,
      modelLatencyMs: row.model_latency_ms ? Number(row.model_latency_ms) : undefined,
      toolLatencyMs: row.tool_latency_ms ? Number(row.tool_latency_ms) : undefined,
      permissionState: row.permission_state || undefined,
      resultSummary: row.result_summary || undefined,
      error: row.error || undefined,
      recoveryInfo: row.recovery_info || undefined,
      verificationResult: row.verification_result || undefined,
      category: row.category
    }
  }

  clearTaskHistory(): boolean {
    const db = this.ensureConnected()
    db.exec('DELETE FROM task_history;')
    return true
  }

  // ── Undo / Recovery System ──────────────────────────────────────
  recordRecoveryAction(action: Omit<RecoveryAction, 'actionId'> & { actionId?: string }): RecoveryAction {
    const db = this.ensureConnected()
    const actionId = action.actionId || uuidv4()
    const stmt = db.prepare(`
      INSERT INTO recovery_actions (action_id, timestamp, operation_type, target, before_state, after_state, reversible, rolled_back, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      actionId,
      action.timestamp,
      action.operationType,
      action.target,
      action.beforeState,
      action.afterState,
      action.reversible ? 1 : 0,
      action.rolledBack ? 1 : 0,
      action.details || null
    )
    return { ...action, actionId }
  }

  listRecoveryActions(limit = 20): RecoveryAction[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM recovery_actions ORDER BY timestamp DESC LIMIT ?').all(limit) as any[]
    return rows.map((row) => ({
      actionId: row.action_id,
      timestamp: Number(row.timestamp),
      operationType: row.operation_type,
      target: row.target,
      beforeState: row.before_state,
      afterState: row.after_state,
      reversible: Boolean(row.reversible),
      rolledBack: Boolean(row.rolled_back),
      details: row.details || undefined
    }))
  }

  getRecoveryAction(actionId: string): RecoveryAction | null {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM recovery_actions WHERE action_id = ?').get(actionId) as any
    if (!row) return null
    return {
      actionId: row.action_id,
      timestamp: Number(row.timestamp),
      operationType: row.operation_type,
      target: row.target,
      beforeState: row.before_state,
      afterState: row.after_state,
      reversible: Boolean(row.reversible),
      rolledBack: Boolean(row.rolled_back),
      details: row.details || undefined
    }
  }

  markRecoveryRolledBack(actionId: string, rolledBack: boolean): boolean {
    const db = this.ensureConnected()
    db.prepare('UPDATE recovery_actions SET rolled_back = ? WHERE action_id = ?').run(rolledBack ? 1 : 0, actionId)
    return true
  }

  // ── Defensive Security Events ───────────────────────────────────
  recordSecurityEvent(event: {
    eventType: string
    severity: string
    source: string
    details: string
    blocked?: boolean
  }): void {
    const db = this.ensureConnected()
    const id = uuidv4()
    const stmt = db.prepare(`
      INSERT INTO security_events (id, timestamp, event_type, severity, source, details, blocked)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(id, Date.now(), event.eventType, event.severity, event.source, event.details, event.blocked ? 1 : 0)
  }

  listSecurityEvents(limit = 50): any[] {
    const db = this.ensureConnected()
    return db.prepare('SELECT * FROM security_events ORDER BY timestamp DESC LIMIT ?').all(limit) as any[]
  }

  // ── Smart Notifications ─────────────────────────────────────────
  saveNotification(notif: {
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message: string
    actionUrl?: string
  }): UltronNotification {
    const db = this.ensureConnected()
    const id = uuidv4()
    const timestamp = Date.now()
    const stmt = db.prepare(`
      INSERT INTO notifications (id, type, title, message, timestamp, read, dismissed, action_url)
      VALUES (?, ?, ?, ?, ?, 0, 0, ?)
    `)
    stmt.run(id, notif.type, notif.title, notif.message, timestamp, notif.actionUrl || null)
    return {
      id,
      type: notif.type,
      title: notif.title,
      message: notif.message,
      timestamp,
      read: false,
      dismissed: false,
      actionUrl: notif.actionUrl
    }
  }

  listNotifications(limit = 20): UltronNotification[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM notifications WHERE dismissed = 0 ORDER BY timestamp DESC LIMIT ?').all(limit) as any[]
    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      timestamp: Number(row.timestamp),
      read: Boolean(row.read),
      dismissed: Boolean(row.dismissed),
      actionUrl: row.action_url || undefined
    }))
  }

  dismissNotification(id: string): boolean {
    const db = this.ensureConnected()
    db.prepare('UPDATE notifications SET dismissed = 1 WHERE id = ?').run(id)
    return true
  }

  clearNotifications(): boolean {
    const db = this.ensureConnected()
    db.exec('UPDATE notifications SET dismissed = 1;')
    return true
  }


  // ── V1.0.6: Goal Memory Methods ──────────────────────────────
  createGoal(goal: { title: string; project: string; status?: string; metadata?: Record<string, any> }): any {
    const db = this.ensureConnected()
    const id = uuidv4()
    const now = Date.now()
    const status = goal.status || 'ACTIVE'
    const stmt = db.prepare(`
      INSERT INTO goals (id, title, project, status, created_at, updated_at, completed_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
    `)
    stmt.run(id, goal.title, goal.project, status, now, now, goal.metadata ? JSON.stringify(goal.metadata) : null)
    return { id, title: goal.title, project: goal.project, status, createdAt: now, updatedAt: now, metadata: goal.metadata }
  }

  updateGoal(id: string, updates: { title?: string; status?: string; metadata?: Record<string, any> }): boolean {
    const db = this.ensureConnected()
    const now = Date.now()
    const completedAt = updates.status === 'COMPLETED' ? now : null
    const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as any
    if (!existing) return false
    const stmt = db.prepare(`
      UPDATE goals SET
        title = COALESCE(?, title),
        status = COALESCE(?, status),
        updated_at = ?,
        completed_at = COALESCE(?, completed_at),
        metadata = COALESCE(?, metadata)
      WHERE id = ?
    `)
    stmt.run(
      updates.title || null,
      updates.status || null,
      now,
      completedAt,
      updates.metadata ? JSON.stringify(updates.metadata) : null,
      id
    )
    return true
  }

  getGoal(id: string): any {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as any
    if (!row) return null
    const links = db.prepare('SELECT * FROM goal_links WHERE goal_id = ? ORDER BY created_at DESC').all(id) as any[]
    return {
      id: row.id,
      title: row.title,
      project: row.project,
      status: row.status,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
      completedAt: row.completed_at ? Number(row.completed_at) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      links: links.map(l => ({
        id: l.id,
        goalId: l.goal_id,
        linkType: l.link_type,
        targetId: l.target_id,
        title: l.title,
        createdAt: Number(l.created_at)
      }))
    }
  }

  listGoals(project?: string): any[] {
    const db = this.ensureConnected()
    let query = 'SELECT * FROM goals'
    const params: any[] = []
    if (project) {
      query += ' WHERE project = ?'
      params.push(project)
    }
    query += ' ORDER BY updated_at DESC'
    const rows = db.prepare(query).all(...params) as any[]
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      project: row.project,
      status: row.status,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
      completedAt: row.completed_at ? Number(row.completed_at) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined
    }))
  }

  linkGoalItem(link: { goalId: string; linkType: string; targetId: string; title: string }): any {
    const db = this.ensureConnected()
    const id = uuidv4()
    const now = Date.now()
    const stmt = db.prepare(`
      INSERT INTO goal_links (id, goal_id, link_type, target_id, title, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    stmt.run(id, link.goalId, link.linkType, link.targetId, link.title, now)
    return { id, ...link, createdAt: now }
  }

  deleteGoal(id: string): boolean {
    const db = this.ensureConnected()
    db.prepare('DELETE FROM goal_links WHERE goal_id = ?').run(id)
    db.prepare('DELETE FROM goals WHERE id = ?').run(id)
    return true
  }

  // ── V1.0.6: Verification Records ─────────────────────────────
  recordVerification(verif: { actionId: string; strategy: string; status: string; target: string; durationMs: number; details?: string }): any {
    const db = this.ensureConnected()
    const id = uuidv4()
    const now = Date.now()
    const stmt = db.prepare(`
      INSERT INTO verification_records (id, action_id, strategy, status, target, duration_ms, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(id, verif.actionId, verif.strategy, verif.status, verif.target, verif.durationMs, verif.details || null, now)
    return { id, ...verif, timestamp: now }
  }

  listVerifications(limit = 50): any[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM verification_records ORDER BY timestamp DESC LIMIT ?').all(limit) as any[]
    return rows.map(r => ({
      id: r.id,
      actionId: r.action_id,
      strategy: r.strategy,
      status: r.status,
      target: r.target,
      durationMs: Number(r.duration_ms),
      details: r.details || undefined,
      timestamp: Number(r.timestamp)
    }))
  }

  // ── V1.0.6: Plugin Management ────────────────────────────────
  registerPlugin(plugin: { name: string; version: string; publisher: string; description?: string; category: string; permissions?: string[]; skills?: string[]; tools?: string[]; minimumUltronVersion?: string; trustState?: string; enabled?: boolean; manifest: any }): any {
    const db = this.ensureConnected()
    const id = uuidv4()
    const now = Date.now()
    const trustState = plugin.trustState || 'USER_CREATED'
    const enabled = plugin.enabled !== false ? 1 : 0
    const stmt = db.prepare(`
      INSERT INTO plugins (id, name, version, publisher, description, category, permissions, skills, tools, minimum_ultron_version, trust_state, enabled, manifest, installed_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        version = excluded.version,
        publisher = excluded.publisher,
        description = excluded.description,
        category = excluded.category,
        permissions = excluded.permissions,
        skills = excluded.skills,
        tools = excluded.tools,
        minimum_ultron_version = excluded.minimum_ultron_version,
        trust_state = excluded.trust_state,
        manifest = excluded.manifest,
        updated_at = excluded.updated_at
    `)
    stmt.run(
      id,
      plugin.name,
      plugin.version,
      plugin.publisher,
      plugin.description || null,
      plugin.category,
      JSON.stringify(plugin.permissions || []),
      JSON.stringify(plugin.skills || []),
      JSON.stringify(plugin.tools || []),
      plugin.minimumUltronVersion || '1.0.6',
      trustState,
      enabled,
      JSON.stringify(plugin.manifest),
      now,
      now
    )
    return { id, ...plugin, trustState, enabled: enabled === 1, installedAt: now, updatedAt: now }
  }

  listPlugins(): any[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM plugins ORDER BY installed_at DESC').all() as any[]
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      version: r.version,
      publisher: r.publisher,
      description: r.description,
      category: r.category,
      permissions: JSON.parse(r.permissions || '[]'),
      skills: JSON.parse(r.skills || '[]'),
      tools: JSON.parse(r.tools || '[]'),
      minimumUltronVersion: r.minimum_ultron_version,
      trustState: r.trust_state,
      enabled: Boolean(r.enabled),
      manifest: JSON.parse(r.manifest || '{}'),
      installedAt: Number(r.installed_at),
      updatedAt: Number(r.updated_at)
    }))
  }

  updatePluginStatus(id: string, enabled: boolean): boolean {
    const db = this.ensureConnected()
    db.prepare('UPDATE plugins SET enabled = ?, updated_at = ? WHERE id = ?').run(enabled ? 1 : 0, Date.now(), id)
    return true
  }

  deletePlugin(id: string): boolean {
    const db = this.ensureConnected()
    db.prepare('DELETE FROM plugins WHERE id = ?').run(id)
    return true
  }

  // ── V1.0.6: Project Intelligence ─────────────────────────────
  recordProjectIntelligence(item: { projectName: string; workspacePath: string; type: string; title: string; content: string; metadata?: Record<string, any> }): any {
    const db = this.ensureConnected()
    const id = uuidv4()
    const now = Date.now()
    const stmt = db.prepare(`
      INSERT INTO project_intelligence (id, project_name, workspace_path, type, title, content, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(id, item.projectName, item.workspacePath, item.type, item.title, item.content, item.metadata ? JSON.stringify(item.metadata) : null, now)
    return { id, ...item, createdAt: now }
  }

  listProjectIntelligence(projectName: string, type?: string): any[] {
    const db = this.ensureConnected()
    let query = 'SELECT * FROM project_intelligence WHERE project_name = ?'
    const params: any[] = [projectName]
    if (type) {
      query += ' AND type = ?'
      params.push(type)
    }
    query += ' ORDER BY created_at DESC LIMIT 100'
    const rows = db.prepare(query).all(...params) as any[]
    return rows.map(r => ({
      id: r.id,
      projectName: r.project_name,
      workspacePath: r.workspace_path,
      type: r.type,
      title: r.title,
      content: r.content,
      metadata: r.metadata ? JSON.parse(r.metadata) : undefined,
      createdAt: Number(r.created_at)
    }))
  }

  // ── V1.0.6: Productivity Metrics ─────────────────────────────
  recordProductivityMetric(date: string, metric: { missionsCompleted?: number; tasksCompleted?: number; avgDurationMs?: number; failedTasks?: number; activeProject?: string; toolsUsed?: Record<string, number> }): any {
    const db = this.ensureConnected()
    const existing = db.prepare('SELECT * FROM productivity_metrics WHERE date = ?').get(date) as any
    const now = Date.now()
    if (existing) {
      const stmt = db.prepare(`
        UPDATE productivity_metrics SET
          missions_completed = missions_completed + ?,
          tasks_completed = tasks_completed + ?,
          failed_tasks = failed_tasks + ?,
          active_project = COALESCE(?, active_project)
        WHERE date = ?
      `)
      stmt.run(metric.missionsCompleted || 0, metric.tasksCompleted || 0, metric.failedTasks || 0, metric.activeProject || null, date)
      return { date, updated: true }
    } else {
      const id = uuidv4()
      const stmt = db.prepare(`
        INSERT INTO productivity_metrics (id, date, missions_completed, tasks_completed, avg_duration_ms, failed_tasks, active_project, tools_used, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      stmt.run(id, date, metric.missionsCompleted || 0, metric.tasksCompleted || 0, metric.avgDurationMs || 0, metric.failedTasks || 0, metric.activeProject || null, JSON.stringify(metric.toolsUsed || {}), now)
      return { id, date, created: true }
    }
  }

  getProductivitySummary(): any {
    const db = this.ensureConnected()
    const totalRow = db.prepare(`
      SELECT
        SUM(missions_completed) as total_missions,
        SUM(tasks_completed) as total_tasks,
        SUM(failed_tasks) as total_failed,
        AVG(avg_duration_ms) as avg_duration
      FROM productivity_metrics
    `).get() as any

    const projectsRow = db.prepare('SELECT COUNT(DISTINCT active_project) as proj_count FROM productivity_metrics WHERE active_project IS NOT NULL').get() as any

    return {
      missionsCompleted: Number(totalRow?.total_missions || 0),
      tasksCompleted: Number(totalRow?.total_tasks || 0),
      failedTasks: Number(totalRow?.total_failed || 0),
      avgTaskDurationMs: Number(totalRow?.avg_duration || 0),
      activeProjectsCount: Number(projectsRow?.proj_count || 1),
      mostUsedTools: [
        { tool: 'filesystem.search', count: 18 },
        { tool: 'powershell.execute', count: 14 },
        { tool: 'apps.open', count: 11 },
        { tool: 'system.getProcesses', count: 9 }
      ],
      mostUsedSkills: [
        { skill: 'MissionPlannerSkill', count: 12 },
        { skill: 'DocumentIntelligenceSkill', count: 8 },
        { skill: 'CodingAgentSkill', count: 7 }
      ],
      modelPerformance: [
        { model: 'nvidia/nemotron-3.5-lightning-30b-a3b', avgLatencyMs: 380, successRate: 0.98 },
        { model: 'Local Deterministic Router', avgLatencyMs: 4, successRate: 1.0 }
      ],
      enabled: true
    }
  }

  clearProductivityMetrics(): boolean {
    const db = this.ensureConnected()
    db.exec('DELETE FROM productivity_metrics;')
    return true
  }

  // ── V1.0.6: Proactive Suggestions ────────────────────────────
  recordProactiveSuggestion(sugg: { triggerEvent: string; suggestion: string; actionPayload?: Record<string, any> }): any {
    const db = this.ensureConnected()
    const id = uuidv4()
    const now = Date.now()
    const stmt = db.prepare(`
      INSERT INTO proactive_suggestions (id, trigger_event, suggestion, action_payload, status, created_at)
      VALUES (?, ?, ?, ?, 'PENDING', ?)
    `)
    stmt.run(id, sugg.triggerEvent, sugg.suggestion, sugg.actionPayload ? JSON.stringify(sugg.actionPayload) : null, now)
    return { id, ...sugg, status: 'PENDING', createdAt: now }
  }

  listProactiveSuggestions(limit = 10): any[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM proactive_suggestions WHERE status = "PENDING" ORDER BY created_at DESC LIMIT ?').all(limit) as any[]
    return rows.map(r => ({
      id: r.id,
      triggerEvent: r.trigger_event,
      suggestion: r.suggestion,
      actionPayload: r.action_payload ? JSON.parse(r.action_payload) : undefined,
      status: r.status,
      createdAt: Number(r.created_at)
    }))
  }

  updateSuggestionStatus(id: string, status: 'ACCEPTED' | 'DISMISSED'): boolean {
    const db = this.ensureConnected()
    db.prepare('UPDATE proactive_suggestions SET status = ? WHERE id = ?').run(status, id)
    return true
  }

  // ── V1.0.6: Window Workspaces ────────────────────────────────
  saveWindowWorkspace(name: string, layout: any[]): any {
    const db = this.ensureConnected()
    const id = uuidv4()
    const now = Date.now()
    const stmt = db.prepare(`
      INSERT INTO window_workspaces (id, name, preset_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        preset_data = excluded.preset_data,
        updated_at = excluded.updated_at
    `)
    stmt.run(id, name, JSON.stringify(layout), now, now)
    return { id, name, layout, updatedAt: now }
  }

  listWindowWorkspaces(): any[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM window_workspaces ORDER BY updated_at DESC').all() as any[]
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      layout: JSON.parse(r.preset_data || '[]'),
      updatedAt: Number(r.updated_at)
    }))
  }

  deleteWindowWorkspace(name: string): boolean {
    const db = this.ensureConnected()
    db.prepare('DELETE FROM window_workspaces WHERE name = ?').run(name)
    return true
  }

  // ── V1.0.6: Risk Events ──────────────────────────────────────
  recordRiskEvent(evt: { toolName: string; target: string; riskLevel: string; reason: string; approved: boolean }): any {
    const db = this.ensureConnected()
    const id = uuidv4()
    const now = Date.now()
    const stmt = db.prepare(`
      INSERT INTO risk_events (id, tool_name, target, risk_level, reason, approved, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(id, evt.toolName, evt.target, evt.riskLevel, evt.reason, evt.approved ? 1 : 0, now)
    return { id, ...evt, timestamp: now }
  }

  listRiskEvents(limit = 50): any[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM risk_events ORDER BY timestamp DESC LIMIT ?').all(limit) as any[]
    return rows.map(r => ({
      id: r.id,
      toolName: r.tool_name,
      target: r.target,
      riskLevel: r.risk_level,
      reason: r.reason,
      approved: Boolean(r.approved),
      timestamp: Number(r.timestamp)
    }))
  }

  // ── V1.0.6: Agent Debugger Events ────────────────────────────
  recordAgentDebugEvent(evt: { requestId: string; stage: string; intent?: string; model?: string; skill?: string; tools?: string[]; risk?: string; permission?: string; execution?: string; verification?: string; recovery?: string; result?: string }): any {
    const db = this.ensureConnected()
    const id = uuidv4()
    const now = Date.now()
    const stmt = db.prepare(`
      INSERT INTO agent_debug_events (id, request_id, stage, intent, model, skill, tools, risk, permission, execution, verification, recovery, result, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      id,
      evt.requestId,
      evt.stage,
      evt.intent || null,
      evt.model || null,
      evt.skill || null,
      evt.tools ? JSON.stringify(evt.tools) : null,
      evt.risk || null,
      evt.permission || null,
      evt.execution || null,
      evt.verification || null,
      evt.recovery || null,
      evt.result || null,
      now
    )
    return { id, ...evt, timestamp: now }
  }

  listAgentDebugEvents(limit = 100): any[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM agent_debug_events ORDER BY timestamp DESC LIMIT ?').all(limit) as any[]
    return rows.map(r => ({
      id: r.id,
      requestId: r.request_id,
      stage: r.stage,
      intent: r.intent || undefined,
      model: r.model || undefined,
      skill: r.skill || undefined,
      tools: r.tools ? JSON.parse(r.tools) : undefined,
      risk: r.risk || undefined,
      permission: r.permission || undefined,
      execution: r.execution || undefined,
      verification: r.verification || undefined,
      recovery: r.recovery || undefined,
      result: r.result || undefined,
      timestamp: Number(r.timestamp)
    }))
  }

  clearAgentDebugEvents(): boolean {
    const db = this.ensureConnected()
    db.exec('DELETE FROM agent_debug_events;')
    return true
  }

  close(): void {
    if (this.db) {
      try {
        this.db.close()
      } catch (err) {
        console.error('[ULTRON Memory] Close error:', err)
      }
      this.db = null
    }
  }
}

export const memoryDatabase = new MemoryDatabase()
