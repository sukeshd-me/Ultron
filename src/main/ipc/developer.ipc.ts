// src/main/ipc/developer.ipc.ts — Developer Mode & Skills IPC Handlers
import { ipcMain } from 'electron'
import { developerService } from '../services/developer.service'
import { skillsRegistryService } from '../services/skills.registry'
import { SkillId } from '../../shared/skills/skills.types'

export function registerDeveloperIPC(): void {
  ipcMain.handle('developer:inspectProject', async () => {
    return developerService.inspectProject()
  })

  ipcMain.handle('developer:checkTypescript', async () => {
    return developerService.checkTypescript()
  })

  ipcMain.handle('developer:checkBuild', async () => {
    return developerService.checkBuild()
  })

  ipcMain.handle('developer:gitStatus', async () => {
    return developerService.getGitStatus()
  })

  ipcMain.handle('skills:list', async () => {
    return skillsRegistryService.getAllSkills()
  })

  ipcMain.handle('skills:get', async (_event, skillId: SkillId) => {
    return skillsRegistryService.getSkill(skillId)
  })
}
