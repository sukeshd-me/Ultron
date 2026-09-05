// src/main/services/search.service.ts — V1.0.4 Universal PC Search Service
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import { shell } from 'electron'
import { UniversalSearchResult, SearchCategory, SearchSafeAction } from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'
import { taskService } from './task.service'

const execAsync = promisify(exec)

export class SearchService {
  private cachedApps: UniversalSearchResult[] = []
  private lastAppCacheTime: number = 0
  private readonly CACHE_TTL_MS = 60 * 1000 // 1 minute cache for start menu items

  /**
   * Search Windows Start Menu shortcuts and installed apps
   */
  private async searchApps(query: string): Promise<UniversalSearchResult[]> {
    const q = query.toLowerCase().trim()
    const now = Date.now()

    if (this.cachedApps.length === 0 || now - this.lastAppCacheTime > this.CACHE_TTL_MS) {
      const appResults: UniversalSearchResult[] = []
      const startMenuDirs: string[] = []

      // Windows system start menu
      const programData = process.env.ProgramData || 'C:\\ProgramData'
      startMenuDirs.push(path.join(programData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'))

      // Windows user start menu
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
      startMenuDirs.push(path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs'))

      const scanDir = (dir: string, depth = 0) => {
        if (depth > 4) return
        if (!fs.existsSync(dir)) return
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
              scanDir(fullPath, depth + 1)
            } else if (entry.name.endsWith('.lnk') || entry.name.endsWith('.url')) {
              const appName = entry.name.replace(/\.(lnk|url)$/i, '')
              appResults.push({
                id: `app_${fullPath}`,
                title: appName,
                subtitle: fullPath,
                category: 'apps',
                path: fullPath,
                score: 0.5,
                actions: [
                  {
                    id: 'open_app',
                    label: 'Launch Application',
                    type: 'open_app',
                    target: fullPath
                  },
                  {
                    id: 'open_folder',
                    label: 'Show in File Explorer',
                    type: 'open_folder',
                    target: fullPath
                  }
                ]
              })
            }
          }
        } catch {
          // directory read permissions
        }
      }

      for (const smDir of startMenuDirs) {
        scanDir(smDir)
      }

      this.cachedApps = appResults
      this.lastAppCacheTime = now
    }

    if (!q) {
      return this.cachedApps.slice(0, 8)
    }

    return this.cachedApps
      .filter((app) => app.title.toLowerCase().includes(q))
      .map((app) => ({
        ...app,
        score: app.title.toLowerCase().startsWith(q) ? 0.95 : 0.75
      }))
      .slice(0, 10)
  }

  /**
   * Search user files (Documents, Downloads, Desktop, Recent)
   */
  private async searchFiles(query: string): Promise<UniversalSearchResult[]> {
    const q = query.toLowerCase().trim()
    if (!q) return []

    const userHome = os.homedir()
    const targetDirs = [
      path.join(userHome, 'Desktop'),
      path.join(userHome, 'Documents'),
      path.join(userHome, 'Downloads')
    ]

    const results: UniversalSearchResult[] = []

    for (const d of targetDirs) {
      if (!fs.existsSync(d)) continue
      try {
        const files = fs.readdirSync(d, { withFileTypes: true })
        for (const file of files) {
          if (file.name.toLowerCase().includes(q)) {
            const fullPath = path.join(d, file.name)
            const isDir = file.isDirectory()
            results.push({
              id: `file_${fullPath}`,
              title: file.name,
              subtitle: fullPath,
              category: 'files',
              path: fullPath,
              score: file.name.toLowerCase().startsWith(q) ? 0.85 : 0.6,
              actions: [
                {
                  id: isDir ? 'open_folder' : 'open_file',
                  label: isDir ? 'Open Folder' : 'Open File',
                  type: isDir ? 'open_folder' : 'open_file',
                  target: fullPath
                },
                {
                  id: 'show_in_folder',
                  label: 'Show in File Explorer',
                  type: 'open_folder',
                  target: fullPath
                }
              ]
            })
            if (results.length >= 10) break
          }
        }
      } catch {
        // ignore
      }
      if (results.length >= 10) break
    }

    return results
  }

  /**
   * Search known workspace projects
   */
  private async searchProjects(query: string): Promise<UniversalSearchResult[]> {
    const q = query.toLowerCase().trim()
    let workspaces: any[] = []
    try {
      workspaces = memoryDatabase.listWorkspaces(30)
    } catch {
      // ignore
    }

    const matched = workspaces.filter(
      (w) => !q || w.name.toLowerCase().includes(q) || w.path.toLowerCase().includes(q)
    )

    return matched.map((w) => ({
      id: `project_${w.id}`,
      title: w.name,
      subtitle: `${w.path}${w.branch ? ` (${w.branch})` : ''}`,
      category: 'projects',
      path: w.path,
      score: 0.9,
      actions: [
        {
          id: 'open_workspace',
          label: 'Open Workspace',
          type: 'open_folder',
          target: w.path
        },
        {
          id: 'git_status',
          label: 'Git Status',
          type: 'git_status',
          target: w.path
        }
      ]
    }))
  }

  /**
   * Search SQLite persistent memories
   */
  private async searchMemory(query: string): Promise<UniversalSearchResult[]> {
    const q = query.toLowerCase().trim()
    if (!q) return []

    try {
      const mems = memoryDatabase.search({ query: q, limit: 8 })
      return mems.records.map((m) => ({
        id: `memory_${m.id}`,
        title: m.content.slice(0, 60),
        subtitle: `Category: ${m.category} • ${new Date(m.created_at).toLocaleDateString()}`,
        category: 'memory',
        score: 0.8,
        actions: [
          {
            id: 'view_memory',
            label: 'Copy Memory',
            type: 'view_memory',
            target: m.content
          }
        ]
      }))
    } catch {
      return []
    }
  }

  /**
   * Search Active and Recent Background Tasks
   */
  private async searchTasks(query: string): Promise<UniversalSearchResult[]> {
    const q = query.toLowerCase().trim()
    const tasks = taskService.listBackgroundTasks()
    const filtered = tasks.filter(
      (t) => !q || t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
    )

    return filtered.slice(0, 5).map((t) => ({
      id: `task_${t.id}`,
      title: t.title,
      subtitle: `Status: ${t.status} • Category: ${t.category}`,
      category: 'tasks',
      score: 0.75,
      actions: [
        {
          id: 'inspect_task',
          label: 'Inspect Task',
          type: 'run_task',
          target: t.id
        }
      ]
    }))
  }

  /**
   * Master query method with category filtering and score sorting
   */
  async query(
    text: string,
    filterCategories?: SearchCategory[]
  ): Promise<UniversalSearchResult[]> {
    const catSet = new Set(filterCategories || ['apps', 'files', 'projects', 'memory', 'tasks', 'git'])
    const results: UniversalSearchResult[] = []

    const promises: Promise<UniversalSearchResult[]>[] = []
    if (catSet.has('apps')) promises.push(this.searchApps(text))
    if (catSet.has('files')) promises.push(this.searchFiles(text))
    if (catSet.has('projects')) promises.push(this.searchProjects(text))
    if (catSet.has('memory')) promises.push(this.searchMemory(text))
    if (catSet.has('tasks')) promises.push(this.searchTasks(text))

    const settled = await Promise.allSettled(promises)
    for (const s of settled) {
      if (s.status === 'fulfilled') {
        results.push(...s.value)
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 30)
  }

  /**
   * Safe action executor
   */
  async executeAction(action: SearchSafeAction): Promise<{ success: boolean; message?: string }> {
    try {
      switch (action.type) {
        case 'open_app': {
          await shell.openPath(action.target)
          return { success: true, message: `Launched ${action.target}` }
        }
        case 'open_file': {
          const err = await shell.openPath(action.target)
          if (err) throw new Error(err)
          return { success: true, message: `Opened ${action.target}` }
        }
        case 'open_folder': {
          shell.showItemInFolder(action.target)
          return { success: true, message: `Showed ${action.target} in explorer` }
        }
        case 'git_status': {
          const { stdout } = await execAsync('git status -s', { cwd: action.target })
          return { success: true, message: stdout || 'Working tree clean' }
        }
        case 'run_task': {
          const task = taskService.getBackgroundTask(action.target)
          return {
            success: true,
            message: task ? `Task ${task.title} is ${task.status}` : 'Task not found'
          }
        }
        case 'view_memory': {
          return { success: true, message: action.target }
        }
        default:
          return { success: false, message: 'Unknown action type' }
      }
    } catch (err: any) {
      return { success: false, message: err.message || String(err) }
    }
  }
}

export const searchService = new SearchService()
