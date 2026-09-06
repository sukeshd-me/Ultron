// scratch/update_memory_db_v107.js
const fs = require('fs')
const path = require('path')

const targetPath = path.resolve(__dirname, '../src/main/database/memory.db.ts')
let content = fs.readFileSync(targetPath, 'utf8')

// 1. Update imports
const oldImport = `  UltronNotification
} from '../../shared/types'`

const newImport = `  UltronNotification,
  CommunicationItem,
  InboxItem,
  DailyBriefing,
  FocusSession,
  WorkspaceProfile,
  WorkspaceItem,
  AutomationDefinition,
  AutomationRun,
  ScheduledMission,
  EventTrigger,
  PersonalityProfile,
  WorkspaceBackupMeta,
  WorkspaceBackupBundle,
  MemoryItemView
} from '../../shared/types'`

if (!content.includes('CommunicationItem')) {
  content = content.replace(oldImport, newImport)
}

// 2. Add V1.0.7 tables in init()
const schemaMarker = `console.log(\`[ULTRON Memory] SQLite database initialized at \${this.dbPath} (V1.0.6 schema active)\`)`

const v107Tables = `      // ════════════════════════════════════════════════════════════════
      // ── V1.0.7: INTELLIGENT AGENT OPERATING LAYER ───────────────────
      // ════════════════════════════════════════════════════════════════

      // ── 1. Communication Items ──
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS communication_items (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          source TEXT NOT NULL,
          target TEXT,
          sender TEXT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          status TEXT NOT NULL,
          metadata TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_comm_ts ON communication_items(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_comm_type ON communication_items(type);
      \`)

      // ── 2. Universal Inbox Items ──
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS inbox_items (
          id TEXT PRIMARY KEY,
          source TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          importance TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          is_read INTEGER DEFAULT 0,
          action_available INTEGER DEFAULT 0,
          action_label TEXT,
          action_payload TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_inbox_ts ON inbox_items(timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_inbox_unread ON inbox_items(is_read);
        CREATE INDEX IF NOT EXISTS idx_inbox_importance ON inbox_items(importance);
      \`)

      // ── 3. Daily Briefings ──
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS briefings (
          id TEXT PRIMARY KEY,
          timestamp INTEGER NOT NULL,
          date_string TEXT NOT NULL,
          greeting TEXT NOT NULL,
          summary TEXT NOT NULL,
          data TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_briefings_ts ON briefings(timestamp DESC);
      \`)

      // ── 4. Focus Sessions ──
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS focus_sessions (
          id TEXT PRIMARY KEY,
          mode TEXT NOT NULL,
          duration_minutes INTEGER NOT NULL,
          elapsed_seconds INTEGER NOT NULL,
          started_at INTEGER NOT NULL,
          ended_at INTEGER,
          active INTEGER DEFAULT 1,
          target_apps TEXT,
          notifications_muted INTEGER DEFAULT 1
        );
        CREATE INDEX IF NOT EXISTS idx_focus_active ON focus_sessions(active);
        CREATE INDEX IF NOT EXISTS idx_focus_started ON focus_sessions(started_at DESC);
      \`)

      // ── 5. Multiple Workspace Profiles & Items ──
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS workspace_profiles (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          category TEXT NOT NULL,
          default_model TEXT,
          preferred_skills TEXT,
          layout_preset TEXT,
          is_active INTEGER DEFAULT 0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_ws_prof_active ON workspace_profiles(is_active);

        CREATE TABLE IF NOT EXISTS workspace_items (
          id TEXT PRIMARY KEY,
          workspace_id TEXT NOT NULL,
          item_type TEXT NOT NULL,
          target_path TEXT NOT NULL,
          launch_args TEXT,
          window_action TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_ws_items_wsid ON workspace_items(workspace_id);
      \`)

      // ── 6. Automations & Runs ──
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS automations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          trigger_type TEXT NOT NULL,
          event_type TEXT,
          cron_expression TEXT,
          time_schedule TEXT,
          conditions TEXT NOT NULL,
          actions TEXT NOT NULL,
          enabled INTEGER DEFAULT 1,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          last_run_at INTEGER,
          last_run_status TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_automations_enabled ON automations(enabled);

        CREATE TABLE IF NOT EXISTS automation_runs (
          id TEXT PRIMARY KEY,
          automation_id TEXT NOT NULL,
          executed_at INTEGER NOT NULL,
          status TEXT NOT NULL,
          actions_count INTEGER DEFAULT 0,
          error TEXT,
          duration_ms REAL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_auto_runs_ts ON automation_runs(executed_at DESC);
      \`)

      // ── 7. Scheduled Missions ──
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS scheduled_missions (
          id TEXT PRIMARY KEY,
          mission_id TEXT,
          title TEXT NOT NULL,
          goal TEXT NOT NULL,
          recurrence TEXT NOT NULL,
          cron_or_schedule TEXT NOT NULL,
          next_run_at INTEGER NOT NULL,
          last_run_at INTEGER,
          status TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_sched_missions_next ON scheduled_missions(next_run_at ASC, status);
      \`)

      // ── 8. Event Triggers ──
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS event_triggers (
          id TEXT PRIMARY KEY,
          event_type TEXT NOT NULL,
          automation_id TEXT NOT NULL,
          enabled INTEGER DEFAULT 1
        );
        CREATE INDEX IF NOT EXISTS idx_evt_triggers_type ON event_triggers(event_type, enabled);
      \`)

      // ── 9. Personality Profiles ──
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS personality_profiles (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          verbosity TEXT NOT NULL,
          tone TEXT NOT NULL,
          status_prefix TEXT NOT NULL,
          is_active INTEGER DEFAULT 0
        );
      \`)

      // ── 10. Workspace Backups ──
      this.db.exec(\`
        CREATE TABLE IF NOT EXISTS workspace_backups (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          ultron_version TEXT NOT NULL,
          workspace_count INTEGER NOT NULL,
          automation_count INTEGER NOT NULL,
          size_bytes INTEGER NOT NULL,
          bundle_data TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_ws_backups_ts ON workspace_backups(created_at DESC);
      \`)

      // Seed default workspace profiles if empty
      const wsCountRow = this.db.prepare('SELECT COUNT(*) as count FROM workspace_profiles').get() as any
      if (wsCountRow && wsCountRow.count === 0) {
        const now = Date.now()
        const defaultProfiles = [
          { id: 'dev-workspace', name: 'Development', description: 'Primary software engineering and debugging environment', category: 'Development', preferred_skills: JSON.stringify(['code-editing', 'terminal-execution', 'git-ops']), layout_preset: 'code_and_terminal', is_active: 1 },
          { id: 'research-workspace', name: 'Research', description: 'Deep web analysis, document intelligence, and data aggregation', category: 'Research', preferred_skills: JSON.stringify(['web-search', 'document-qa', 'browser-control']), layout_preset: 'browser_and_notes', is_active: 0 },
          { id: 'study-workspace', name: 'Study', description: 'Focused learning, notes, and concept exploration', category: 'Study', preferred_skills: JSON.stringify(['tutor-mode', 'document-qa']), layout_preset: 'reader_view', is_active: 0 },
          { id: 'personal-workspace', name: 'Personal', description: 'Daily planning, communications, and personal tasks', category: 'Personal', preferred_skills: JSON.stringify(['calendar', 'android-sms', 'briefing']), layout_preset: 'compact_dashboard', is_active: 0 },
          { id: 'security-lab-workspace', name: 'Security Lab', description: 'Defensive audits, log analysis, and system verification', category: 'Security Lab', preferred_skills: JSON.stringify(['audit-verification', 'risk-analysis']), layout_preset: 'split_logs', is_active: 0 }
        ]
        for (const p of defaultProfiles) {
          this.db.prepare(\`
            INSERT INTO workspace_profiles (id, name, description, category, preferred_skills, layout_preset, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          \`).run(p.id, p.name, p.description, p.category, p.preferred_skills, p.layout_preset, p.is_active, now, now)
        }
      }

      // Seed default personality profiles if empty
      const pCountRow = this.db.prepare('SELECT COUNT(*) as count FROM personality_profiles').get() as any
      if (pCountRow && pCountRow.count === 0) {
        const personalities = [
          { id: 'Balanced', name: 'Balanced', description: 'Natural, poised, and adaptive assistant profile', verbosity: 'balanced', tone: 'neutral', statusPrefix: 'ULTRON', is_active: 1 },
          { id: 'Professional', name: 'Professional', description: 'Formal, concise executive command posture', verbosity: 'concise', tone: 'instructive', statusPrefix: 'EXECUTIVE', is_active: 0 },
          { id: 'Technical', name: 'Technical', description: 'Detailed systems engineering and diagnostic focus', verbosity: 'detailed', tone: 'technical', statusPrefix: 'ENGINEER', is_active: 0 },
          { id: 'Minimal', name: 'Minimal', description: 'Ultra-concise telemetry and action status only', verbosity: 'concise', tone: 'minimalist', statusPrefix: 'CORE', is_active: 0 },
          { id: 'Tutor', name: 'Tutor', description: 'Instructive, educational, and explanatory guidance', verbosity: 'detailed', tone: 'instructive', statusPrefix: 'TUTOR', is_active: 0 },
          { id: 'Developer', name: 'Developer', description: 'Code-first syntax, refactor, and build orientation', verbosity: 'balanced', tone: 'technical', statusPrefix: 'DEV', is_active: 0 },
          { id: 'Researcher', name: 'Researcher', description: 'Rigorous citations, evidence, and structured breakdown', verbosity: 'detailed', tone: 'technical', statusPrefix: 'RESEARCH', is_active: 0 },
          { id: 'Custom', name: 'Custom', description: 'User-configured personality settings', verbosity: 'balanced', tone: 'neutral', statusPrefix: 'CUSTOM', is_active: 0 }
        ]
        for (const p of personalities) {
          this.db.prepare(\`
            INSERT INTO personality_profiles (id, name, description, verbosity, tone, status_prefix, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          \`).run(p.id, p.name, p.description, p.verbosity, p.tone, p.statusPrefix, p.is_active)
        }
      }

      console.log(\`[ULTRON Memory] SQLite database initialized at \${this.dbPath} (V1.0.7 schema active)\`)`

if (content.includes(schemaMarker)) {
  content = content.replace(schemaMarker, v107Tables)
}

// 3. Add V1.0.7 helper methods before close()
const closeMarker = `  close(): void {`

const v107Methods = `  // ════════════════════════════════════════════════════════════════
  // ── V1.0.7: DATA ACCESS & HELPER METHODS ─────────────────────────
  // ════════════════════════════════════════════════════════════════

  // ── 1. Communication Items ──
  saveCommunicationItem(item: Omit<CommunicationItem, 'id' | 'timestamp'> & { id?: string; timestamp?: number }): CommunicationItem {
    const db = this.ensureConnected()
    const id = item.id || uuidv4()
    const timestamp = item.timestamp || Date.now()
    const stmt = db.prepare(\`
      INSERT OR REPLACE INTO communication_items (id, type, source, target, sender, title, content, timestamp, status, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`)
    stmt.run(
      id,
      item.type,
      item.source,
      item.target || null,
      item.sender || null,
      item.title,
      redactSecrets(item.content),
      timestamp,
      item.status,
      item.metadata ? JSON.stringify(item.metadata) : null
    )
    return {
      id,
      type: item.type,
      source: item.source,
      target: item.target,
      sender: item.sender,
      title: item.title,
      content: item.content,
      timestamp,
      status: item.status,
      metadata: item.metadata
    }
  }

  getRecentCommunications(limit = 50, type?: string): CommunicationItem[] {
    const db = this.ensureConnected()
    let query = 'SELECT * FROM communication_items'
    const params: any[] = []
    if (type) {
      query += ' WHERE type = ?'
      params.push(type)
    }
    query += ' ORDER BY timestamp DESC LIMIT ?'
    params.push(limit)

    const rows = db.prepare(query).all(...params) as any[]
    return rows.map(r => ({
      id: r.id,
      type: r.type,
      source: r.source,
      target: r.target || undefined,
      sender: r.sender || undefined,
      title: r.title,
      content: r.content,
      timestamp: Number(r.timestamp),
      status: r.status,
      metadata: r.metadata ? JSON.parse(r.metadata) : undefined
    }))
  }

  // ── 2. Universal Inbox Items ──
  saveInboxItem(item: Omit<InboxItem, 'id' | 'timestamp' | 'isRead'> & { id?: string; timestamp?: number; isRead?: boolean }): InboxItem {
    const db = this.ensureConnected()
    const id = item.id || uuidv4()
    const timestamp = item.timestamp || Date.now()
    const isRead = item.isRead ? 1 : 0
    const stmt = db.prepare(\`
      INSERT OR REPLACE INTO inbox_items (id, source, title, content, importance, timestamp, is_read, action_available, action_label, action_payload)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`)
    stmt.run(
      id,
      item.source,
      item.title,
      redactSecrets(item.content),
      item.importance,
      timestamp,
      isRead,
      item.actionAvailable ? 1 : 0,
      item.actionLabel || null,
      item.actionPayload ? JSON.stringify(item.actionPayload) : null
    )
    return {
      id,
      source: item.source,
      title: item.title,
      content: item.content,
      importance: item.importance,
      timestamp,
      isRead: Boolean(isRead),
      actionAvailable: item.actionAvailable,
      actionLabel: item.actionLabel,
      actionPayload: item.actionPayload
    }
  }

  listInboxItems(filter?: { unreadOnly?: boolean; importance?: string; limit?: number }): InboxItem[] {
    const db = this.ensureConnected()
    let query = 'SELECT * FROM inbox_items WHERE 1=1'
    const params: any[] = []
    if (filter?.unreadOnly) {
      query += ' AND is_read = 0'
    }
    if (filter?.importance) {
      query += ' AND importance = ?'
      params.push(filter.importance)
    }
    query += ' ORDER BY timestamp DESC LIMIT ?'
    params.push(filter?.limit || 100)

    const rows = db.prepare(query).all(...params) as any[]
    return rows.map(r => ({
      id: r.id,
      source: r.source,
      title: r.title,
      content: r.content,
      importance: r.importance,
      timestamp: Number(r.timestamp),
      isRead: Boolean(r.is_read),
      actionAvailable: Boolean(r.action_available),
      actionLabel: r.action_label || undefined,
      actionPayload: r.action_payload ? JSON.parse(r.action_payload) : undefined
    }))
  }

  getInboxSummary(): { totalCount: number; unreadCount: number; urgentCount: number; highCount: number; items: InboxItem[] } {
    const items = this.listInboxItems({ limit: 50 })
    const totalCount = (this.ensureConnected().prepare('SELECT COUNT(*) as count FROM inbox_items').get() as any)?.count || 0
    const unreadCount = (this.ensureConnected().prepare('SELECT COUNT(*) as count FROM inbox_items WHERE is_read = 0').get() as any)?.count || 0
    const urgentCount = (this.ensureConnected().prepare("SELECT COUNT(*) as count FROM inbox_items WHERE importance = 'URGENT' AND is_read = 0").get() as any)?.count || 0
    const highCount = (this.ensureConnected().prepare("SELECT COUNT(*) as count FROM inbox_items WHERE importance = 'HIGH' AND is_read = 0").get() as any)?.count || 0

    return { totalCount, unreadCount, urgentCount, highCount, items }
  }

  markInboxItemRead(id: string): boolean {
    const db = this.ensureConnected()
    const res = db.prepare('UPDATE inbox_items SET is_read = 1 WHERE id = ?').run(id)
    return (res as any)?.changes > 0
  }

  clearLowPriorityInbox(): number {
    const db = this.ensureConnected()
    const res = db.prepare("DELETE FROM inbox_items WHERE importance = 'LOW'").run()
    return Number((res as any)?.changes || 0)
  }

  // ── 3. Daily Briefings ──
  saveBriefing(briefing: DailyBriefing): DailyBriefing {
    const db = this.ensureConnected()
    const stmt = db.prepare(\`
      INSERT OR REPLACE INTO briefings (id, timestamp, date_string, greeting, summary, data)
      VALUES (?, ?, ?, ?, ?, ?)
    \`)
    stmt.run(
      briefing.id,
      briefing.timestamp,
      briefing.dateString,
      briefing.greeting,
      briefing.summary,
      JSON.stringify(briefing)
    )
    return briefing
  }

  getLatestBriefing(): DailyBriefing | null {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM briefings ORDER BY timestamp DESC LIMIT 1').get() as any
    if (!row) return null
    try {
      return JSON.parse(row.data)
    } catch {
      return null
    }
  }

  listBriefings(limit = 10): DailyBriefing[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM briefings ORDER BY timestamp DESC LIMIT ?').all(limit) as any[]
    return rows.map(r => {
      try {
        return JSON.parse(r.data)
      } catch {
        return {
          id: r.id,
          timestamp: Number(r.timestamp),
          dateString: r.date_string,
          greeting: r.greeting,
          summary: r.summary,
          activeGoals: [],
          scheduledMissions: [],
          pendingTasks: [],
          systemHealth: {},
          androidStatus: { connected: false },
          projectActivity: [],
          recentCompletedWork: [],
          pendingWork: []
        }
      }
    })
  }

  // ── 4. Focus Sessions ──
  startFocusSession(session: Omit<FocusSession, 'id' | 'elapsedSeconds' | 'active'> & { id?: string }): FocusSession {
    const db = this.ensureConnected()
    const id = session.id || uuidv4()
    // Deactivate existing active focus sessions
    db.prepare('UPDATE focus_sessions SET active = 0, ended_at = ? WHERE active = 1').run(Date.now())
    const stmt = db.prepare(\`
      INSERT INTO focus_sessions (id, mode, duration_minutes, elapsed_seconds, started_at, active, target_apps, notifications_muted)
      VALUES (?, ?, ?, 0, ?, 1, ?, ?)
    \`)
    stmt.run(
      id,
      session.mode,
      session.durationMinutes,
      session.startedAt,
      JSON.stringify(session.targetApps || []),
      session.notificationsMuted ? 1 : 0
    )
    return {
      id,
      mode: session.mode,
      durationMinutes: session.durationMinutes,
      elapsedSeconds: 0,
      startedAt: session.startedAt,
      active: true,
      targetApps: session.targetApps,
      notificationsMuted: session.notificationsMuted
    }
  }

  updateFocusSession(id: string, elapsedSeconds: number): boolean {
    const db = this.ensureConnected()
    const res = db.prepare('UPDATE focus_sessions SET elapsed_seconds = ? WHERE id = ?').run(elapsedSeconds, id)
    return (res as any)?.changes > 0
  }

  endFocusSession(id: string): boolean {
    const db = this.ensureConnected()
    const res = db.prepare('UPDATE focus_sessions SET active = 0, ended_at = ? WHERE id = ?').run(Date.now(), id)
    return (res as any)?.changes > 0
  }

  getActiveFocusSession(): FocusSession | null {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM focus_sessions WHERE active = 1 ORDER BY started_at DESC LIMIT 1').get() as any
    if (!row) return null
    return {
      id: row.id,
      mode: row.mode,
      durationMinutes: Number(row.duration_minutes),
      elapsedSeconds: Number(row.elapsed_seconds),
      startedAt: Number(row.started_at),
      endedAt: row.ended_at ? Number(row.ended_at) : undefined,
      active: Boolean(row.active),
      targetApps: row.target_apps ? JSON.parse(row.target_apps) : [],
      notificationsMuted: Boolean(row.notifications_muted)
    }
  }

  listFocusSessions(limit = 20): FocusSession[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM focus_sessions ORDER BY started_at DESC LIMIT ?').all(limit) as any[]
    return rows.map(row => ({
      id: row.id,
      mode: row.mode,
      durationMinutes: Number(row.duration_minutes),
      elapsedSeconds: Number(row.elapsed_seconds),
      startedAt: Number(row.started_at),
      endedAt: row.ended_at ? Number(row.ended_at) : undefined,
      active: Boolean(row.active),
      targetApps: row.target_apps ? JSON.parse(row.target_apps) : [],
      notificationsMuted: Boolean(row.notifications_muted)
    }))
  }

  // ── 5. Multiple Workspace Profiles ──
  listWorkspaceProfiles(): WorkspaceProfile[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM workspace_profiles ORDER BY name ASC').all() as any[]
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      category: r.category,
      defaultModel: r.default_model || undefined,
      preferredSkills: r.preferred_skills ? JSON.parse(r.preferred_skills) : [],
      layoutPreset: r.layout_preset || undefined,
      isActive: Boolean(r.is_active),
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at)
    }))
  }

  getWorkspaceProfile(idOrName: string): WorkspaceProfile | null {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM workspace_profiles WHERE id = ? OR name = ?').get(idOrName, idOrName) as any
    if (!row) return null
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      category: row.category,
      defaultModel: row.default_model || undefined,
      preferredSkills: row.preferred_skills ? JSON.parse(row.preferred_skills) : [],
      layoutPreset: row.layout_preset || undefined,
      isActive: Boolean(row.is_active),
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at)
    }
  }

  saveWorkspaceProfile(profile: Omit<WorkspaceProfile, 'createdAt' | 'updatedAt'> & { createdAt?: number; updatedAt?: number }): WorkspaceProfile {
    const db = this.ensureConnected()
    const now = Date.now()
    const createdAt = profile.createdAt || now
    const updatedAt = now
    const stmt = db.prepare(\`
      INSERT OR REPLACE INTO workspace_profiles (id, name, description, category, default_model, preferred_skills, layout_preset, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`)
    stmt.run(
      profile.id,
      profile.name,
      profile.description || null,
      profile.category,
      profile.defaultModel || null,
      JSON.stringify(profile.preferredSkills || []),
      profile.layoutPreset || null,
      profile.isActive ? 1 : 0,
      createdAt,
      updatedAt
    )
    return {
      ...profile,
      createdAt,
      updatedAt
    }
  }

  deleteWorkspaceProfile(id: string): boolean {
    const db = this.ensureConnected()
    db.prepare('DELETE FROM workspace_items WHERE workspace_id = ?').run(id)
    const res = db.prepare('DELETE FROM workspace_profiles WHERE id = ?').run(id)
    return (res as any)?.changes > 0
  }

  setActiveWorkspaceProfile(id: string): boolean {
    const db = this.ensureConnected()
    db.prepare('UPDATE workspace_profiles SET is_active = 0').run()
    const res = db.prepare('UPDATE workspace_profiles SET is_active = 1, updated_at = ? WHERE id = ?').run(Date.now(), id)
    return (res as any)?.changes > 0
  }

  listWorkspaceItems(workspaceId: string): WorkspaceItem[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM workspace_items WHERE workspace_id = ?').all(workspaceId) as any[]
    return rows.map(r => ({
      id: r.id,
      workspaceId: r.workspace_id,
      itemType: r.item_type,
      targetPath: r.target_path,
      launchArgs: r.launch_args || undefined,
      windowAction: r.window_action || undefined
    }))
  }

  saveWorkspaceItem(item: WorkspaceItem): WorkspaceItem {
    const db = this.ensureConnected()
    const stmt = db.prepare(\`
      INSERT OR REPLACE INTO workspace_items (id, workspace_id, item_type, target_path, launch_args, window_action)
      VALUES (?, ?, ?, ?, ?, ?)
    \`)
    stmt.run(
      item.id,
      item.workspaceId,
      item.itemType,
      item.targetPath,
      item.launchArgs || null,
      item.windowAction || null
    )
    return item
  }

  deleteWorkspaceItem(id: string): boolean {
    const db = this.ensureConnected()
    const res = db.prepare('DELETE FROM workspace_items WHERE id = ?').run(id)
    return (res as any)?.changes > 0
  }

  // ── 6. Automations & Runs ──
  listAutomations(): AutomationDefinition[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM automations ORDER BY name ASC').all() as any[]
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      triggerType: r.trigger_type,
      eventType: r.event_type || undefined,
      cronExpression: r.cron_expression || undefined,
      timeSchedule: r.time_schedule || undefined,
      conditions: r.conditions ? JSON.parse(r.conditions) : [],
      actions: r.actions ? JSON.parse(r.actions) : [],
      enabled: Boolean(r.enabled),
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
      lastRunAt: r.last_run_at ? Number(r.last_run_at) : undefined,
      lastRunStatus: r.last_run_status || undefined
    }))
  }

  getAutomation(id: string): AutomationDefinition | null {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM automations WHERE id = ?').get(id) as any
    if (!row) return null
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      triggerType: row.trigger_type,
      eventType: row.event_type || undefined,
      cronExpression: row.cron_expression || undefined,
      timeSchedule: row.time_schedule || undefined,
      conditions: row.conditions ? JSON.parse(row.conditions) : [],
      actions: row.actions ? JSON.parse(row.actions) : [],
      enabled: Boolean(row.enabled),
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
      lastRunAt: row.last_run_at ? Number(row.last_run_at) : undefined,
      lastRunStatus: row.last_run_status || undefined
    }
  }

  saveAutomation(auto: AutomationDefinition): AutomationDefinition {
    const db = this.ensureConnected()
    const stmt = db.prepare(\`
      INSERT OR REPLACE INTO automations (id, name, description, trigger_type, event_type, cron_expression, time_schedule, conditions, actions, enabled, created_at, updated_at, last_run_at, last_run_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`)
    stmt.run(
      auto.id,
      auto.name,
      auto.description || null,
      auto.triggerType,
      auto.eventType || null,
      auto.cronExpression || null,
      auto.timeSchedule || null,
      JSON.stringify(auto.conditions || []),
      JSON.stringify(auto.actions || []),
      auto.enabled ? 1 : 0,
      auto.createdAt,
      auto.updatedAt,
      auto.lastRunAt || null,
      auto.lastRunStatus || null
    )
    return auto
  }

  deleteAutomation(id: string): boolean {
    const db = this.ensureConnected()
    db.prepare('DELETE FROM automation_runs WHERE automation_id = ?').run(id)
    db.prepare('DELETE FROM event_triggers WHERE automation_id = ?').run(id)
    const res = db.prepare('DELETE FROM automations WHERE id = ?').run(id)
    return (res as any)?.changes > 0
  }

  toggleAutomation(id: string, enabled: boolean): boolean {
    const db = this.ensureConnected()
    const res = db.prepare('UPDATE automations SET enabled = ?, updated_at = ? WHERE id = ?').run(enabled ? 1 : 0, Date.now(), id)
    return (res as any)?.changes > 0
  }

  recordAutomationRun(run: Omit<AutomationRun, 'id' | 'executedAt'> & { id?: string; executedAt?: number }): AutomationRun {
    const db = this.ensureConnected()
    const id = run.id || uuidv4()
    const executedAt = run.executedAt || Date.now()
    const stmt = db.prepare(\`
      INSERT INTO automation_runs (id, automation_id, executed_at, status, actions_count, error, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    \`)
    stmt.run(
      id,
      run.automationId,
      executedAt,
      run.status,
      run.actionsCount || 0,
      run.error || null,
      run.durationMs || 0
    )
    // Also update parent automation last_run
    db.prepare('UPDATE automations SET last_run_at = ?, last_run_status = ? WHERE id = ?').run(executedAt, run.status, run.automationId)
    return {
      id,
      automationId: run.automationId,
      executedAt,
      status: run.status,
      actionsCount: run.actionsCount,
      error: run.error,
      durationMs: run.durationMs
    }
  }

  listAutomationRuns(limit = 50, automationId?: string): AutomationRun[] {
    const db = this.ensureConnected()
    let query = 'SELECT * FROM automation_runs'
    const params: any[] = []
    if (automationId) {
      query += ' WHERE automation_id = ?'
      params.push(automationId)
    }
    query += ' ORDER BY executed_at DESC LIMIT ?'
    params.push(limit)

    const rows = db.prepare(query).all(...params) as any[]
    return rows.map(r => ({
      id: r.id,
      automationId: r.automation_id,
      executedAt: Number(r.executed_at),
      status: r.status,
      actionsCount: Number(r.actions_count || 0),
      error: r.error || undefined,
      durationMs: Number(r.duration_ms || 0)
    }))
  }

  // ── 7. Scheduled Missions ──
  listScheduledMissions(): ScheduledMission[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM scheduled_missions ORDER BY next_run_at ASC').all() as any[]
    return rows.map(r => ({
      id: r.id,
      missionId: r.mission_id || undefined,
      title: r.title,
      goal: r.goal,
      recurrence: r.recurrence,
      cronOrSchedule: r.cron_or_schedule,
      nextRunAt: Number(r.next_run_at),
      lastRunAt: r.last_run_at ? Number(r.last_run_at) : undefined,
      status: r.status,
      createdAt: Number(r.created_at)
    }))
  }

  saveScheduledMission(mission: ScheduledMission): ScheduledMission {
    const db = this.ensureConnected()
    const stmt = db.prepare(\`
      INSERT OR REPLACE INTO scheduled_missions (id, mission_id, title, goal, recurrence, cron_or_schedule, next_run_at, last_run_at, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    \`)
    stmt.run(
      mission.id,
      mission.missionId || null,
      mission.title,
      mission.goal,
      mission.recurrence,
      mission.cronOrSchedule,
      mission.nextRunAt,
      mission.lastRunAt || null,
      mission.status,
      mission.createdAt
    )
    return mission
  }

  updateScheduledMissionStatus(id: string, status: ScheduledMission['status']): boolean {
    const db = this.ensureConnected()
    const res = db.prepare('UPDATE scheduled_missions SET status = ? WHERE id = ?').run(status, id)
    return (res as any)?.changes > 0
  }

  deleteScheduledMission(id: string): boolean {
    const db = this.ensureConnected()
    const res = db.prepare('DELETE FROM scheduled_missions WHERE id = ?').run(id)
    return (res as any)?.changes > 0
  }

  // ── 8. Event Triggers ──
  listEventTriggers(eventType?: string): EventTrigger[] {
    const db = this.ensureConnected()
    let query = 'SELECT * FROM event_triggers'
    const params: any[] = []
    if (eventType) {
      query += ' WHERE event_type = ?'
      params.push(eventType)
    }
    const rows = db.prepare(query).all(...params) as any[]
    return rows.map(r => ({
      id: r.id,
      eventType: r.event_type,
      automationId: r.automation_id,
      enabled: Boolean(r.enabled)
    }))
  }

  saveEventTrigger(trigger: EventTrigger): EventTrigger {
    const db = this.ensureConnected()
    const stmt = db.prepare(\`
      INSERT OR REPLACE INTO event_triggers (id, event_type, automation_id, enabled)
      VALUES (?, ?, ?, ?)
    \`)
    stmt.run(trigger.id, trigger.eventType, trigger.automationId, trigger.enabled ? 1 : 0)
    return trigger
  }

  deleteEventTrigger(id: string): boolean {
    const db = this.ensureConnected()
    const res = db.prepare('DELETE FROM event_triggers WHERE id = ?').run(id)
    return (res as any)?.changes > 0
  }

  // ── 9. Personality Profiles ──
  listPersonalityProfiles(): PersonalityProfile[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT * FROM personality_profiles ORDER BY name ASC').all() as any[]
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      verbosity: r.verbosity,
      tone: r.tone,
      statusPrefix: r.status_prefix,
      isActive: Boolean(r.is_active)
    }))
  }

  getActivePersonality(): PersonalityProfile {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM personality_profiles WHERE is_active = 1 LIMIT 1').get() as any
    if (!row) {
      return {
        id: 'Balanced',
        name: 'Balanced',
        description: 'Natural, poised, and adaptive assistant profile',
        verbosity: 'balanced',
        tone: 'neutral',
        statusPrefix: 'ULTRON',
        isActive: true
      }
    }
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      verbosity: row.verbosity,
      tone: row.tone,
      statusPrefix: row.status_prefix,
      isActive: true
    }
  }

  setActivePersonality(id: string): boolean {
    const db = this.ensureConnected()
    db.prepare('UPDATE personality_profiles SET is_active = 0').run()
    const res = db.prepare('UPDATE personality_profiles SET is_active = 1 WHERE id = ?').run(id)
    return (res as any)?.changes > 0
  }

  savePersonalityProfile(profile: PersonalityProfile): PersonalityProfile {
    const db = this.ensureConnected()
    const stmt = db.prepare(\`
      INSERT OR REPLACE INTO personality_profiles (id, name, description, verbosity, tone, status_prefix, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    \`)
    stmt.run(
      profile.id,
      profile.name,
      profile.description || null,
      profile.verbosity,
      profile.tone,
      profile.statusPrefix,
      profile.isActive ? 1 : 0
    )
    return profile
  }

  // ── 10. Workspace Backups ──
  listWorkspaceBackups(): WorkspaceBackupMeta[] {
    const db = this.ensureConnected()
    const rows = db.prepare('SELECT id, name, ultron_version, workspace_count, automation_count, size_bytes, created_at FROM workspace_backups ORDER BY created_at DESC').all() as any[]
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      ultronVersion: r.ultron_version,
      workspaceCount: Number(r.workspace_count),
      automationCount: Number(r.automation_count),
      sizeBytes: Number(r.size_bytes),
      createdAt: Number(r.created_at)
    }))
  }

  saveWorkspaceBackup(name: string, ultronVersion: string, bundle: any): WorkspaceBackupMeta {
    const db = this.ensureConnected()
    const id = uuidv4()
    const now = Date.now()
    const bundleData = JSON.stringify(bundle)
    const sizeBytes = Buffer.byteLength(bundleData, 'utf8')
    const workspaceCount = bundle.workspaces ? bundle.workspaces.length : 0
    const automationCount = bundle.automations ? bundle.automations.length : 0

    const stmt = db.prepare(\`
      INSERT INTO workspace_backups (id, name, ultron_version, workspace_count, automation_count, size_bytes, bundle_data, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    \`)
    stmt.run(id, name, ultronVersion, workspaceCount, automationCount, sizeBytes, bundleData, now)
    return {
      id,
      name,
      ultronVersion,
      workspaceCount,
      automationCount,
      sizeBytes,
      createdAt: now
    }
  }

  getWorkspaceBackup(id: string): { meta: WorkspaceBackupMeta; bundle: any } | null {
    const db = this.ensureConnected()
    const row = db.prepare('SELECT * FROM workspace_backups WHERE id = ?').get(id) as any
    if (!row) return null
    try {
      const bundle = JSON.parse(row.bundle_data)
      return {
        meta: {
          id: row.id,
          name: row.name,
          ultronVersion: row.ultron_version,
          workspaceCount: Number(row.workspace_count),
          automationCount: Number(row.automation_count),
          sizeBytes: Number(row.size_bytes),
          createdAt: Number(row.created_at)
        },
        bundle
      }
    } catch {
      return null
    }
  }

  deleteWorkspaceBackup(id: string): boolean {
    const db = this.ensureConnected()
    const res = db.prepare('DELETE FROM workspace_backups WHERE id = ?').run(id)
    return (res as any)?.changes > 0
  }

  // ── 11. Memory Control Center (Scoped queries, Safe deletion with backup) ──
  scopedSearchMemories(filter: { category?: string; scope?: string; query?: string; showArchived?: boolean; limit?: number }): MemoryItemView[] {
    const db = this.ensureConnected()
    let sql = 'SELECT * FROM memories WHERE 1=1'
    const params: any[] = []

    if (filter.category) {
      sql += ' AND category = ?'
      params.push(filter.category)
    }

    if (filter.query) {
      sql += ' AND (content LIKE ? OR key LIKE ?)'
      params.push(\`%\${filter.query}%\`, \`%\${filter.query}%\`)
    }

    sql += ' ORDER BY updated_at DESC LIMIT ?'
    params.push(filter.limit || 100)

    const rows = db.prepare(sql).all(...params) as any[]
    return rows.map(r => {
      let meta: any = {}
      try {
        meta = r.metadata ? JSON.parse(r.metadata) : {}
      } catch {}

      const scope = meta.scope || meta.project || 'Global'
      const isArchived = Boolean(meta.archived)

      return {
        id: r.id,
        category: r.category as any,
        scope,
        key: r.key || '',
        value: r.content,
        source: meta.source || 'agent',
        confidence: meta.confidence !== undefined ? Number(meta.confidence) : 1.0,
        createdAt: Number(r.created_at),
        updatedAt: Number(r.updated_at),
        isArchived
      }
    }).filter(item => {
      if (filter.scope && !item.scope.toLowerCase().includes(filter.scope.toLowerCase())) {
        return false
      }
      if (!filter.showArchived && item.isArchived) {
        return false
      }
      return true
    })
  }

  scopedDeleteMemory(id: string, createBackup = true): { success: boolean; backupId?: string; error?: string } {
    const db = this.ensureConnected()
    try {
      const memory = db.prepare('SELECT * FROM memories WHERE id = ?').get(id) as any
      if (!memory) {
        return { success: false, error: 'Memory not found' }
      }

      let backupId: string | undefined = undefined
      if (createBackup) {
        backupId = uuidv4()
        this.saveRecoveryAction({
          actionId: backupId,
          operationType: 'memory_deletion',
          target: id,
          beforeState: JSON.stringify(memory),
          afterState: 'deleted',
          reversible: true,
          details: \`Backup before deleting memory \${id} (\${memory.key || memory.category})\`
        })
      }

      const res = db.prepare('DELETE FROM memories WHERE id = ?').run(id)
      return {
        success: (res as any)?.changes > 0,
        backupId
      }
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  }

  archiveMemory(id: string, archived: boolean): boolean {
    const db = this.ensureConnected()
    const memory = db.prepare('SELECT metadata FROM memories WHERE id = ?').get(id) as any
    if (!memory) return false

    let meta: any = {}
    try {
      meta = memory.metadata ? JSON.parse(memory.metadata) : {}
    } catch {}

    meta.archived = archived
    const res = db.prepare('UPDATE memories SET metadata = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(meta), Date.now(), id)
    return (res as any)?.changes > 0
  }

  exportMemorySnapshot(scope?: string): { snapshot: any; count: number; exportedAt: number } {
    const items = this.scopedSearchMemories({ scope, showArchived: true, limit: 1000 })
    return {
      snapshot: items,
      count: items.length,
      exportedAt: Date.now()
    }
  }

`

if (!content.includes('saveCommunicationItem')) {
  content = content.replace(closeMarker, v107Methods + closeMarker)
}

fs.writeFileSync(targetPath, content, 'utf8')
console.log('Successfully updated memory.db.ts for V1.0.7')
