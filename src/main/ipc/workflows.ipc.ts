// src/main/ipc/workflows.ipc.ts — V1.0.5 Multi-App Workflow IPC Handlers
import { ipcMain } from 'electron'
import { workflowService } from '../services/workflow.service'

export function registerWorkflowsIPC(): void {
  ipcMain.handle('workflows:create', async (_event, name: string, description: string, steps: any[]) => {
    return workflowService.createWorkflow(name, description, steps)
  })

  ipcMain.handle('workflows:list', async () => {
    return workflowService.listWorkflows()
  })

  ipcMain.handle('workflows:execute', async (_event, id: string) => {
    return workflowService.executeWorkflow(id)
  })

  ipcMain.handle('workflows:cancel', async (_event, id: string) => {
    return workflowService.cancelWorkflow(id)
  })
}
