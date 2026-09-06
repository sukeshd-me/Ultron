// scratch/gen_v107_ipc.js
const fs = require('fs')
const path = require('path')

const ipcDir = path.resolve(__dirname, '../src/main/ipc')

// 1. communication.ipc.ts
fs.writeFileSync(path.join(ipcDir, 'communication.ipc.ts'), `import { ipcMain } from 'electron'
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
`)

// 2. briefing.ipc.ts
fs.writeFileSync(path.join(ipcDir, 'briefing.ipc.ts'), `import { ipcMain } from 'electron'
import { briefingService } from '../services/briefing.service'

export function registerBriefingIpc(): void {
  ipcMain.handle('briefing:generate', async () => briefingService.generateBriefing())
  ipcMain.handle('briefing:getLatest', async () => briefingService.getLatest())
  ipcMain.handle('briefing:list', async (_, limit) => briefingService.listBriefings(limit))
}
`)

// 3. focus.ipc.ts
fs.writeFileSync(path.join(ipcDir, 'focus.ipc.ts'), `import { ipcMain } from 'electron'
import { focusService } from '../services/focus.service'

export function registerFocusIpc(): void {
  ipcMain.handle('focus:start', async (_, { mode, durationMinutes, customApps }) => focusService.startFocus(mode, durationMinutes, customApps))
  ipcMain.handle('focus:end', async () => focusService.endFocus())
  ipcMain.handle('focus:getActive', async () => focusService.getActiveSession())
  ipcMain.handle('focus:list', async (_, limit) => focusService.listSessions(limit))
}
`)

// 4. workspaces-v2.ipc.ts
fs.writeFileSync(path.join(ipcDir, 'workspaces-v2.ipc.ts'), `import { ipcMain } from 'electron'
import { workspaceManagerService } from '../services/workspace-manager.service'

export function registerWorkspacesV2Ipc(): void {
  ipcMain.handle('workspaces:list', async () => workspaceManagerService.listWorkspaces())
  ipcMain.handle('workspaces:getActive', async () => workspaceManagerService.getActiveWorkspace())
  ipcMain.handle('workspaces:switch', async (_, idOrName) => workspaceManagerService.switchWorkspace(idOrName))
  ipcMain.handle('workspaces:save', async (_, { profile, items }) => workspaceManagerService.saveWorkspace(profile, items))
  ipcMain.handle('workspaces:delete', async (_, id) => workspaceManagerService.deleteWorkspace(id))
}
`)

// 5. continuity.ipc.ts
fs.writeFileSync(path.join(ipcDir, 'continuity.ipc.ts'), `import { ipcMain } from 'electron'
import { continuityService } from '../services/continuity.service'

export function registerContinuityIpc(): void {
  ipcMain.handle('continuity:getStatus', async () => continuityService.getStatus())
  ipcMain.handle('continuity:getActive', async () => continuityService.getActiveSession())
  ipcMain.handle('continuity:sync', async (_, { missionId, stateSummary }) => continuityService.syncMissionState(missionId, stateSummary))
}
`)

// 6. automations.ipc.ts
fs.writeFileSync(path.join(ipcDir, 'automations.ipc.ts'), `import { ipcMain } from 'electron'
import { automationService } from '../services/automation.service'
import { schedulerService } from '../services/scheduler.service'

export function registerAutomationsIpc(): void {
  ipcMain.handle('automations:list', async () => automationService.listAutomations())
  ipcMain.handle('automations:get', async (_, id) => automationService.getAutomation(id))
  ipcMain.handle('automations:save', async (_, def) => automationService.saveAutomation(def))
  ipcMain.handle('automations:delete', async (_, id) => automationService.deleteAutomation(id))
  ipcMain.handle('automations:toggle', async (_, { id, enabled }) => automationService.toggleAutomation(id, enabled))
  ipcMain.handle('automations:execute', async (_, { id, contextData, permissionGranted }) => automationService.executeAutomation(id, contextData, permissionGranted))
  ipcMain.handle('automations:listRuns', async (_, { limit, automationId }) => automationService.listRuns(limit, automationId))

  ipcMain.handle('missions:listScheduled', async () => schedulerService.listScheduledMissions())
  ipcMain.handle('missions:schedule', async (_, params) => schedulerService.scheduleMission(params))
  ipcMain.handle('missions:pauseScheduled', async (_, id) => schedulerService.pauseMission(id))
  ipcMain.handle('missions:resumeScheduled', async (_, id) => schedulerService.resumeMission(id))
  ipcMain.handle('missions:cancelScheduled', async (_, id) => schedulerService.cancelMission(id))
  ipcMain.handle('missions:deleteScheduled', async (_, id) => schedulerService.deleteMission(id))
  ipcMain.handle('missions:runScheduledNow', async (_, id) => schedulerService.runNow(id))
}
`)

// 7. memory-control.ipc.ts
fs.writeFileSync(path.join(ipcDir, 'memory-control.ipc.ts'), `import { ipcMain } from 'electron'
import { memoryControlService } from '../services/memory-control.service'

export function registerMemoryControlIpc(): void {
  ipcMain.handle('memoryControl:search', async (_, filter) => memoryControlService.search(filter))
  ipcMain.handle('memoryControl:forget', async (_, { id, createBackup }) => memoryControlService.forgetMemory(id, createBackup))
  ipcMain.handle('memoryControl:archive', async (_, { id, archived }) => memoryControlService.setArchived(id, archived))
  ipcMain.handle('memoryControl:export', async (_, scope) => memoryControlService.exportSnapshot(scope))
  ipcMain.handle('memoryControl:clearScope', async (_, scope) => memoryControlService.clearScope(scope))
}
`)

// 8. personality.ipc.ts
fs.writeFileSync(path.join(ipcDir, 'personality.ipc.ts'), `import { ipcMain } from 'electron'
import { personalityService } from '../services/personality.service'

export function registerPersonalityIpc(): void {
  ipcMain.handle('personality:list', async () => personalityService.listProfiles())
  ipcMain.handle('personality:getActive', async () => personalityService.getActiveProfile())
  ipcMain.handle('personality:setActive', async (_, id) => personalityService.setActiveProfile(id))
}
`)

// 9. simulation.ipc.ts
fs.writeFileSync(path.join(ipcDir, 'simulation.ipc.ts'), `import { ipcMain } from 'electron'
import { simulationService } from '../services/simulation.service'

export function registerSimulationIpc(): void {
  ipcMain.handle('simulation:simulate', async (_, { goal, title }) => simulationService.simulateMission(goal, title))
}
`)

// 10. backup.ipc.ts
fs.writeFileSync(path.join(ipcDir, 'backup.ipc.ts'), `import { ipcMain } from 'electron'
import { workspaceBackupService } from '../services/workspace-backup.service'

export function registerBackupIpc(): void {
  ipcMain.handle('backup:create', async (_, name) => workspaceBackupService.createBackup(name))
  ipcMain.handle('backup:list', async () => workspaceBackupService.listBackups())
  ipcMain.handle('backup:restore', async (_, id) => workspaceBackupService.restoreBackup(id))
  ipcMain.handle('backup:delete', async (_, id) => workspaceBackupService.deleteBackup(id))
  ipcMain.handle('backup:export', async (_, { id, filePath }) => workspaceBackupService.exportToFile(id, filePath))
  ipcMain.handle('backup:import', async (_, filePath) => workspaceBackupService.importFromFile(filePath))
}
`)

// 11. updates.ipc.ts
fs.writeFileSync(path.join(ipcDir, 'updates.ipc.ts'), `import { ipcMain } from 'electron'
import { updateService } from '../services/update.service'

export function registerUpdatesIpc(): void {
  ipcMain.handle('updates:check', async () => updateService.checkForUpdates())
  ipcMain.handle('updates:getCurrentVersion', async () => updateService.getCurrentVersion())
  ipcMain.handle('updates:prepareBackup', async () => updateService.prepareUpdateBackup())
}
`)

console.log('Successfully generated all 11 V1.0.7 IPC handlers')
