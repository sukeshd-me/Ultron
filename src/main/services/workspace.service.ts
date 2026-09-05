// src/main/services/workspace.service.ts — V1.0.4 Smart Workspace Context & Project Management
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { v4 as uuidv4 } from 'uuid'
import { WorkspaceContext, WorkspaceProjectInfo } from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'

const execAsync = promisify(exec)

export class WorkspaceService {
  private activePath: string = process.cwd()
  private activeBranch?: string
  private isGit: boolean = false
  private recentFiles: string[] = []

  constructor() {
    this.initCurrent()
  }

  private async initCurrent(): Promise<void> {
    await this.inspectDirectory(this.activePath)
  }

  async inspectDirectory(dirPath: string): Promise<WorkspaceProjectInfo> {
    const resolvedPath = path.resolve(dirPath)
    const folderName = path.basename(resolvedPath) || 'Root'

    let isGitRepo = false
    let currentBranch: string | undefined = undefined
    let isDirty = false

    try {
      const { stdout: branchOut } = await execAsync('git branch --show-current', { cwd: resolvedPath })
      currentBranch = branchOut.trim() || undefined
      isGitRepo = true

      const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd: resolvedPath })
      isDirty = statusOut.trim().length > 0
    } catch {
      // not a git repo
    }

    let packageJsonData: Record<string, unknown> | undefined = undefined
    const pkgPath = path.join(resolvedPath, 'package.json')
    if (fs.existsSync(pkgPath)) {
      try {
        const raw = fs.readFileSync(pkgPath, 'utf-8')
        packageJsonData = JSON.parse(raw)
      } catch {
        // ignore parse errors
      }
    }

    const info: WorkspaceProjectInfo = {
      id: uuidv4(),
      name: folderName,
      path: resolvedPath,
      isGit: isGitRepo,
      branch: currentBranch,
      packageJson: packageJsonData,
      recentFiles: this.recentFiles.slice(0, 10),
      lastOpened: Date.now()
    }

    this.activePath = resolvedPath
    this.activeBranch = currentBranch
    this.isGit = isGitRepo

    try {
      memoryDatabase.saveWorkspace(info)
    } catch (err) {
      console.warn('[WorkspaceService] Failed to persist workspace to SQLite:', err)
    }

    return info
  }

  async getContext(): Promise<WorkspaceContext> {
    const folderName = path.basename(this.activePath) || 'Workspace'
    let isDirty = false

    if (this.isGit) {
      try {
        const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd: this.activePath })
        isDirty = statusOut.trim().length > 0
        const { stdout: branchOut } = await execAsync('git branch --show-current', { cwd: this.activePath })
        this.activeBranch = branchOut.trim() || undefined
      } catch {
        // ignore
      }
    }

    let packageJsonData: Record<string, unknown> | undefined = undefined
    const pkgPath = path.join(this.activePath, 'package.json')
    if (fs.existsSync(pkgPath)) {
      try {
        const raw = fs.readFileSync(pkgPath, 'utf-8')
        packageJsonData = JSON.parse(raw)
      } catch {
        // ignore
      }
    }

    return {
      activeProjectPath: this.activePath,
      projectName: folderName,
      gitBranch: this.activeBranch,
      isGitDirty: isDirty,
      recentFiles: this.recentFiles.slice(0, 10),
      packageJson: packageJsonData
    }
  }

  async switchWorkspace(newPath: string): Promise<WorkspaceContext> {
    if (!fs.existsSync(newPath)) {
      throw new Error(`Directory does not exist: ${newPath}`)
    }
    const stat = fs.statSync(newPath)
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${newPath}`)
    }

    await this.inspectDirectory(newPath)
    return this.getContext()
  }

  listWorkspaces(): WorkspaceProjectInfo[] {
    try {
      return memoryDatabase.listWorkspaces(20)
    } catch {
      return []
    }
  }

  recordOpenedFile(filePath: string): void {
    const normalized = path.resolve(filePath)
    this.recentFiles = [normalized, ...this.recentFiles.filter((f) => f !== normalized)].slice(0, 20)
  }
}

export const workspaceService = new WorkspaceService()
