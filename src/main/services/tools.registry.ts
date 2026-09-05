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

        if (resolved.contacts.length === 0) {
          return {
            success: false,
            message: `I couldn't find a contact named "${args.contactName}". Please check the name and try again.`,
            duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
          }
        }

        if (!resolved.exact && resolved.contacts.length > 1) {
          const names = resolved.contacts.map((c) => c.name).join(', ')
          return {
            success: false,
            message: `I found multiple contacts matching "${args.contactName}": ${names}. Which one did you mean?`,
            contacts: resolved.contacts.map((c) => c.name),
            duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
          }
        }

        const contact = resolved.contacts[0]
        const callResult = await adbService.makeCall(contact.phone)
        const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))

        return {
          success: callResult.success,
          contact_reference: contact.name,
          message: callResult.success
            ? `Calling ${contact.name}...`
            : `Failed to initiate call to ${contact.name}.`,
          duration_ms
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
  }
}

export const toolsRegistry = new ToolsRegistry()
