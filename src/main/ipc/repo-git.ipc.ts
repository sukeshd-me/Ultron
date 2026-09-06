// src/main/ipc/repo-git.ipc.ts — Repository & Git Intelligence IPC for ULTRON V1.0.8
import { ipcMain } from 'electron'
import { gitIntelligenceService } from '../services/git-intelligence.service'
import { repositoryIntelligenceService } from '../services/repository-intelligence.service'
import { codeImpactService } from '../services/code-impact.service'

export function registerRepoGitIpc(): void {
  ipcMain.handle('git:getStatus', async (_, repoPath?: string) => {
    return gitIntelligenceService.getStatus(repoPath)
  })

  ipcMain.handle('git:getDiff', async (_, repoPath?: string) => {
    return gitIntelligenceService.getDiff(repoPath)
  })

  ipcMain.handle('git:getActivity', async (_, repoPath?: string) => {
    return gitIntelligenceService.getRecentActivity(repoPath)
  })

  ipcMain.handle('repo:analyze', async (_, repoPath?: string) => {
    return repositoryIntelligenceService.analyzeRepository(repoPath)
  })

  ipcMain.handle('repo:queryRole', async (_, query: string, repoPath?: string) => {
    return repositoryIntelligenceService.queryRepositoryRole(query, repoPath)
  })

  ipcMain.handle('impact:analyze', async (_, change: string, target: string, repoPath?: string) => {
    return codeImpactService.analyzeImpact(change, target, repoPath)
  })
}