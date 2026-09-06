import { ipcMain } from 'electron'
import { projectIntelligenceService } from '../services/project-intelligence.service'

export function registerProjectIntelligenceIpc(): void {
  ipcMain.handle('project:getHistory', async (_, { projectName, workspacePath }) => {
    return projectIntelligenceService.getProjectHistory(projectName, workspacePath)
  })

  ipcMain.handle('project:recordDecision', async (_, { projectName, title, context, decision, rationale }) => {
    return projectIntelligenceService.recordDecision(projectName, title, context, decision, rationale)
  })

  ipcMain.handle('project:getDecisions', async (_, projectName) => {
    return projectIntelligenceService.getDecisions(projectName)
  })
}
