// src/main/ipc/credentials.ipc.ts — Secure Credentials & Phone PIN IPC handlers
import { ipcMain } from 'electron'
import { credentialService } from '../services/credential.service'
import { adbService } from '../services/adb.service'

export function registerCredentialsIPC(): void {
  ipcMain.handle('credentials:hasPhonePin', async () => {
    return credentialService.hasPhonePin()
  })

  ipcMain.handle('credentials:setPhonePin', async (_event, pin: string) => {
    return credentialService.setPhonePin(pin)
  })

  ipcMain.handle('credentials:clearPhonePin', async () => {
    return credentialService.clearPhonePin()
  })

  ipcMain.handle('credentials:unlockPhone', async (_event, explicitPin?: string) => {
    return adbService.unlockPhone(explicitPin)
  })

  // NVIDIA API Key Secure Vault IPC Handlers
  ipcMain.handle('credentials:hasNvidiaKey', async () => {
    return credentialService.hasNvidiaApiKey()
  })

  ipcMain.handle('credentials:getMaskedNvidiaKey', async () => {
    return credentialService.getMaskedNvidiaApiKey()
  })

  ipcMain.handle('credentials:setNvidiaKey', async (_event, key: string) => {
    return credentialService.setNvidiaApiKey(key)
  })

  ipcMain.handle('credentials:clearNvidiaKey', async () => {
    return credentialService.clearNvidiaApiKey()
  })

  ipcMain.handle('credentials:validateNvidiaKey', async (_event, apiKey?: string) => {
    return credentialService.validateNvidiaApiKey(apiKey)
  })

  ipcMain.handle('credentials:useSavedNvidiaKey', async () => {
    return credentialService.useSavedNvidiaKey()
  })

  ipcMain.handle('credentials:continueOffline', async () => {
    return credentialService.continueOffline()
  })

  ipcMain.handle('adb:unlockPhone', async (_event, explicitPin?: string) => {
    return adbService.unlockPhone(explicitPin)
  })

  ipcMain.handle('adb:getDevices', async () => {
    return adbService.getDevicesWithDetails()
  })

  ipcMain.handle('adb:connectPhone', async (_event, target?: string) => {
    return adbService.connectPhone(target)
  })

  ipcMain.handle('adb:wakeScreen', async () => {
    return adbService.wakeScreen()
  })

  ipcMain.handle('adb:makeCall', async (_event, phoneNumber: string) => {
    return adbService.makeCall(phoneNumber)
  })

  ipcMain.handle('adb:sendMessage', async (_event, phoneNumber: string, message: string) => {
    return adbService.sendMessage(phoneNumber, message)
  })
}
