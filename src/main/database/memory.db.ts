// src/main/database/memory.db.ts — Persistent SQLite Memory Subsystem for ULTRON
import { DatabaseSync } from 'node:sqlite'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { MemoryRecord, MemoryCategory, MemorySearchParams, MemoryStats } from '../../shared/types'

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

  // Key-value pairs: password=..., api_key: "..."
  sanitized = sanitized.replace(
    /((?:password|passwd|secret|api[_-]?key|apikey|auth[_-]?token)\s*[:=]\s*["']?)([^"'\s,;]+)(["']?)/gi,
    '$1[REDACTED_SECRET]$3'
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

      // Create indices
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
        CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key);
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
