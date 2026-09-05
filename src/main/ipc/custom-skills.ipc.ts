// src/main/ipc/custom-skills.ipc.ts — V1.0.5 Custom Skills IPC Handlers
import { ipcMain } from 'electron'
import { customSkillsService } from '../services/custom-skills.service'

export function registerCustomSkillsIPC(): void {
  ipcMain.handle('customSkills:list', async () => {
    return customSkillsService.listSkills()
  })

  ipcMain.handle('customSkills:create', async (_event, skill: any) => {
    return customSkillsService.createSkill(skill)
  })

  ipcMain.handle('customSkills:update', async (_event, id: string, updates: any) => {
    return customSkillsService.updateSkill(id, updates)
  })

  ipcMain.handle('customSkills:delete', async (_event, id: string) => {
    return customSkillsService.deleteSkill(id)
  })

  ipcMain.handle('customSkills:toggle', async (_event, id: string, enabled: boolean) => {
    return customSkillsService.toggleSkill(id, enabled)
  })
}
