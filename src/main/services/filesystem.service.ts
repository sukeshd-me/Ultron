// src/main/services/filesystem.service.ts — Full Computer Filesystem & Search Engine
import * as fs from 'fs/promises'
import { existsSync } from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: number
}

export interface SearchResult {
  query: string
  searchRoot: string
  matches: FileItem[]
  totalMatches: number
  duration_ms: number
}

export class FilesystemService {
  /**
   * Resolve named alias locations or relative/absolute computer paths
   */
  resolveLocation(rawPath: string): string {
    const trimmed = rawPath.trim()
    const lower = trimmed.toLowerCase()

    const home = os.homedir()
    if (lower === 'desktop' || lower.startsWith('desktop/') || lower.startsWith('desktop\\')) {
      return path.join(home, 'Desktop', trimmed.slice(7))
    }
    if (lower === 'documents' || lower === 'docs' || lower.startsWith('documents/') || lower.startsWith('documents\\')) {
      return path.join(home, 'Documents', trimmed.slice(9))
    }
    if (lower === 'downloads' || lower.startsWith('downloads/') || lower.startsWith('downloads\\')) {
      return path.join(home, 'Downloads', trimmed.slice(9))
    }
    if (lower === 'pictures' || lower.startsWith('pictures/') || lower.startsWith('pictures\\')) {
      return path.join(home, 'Pictures', trimmed.slice(8))
    }
    if (lower === 'music' || lower.startsWith('music/') || lower.startsWith('music\\')) {
      return path.join(home, 'Music', trimmed.slice(5))
    }
    if (lower === 'videos' || lower.startsWith('videos/') || lower.startsWith('videos\\')) {
      return path.join(home, 'Videos', trimmed.slice(6))
    }
    if (lower === 'home' || lower === '~' || lower === 'user') {
      return home
    }
    if (lower.startsWith('~/') || lower.startsWith('~\\')) {
      return path.join(home, trimmed.slice(2))
    }

    const resolvedLocal = path.resolve(trimmed)
    if (existsSync(resolvedLocal)) {
      return resolvedLocal
    }
    const desktopCandidate = path.join(home, 'Desktop', trimmed)
    if (existsSync(desktopCandidate)) {
      return desktopCandidate
    }
    return resolvedLocal
  }

  async createFile(
    targetPath: string,
    content: string = ''
  ): Promise<{ success: boolean; path: string; size: number; duration_ms: number }> {
    const startMs = performance.now()
    const resolvedPath = this.resolveLocation(targetPath)
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true })
    await fs.writeFile(resolvedPath, content, 'utf-8')
    const stat = await fs.stat(resolvedPath)
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { success: true, path: resolvedPath, size: stat.size, duration_ms }
  }

  async writeCodeFile(
    targetPath: string,
    code: string
  ): Promise<{ success: boolean; path: string; size: number; lines: number; duration_ms: number }> {
    const startMs = performance.now()
    const resolvedPath = this.resolveLocation(targetPath)
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true })
    await fs.writeFile(resolvedPath, code, 'utf-8')
    const stat = await fs.stat(resolvedPath)
    const lines = code.split('\n').length
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { success: true, path: resolvedPath, size: stat.size, lines, duration_ms }
  }

  async createFolder(
    targetPath: string
  ): Promise<{ success: boolean; path: string; duration_ms: number }> {
    const startMs = performance.now()
    const resolvedPath = this.resolveLocation(targetPath)
    await fs.mkdir(resolvedPath, { recursive: true })
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { success: true, path: resolvedPath, duration_ms }
  }

  async readFile(
    targetPath: string
  ): Promise<{ success: boolean; path: string; content: string; size: number; duration_ms: number }> {
    const startMs = performance.now()
    const resolvedPath = this.resolveLocation(targetPath)
    const content = await fs.readFile(resolvedPath, 'utf-8')
    const stat = await fs.stat(resolvedPath)
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { success: true, path: resolvedPath, content, size: stat.size, duration_ms }
  }

  async listFolder(
    targetPath: string
  ): Promise<{ success: boolean; path: string; items: FileItem[]; duration_ms: number }> {
    const startMs = performance.now()
    const resolvedPath = this.resolveLocation(targetPath)
    const entries = await fs.readdir(resolvedPath, { withFileTypes: true })
    const items: FileItem[] = await Promise.all(
      entries.map(async (e) => {
        const full = path.join(resolvedPath, e.name)
        let size = 0
        let modified = Date.now()
        try {
          const s = await fs.stat(full)
          size = s.size
          modified = s.mtimeMs
        } catch {}
        return {
          name: e.name,
          path: full,
          isDirectory: e.isDirectory(),
          size,
          modified
        }
      })
    )
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { success: true, path: resolvedPath, items, duration_ms }
  }

  async moveItem(
    sourcePath: string,
    destinationPath: string
  ): Promise<{ success: boolean; source: string; destination: string; duration_ms: number }> {
    const startMs = performance.now()
    const srcResolved = this.resolveLocation(sourcePath)
    let destResolved = this.resolveLocation(destinationPath)

    // If destination is a directory, append the source basename
    try {
      const destStat = await fs.stat(destResolved)
      if (destStat.isDirectory()) {
        destResolved = path.join(destResolved, path.basename(srcResolved))
      }
    } catch {
      // If destination does not exist, ensure parent directory exists
      await fs.mkdir(path.dirname(destResolved), { recursive: true })
    }

    try {
      await fs.rename(srcResolved, destResolved)
    } catch (err: any) {
      // Cross-device link fallback (EXDEV)
      await fs.cp(srcResolved, destResolved, { recursive: true })
      await fs.rm(srcResolved, { recursive: true, force: true })
    }

    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { success: true, source: srcResolved, destination: destResolved, duration_ms }
  }

  async copyItem(
    sourcePath: string,
    destinationPath: string
  ): Promise<{ success: boolean; source: string; destination: string; duration_ms: number }> {
    const startMs = performance.now()
    const srcResolved = this.resolveLocation(sourcePath)
    let destResolved = this.resolveLocation(destinationPath)

    try {
      const destStat = await fs.stat(destResolved)
      if (destStat.isDirectory()) {
        destResolved = path.join(destResolved, path.basename(srcResolved))
      }
    } catch {
      await fs.mkdir(path.dirname(destResolved), { recursive: true })
    }

    await fs.cp(srcResolved, destResolved, { recursive: true })
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { success: true, source: srcResolved, destination: destResolved, duration_ms }
  }

  async deleteItem(
    targetPath: string
  ): Promise<{ success: boolean; path: string; duration_ms: number }> {
    const startMs = performance.now()
    const resolved = this.resolveLocation(targetPath)
    await fs.rm(resolved, { recursive: true, force: true })
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { success: true, path: resolved, duration_ms }
  }

  /**
   * Fast file search across directory trees (Desktop, Documents, Downloads, C:\, etc.)
   */
  async searchFiles(
    query: string,
    searchRoot?: string,
    maxResults: number = 30
  ): Promise<SearchResult> {
    const startMs = performance.now()
    const root = searchRoot ? this.resolveLocation(searchRoot) : os.homedir()
    const matches: FileItem[] = []
    const cleanQuery = query.toLowerCase().trim()

    // Common directories to skip for speed
    const skipDirs = new Set(['node_modules', '.git', 'appdata', '$recycle.bin', 'system volume information', 'windows'])

    async function walk(dir: string, depth: number) {
      if (matches.length >= maxResults || depth > 5) return

      let entries
      try {
        entries = await fs.readdir(dir, { withFileTypes: true })
      } catch {
        return
      }

      for (const e of entries) {
        if (matches.length >= maxResults) break

        const nameLower = e.name.toLowerCase()
        if (skipDirs.has(nameLower) || nameLower.startsWith('.')) continue

        const fullPath = path.join(dir, e.name)

        if (nameLower.includes(cleanQuery)) {
          let size = 0
          let modified = Date.now()
          try {
            const s = await fs.stat(fullPath)
            size = s.size
            modified = s.mtimeMs
          } catch {}

          matches.push({
            name: e.name,
            path: fullPath,
            isDirectory: e.isDirectory(),
            size,
            modified
          })
        }

        if (e.isDirectory()) {
          await walk(fullPath, depth + 1)
        }
      }
    }

    await walk(root, 0)

    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return {
      query,
      searchRoot: root,
      matches,
      totalMatches: matches.length,
      duration_ms
    }
  }
}

export const filesystemService = new FilesystemService()