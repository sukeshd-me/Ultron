// src/main/services/app-intelligence.service.ts — Application Intelligence 2.0 for ULTRON V1.0.8
import * as path from 'path'
import { memoryDatabase } from '../database/memory.db'
import { ApplicationMetadata } from '../../shared/types'
import { appsService } from './apps.service'

export class AppIntelligenceService {
  constructor() {
    this.seedKnownWindowsApplications()
  }

  /**
   * Seed standard development, productivity, and browser apps with safe paths
   */
  private seedKnownWindowsApplications(): void {
    const defaultApps: Array<Omit<ApplicationMetadata, 'id' | 'useCount'>> = [
      {
        appName: 'VS Code',
        exePath: 'code',
        installPath: process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs\\Microsoft VS Code\\Code.exe') : undefined,
        supportedActions: ['open_file', 'open_folder', 'run_command'],
        category: 'Development',
        workspaceId: 'dev-workspace'
      },
      {
        appName: 'Google Chrome',
        exePath: 'chrome',
        installPath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        supportedActions: ['open_url', 'search_web'],
        category: 'Browser',
        workspaceId: 'research-workspace'
      },
      {
        appName: 'Windows Terminal',
        exePath: 'wt',
        supportedActions: ['run_powershell', 'run_cmd'],
        category: 'Development',
        workspaceId: 'dev-workspace'
      },
      {
        appName: 'Notepad',
        exePath: 'notepad',
        supportedActions: ['open_text', 'new_note'],
        category: 'Utility'
      },
      {
        appName: 'Calculator',
        exePath: 'calc',
        supportedActions: ['compute'],
        category: 'Utility'
      }
    ]

    for (const app of defaultApps) {
      try {
        memoryDatabase.upsertApplicationMetadata(app)
      } catch {}
    }
  }

  /**
   * Resolve an application request by name or alias
   */
  findApp(query: string): ApplicationMetadata | null {
    return memoryDatabase.getApplicationByName(query)
  }

  /**
   * Execute intelligent app open with project or file context
   */
  async launchWithContext(appName: string, targetPath?: string): Promise<{ success: boolean; message: string }> {
    const app = this.findApp(appName)
    const exe = app ? app.exePath : appName

    try {
      const res = await appsService.openApp(exe, targetPath ? [targetPath] : [])
      if (res.success) {
        memoryDatabase.recordAppUsage(appName)
        return {
          success: true,
          message: `Launched ${app?.appName || appName} ${targetPath ? `with "${path.basename(targetPath)}"` : ''} successfully.`
        }
      }
      return { success: false, message: res.error || 'Failed to launch application.' }
    } catch (err: any) {
      return { success: false, message: err.message }
    }
  }

  getAll(): ApplicationMetadata[] {
    return memoryDatabase.getAllApplicationMetadata()
  }
}

export const appIntelligenceService = new AppIntelligenceService()