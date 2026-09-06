// src/main/index.ts — ULTRON Electron Main Process
import { app, BrowserWindow, ipcMain, shell, globalShortcut } from 'electron'
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
import { registerMissionsIPC } from './ipc/missions.ipc'
import { registerWorkflowsIPC } from './ipc/workflows.ipc'
import { registerDocumentsIPC } from './ipc/documents.ipc'
import { registerRecoveryIPC } from './ipc/recovery.ipc'
import { registerPreferencesIPC } from './ipc/preferences.ipc'
import { registerHistoryIPC } from './ipc/history.ipc'
import { registerSecurityIPC } from './ipc/security.ipc'
import { registerNetworkIPC } from './ipc/network.ipc'
import { registerRepairIPC } from './ipc/repair.ipc'
import { registerNotificationsIPC } from './ipc/notifications.ipc'
import { registerCustomSkillsIPC } from './ipc/custom-skills.ipc'
import { registerGoalsIpc } from './ipc/goals.ipc'
import { registerPluginsIpc } from './ipc/plugins.ipc'
import { registerCredentialVaultIpc } from './ipc/credentials-vault.ipc'
import { registerWindowsIpc } from './ipc/windows.ipc'
import { registerProjectIntelligenceIpc } from './ipc/project-intel.ipc'
import { registerProductivityIpc } from './ipc/productivity.ipc'
import { registerImportExportIpc } from './ipc/import-export.ipc'
import { registerDebuggerIpc } from './ipc/debugger.ipc'
import { registerCommunicationIpc } from './ipc/communication.ipc'
import { registerBriefingIpc } from './ipc/briefing.ipc'
import { registerFocusIpc } from './ipc/focus.ipc'
import { registerWorkspacesV2Ipc } from './ipc/workspaces-v2.ipc'
import { registerContinuityIpc } from './ipc/continuity.ipc'
import { registerAutomationsIpc } from './ipc/automations.ipc'
import { registerMemoryControlIpc } from './ipc/memory-control.ipc'
import { registerPersonalityIpc } from './ipc/personality.ipc'
import { registerSimulationIpc } from './ipc/simulation.ipc'
import { registerBackupIpc } from './ipc/backup.ipc'
import { registerUpdatesIpc } from './ipc/updates.ipc'
import { registerContextGraphIpc } from './ipc/context-graph.ipc'
import { registerRepoGitIpc } from './ipc/repo-git.ipc'
import { registerAgentTeamsIpc } from './ipc/agent-teams.ipc'
import { registerModelPerfIpc } from './ipc/model-perf.ipc'
import { registerContradictionsIpc } from './ipc/contradictions.ipc'
import { memoryDatabase } from './database/memory.db'
import { agentStateMachine } from './services/state-machine.service'
import { notificationService } from './services/notification.service'
import { missionService } from './services/mission.service'

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
  ipcMain.handle('system:getVersion', () => app.getVersion() || '1.0.8')
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
    registerMissionsIPC()
    registerWorkflowsIPC()
    registerDocumentsIPC()
    registerRecoveryIPC()
    registerPreferencesIPC()
    registerHistoryIPC()
    registerSecurityIPC()
    registerNetworkIPC()
    registerRepairIPC()
    registerNotificationsIPC()
    registerCustomSkillsIPC()
    registerGoalsIpc()
    registerPluginsIpc()
    registerCredentialVaultIpc()
    registerWindowsIpc()
    registerProjectIntelligenceIpc()
    registerProductivityIpc()
    registerImportExportIpc()
    registerDebuggerIpc()
    registerCommunicationIpc()
    registerBriefingIpc()
    registerFocusIpc()
    registerWorkspacesV2Ipc()
    registerContinuityIpc()
    registerAutomationsIpc()
    registerMemoryControlIpc()
    registerPersonalityIpc()
    registerSimulationIpc()
    registerBackupIpc()
    registerUpdatesIpc()
    registerContextGraphIpc()
    registerRepoGitIpc()
    registerAgentTeamsIpc()
    registerModelPerfIpc()
    registerContradictionsIpc()

    createWindow()

    // Global shortcut for Command Bar Everywhere (Ctrl+Space / Cmd+Space)
    try {
      globalShortcut.register('CommandOrControl+Space', () => {
        if (!mainWindow) return
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
        mainWindow.webContents.send('commandBar:toggle')
      })
    } catch (err) {
      console.warn('[ULTRON Main] Failed to register global shortcut:', err)
    }

    // Real-time Event Broadcasters to Renderer
    agentStateMachine.onStateChange((state) => {
      mainWindow?.webContents.send('agent:stateChanged', state)
      mainWindow?.webContents.send('state:change', state)
    })

    notificationService.onNotification((notification) => {
      mainWindow?.webContents.send('notifications:received', notification)
    })

    missionService.onPreview((preview) => {
      mainWindow?.webContents.send('actionPreview:requested', preview)
    })

    missionService.subscribeCheckpoints((checkpoint) => {
      mainWindow?.webContents.send('checkpoint:requested', checkpoint)
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('before-quit', () => {
    try {
      globalShortcut.unregisterAll()
    } catch {}
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
export { agentStateMachine } from './services/state-machine.service'
export { missionService } from './services/mission.service'
export { workflowService } from './services/workflow.service'
export { documentService } from './services/document.service'
export { recoveryService } from './services/recovery.service'
export { preferenceService } from './services/preference.service'
export { customSkillsService } from './services/custom-skills.service'
export { taskHistoryService } from './services/task-history.service'
export { notificationService } from './services/notification.service'
export { networkService } from './services/network.service'
export { safeRepairService } from './services/repair.service'