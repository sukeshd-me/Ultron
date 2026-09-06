import { PluginManifest, PluginCategory, PluginTrustState } from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'

export class PluginService {
  constructor() {
    this.seedDefaultPlugins()
  }

  private seedDefaultPlugins(): void {
    const existing = memoryDatabase.listPlugins()
    if (existing.length === 0) {
      const defaultPlugins: Array<Partial<PluginManifest>> = [
        {
          id: 'plugin-dev-workspace',
          name: 'Developer Workspace',
          version: '1.0.0',
          publisher: 'UPAI Technologies',
          description: 'Git intelligence, build verification, and multi-file project refactoring tools.',
          category: 'Developer',
          permissions: ['filesystem:read', 'filesystem:write', 'terminal:restricted'],
          skills: ['CodingAgentSkill', 'MultiAppWorkflowSkill'],
          tools: ['code.inspect', 'code.search', 'filesystem.search'],
          minimumUltronVersion: '1.0.6',
          trustState: 'BUILT_IN',
          enabled: true
        },
        {
          id: 'plugin-research-deep',
          name: 'Research Agent 2.0',
          version: '1.0.0',
          publisher: 'UPAI Technologies',
          description: 'Multi-source factual web research, citation verification, and cross-comparison.',
          category: 'Research',
          permissions: ['network:internet'],
          skills: ['ResearchAgentSkill'],
          tools: ['research.search', 'research.verifySource'],
          minimumUltronVersion: '1.0.6',
          trustState: 'BUILT_IN',
          enabled: true
        },
        {
          id: 'plugin-win-productivity',
          name: 'Windows Window & Workspace Manager',
          version: '1.0.0',
          publisher: 'UPAI Technologies',
          description: 'Focus, arrange, maximize, and manage active application layouts on Windows.',
          category: 'Windows',
          permissions: ['windows:management'],
          skills: ['WindowManagementSkill'],
          tools: ['windows.focus', 'windows.arrange'],
          minimumUltronVersion: '1.0.6',
          trustState: 'BUILT_IN',
          enabled: true
        },
        {
          id: 'plugin-android-controller',
          name: 'Android Phone Controller',
          version: '1.0.0',
          publisher: 'UPAI Technologies',
          description: 'Safe ADB smartphone automation with DPAPI hardware credential security.',
          category: 'Android',
          permissions: ['adb:command', 'phone:call'],
          skills: ['AndroidDeviceSkill'],
          tools: ['android.openApp', 'android.callContact'],
          minimumUltronVersion: '1.0.6',
          trustState: 'BUILT_IN',
          enabled: true
        }
      ]

      for (const p of defaultPlugins) {
        memoryDatabase.registerPlugin({
          name: p.name!,
          version: p.version!,
          publisher: p.publisher!,
          description: p.description,
          category: p.category!,
          permissions: p.permissions,
          skills: p.skills,
          tools: p.tools,
          minimumUltronVersion: p.minimumUltronVersion,
          trustState: p.trustState,
          enabled: true,
          manifest: p
        })
      }
    }
  }

  listPlugins(): PluginManifest[] {
    return memoryDatabase.listPlugins()
  }

  togglePlugin(id: string, enabled: boolean): boolean {
    return memoryDatabase.updatePluginStatus(id, enabled)
  }

  installPlugin(manifest: PluginManifest): PluginManifest {
    // Validate required manifest fields
    if (!manifest.name || !manifest.version || !manifest.publisher) {
      throw new Error('Invalid plugin manifest: missing required identification fields.')
    }
    return memoryDatabase.registerPlugin({
      name: manifest.name,
      version: manifest.version,
      publisher: manifest.publisher,
      description: manifest.description,
      category: manifest.category || 'Utilities',
      permissions: manifest.permissions || [],
      skills: manifest.skills || [],
      tools: manifest.tools || [],
      minimumUltronVersion: manifest.minimumUltronVersion || '1.0.6',
      trustState: manifest.trustState || 'USER_CREATED',
      enabled: true,
      manifest
    })
  }

  uninstallPlugin(id: string): boolean {
    return memoryDatabase.deletePlugin(id)
  }
}

export const pluginService = new PluginService()
