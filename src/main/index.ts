// src/main/index.ts — ULTRON Electron Main Process
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import * as dotenv from 'dotenv'

// Load .env configuration
dotenv.config({ path: join(__dirname, '../../.env') })
dotenv.config()

import { registerChatIPC } from './ipc/chat.ipc'
import { registerToolsIPC } from './ipc/tools.ipc'
import { registerSettingsIPC } from './ipc/settings.ipc'
import { registerMemoryIPC } from './ipc/memory.ipc'
import { registerSystemIPC } from './ipc/system.ipc'
import { registerCredentialsIPC } from './ipc/credentials.ipc'
import { registerVoiceIPC } from './ipc/voice.ipc'
import { registerScreenIPC } from './ipc/screen.ipc'
import { registerPermissionsIPC } from './ipc/permissions.ipc'
import { registerDeveloperIPC } from './ipc/developer.ipc'
import { registerSearchIPC } from './ipc/search.ipc'
import { registerDiagnosticsIPC } from './ipc/diagnostics.ipc'
import { registerWorkspaceIPC } from './ipc/workspace.ipc'
import { registerTasksIPC } from './ipc/tasks.ipc'
import { memoryDatabase } from './database/memory.db'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'ULTRON',
    backgroundColor: '#000000',
    frame: false,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#000000',
      symbolColor: '#00d4ff',
      height: 36
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  })

  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

if (app && ipcMain) {
  app.setName('ULTRON')
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.ultron.commandcenter')
  }

  ipcMain.handle('window:minimize', () => mainWindow?.minimize())
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.handle('window:close', () => mainWindow?.close())
  ipcMain.handle('system:getVersion', () => app.getVersion() || '1.0.4')
  ipcMain.handle('system:getPlatform', () => process.platform)

  app.whenReady().then(() => {
    registerChatIPC()
    registerToolsIPC()
    registerSettingsIPC()
    registerMemoryIPC()
    registerSystemIPC()
    registerCredentialsIPC()
    registerVoiceIPC()
    registerScreenIPC()
    registerPermissionsIPC()
    registerDeveloperIPC()
    registerSearchIPC()
    registerDiagnosticsIPC()
    registerWorkspaceIPC()
    registerTasksIPC()

    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('before-quit', () => {
    memoryDatabase.close()
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}

// Core Service Exports for CLI and External Harnesses
export { agentService } from './services/agent.service'
export { toolsRegistry } from './services/tools.registry'
export { modelService } from './services/model.service'
export { memoryService } from './services/memory.service'
export { commandRegistry } from './services/command.registry'
export { adbService } from './services/adb.service'
export { credentialService } from './services/credential.service'
export { whisperService } from './services/whisper.service'
export { androidAppsService } from './services/android-apps.service'
export { contactsService } from './services/contacts.service'
export { intentService } from './services/intent.service'
export { taskService } from './services/task.service'
export { searchService } from './services/search.service'
export { diagnosticsService } from './services/diagnostics.service'
export { workspaceService } from './services/workspace.service'