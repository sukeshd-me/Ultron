// src/main/ipc/agent-teams.ipc.ts — Agent Teams IPC for ULTRON V1.0.8
import { ipcMain } from 'electron'
import { agentTeamsService } from '../services/agent-teams.service'
import { AgentRole } from '../../shared/types'

export function registerAgentTeamsIpc(): void {
  ipcMain.handle('agentTeams:getRuns', async (_, role?: AgentRole, limit?: number) => {
    return agentTeamsService.getRuns(role, limit)
  })

  ipcMain.handle('agentTeams:getRoles', async () => {
    return agentTeamsService.getRoles()
  })
}