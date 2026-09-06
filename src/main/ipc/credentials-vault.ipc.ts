import { ipcMain } from 'electron'
import { credentialVaultService } from '../services/credential-vault.service'

export function registerCredentialVaultIpc(): void {
  ipcMain.handle('credentials:list', async () => {
    return credentialVaultService.listCredentials()
  })

  ipcMain.handle('credentials:save', async (_, { id, name, service, secretValue }) => {
    return credentialVaultService.saveCredential(id, name, service, secretValue)
  })

  ipcMain.handle('credentials:delete', async (_, id) => {
    return credentialVaultService.deleteCredential(id)
  })

  ipcMain.handle('credentials:test', async (_, id) => {
    return credentialVaultService.testCredential(id)
  })
}
