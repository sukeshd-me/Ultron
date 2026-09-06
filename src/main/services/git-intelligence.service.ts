// src/main/services/git-intelligence.service.ts — Git Intelligence for ULTRON V1.0.8
import { memoryDatabase } from '../database/memory.db'
import { GitStatusSummary, GitActivityRecord } from '../../shared/types'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class GitIntelligenceService {
  /**
   * Safe status query: branch, staged, modified, uncommitted changes
   */
  async getStatus(repoPath = process.cwd()): Promise<GitStatusSummary> {
    try {
      const { stdout: branchOut } = await execAsync('git branch --show-current', { cwd: repoPath })
      const branch = branchOut.trim() || 'main'

      const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd: repoPath })
      const lines = statusOut.split('\n').map(l => l.trim()).filter(Boolean)

      const stagedFiles: string[] = []
      const modifiedFiles: string[] = []
      const untrackedFiles: string[] = []

      for (const line of lines) {
        const code = line.slice(0, 2)
        const file = line.slice(3)
        if (code.startsWith('?')) {
          untrackedFiles.push(file)
        } else if (code[0] !== ' ' && code[0] !== '?') {
          stagedFiles.push(file)
        } else {
          modifiedFiles.push(file)
        }
      }

      let latestCommit: GitStatusSummary['latestCommit'] = undefined
      try {
        const { stdout: logOut } = await execAsync('git log -1 --format="%H|%s|%an|%ad"', { cwd: repoPath })
        const [hash, message, author, date] = logOut.trim().split('|')
        if (hash) {
          latestCommit = { hash: hash.slice(0, 7), message, author, date }
          memoryDatabase.recordGitActivity({
            repoPath,
            branch,
            commitHash: hash.slice(0, 7),
            commitMsg: message,
            author
          })
        }
      } catch {}

      return {
        repoPath,
        currentBranch: branch,
        isClean: lines.length === 0,
        stagedFiles,
        modifiedFiles,
        untrackedFiles,
        aheadCount: 0,
        behindCount: 0,
        latestCommit
      }
    } catch (err: any) {
      return {
        repoPath,
        currentBranch: 'main',
        isClean: true,
        stagedFiles: [],
        modifiedFiles: [],
        untrackedFiles: [],
        aheadCount: 0,
        behindCount: 0
      }
    }
  }

  /**
   * Get uncommitted diff summary safely
   */
  async getDiff(repoPath = process.cwd()): Promise<string> {
    try {
      const { stdout } = await execAsync('git diff --stat', { cwd: repoPath })
      return stdout.trim() || 'No uncommitted modifications detected.'
    } catch (err: any) {
      return `Error querying git diff: ${err.message}`
    }
  }

  getRecentActivity(repoPath = process.cwd()): GitActivityRecord[] {
    return memoryDatabase.getRecentGitActivity(repoPath)
  }
}

export const gitIntelligenceService = new GitIntelligenceService()