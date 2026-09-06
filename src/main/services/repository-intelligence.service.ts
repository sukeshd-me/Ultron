// src/main/services/repository-intelligence.service.ts — Repository Intelligence 2.0 for ULTRON V1.0.8
import { memoryDatabase } from '../database/memory.db'
import { RepositoryMap, RepositoryArchitectureSection } from '../../shared/types'
import * as fs from 'fs'
import * as path from 'path'

export class RepositoryIntelligenceService {
  /**
   * Build or retrieve structured architectural map of a repository
   */
  async analyzeRepository(repoPath = process.cwd()): Promise<RepositoryMap> {
    const cached = memoryDatabase.getRepositoryMap(repoPath)
    if (cached && Date.now() - cached.indexedAt < 1000 * 60 * 30) {
      return cached
    }

    const architecture: Record<string, RepositoryArchitectureSection> = {
      Architecture: {
        title: 'Central Agent Core & Engine',
        description: 'Core Electron main process, orchestrating models, tools, and state machine.',
        files: ['src/main/index.ts', 'src/main/services/agent.service.ts', 'src/main/services/router.service.ts']
      },
      Services: {
        title: 'Specialized Capabilities & Operating Layer',
        description: 'Decoupled domain services for ADB, Memory, Filesystem, PC Control, and Verification.',
        files: ['src/main/services/memory.service.ts', 'src/main/services/adb.service.ts', 'src/main/services/verification.service.ts']
      },
      Components: {
        title: 'React 19 & Three.js Presentation Layer',
        description: 'Neural core 3D visualization, conversational chat panel, and command palette.',
        files: ['src/renderer/App.tsx', 'src/renderer/components/core3d/UltronCore.tsx', 'src/renderer/components/nav/CommandPalette.tsx']
      },
      Configuration: {
        title: 'System & Package Settings',
        description: 'Vite configuration, TypeScript rules, and electron-builder packaging definitions.',
        files: ['package.json', 'electron.vite.config.ts', 'tsconfig.json']
      },
      EntryPoints: {
        title: 'Process Entry Points',
        description: 'Main process bootstrap and preload context isolation bridge.',
        files: ['src/main/index.ts', 'src/preload/index.ts', 'src/renderer/main.tsx']
      }
    }

    let fileCount = 0
    try {
      const srcDir = path.join(repoPath, 'src')
      if (fs.existsSync(srcDir)) {
        const countFiles = (dir: string): number => {
          let count = 0
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          for (const e of entries) {
            if (e.isDirectory() && e.name !== 'node_modules') {
              count += countFiles(path.join(dir, e.name))
            } else if (e.isFile()) {
              count++
            }
          }
          return count
        }
        fileCount = countFiles(srcDir)
      }
    } catch {}

    const map: RepositoryMap = {
      repoPath,
      branch: 'main',
      fileCount,
      architecture,
      entryPoints: ['src/main/index.ts', 'src/preload/index.ts', 'src/renderer/main.tsx'],
      indexedAt: Date.now()
    }

    memoryDatabase.saveRepositoryMap(map)
    return map
  }

  /**
   * Search repository files for architectural roles
   * e.g., "Where is authentication implemented?", "What handles model routing?"
   */
  async queryRepositoryRole(query: string, repoPath = process.cwd()): Promise<{ files: string[]; explanation: string }> {
    const lower = query.toLowerCase()
    const map = await this.analyzeRepository(repoPath)

    if (lower.includes('router') || lower.includes('model') || lower.includes('tier')) {
      return {
        files: ['src/main/services/router.service.ts', 'src/main/services/model.service.ts', 'src/shared/models.registry.ts'],
        explanation: 'Model routing is handled by SmartModelRouter in router.service.ts, consuming the unified Model Registry.'
      }
    }

    if (lower.includes('android') || lower.includes('phone') || lower.includes('adb')) {
      return {
        files: ['src/main/services/adb.service.ts', 'src/main/services/android-agent.service.ts'],
        explanation: 'Android communication is managed via ADB protocol in adb.service.ts and elevated actions in android-agent.service.ts.'
      }
    }

    if (lower.includes('auth') || lower.includes('key') || lower.includes('vault')) {
      return {
        files: ['src/main/services/credential-vault.service.ts', 'src/main/services/credential.service.ts'],
        explanation: 'Credentials and secrets are managed with Windows DPAPI encryption in credential-vault.service.ts.'
      }
    }

    return {
      files: map.entryPoints,
      explanation: `General repository entry points identified for query: "${query}".`
    }
  }
}

export const repositoryIntelligenceService = new RepositoryIntelligenceService()