// src/main/ipc/documents.ipc.ts — V1.0.5 Document Intelligence IPC Handlers
import { ipcMain } from 'electron'
import { documentService } from '../services/document.service'

export function registerDocumentsIPC(): void {
  ipcMain.handle('documents:index', async (_event, filePath: string) => {
    return documentService.indexDocument(filePath)
  })

  ipcMain.handle('documents:query', async (_event, query: string, docId?: string) => {
    return documentService.queryDocuments(query, docId)
  })

  ipcMain.handle('documents:list', async () => {
    return documentService.listDocuments()
  })

  ipcMain.handle('documents:delete', async (_event, docId: string) => {
    return documentService.deleteDocument(docId)
  })
}
