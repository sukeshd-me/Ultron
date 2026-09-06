import { ipcMain } from 'electron'
import { productivityService } from '../services/productivity.service'

export function registerProductivityIpc(): void {
  ipcMain.handle('productivity:getSummary', async () => {
    return productivityService.getSummary()
  })

  ipcMain.handle('productivity:clear', async () => {
    return productivityService.clearMetrics()
  })

  ipcMain.handle('productivity:listSuggestions', async () => {
    return productivityService.listPendingSuggestions()
  })

  ipcMain.handle('productivity:updateSuggestion', async (_, { id, status }) => {
    return productivityService.updateSuggestionStatus(id, status)
  })
}
