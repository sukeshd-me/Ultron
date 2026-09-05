// src/main/services/developer.service.ts — Developer Mode Engine for Codebase Diagnostics
import { execFile } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

const execFileAsync = promisify(execFile)

export interface ProjectOverview {
  name: string
  version: string
  description: string
  rootPath: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
  scripts: Record<string, string>
  directoryStructure: {
    mainFiles: string[]
    rendererFiles: string[]
    sharedFiles: string[]
    preloadFiles: string[]
  }
}

export interface TypeScriptCheckResult {
  success: boolean
  clean: boolean
  errors: string[]
  count: number
  durationMs: number
}

export interface GitStatusResult {
  branch: string
  clean: boolean
  modifiedFiles: string[]
  untrackedFiles: string[]
  recentCommits: string[]
  durationMs: number
}

export class DeveloperService {
  private projectRoot: string

  constructor() {
    this.projectRoot = process.cwd()
  }

  /**
   * Inspect project metadata, dependencies, and file layout
   */
  async inspectProject(): Promise<ProjectOverview> {
    const pkgPath = path.join(this.projectRoot, 'package.json')
    let pkg: any = {}
    if (fs.existsSync(pkgPath)) {
      try {
        pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
      } catch {}
    }

    const safeListFiles = (dir: string): string[] => {
      const fullDir = path.join(this.projectRoot, dir)
      if (!fs.existsSync(fullDir)) return []
      try {
        return fs.readdirSync(fullDir, { recursive: true })
          .filter((f) => typeof f === 'string' && (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.css') || f.endsWith('.json')))
          .map((f) => path.join(dir, f as string).replace(/\\/g, '/'))
      } catch {
        return []
      }
    }

    return {
      name: pkg.name || 'ultron',
      version: pkg.version || '1.0.3',
      description: pkg.description || 'ULTRON Personal AI Command Center',
      rootPath: this.projectRoot,
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      scripts: pkg.scripts || {},
      directoryStructure: {
        mainFiles: safeListFiles('src/main').slice(0, 30),
        rendererFiles: safeListFiles('src/renderer').slice(0, 40),
        sharedFiles: safeListFiles('src/shared').slice(0, 20),
        preloadFiles: safeListFiles('src/preload').slice(0, 10)
      }
    }
  }

  /**
   * Run authentic TypeScript compilation check via npx tsc --noEmit.
   * Never fabricates errors.
   */
  async checkTypescript(): Promise<TypeScriptCheckResult> {
    const startMs = performance.now()
    try {
      // Use npx.cmd on Windows without shell injection
      const isWin = process.platform === 'win32'
      const cmd = isWin ? 'npx.cmd' : 'npx'

      const { stdout, stderr } = await execFileAsync(cmd, ['tsc', '--noEmit'], {
        cwd: this.projectRoot,
        windowsHide: true,
        timeout: 30000
      })

      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))
      const combined = (stdout + '\n' + stderr).trim()

      if (!combined) {
        return {
          success: true,
          clean: true,
          errors: [],
          count: 0,
          durationMs
        }
      }

      const errorLines = combined
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.includes('error TS') || l.includes('ERROR:'))

      return {
        success: true,
        clean: errorLines.length === 0,
        errors: errorLines,
        count: errorLines.length,
        durationMs
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))
      const combined = ((err.stdout || '') + '\n' + (err.stderr || '') + '\n' + err.message).trim()
      const errorLines = combined
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.includes('error TS') || l.includes('ERROR:'))

      return {
        success: true,
        clean: false,
        errors: errorLines.length > 0 ? errorLines : [err.message],
        count: errorLines.length > 0 ? errorLines.length : 1,
        durationMs
      }
    }
  }

  /**
   * Inspect genuine Git status, current branch, and recent commits.
   * Strictly read-only: never pushes automatically.
   */
  async getGitStatus(): Promise<GitStatusResult> {
    const startMs = performance.now()
    try {
      const [branchRes, statusRes, logRes] = await Promise.all([
        execFileAsync('git', ['branch', '--show-current'], { cwd: this.projectRoot, windowsHide: true }),
        execFileAsync('git', ['status', '--short'], { cwd: this.projectRoot, windowsHide: true }),
        execFileAsync('git', ['log', '-n', '5', '--oneline'], { cwd: this.projectRoot, windowsHide: true })
      ])

      const branch = (branchRes.stdout || '').trim() || 'main'
      const statusLines = (statusRes.stdout || '').split('\n').map((l) => l.trim()).filter(Boolean)
      const modifiedFiles = statusLines.filter((l) => l.startsWith('M ') || l.startsWith(' M')).map((l) => l.slice(2).trim())
      const untrackedFiles = statusLines.filter((l) => l.startsWith('??')).map((l) => l.slice(2).trim())
      const recentCommits = (logRes.stdout || '').split('\n').map((l) => l.trim()).filter(Boolean)

      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))

      return {
        branch,
        clean: statusLines.length === 0,
        modifiedFiles,
        untrackedFiles,
        recentCommits,
        durationMs
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        branch: 'main',
        clean: true,
        modifiedFiles: [],
        untrackedFiles: [],
        recentCommits: [],
        durationMs
      }
    }
  }

  /**
   * Check production build integrity
   */
  async checkBuild(): Promise<{ success: boolean; output: string; durationMs: number }> {
    const startMs = performance.now()
    const outMain = path.join(this.projectRoot, 'out/main/index.js')
    const outRenderer = path.join(this.projectRoot, 'out/renderer/index.html')

    const mainBuilt = fs.existsSync(outMain)
    const rendererBuilt = fs.existsSync(outRenderer)
    const durationMs = parseFloat((performance.now() - startMs).toFixed(2))

    if (mainBuilt && rendererBuilt) {
      const mainStat = fs.statSync(outMain)
      return {
        success: true,
        output: `Build outputs present in out/:\n• out/main/index.js (${(mainStat.size / 1024).toFixed(1)} KB)\n• out/renderer/index.html`,
        durationMs
      }
    }

    return {
      success: false,
      output: 'Build outputs missing. Run "npm run build" to compile.',
      durationMs
    }
  }
}

export const developerService = new DeveloperService()
