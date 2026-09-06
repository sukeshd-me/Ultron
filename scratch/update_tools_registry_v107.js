// scratch/update_tools_registry_v107.js
const fs = require('fs')
const path = require('path')

const targetPath = path.resolve(__dirname, '../src/main/services/tools.registry.ts')
let content = fs.readFileSync(targetPath, 'utf8')

// 1. Add imports
const importMarker = `import { actionRiskEngine } from './risk-engine.service'`
const newImports = `import { actionRiskEngine } from './risk-engine.service'
import { communicationService } from './communication.service'
import { inboxService } from './inbox.service'
import { briefingService } from './briefing.service'
import { focusService } from './focus.service'
import { workspaceManagerService } from './workspace-manager.service'
import { androidAgentService } from './android-agent.service'
import { memoryControlService } from './memory-control.service'
import { personalityService } from './personality.service'
import { automationService } from './automation.service'
import { schedulerService } from './scheduler.service'
import { simulationService } from './simulation.service'
import { workspaceBackupService } from './workspace-backup.service'
import { updateService } from './update.service'`

if (!content.includes('communicationService')) {
  content = content.replace(importMarker, newImports)
}

// 2. Add V1.0.7 tools before end of registerAllTools
const endMarker = `      validate: (args) => (args?.id ? { valid: true } : { valid: false, error: 'Credential ID is required' }),
      executor: async (args) => credentialVaultService.testCredential(args.id)
    })
  }`

const v107Tools = `      validate: (args) => (args?.id ? { valid: true } : { valid: false, error: 'Credential ID is required' }),
      executor: async (args) => credentialVaultService.testCredential(args.id)
    })

    // ════════════════════════════════════════════════════════════════
    // ── V1.0.7: INTELLIGENT AGENT OPERATING LAYER TOOLS ─────────────
    // ════════════════════════════════════════════════════════════════

    // ── Briefing Tools ──
    this.register({
      name: 'briefing.get',
      description: 'Generate authentic personal daily briefing with real system status, active goals, and tasks',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => briefingService.generateBriefing()
    })

    // ── Focus Mode Tools ──
    this.register({
      name: 'focus.start',
      description: 'Start a focused work session (Coding, Research, Study, Writing, General Focus)',
      category: 'WORKSPACE',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        mode: { type: 'string', description: 'Focus mode type', required: false },
        durationMinutes: { type: 'number', description: 'Duration in minutes', required: false }
      },
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async (args) => focusService.startFocus(args?.mode, args?.durationMinutes)
    })

    this.register({
      name: 'focus.end',
      description: 'End the current active focus session',
      category: 'WORKSPACE',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 3000,
      validate: () => ({ valid: true }),
      executor: async () => focusService.endFocus()
    })

    // ── Multiple Workspaces Tools ──
    this.register({
      name: 'workspaces.list',
      description: 'List all available workspace profiles (Development, Research, Study, Personal, Security Lab, Custom)',
      category: 'WORKSPACE',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 3000,
      validate: () => ({ valid: true }),
      executor: async () => workspaceManagerService.listWorkspaces()
    })

    this.register({
      name: 'workspaces.switch',
      description: 'Switch to a specific workspace profile and restore its configured tools safely',
      category: 'WORKSPACE',
      riskLevel: 'LEVEL_2_REVERSIBLE',
      parameters: {
        name: { type: 'string', description: 'Workspace name or ID', required: true }
      },
      timeoutMs: 8000,
      validate: (args) => (args?.name ? { valid: true } : { valid: false, error: 'Workspace name is required' }),
      executor: async (args) => workspaceManagerService.switchWorkspace(args.name)
    })

    // ── Universal Inbox Tools ──
    this.register({
      name: 'inbox.list',
      description: 'List incoming notifications, Android messages, and mission alerts',
      category: 'COMMUNICATION',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        unreadOnly: { type: 'boolean', description: 'Show only unread items', required: false },
        importance: { type: 'string', description: 'Importance filter (LOW, NORMAL, HIGH, URGENT)', required: false }
      },
      timeoutMs: 3000,
      validate: () => ({ valid: true }),
      executor: async (args) => inboxService.getItems(args)
    })

    this.register({
      name: 'inbox.summarize',
      description: 'Produce a natural language summary of the universal inbox',
      category: 'COMMUNICATION',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 3000,
      validate: () => ({ valid: true }),
      executor: async () => ({ summary: inboxService.summarizeInbox() })
    })

    // ── Communication Center Tools ──
    this.register({
      name: 'communication.sms',
      description: 'Send or preview an SMS message via Android Companion with required preview/permission',
      category: 'COMMUNICATION',
      riskLevel: 'LEVEL_2_REVERSIBLE',
      parameters: {
        recipient: { type: 'string', description: 'Phone number or contact', required: true },
        message: { type: 'string', description: 'Message body', required: true },
        previewOnly: { type: 'boolean', description: 'Preview without dispatching', required: false }
      },
      timeoutMs: 10000,
      validate: (args) => (args?.recipient && args?.message ? { valid: true } : { valid: false, error: 'Recipient and message required' }),
      executor: async (args) => communicationService.sendMessage(args)
    })

    // ── Android Agent 2.0 Tools ──
    this.register({
      name: 'android.app',
      description: 'Launch an application on Android phone safely via natural name or package',
      category: 'ANDROID',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        app: { type: 'string', description: 'App name or package name', required: true }
      },
      timeoutMs: 8000,
      validate: (args) => (args?.app ? { valid: true } : { valid: false, error: 'App name is required' }),
      executor: async (args) => androidAgentService.openApp(args.app)
    })

    this.register({
      name: 'android.call',
      description: 'Initiate a phone call to a contact or phone number via Android Companion',
      category: 'ANDROID',
      riskLevel: 'LEVEL_2_REVERSIBLE',
      parameters: {
        target: { type: 'string', description: 'Contact name or phone number', required: true }
      },
      timeoutMs: 8000,
      validate: (args) => (args?.target ? { valid: true } : { valid: false, error: 'Target contact/number is required' }),
      executor: async (args) => androidAgentService.makeCall(args.target)
    })

    this.register({
      name: 'android.endcall',
      description: 'End the current active phone call',
      category: 'ANDROID',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => androidAgentService.endCall()
    })

    // ── Automation & Scheduling Tools ──
    this.register({
      name: 'automations.list',
      description: 'List configured automation rules',
      category: 'AUTOMATION',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 3000,
      validate: () => ({ valid: true }),
      executor: async () => automationService.listAutomations()
    })

    this.register({
      name: 'missions.schedule',
      description: 'Schedule a mission with one-time, daily, weekly, or custom recurrence',
      category: 'AUTOMATION',
      riskLevel: 'LEVEL_2_REVERSIBLE',
      parameters: {
        title: { type: 'string', description: 'Mission title', required: true },
        goal: { type: 'string', description: 'Goal description', required: true },
        recurrence: { type: 'string', description: 'Recurrence: one_time, daily, weekly', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => (args?.title && args?.goal ? { valid: true } : { valid: false, error: 'Title and goal are required' }),
      executor: async (args) => schedulerService.scheduleMission(args)
    })

    this.register({
      name: 'missions.simulate',
      description: 'Simulate a mission dry-run previewing predicted tools, risk, and rollback options without side effects',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        goal: { type: 'string', description: 'Mission goal to simulate', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => (args?.goal ? { valid: true } : { valid: false, error: 'Goal is required' }),
      executor: async (args) => simulationService.simulateMission(args.goal)
    })

    // ── Memory Control Tools ──
    this.register({
      name: 'memory.scoped_delete',
      description: 'Safely forget a memory item with an automatic reversible backup',
      category: 'MEMORY',
      riskLevel: 'LEVEL_3_CONFIRM',
      parameters: {
        id: { type: 'string', description: 'Memory ID to forget', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => (args?.id ? { valid: true } : { valid: false, error: 'Memory ID is required' }),
      executor: async (args) => memoryControlService.forgetMemory(args.id)
    })

    // ── Update Manager Tools ──
    this.register({
      name: 'updates.check',
      description: 'Check official GitHub repository releases for available ULTRON updates',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 10000,
      validate: () => ({ valid: true }),
      executor: async () => updateService.checkForUpdates()
    })

    // ── Workspace Backup Tools ──
    this.register({
      name: 'backups.create',
      description: 'Create a configuration backup bundle excluding credentials',
      category: 'WORKSPACE',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        name: { type: 'string', description: 'Backup name', required: false }
      },
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async (args) => workspaceBackupService.createBackup(args?.name)
    })

    // ── Personality Tools ──
    this.register({
      name: 'personality.set',
      description: 'Switch the active ULTRON conversational personality profile',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        profileId: { type: 'string', description: 'Profile ID: Balanced, Technical, Minimal, Professional, Tutor, Developer, Researcher', required: true }
      },
      timeoutMs: 3000,
      validate: (args) => (args?.profileId ? { valid: true } : { valid: false, error: 'Profile ID is required' }),
      executor: async (args) => personalityService.setActiveProfile(args.profileId)
    })
  }`

if (!content.includes('briefing.get')) {
  content = content.replace(endMarker, v107Tools)
}

fs.writeFileSync(targetPath, content, 'utf8')
console.log('Successfully registered V1.0.7 tools in tools.registry.ts')
