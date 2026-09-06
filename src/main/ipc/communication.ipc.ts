import { ipcMain } from 'electron'
import { communicationService } from '../services/communication.service'
import { inboxService } from '../services/inbox.service'

export function registerCommunicationIpc(): void {
  ipcMain.handle('communication:getStatus', async () => communicationService.getStatus())
  ipcMain.handle('communication:getSummary', async (_, limit) => communicationService.getSummary(limit))
  ipcMain.handle('communication:getRecent', async (_, { limit, type }) => communicationService.getRecent(limit, type))
  ipcMain.handle('communication:sendMessage', async (_, options) => communicationService.sendMessage(options))

  ipcMain.handle('inbox:getItems', async (_, filter) => inboxService.getItems(filter))
  ipcMain.handle('inbox:getSummary', async () => inboxService.getSummary())
  ipcMain.handle('inbox:markRead', async (_, id) => inboxService.markRead(id))
  ipcMain.handle('inbox:clearLowPriority', async () => inboxService.clearLowPriority())
  ipcMain.handle('inbox:summarize', async () => inboxService.summarizeInbox())
}
