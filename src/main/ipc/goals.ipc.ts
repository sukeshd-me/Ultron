import { ipcMain } from 'electron'
import { goalMemoryService } from '../services/goal-memory.service'

export function registerGoalsIpc(): void {
  ipcMain.handle('goals:create', async (_, { title, project, metadata }) => {
    return goalMemoryService.createGoal(title, project, metadata)
  })

  ipcMain.handle('goals:list', async (_, project) => {
    return goalMemoryService.listGoals(project)
  })

  ipcMain.handle('goals:get', async (_, id) => {
    return goalMemoryService.getGoal(id)
  })

  ipcMain.handle('goals:update', async (_, { id, updates }) => {
    return goalMemoryService.updateGoal(id, updates)
  })

  ipcMain.handle('goals:delete', async (_, id) => {
    return goalMemoryService.deleteGoal(id)
  })
}
