// src/main/ipc/diagnostics.ipc.ts — V1.0.4 Diagnostics & Health Check IPC Handlers
import { ipcMain } from 'electron'
import { diagnosticsService } from '../services/diagnostics.service'
import { DiagnosticsReport } from '../../shared/types'

export function registerDiagnosticsIPC(): void {
  ipcMain.handle('diagnostics:run', async () => {
    return diagnosticsService.runFullDiagnostics()
  })

  ipcMain.handle('diagnostics:getLatest', async () => {
    return diagnosticsService.getLatestReport()
  })

  ipcMain.handle('diagnostics:copyReport', async (_event, report: DiagnosticsReport) => {
    return diagnosticsService.copyReportMarkdown(report)
  })
}
