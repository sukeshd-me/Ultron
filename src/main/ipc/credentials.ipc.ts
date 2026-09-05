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
