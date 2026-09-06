// src/main/services/tools.registry.ts — Centralized Typed Tool Registry
import { UltronToolDefinition, ToolExecutionResult } from '../../shared/tools/tool.types'
import { powershellService } from './powershell.service'
import { appsService } from './apps.service'
import { filesystemService } from './filesystem.service'
import { memoryService } from './memory.service'
import { researchService } from './research.service'
import { commandRegistry } from './command.registry'
import { adbService } from './adb.service'
import { androidAppsService } from './android-apps.service'
import { contactsService } from './contacts.service'
import { screenService } from './screen.service'
import { developerService } from './developer.service'
import { skillsRegistryService } from './skills.registry'
import { searchService } from './search.service'
import { diagnosticsService } from './diagnostics.service'
import { taskService } from './task.service'
import { workspaceService } from './workspace.service'
import { missionService } from './mission.service'
import { workflowService } from './workflow.service'
import { documentService } from './document.service'
import { recoveryService } from './recovery.service'
import { preferenceService } from './preference.service'
import { networkService } from './network.service'
import { repairService } from './repair.service'
import { goalMemoryService } from './goal-memory.service'
import { windowManagerService } from './window-manager.service'
import { pluginService } from './plugin.service'
import { projectIntelligenceService } from './project-intelligence.service'
import { productivityService } from './productivity.service'
import { credentialVaultService } from './credential-vault.service'
import { verificationService } from './verification.service'
import { actionRiskEngine } from './risk-engine.service'

class ToolsRegistry {
  private tools: Map<string, UltronToolDefinition> = new Map()

  constructor() {
    this.registerAllTools()
  }

  register<TArgs = any, TResult = any>(tool: UltronToolDefinition<TArgs, TResult>): void {
    this.tools.set(tool.name, tool)
  }

  get(name: string): UltronToolDefinition | undefined {
    return this.tools.get(name)
  }

  getAll(): UltronToolDefinition[] {
    return Array.from(this.tools.values())
  }

  getNames(): string[] {
    return Array.from(this.tools.keys())
  }

  /**
   * Execute a tool by name with strict validation, timeout, and telemetry measurement
   */
  async execute(toolName: string, args: Record<string, any> = {}): Promise<ToolExecutionResult> {
    const startMs = performance.now()
    const def = this.tools.get(toolName)

    if (!def) {
      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        tool: toolName,
        category: 'SYSTEM',
        success: false,
        durationMs,
        error: `Tool '${toolName}' is not registered in ULTRON tool catalog.`
      }
    }

    // 1. Argument validation
    const validation = def.validate(args)
    if (!validation.valid) {
      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        tool: toolName,
        category: def.category,
        success: false,
        durationMs,
        error: `Invalid arguments for tool '${toolName}': ${validation.error}`
      }
    }

    // 2. Execution with timeout boundary
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Tool '${toolName}' timed out after ${def.timeoutMs}ms`)), def.timeoutMs)
      )

      const executionPromise = def.executor(args)
      const data = await Promise.race([executionPromise, timeoutPromise])
      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))

      // ── V1.0.6 Verification Engine Gate ──
      const actionId = 'act-' + Date.now()
      const target = args?.path || args?.appName || args?.query || toolName
      const verif = await verificationService.verifyAction(actionId, toolName, target, args, data)

      if (!verif.verified) {
        return {
          tool: toolName,
          category: def.category,
          success: false,
          durationMs,
          error: `Verification failed: ${verif.details}`,
          data
        }
      }

      return {
        tool: toolName,
        category: def.category,
        success: true,
        durationMs,
        data
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        tool: toolName,
        category: def.category,
        success: false,
        durationMs,
        error: err.message || 'Execution failed'
      }
    }
  }

  private registerAllTools() {
    // ══════════════════════════════════════════════════════════════════
    // SYSTEM TOOLS
    // ══════════════════════════════════════════════════════════════════
    this.register({
      name: 'system.getTime',
      description: 'Get current real-time Windows system clock time',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await powershellService.execute<string>('Get-Date -Format "hh:mm:ss tt (dddd)"', { commandType: 'system.time' })
        return { time: res.stdout, timestamp: Date.now() }
      }
    })

    this.register({
      name: 'system.getDate',
      description: 'Get current Windows date and day of the week',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await powershellService.execute<string>('Get-Date -Format "MMMM dd, yyyy (dddd)"', { commandType: 'system.date' })
        return { date: res.stdout, timestamp: Date.now() }
      }
    })

    this.register({
      name: 'system.getCpu',
      description: 'Query live CPU load percentage, core count, and processor name',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('system.cpu')
        return res.data
      }
    })

    this.register({
      name: 'system.getMemory',
      description: 'Query physical RAM usage, free memory, and load percentage',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('system.memory')
        const data = res.data || {}
        return {
          ...data,
          usedPercent: data.percentUsed ?? data.usedPercent,
          percentUsed: data.percentUsed ?? data.usedPercent
        }
      }
    })

    this.register({
      name: 'system.getDisk',
      description: 'Query primary and secondary drive storage capacities and free space',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('system.disk')
        const data = res.data || {}
        const disks = data.disks || []
        const primary = disks[0] || {}
        return {
          ...data,
          drives: disks,
          freeGB: primary.freeGB ?? data.freeGB,
          sizeGB: primary.sizeGB ?? data.sizeGB
        }
      }
    })

    this.register({
      name: 'system.getProcesses',
      description: 'Query top active Windows processes by CPU/memory consumption',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        limit: { type: 'number', description: 'Maximum number of processes to return (default: 8)', required: false }
      },
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('system.processes')
        return res.data
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // APPLICATION TOOLS
    // ══════════════════════════════════════════════════════════════════
    this.register({
      name: 'apps.open',
      description: 'Launch a local Windows desktop application or system tool by name',
      category: 'APPS',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        app: { type: 'string', description: 'Application name (e.g. calculator, notepad, chrome, explorer, vscode, spotify)', required: true },
        args: { type: 'array', description: 'Optional command-line arguments', required: false }
      },
      timeoutMs: 10000,
      validate: (args) => {
        if (!args?.app || typeof args.app !== 'string' || !args.app.trim()) {
          return { valid: false, error: 'Target application name is required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return appsService.launch(args.app, args.args || [])
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // FILESYSTEM TOOLS
    // ══════════════════════════════════════════════════════════════════
    this.register({
      name: 'filesystem.list',
      description: 'List files and folders inside a directory',
      category: 'FILESYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        path: { type: 'string', description: 'Directory path (e.g. Desktop, Documents, or absolute path)', required: false }
      },
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async (args) => {
        return filesystemService.listFolder(args.path || 'Desktop')
      }
    })

    this.register({
      name: 'filesystem.search',
      description: 'Search for files by query string or pattern',
      category: 'FILESYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        query: { type: 'string', description: 'Filename query or pattern', required: true },
        root: { type: 'string', description: 'Starting search directory (e.g. Desktop, Documents)', required: false }
      },
      timeoutMs: 10000,
      validate: (args) => {
        if (!args?.query || typeof args.query !== 'string') {
          return { valid: false, error: 'Search query is required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return filesystemService.searchFiles(args.query, args.root)
      }
    })

    this.register({
      name: 'filesystem.createFile',
      description: 'Create a new text or code file with optional content',
      category: 'FILESYSTEM',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        path: { type: 'string', description: 'File path to create', required: true },
        content: { type: 'string', description: 'Text or code content to write', required: false }
      },
      timeoutMs: 8000,
      validate: (args) => {
        if (!args?.path || typeof args.path !== 'string') {
          return { valid: false, error: 'Target file path is required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return filesystemService.createFile(args.path, args.content || '')
      }
    })

    this.register({
      name: 'filesystem.createDirectory',
      description: 'Create a new folder or directory path',
      category: 'FILESYSTEM',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        path: { type: 'string', description: 'Folder path to create', required: true }
      },
      timeoutMs: 8000,
      validate: (args) => {
        if (!args?.path || typeof args.path !== 'string') {
          return { valid: false, error: 'Target directory path is required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return filesystemService.createFolder(args.path)
      }
    })

    this.register({
      name: 'filesystem.read',
      description: 'Read the text contents of a file',
      category: 'FILESYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        path: { type: 'string', description: 'Target file path', required: true }
      },
      timeoutMs: 8000,
      validate: (args) => {
        if (!args?.path || typeof args.path !== 'string') {
          return { valid: false, error: 'Target file path is required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return filesystemService.readFile(args.path)
      }
    })

    this.register({
      name: 'filesystem.copy',
      description: 'Copy a file or directory from source to destination',
      category: 'FILESYSTEM',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        source: { type: 'string', description: 'Source file or folder path', required: true },
        destination: { type: 'string', description: 'Destination file or folder path', required: true }
      },
      timeoutMs: 10000,
      validate: (args) => {
        if (!args?.source || !args?.destination) {
          return { valid: false, error: 'Source and destination paths are required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return filesystemService.copyItem(args.source, args.destination)
      }
    })

    this.register({
      name: 'filesystem.move',
      description: 'Move or rename a file or directory from source to destination',
      category: 'FILESYSTEM',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        source: { type: 'string', description: 'Source file or folder path', required: true },
        destination: { type: 'string', description: 'Destination file or folder path', required: true }
      },
      timeoutMs: 10000,
      validate: (args) => {
        if (!args?.source || !args?.destination) {
          return { valid: false, error: 'Source and destination paths are required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return filesystemService.moveItem(args.source, args.destination)
      }
    })

    this.register({
      name: 'filesystem.rename',
      description: 'Rename a file or folder in-place',
      category: 'FILESYSTEM',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        source: { type: 'string', description: 'Source path', required: true },
        newName: { type: 'string', description: 'New name for file or folder', required: true }
      },
      timeoutMs: 8000,
      validate: (args) => {
        if (!args?.source || !args?.newName) {
          return { valid: false, error: 'Source path and newName are required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        const pathModule = await import('path')
        const dir = pathModule.dirname(args.source)
        const dest = pathModule.join(dir, args.newName)
        return filesystemService.moveItem(args.source, dest)
      }
    })

    this.register({
      name: 'filesystem.delete',
      description: 'Delete a file or folder (requires explicit confirmation for non-test items)',
      category: 'FILESYSTEM',
      riskLevel: 'LEVEL_3_DESTRUCTIVE',
      parameters: {
        path: { type: 'string', description: 'Path to file or folder to delete', required: true }
      },
      timeoutMs: 8000,
      requiresConfirmation: true,
      validate: (args) => {
        if (!args?.path || typeof args.path !== 'string') {
          return { valid: false, error: 'Target path to delete is required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return filesystemService.deleteItem(args.path)
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // NETWORK TOOLS
    // ══════════════════════════════════════════════════════════════════
    this.register({
      name: 'network.getStatus',
      description: 'Query Windows network connectivity status and active interfaces',
      category: 'NETWORK',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('network.status')
        return res.data
      }
    })

    this.register({
      name: 'network.getWifiStatus',
      description: 'Query live Wi-Fi interface status, connected SSID, and signal quality',
      category: 'NETWORK',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('network.wifi.status')
        return res.data
      }
    })

    this.register({
      name: 'network.enableWifi',
      description: 'Turn the primary Wi-Fi network adapter ON',
      category: 'NETWORK',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {},
      timeoutMs: 10000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('network.wifi.on')
        return res.data
      }
    })

    this.register({
      name: 'network.disableWifi',
      description: 'Turn the primary Wi-Fi network adapter OFF',
      category: 'NETWORK',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {},
      timeoutMs: 10000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('network.wifi.off')
        return res.data
      }
    })

    this.register({
      name: 'network.getAdapters',
      description: 'List all physical and virtual network adapters and link speeds',
      category: 'NETWORK',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('network.adapters')
        return res.data
      }
    })

    this.register({
      name: 'network.getIp',
      description: 'Query local IPv4 / IPv6 addresses and interface configurations',
      category: 'NETWORK',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('network.ip')
        return res.data
      }
    })

    this.register({
      name: 'network.getDns',
      description: 'Query active DNS server addresses',
      category: 'NETWORK',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await powershellService.execute('Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses.Count -gt 0 } | Select-Object InterfaceAlias, ServerAddresses')
        return { dns: res.stdout }
      }
    })

    this.register({
      name: 'network.getAvailableNetworks',
      description: 'Scan and list nearby Wi-Fi network SSIDs and signal qualities',
      category: 'NETWORK',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 12000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await powershellService.execute('netsh wlan show networks mode=bssid')
        return { networks: res.stdout }
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // SECURITY TOOLS
    // ══════════════════════════════════════════════════════════════════
    this.register({
      name: 'security.getFirewallStatus',
      description: 'Query Windows Defender Firewall profile states (Domain, Private, Public)',
      category: 'SECURITY',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('security.firewall')
        return res.data
      }
    })

    this.register({
      name: 'security.getDefenderStatus',
      description: 'Query Windows Defender real-time protection, antivirus, and signature status',
      category: 'SECURITY',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('security.defender')
        return res.data
      }
    })

    this.register({
      name: 'security.getListeningPorts',
      description: 'List active TCP listening sockets and owning process IDs',
      category: 'SECURITY',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        const res = await commandRegistry.execute('security.ports')
        return res.data
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // SETTINGS TOOLS
    // ══════════════════════════════════════════════════════════════════
    this.register({
      name: 'settings.open',
      description: 'Open native Windows Settings subpages',
      category: 'SETTINGS',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        page: { type: 'string', description: 'Target settings page (e.g. system, display, wifi, bluetooth, apps, sound, battery)', required: false }
      },
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async (args) => {
        const page = (args?.page || 'system').toLowerCase()
        const mapping: Record<string, string> = {
          wifi: 'settings.wifi',
          bluetooth: 'settings.bluetooth',
          display: 'settings.display',
          sound: 'settings.sound',
          apps: 'settings.apps',
          battery: 'settings.battery',
          taskmgr: 'settings.taskmgr',
          system: 'settings.main'
        }
        const cmdId = mapping[page] || 'settings.main'
        const res = await commandRegistry.execute(cmdId)
        return res.data
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // MEMORY TOOLS
    // ══════════════════════════════════════════════════════════════════
    this.register({
      name: 'memory.store',
      description: 'Store an important user fact, preference, or context item into persistent memory',
      category: 'MEMORY',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        content: { type: 'string', description: 'Memory content to store', required: true },
        category: { type: 'string', description: 'Category (fact, preference, context, task)', required: false },
        key: { type: 'string', description: 'Unique identifier key', required: false }
      },
      timeoutMs: 5000,
      validate: (args) => {
        if (!args?.content || typeof args.content !== 'string') {
          return { valid: false, error: 'Memory content string is required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return memoryService.saveMemory({
          content: args.content,
          category: (args.category as any) || 'fact',
          key: args.key,
          metadata: { source: 'agent_tool' }
        })
      }
    })

    this.register({
      name: 'memory.search',
      description: 'Search persistent long-term memory for relevant user facts or context',
      category: 'MEMORY',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        query: { type: 'string', description: 'Search term or query', required: true },
        category: { type: 'string', description: 'Filter category', required: false }
      },
      timeoutMs: 5000,
      validate: (args) => {
        if (!args?.query || typeof args.query !== 'string') {
          return { valid: false, error: 'Search query is required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return memoryService.searchMemories(args.query, args.category as any)
      }
    })

    this.register({
      name: 'memory.delete',
      description: 'Delete a stored memory record by its unique ID',
      category: 'MEMORY',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        id: { type: 'string', description: 'Memory record ID to delete', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => {
        if (!args?.id || typeof args.id !== 'string') {
          return { valid: false, error: 'Memory ID is required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return { success: memoryService.deleteMemory(args.id) }
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // RESEARCH TOOLS
    // ══════════════════════════════════════════════════════════════════
    this.register({
      name: 'research.search',
      description: 'Search the web using search engines (Bing, Google, DuckDuckGo)',
      category: 'RESEARCH',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        query: { type: 'string', description: 'Search query topic', required: true },
        engine: { type: 'string', description: 'Engine: bing, google, duckduckgo (default: bing)', required: false }
      },
      timeoutMs: 8000,
      validate: (args) => {
        if (!args?.query || typeof args.query !== 'string') {
          return { valid: false, error: 'Search query is required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return researchService.searchEngine((args.engine as any) || 'bing', args.query)
      }
    })

    this.register({
      name: 'research.youtube',
      description: 'Search YouTube for videos on a specific query or topic',
      category: 'RESEARCH',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        query: { type: 'string', description: 'Video topic to search for', required: true }
      },
      timeoutMs: 8000,
      validate: (args) => {
        if (!args?.query || typeof args.query !== 'string') {
          return { valid: false, error: 'Video query is required' }
        }
        return { valid: true }
      },
      executor: async (args) => {
        return researchService.searchEngine('youtube', args.query)
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // ANDROID ADB PHONE TOOLS
    // ══════════════════════════════════════════════════════════════════
    this.register({
      name: 'adb.connect',
      description: 'Connect and verify Android phone via ADB (Android Debug Bridge) USB or Wi-Fi',
      category: 'ADB',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        target: { type: 'string', description: 'Optional wireless IP:port (e.g. 192.168.1.50:5555), leave blank for USB/auto', required: false }
      },
      timeoutMs: 12000,
      validate: () => ({ valid: true }),
      executor: async (args) => {
        return adbService.connectPhone(args?.target)
      }
    })

    this.register({
      name: 'adb.getDevices',
      description: 'Query all attached Android phone devices, models, and states via ADB',
      category: 'ADB',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        return adbService.getDevicesWithDetails()
      }
    })

    this.register({
      name: 'adb.makeCall',
      description: 'Initiate a phone call on the connected Android phone via ADB',
      category: 'ADB',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        phoneNumber: { type: 'string', description: 'Phone number to dial', required: true }
      },
      timeoutMs: 10000,
      validate: (args) => {
        if (!args?.phoneNumber) return { valid: false, error: 'Phone number is required' }
        return { valid: true }
      },
      executor: async (args) => {
        return adbService.makeCall(args.phoneNumber)
      }
    })

    this.register({
      name: 'adb.sendMessage',
      description: 'Send an SMS text message on the connected Android phone via ADB',
      category: 'ADB',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        phoneNumber: { type: 'string', description: 'Recipient phone number', required: true },
        message: { type: 'string', description: 'SMS message text body', required: true }
      },
      timeoutMs: 10000,
      validate: (args) => {
        if (!args?.phoneNumber) return { valid: false, error: 'Phone number is required' }
        if (!args?.message) return { valid: false, error: 'Message body is required' }
        return { valid: true }
      },
      executor: async (args) => {
        return adbService.sendMessage(args.phoneNumber, args.message)
      }
    })

    this.register({
      name: 'adb.wakeScreen',
      description: 'Wake up the connected Android phone screen',
      category: 'ADB',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => {
        return adbService.wakeScreen()
      }
    })

    this.register({
      name: 'adb.unlockPhone',
      description: 'Unlock connected Android phone screen using hardware-vaulted secure PIN (never logged or saved in memory)',
      category: 'ADB',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        pin: { type: 'string', description: 'Optional explicit PIN if not already saved in secure vault', required: false }
      },
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async (args) => {
        return adbService.unlockPhone(args?.pin)
      }
    })

    // ────────────────────────────────────────────────────────────────
    // ANDROID APP CONTROL TOOLS (v1.0.2)
    // ────────────────────────────────────────────────────────────────

    this.register({
      name: 'android.openApp',
      description: 'Open/launch an application on the connected Android phone by name (e.g. YouTube, WhatsApp, Chrome)',
      category: 'ADB',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        appName: { type: 'string', description: 'The name of the Android app to open (e.g. YouTube, Spotify)', required: true }
      },
      timeoutMs: 12000,
      validate: (args) => {
        if (!args?.appName || typeof args.appName !== 'string') return { valid: false, error: 'App name is required' }
        return { valid: true }
      },
      executor: async (args) => {
        return androidAppsService.openAppByName(args.appName)
      }
    })

    this.register({
      name: 'android.listApps',
      description: 'List installed applications on the connected Android phone',
      category: 'ADB',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 10000,
      validate: () => ({ valid: true }),
      executor: async () => {
        return androidAppsService.listInstalledPackages()
      }
    })

    this.register({
      name: 'android.callContact',
      description: 'Search for a contact and initiate a phone call on the connected Android device',
      category: 'ADB',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        contactName: { type: 'string', description: 'Name of the contact to call (e.g. Sukesh, Mom, John)', required: true }
      },
      timeoutMs: 15000,
      validate: (args) => {
        if (!args?.contactName) return { valid: false, error: 'Contact name is required' }
        return { valid: true }
      },
      executor: async (args) => {
        const startMs = performance.now()
        const resolved = await contactsService.resolveContact(args.contactName)

        if (resolved.status === 'DISCONNECTED') {
          return {
            success: false,
            message: resolved.message,
            telemetry: resolved.telemetry,
            duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
          }
        }

        if (resolved.status === 'NOT_FOUND') {
          return {
            success: false,
            message: `I couldn't find that contact on your phone.`,
            telemetry: resolved.telemetry,
            duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
          }
        }

        if (resolved.status === 'MULTIPLE_MATCHES') {
          return {
            success: false,
            message: resolved.message,
            matchingNames: resolved.matchingNames,
            telemetry: resolved.telemetry,
            duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
          }
        }

        if (resolved.status === 'AMBIGUOUS_NUMBERS') {
          return {
            success: false,
            message: resolved.message,
            availableNumbers: resolved.availableNumbers,
            telemetry: resolved.telemetry,
            duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
          }
        }

        if (resolved.status === 'NO_NUMBER') {
          return {
            success: false,
            message: resolved.message,
            telemetry: resolved.telemetry,
            duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
          }
        }

        if (resolved.status !== 'RESOLVED' || !resolved.selectedNumber || !resolved.contact) {
          return {
            success: false,
            message: `I couldn't find that contact on your phone.`,
            telemetry: resolved.telemetry,
            duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
          }
        }

        const dispatchStartMs = performance.now()
        const callResult = await adbService.makeCall(resolved.selectedNumber)
        const dispatchEndMs = performance.now()
        const callDispatchMs = parseFloat((dispatchEndMs - dispatchStartMs).toFixed(2))

        const totalMs = parseFloat((performance.now() - startMs).toFixed(2))
        const telemetry = {
          contact_cache_lookup_ms: resolved.telemetry.contact_cache_lookup_ms,
          contact_resolution_ms: resolved.telemetry.contact_resolution_ms,
          call_dispatch_ms: callDispatchMs,
          call_verification_ms: callResult.verification_ms || 0,
          total_ms: totalMs
        }

        return {
          success: callResult.success,
          contact_reference: resolved.contact.name,
          message: callResult.success
            ? `Calling ${resolved.contact.name}...`
            : (callResult.error || `I couldn't start the call through the connected Android device.`),
          telemetry,
          duration_ms: totalMs
        }
      }
    })

    this.register({
      name: 'android.endCall',
      description: 'End/hang up the currently active phone call on the connected Android device',
      category: 'ADB',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => {
        return adbService.endCall()
      }
    })

    this.register({
      name: 'android.muteCall',
      description: 'Mute or unmute the active phone call microphone',
      category: 'ADB',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        mute: { type: 'boolean', description: 'true to mute, false to unmute', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => {
        if (args?.mute === undefined) return { valid: false, error: 'mute parameter is required (true/false)' }
        return { valid: true }
      },
      executor: async (args) => {
        return adbService.muteCall(Boolean(args.mute))
      }
    })

    this.register({
      name: 'android.getPhoneState',
      description: 'Query the current state of the connected Android phone (screen, call status, connection)',
      category: 'ADB',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => {
        return adbService.getPhoneState()
      }
    })

    this.register({
      name: 'android.powerOff',
      description: 'Power off the connected Android phone cleanly via ADB (requires confirmation)',
      category: 'ADB',
      riskLevel: 'LEVEL_3_DESTRUCTIVE',
      parameters: {},
      timeoutMs: 15000,
      requiresConfirmation: true,
      validate: () => ({ valid: true }),
      executor: async () => {
        return adbService.powerOffPhone()
      }
    })

    this.register({
      name: 'android.restart',
      description: 'Restart/reboot the connected Android phone cleanly via ADB (requires confirmation)',
      category: 'ADB',
      riskLevel: 'LEVEL_3_DESTRUCTIVE',
      parameters: {},
      timeoutMs: 15000,
      requiresConfirmation: true,
      validate: () => ({ valid: true }),
      executor: async () => {
        return adbService.restartPhone()
      }
    })

    this.register({
      name: 'android.lock',
      description: 'Lock the connected Android phone screen cleanly via ADB',
      category: 'ADB',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => {
        return adbService.lockPhone()
      }
    })

    this.register({
      name: 'android.getBattery',
      description: 'Get standalone battery level and charging status of connected Android phone',
      category: 'ADB',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => {
        return adbService.getBattery()
      }
    })

    this.register({
      name: 'android.holdCall',
      description: 'Hold the current active phone call',
      category: 'ADB',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {
        hold: { type: 'boolean', description: 'true to hold, false to resume', required: false }
      },
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async (args) => {
        return adbService.holdCall(args.hold ?? true)
      }
    })

    this.register({
      name: 'android.resumeCall',
      description: 'Resume an active held phone call',
      category: 'ADB',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => {
        return adbService.resumeCall()
      }
    })

    this.register({
      name: 'android.mergeCalls',
      description: 'Merge calls into a conference call',
      category: 'ADB',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => {
        return adbService.mergeCalls()
      }
    })

    this.register({
      name: 'android.swapCalls',
      description: 'Swap between active and held phone calls',
      category: 'ADB',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => {
        return adbService.swapCalls()
      }
    })

    this.register({
      name: 'android.secondCall',
      description: 'Answer second incoming call',
      category: 'ADB',
      riskLevel: 'LEVEL_2_MODIFYING',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => {
        return adbService.secondCall()
      }
    })

    this.register({
      name: 'android.searchContact',
      description: 'Search for a contact name and phone number on the connected device',
      category: 'ADB',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        contactName: { type: 'string', description: 'Contact name to search', required: true }
      },
      timeoutMs: 8000,
      validate: (args) => {
        if (!args?.contactName) return { valid: false, error: 'contactName is required' }
        return { valid: true }
      },
      executor: async (args) => {
        return contactsService.resolveContact(args.contactName)
      }
    })

    // ── SCREEN & MULTIMODAL VISION TOOLS ──
    this.register({
      name: 'screen.getSources',
      description: 'Enumerate local displays and application windows for screen capture',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 6000,
      validate: () => ({ valid: true }),
      executor: async () => screenService.getSources()
    })

    this.register({
      name: 'screen.captureFrame',
      description: 'Capture a single frame of the active display or window for visual inspection',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        sourceId: { type: 'string', description: 'Target window or screen source ID', required: false }
      },
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async (args) => screenService.captureFrame(args?.sourceId)
    })

    this.register({
      name: 'screen.analyzeScreen',
      description: 'Analyze the visible screen or window with multimodal vision model to identify elements or errors',
      category: 'RESEARCH',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        prompt: { type: 'string', description: 'Question or inspection request about the screen', required: false },
        sourceId: { type: 'string', description: 'Specific screen or window source ID', required: false }
      },
      timeoutMs: 25000,
      validate: () => ({ valid: true }),
      executor: async (args) => screenService.analyzeScreen(args?.prompt, args?.sourceId)
    })

    // ── DEVELOPER MODE & CODEBASE DIAGNOSTICS TOOLS ──
    this.register({
      name: 'developer.inspectProject',
      description: 'Inspect ULTRON project metadata, package.json dependencies, and file layout',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => developerService.inspectProject()
    })

    this.register({
      name: 'developer.checkTypescript',
      description: 'Execute genuine TypeScript compilation check via npx tsc --noEmit and return real error lines',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 35000,
      validate: () => ({ valid: true }),
      executor: async () => developerService.checkTypescript()
    })

    this.register({
      name: 'developer.checkBuild',
      description: 'Check production build artifact existence and compilation status',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 10000,
      validate: () => ({ valid: true }),
      executor: async () => developerService.checkBuild()
    })

    this.register({
      name: 'developer.gitStatus',
      description: 'Inspect current Git branch, modified files, and recent commit history (read-only)',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => developerService.getGitStatus()
    })

    // ── SKILLS CATALOG TOOLS ──
    this.register({
      name: 'skills.list',
      description: 'List all available modular skills and their capabilities in ULTRON',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 3000,
      validate: () => ({ valid: true }),
      executor: async () => skillsRegistryService.getAllSkills()
    })

    // ── UNIVERSAL SEARCH TOOLS ──
    this.register({
      name: 'search.query',
      description: 'Search across apps, files, projects, neural memory, and background tasks',
      category: 'RESEARCH',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        query: { type: 'string', description: 'Search term or query', required: true },
        categories: { type: 'array', description: 'Categories to include (apps, files, projects, memory, tasks)', required: false }
      },
      timeoutMs: 15000,
      validate: (args) => (args?.query ? { valid: true } : { valid: false, error: 'Query string is required' }),
      executor: async (args) => searchService.search(args.query, args.categories)
    })

    this.register({
      name: 'search.executeAction',
      description: 'Execute a verified action from universal search results',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_2_CONFIRM',
      parameters: {
        action: { type: 'object', description: 'Action object with type and payload', required: true }
      },
      timeoutMs: 10000,
      validate: (args) => (args?.action ? { valid: true } : { valid: false, error: 'Action object is required' }),
      executor: async (args) => searchService.executeAction(args.action)
    })

    // ── HEALTH & DIAGNOSTICS TOOLS ──
    this.register({
      name: 'diagnostics.run',
      description: 'Run comprehensive self-diagnostics across 19+ ULTRON subsystems and return full health report',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 25000,
      validate: () => ({ valid: true }),
      executor: async () => diagnosticsService.runDiagnostics()
    })

    this.register({
      name: 'diagnostics.getLatest',
      description: 'Get the most recent diagnostics health check report without re-running all checks',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => diagnosticsService.getLatestReport()
    })

    // ── ASYNC TASK ENGINE TOOLS ──
    this.register({
      name: 'tasks.list',
      description: 'List background tasks from persistent memory database with optional status filter',
      category: 'BACKGROUND_TASKS',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        filter: { type: 'object', description: 'Optional status or category filter', required: false }
      },
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async (args) => taskService.listTasks(args?.filter)
    })

    this.register({
      name: 'tasks.create',
      description: 'Spawn a managed background task',
      category: 'BACKGROUND_TASKS',
      riskLevel: 'LEVEL_2_CONFIRM',
      parameters: {
        title: { type: 'string', description: 'Task title', required: true },
        category: { type: 'string', description: 'Task category', required: true },
        description: { type: 'string', description: 'Detailed task description', required: false }
      },
      timeoutMs: 10000,
      validate: (args) => (args?.title ? { valid: true } : { valid: false, error: 'Title is required' }),
      executor: async (args) => taskService.createTask(args)
    })

    this.register({
      name: 'tasks.cancel',
      description: 'Cancel a running or paused background task via its ID',
      category: 'BACKGROUND_TASKS',
      riskLevel: 'LEVEL_2_CONFIRM',
      parameters: {
        id: { type: 'string', description: 'Task ID to cancel', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => (args?.id ? { valid: true } : { valid: false, error: 'Task ID is required' }),
      executor: async (args) => taskService.cancelTask(args.id)
    })

    this.register({
      name: 'tasks.pause',
      description: 'Pause a running background task',
      category: 'BACKGROUND_TASKS',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        id: { type: 'string', description: 'Task ID to pause', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => (args?.id ? { valid: true } : { valid: false, error: 'Task ID is required' }),
      executor: async (args) => taskService.pauseTask(args.id)
    })

    this.register({
      name: 'tasks.resume',
      description: 'Resume a paused background task',
      category: 'BACKGROUND_TASKS',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        id: { type: 'string', description: 'Task ID to resume', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => (args?.id ? { valid: true } : { valid: false, error: 'Task ID is required' }),
      executor: async (args) => taskService.resumeTask(args.id)
    })

    // ── WORKSPACE TOOLS ──
    this.register({
      name: 'workspace.getContext',
      description: 'Get active workspace project context, root path, file tree summary, and Git branch status',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => workspaceService.getContext()
    })

    this.register({
      name: 'workspace.switchProject',
      description: 'Switch active workspace project directory',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_2_CONFIRM',
      parameters: {
        path: { type: 'string', description: 'Absolute directory path to project', required: true }
      },
      timeoutMs: 8000,
      validate: (args) => (args?.path ? { valid: true } : { valid: false, error: 'Path is required' }),
      executor: async (args) => workspaceService.switchProject(args.path)
    })

    // ── V1.0.5: MISSION TOOLS ──
    this.register({
      name: 'missions.create',
      description: 'Create a new multi-step agent mission',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        title: { type: 'string', description: 'Mission goal title', required: true },
        description: { type: 'string', description: 'Mission description', required: true },
        steps: { type: 'array', description: 'Sequential mission steps', required: false }
      },
      timeoutMs: 5000,
      validate: (args) => (args?.title ? { valid: true } : { valid: false, error: 'Title is required' }),
      executor: async (args) => missionService.createMission(args)
    })

    this.register({
      name: 'missions.start',
      description: 'Start execution of a planned agent mission',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_2_CONFIRM',
      parameters: {
        id: { type: 'string', description: 'Mission ID to execute', required: true }
      },
      timeoutMs: 10000,
      validate: (args) => (args?.id ? { valid: true } : { valid: false, error: 'Mission ID is required' }),
      executor: async (args) => missionService.startMission(args.id)
    })

    this.register({
      name: 'missions.pause',
      description: 'Pause an active agent mission',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        id: { type: 'string', description: 'Mission ID to pause', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => (args?.id ? { valid: true } : { valid: false, error: 'Mission ID is required' }),
      executor: async (args) => missionService.pauseMission(args.id)
    })

    this.register({
      name: 'missions.cancel',
      description: 'Cancel an active agent mission',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        id: { type: 'string', description: 'Mission ID to cancel', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => (args?.id ? { valid: true } : { valid: false, error: 'Mission ID is required' }),
      executor: async (args) => missionService.cancelMission(args.id)
    })

    this.register({
      name: 'missions.list',
      description: 'List recent missions with execution status',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => missionService.listMissions()
    })

    // ── V1.0.5: MULTI-APP WORKFLOW TOOLS ──
    this.register({
      name: 'workflows.plan',
      description: 'Plan a structured multi-application workflow from a user goal',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        goal: { type: 'string', description: 'Multi-app goal description', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => (args?.goal ? { valid: true } : { valid: false, error: 'Goal is required' }),
      executor: async (args) => workflowService.planWorkflow(args.goal)
    })

    this.register({
      name: 'workflows.execute',
      description: 'Execute a planned multi-app workflow with step-by-step verification',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_2_CONFIRM',
      parameters: {
        id: { type: 'string', description: 'Workflow ID', required: true }
      },
      timeoutMs: 30000,
      validate: (args) => (args?.id ? { valid: true } : { valid: false, error: 'Workflow ID is required' }),
      executor: async (args) => workflowService.executeWorkflow(args.id)
    })

    // ── V1.0.5: DOCUMENT INTELLIGENCE TOOLS ──
    this.register({
      name: 'documents.index',
      description: 'Index a local document, PDF, Markdown, or source code file for intelligent analysis',
      category: 'RESEARCH',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        filePath: { type: 'string', description: 'Absolute path to document', required: true }
      },
      timeoutMs: 15000,
      validate: (args) => (args?.filePath ? { valid: true } : { valid: false, error: 'File path is required' }),
      executor: async (args) => documentService.indexDocument(args.filePath)
    })

    this.register({
      name: 'documents.query',
      description: 'Query indexed documents and receive grounded answers with citations',
      category: 'RESEARCH',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        query: { type: 'string', description: 'Question or search phrase', required: true },
        docId: { type: 'string', description: 'Specific document ID to query', required: false }
      },
      timeoutMs: 25000,
      validate: (args) => (args?.query ? { valid: true } : { valid: false, error: 'Query is required' }),
      executor: async (args) => documentService.queryDocuments(args.query, args.docId)
    })

    // ── V1.0.5: RECOVERY & UNDO TOOLS ──
    this.register({
      name: 'recovery.undo',
      description: 'Undo what you just did by rolling back the last reversible file or configuration action',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_2_CONFIRM',
      parameters: {
        actionId: { type: 'string', description: 'Specific action ID to undo', required: false }
      },
      timeoutMs: 10000,
      validate: () => ({ valid: true }),
      executor: async (args) => recoveryService.undo(args?.actionId)
    })

    this.register({
      name: 'recovery.redo',
      description: 'Redo a previously rolled-back action',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_2_CONFIRM',
      parameters: {
        actionId: { type: 'string', description: 'Specific action ID to redo', required: false }
      },
      timeoutMs: 10000,
      validate: () => ({ valid: true }),
      executor: async (args) => recoveryService.redo(args?.actionId)
    })

    // ── V1.0.5: PREFERENCE TOOLS ──
    this.register({
      name: 'preferences.get',
      description: 'Retrieve stored user preference',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        key: { type: 'string', description: 'Preference key', required: true }
      },
      timeoutMs: 3000,
      validate: (args) => (args?.key ? { valid: true } : { valid: false, error: 'Key is required' }),
      executor: async (args) => ({ key: args.key, value: preferenceService.get(args.key) })
    })

    this.register({
      name: 'preferences.set',
      description: 'Set a personal user preference (e.g. preferred model, response style, workspace)',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        key: { type: 'string', description: 'Preference key', required: true },
        value: { type: 'any', description: 'Preference value', required: true },
        category: { type: 'string', description: 'Category', required: false }
      },
      timeoutMs: 3000,
      validate: (args) => (args?.key && args?.value !== undefined ? { valid: true } : { valid: false, error: 'Key and value are required' }),
      executor: async (args) => preferenceService.set(args.key, args.value, args.category)
    })

    // ── V1.0.5: NETWORK AWARENESS ──
    this.register({
      name: 'network.getStatus',
      description: 'Get real local network connection state, active interface, local IP, gateway, and DNS',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 8000,
      validate: () => ({ valid: true }),
      executor: async () => networkService.getStatus()
    })

    // ── V1.0.5: SAFE REPAIR ──
    this.register({
      name: 'repair.execute',
      description: 'Execute a verified one-click safe local repair for a detected diagnostic failure',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_2_CONFIRM',
      parameters: {
        repairId: { type: 'string', description: 'Repair action ID', required: true }
      },
      timeoutMs: 15000,
      validate: (args) => (args?.repairId ? { valid: true } : { valid: false, error: 'Repair ID is required' }),
      executor: async (args) => repairService.executeRepair(args.repairId)
    })

    // ── V1.0.5: SCREEN MEMORY CLEAR ──
    this.register({
      name: 'screen.forgetContext',
      description: 'Discard and forget all temporary task-scoped screen memory context',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 3000,
      validate: () => ({ valid: true }),
      executor: async () => ({ success: screenService.forgetScreenContext(), message: 'Screen context discarded.' })
    })

    // ── V1.0.6: GOAL MEMORY TOOLS ──
    this.register({
      name: 'goals.create',
      description: 'Create a new persistent long-running user goal',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        title: { type: 'string', description: 'Goal title', required: true },
        project: { type: 'string', description: 'Project name', required: true }
      },
      timeoutMs: 3000,
      validate: (args) => (args?.title && args?.project ? { valid: true } : { valid: false, error: 'Title and project are required' }),
      executor: async (args) => goalMemoryService.createGoal(args.title, args.project, args.metadata)
    })

    this.register({
      name: 'goals.list',
      description: 'List active and historical user goals',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        project: { type: 'string', description: 'Optional project filter', required: false }
      },
      timeoutMs: 3000,
      validate: () => ({ valid: true }),
      executor: async (args) => goalMemoryService.listGoals(args?.project)
    })

    this.register({
      name: 'goals.updateStatus',
      description: 'Update the status of an ongoing goal (ACTIVE, PAUSED, COMPLETED, CANCELLED, ARCHIVED)',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        id: { type: 'string', description: 'Goal ID', required: true },
        status: { type: 'string', description: 'New status', required: true }
      },
      timeoutMs: 3000,
      validate: (args) => (args?.id && args?.status ? { valid: true } : { valid: false, error: 'ID and status are required' }),
      executor: async (args) => ({ success: goalMemoryService.updateGoalStatus(args.id, args.status) })
    })

    // ── V1.0.6: WINDOW MANAGEMENT TOOLS ──
    this.register({
      name: 'windows.focus',
      description: 'Bring a specific application window to the foreground',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        appName: { type: 'string', description: 'Application name or process pattern', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => (args?.appName ? { valid: true } : { valid: false, error: 'appName is required' }),
      executor: async (args) => windowManagerService.focusApplication(args.appName)
    })

    this.register({
      name: 'windows.list',
      description: 'List all currently running desktop application windows',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 5000,
      validate: () => ({ valid: true }),
      executor: async () => windowManagerService.listWindows()
    })

    // ── V1.0.6: PLUGIN TOOLS ──
    this.register({
      name: 'plugins.list',
      description: 'List installed plugins and their trust/permission states',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 3000,
      validate: () => ({ valid: true }),
      executor: async () => pluginService.listPlugins()
    })

    // ── V1.0.6: PROJECT INTELLIGENCE TOOLS ──
    this.register({
      name: 'project.getHistory',
      description: 'Get project timeline history including Git commits, build events, and architecture decisions',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        projectName: { type: 'string', description: 'Project name', required: true },
        workspacePath: { type: 'string', description: 'Workspace path', required: false }
      },
      timeoutMs: 8000,
      validate: (args) => (args?.projectName ? { valid: true } : { valid: false, error: 'projectName is required' }),
      executor: async (args) => projectIntelligenceService.getProjectHistory(args.projectName, args.workspacePath || '')
    })

    this.register({
      name: 'project.recordDecision',
      description: 'Record an architectural or technical decision for a project',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        projectName: { type: 'string', description: 'Project name', required: true },
        title: { type: 'string', description: 'Decision title', required: true },
        context: { type: 'string', description: 'Context', required: true },
        decision: { type: 'string', description: 'Decision taken', required: true },
        rationale: { type: 'string', description: 'Rationale', required: true }
      },
      timeoutMs: 3000,
      validate: (args) => (args?.projectName && args?.title && args?.decision ? { valid: true } : { valid: false, error: 'Missing required decision fields' }),
      executor: async (args) => projectIntelligenceService.recordDecision(args.projectName, args.title, args.context, args.decision, args.rationale)
    })

    // ── V1.0.6: PRODUCTIVITY TOOLS ──
    this.register({
      name: 'productivity.getSummary',
      description: 'Get local productivity metrics summary and task statistics',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {},
      timeoutMs: 3000,
      validate: () => ({ valid: true }),
      executor: async () => productivityService.getSummary()
    })

    // ── V1.0.6: CREDENTIAL VAULT TOOLS ──
    this.register({
      name: 'credentials.test',
      description: 'Test connectivity of a configured credential in the DPAPI vault without exposing secrets',
      category: 'SYSTEM',
      riskLevel: 'LEVEL_1_SAFE',
      parameters: {
        id: { type: 'string', description: 'Credential ID', required: true }
      },
      timeoutMs: 5000,
      validate: (args) => (args?.id ? { valid: true } : { valid: false, error: 'Credential ID is required' }),
      executor: async (args) => credentialVaultService.testCredential(args.id)
    })
  }
}

export const toolsRegistry = new ToolsRegistry()
