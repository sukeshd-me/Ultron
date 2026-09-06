import { ipcMain } from 'electron'
import { agentDebuggerService } from '../services/agent-debugger.service'

export function registerDebuggerIpc(): void {
  ipcMain.handle('debugger:listEvents', async (_, limit) => {
    return agentDebuggerService.listEvents(limit)
  })

  ipcMain.handle('debugger:clearEvents', async () => {
    return agentDebuggerService.clearEvents()
  })
}
