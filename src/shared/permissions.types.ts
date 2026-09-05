// src/shared/permissions.types.ts — Permission Center Types for ULTRON V1.0.3
import { RiskLevel } from './types'

export type PermissionCategory =
  | 'WINDOWS'
  | 'ANDROID'
  | 'FILES'
  | 'SCREEN'
  | 'BROWSER'
  | 'NETWORK'
  | 'MEMORY'
  | 'DEVELOPER'
  | 'AUTOMATION'
  | 'BACKGROUND_TASKS'
  | 'MICROPHONE'
  | 'MISSIONS'
  | 'DOCUMENTS'

export type PermissionLevel = 'ASK' | 'ALLOW' | 'DENY'

export interface PermissionRule {
  category: PermissionCategory
  level: PermissionLevel
  name: string
  description: string
  defaultLevel: PermissionLevel
  updatedAt: number
}

export interface PermissionAuditEntry {
  id: string
  timestamp: number
  category: PermissionCategory
  action: string
  risk: RiskLevel
  levelApplied: PermissionLevel
  outcome: 'ALLOWED' | 'DENIED' | 'CONFIRMED' | 'CANCELLED'
  details?: string
}

export const DEFAULT_PERMISSIONS: Record<PermissionCategory, PermissionRule> = {
  WINDOWS: {
    category: 'WINDOWS',
    level: 'ALLOW',
    name: 'Windows System Control',
    description: 'Read system telemetry, query processes, adjust display/volume.',
    defaultLevel: 'ALLOW',
    updatedAt: Date.now()
  },
  ANDROID: {
    category: 'ANDROID',
    level: 'ASK',
    name: 'Android Phone Companion (ADB)',
    description: 'Inspect device, launch apps, dial contacts, end calls.',
    defaultLevel: 'ASK',
    updatedAt: Date.now()
  },
  FILES: {
    category: 'FILES',
    level: 'ASK',
    name: 'Filesystem Access',
    description: 'Create, modify, move, or delete files on Desktop/Documents/Downloads.',
    defaultLevel: 'ASK',
    updatedAt: Date.now()
  },
  SCREEN: {
    category: 'SCREEN',
    level: 'ASK',
    name: 'Screen Share & Vision',
    description: 'Capture local screen or window frames for AI multimodal vision analysis.',
    defaultLevel: 'ASK',
    updatedAt: Date.now()
  },
  BROWSER: {
    category: 'BROWSER',
    level: 'ALLOW',
    name: 'Browser & Web Launcher',
    description: 'Launch websites and web applications in your default browser.',
    defaultLevel: 'ALLOW',
    updatedAt: Date.now()
  },
  NETWORK: {
    category: 'NETWORK',
    level: 'ALLOW',
    name: 'Network & Internet Operations',
    description: 'Check connectivity status, query IP, execute web research.',
    defaultLevel: 'ALLOW',
    updatedAt: Date.now()
  },
  MEMORY: {
    category: 'MEMORY',
    level: 'ALLOW',
    name: 'Memory Subsystem',
    description: 'Store, recall, and search scoped user preferences and project facts.',
    defaultLevel: 'ALLOW',
    updatedAt: Date.now()
  },
  DEVELOPER: {
    category: 'DEVELOPER',
    level: 'ASK',
    name: 'Developer Mode & Codebase Access',
    description: 'Inspect repository files, run TypeScript checks, view Git status, edit source.',
    defaultLevel: 'ASK',
    updatedAt: Date.now()
  },
  AUTOMATION: {
    category: 'AUTOMATION',
    level: 'ASK',
    name: 'Autonomous Task Orchestration',
    description: 'Execute multi-step compound actions and automated task sequences.',
    defaultLevel: 'ASK',
    updatedAt: Date.now()
  },
  BACKGROUND_TASKS: {
    category: 'BACKGROUND_TASKS',
    level: 'ALLOW',
    name: 'Background Task Execution',
    description: 'Execute long-running tasks, file monitors, builds, and scheduled processes.',
    defaultLevel: 'ALLOW',
    updatedAt: Date.now()
  },
  MICROPHONE: {
    category: 'MICROPHONE',
    level: 'ALLOW',
    name: 'Microphone & Voice Input',
    description: 'Capture voice input for real-time speech-to-text processing.',
    defaultLevel: 'ALLOW',
    updatedAt: Date.now()
  },
  MISSIONS: {
    category: 'MISSIONS',
    level: 'ASK',
    name: 'Agent Mission Engine',
    description: 'Execute multi-step mission workflows and coordinated system actions.',
    defaultLevel: 'ASK',
    updatedAt: Date.now()
  },
  DOCUMENTS: {
    category: 'DOCUMENTS',
    level: 'ALLOW',
    name: 'Document Intelligence',
    description: 'Extract, chunk, index, and analyze local documents and PDFs.',
    defaultLevel: 'ALLOW',
    updatedAt: Date.now()
  }
}
