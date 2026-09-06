// src/main/ipc/account.ipc.ts — Account Authentication IPC Channels
import { ipcMain } from 'electron'
import { googleAuthService } from '../services/google-auth.service'

export function registerAccountIPC(): void {
  // 1. Get current auth and account status
  ipcMain.handle('account:getStatus', async () => {
    try {
      return await googleAuthService.getStatus()
    } catch (err: any) {
      return {
        authenticated: false,
        isOffline: false,
        error: err.message
      }
    }
  })

  // 2. Start Google PKCE Sign-In flow
  ipcMain.handle('account:signIn', async () => {
    try {
      return await googleAuthService.signInWithGoogle()
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Authentication error'
      }
    }
  })

  // 3. Sign out and revoke session
  ipcMain.handle('account:signOut', async () => {
    try {
      return await googleAuthService.signOut()
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })

  // 4. Get sanitized profile
  ipcMain.handle('account:getProfile', async () => {
    try {
      return await googleAuthService.getProfile()
    } catch {
      return null
    }
  })

  // 5. Refresh session
  ipcMain.handle('account:refreshSession', async () => {
    try {
      return await googleAuthService.refreshSession()
    } catch (err: any) {
      return { success: false, error: err.message }
    }
  })
}
