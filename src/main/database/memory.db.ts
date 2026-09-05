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
  WorkspaceProjectInfo
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

      console.log(`[ULTRON Memory] SQLite database initialized at ${this.dbPath}`)
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
