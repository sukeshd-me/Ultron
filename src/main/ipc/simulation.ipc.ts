import { ipcMain } from 'electron'
import { simulationService } from '../services/simulation.service'

export function registerSimulationIpc(): void {
  ipcMain.handle('simulation:simulate', async (_, { goal, title }) => simulationService.simulateMission(goal, title))
}
