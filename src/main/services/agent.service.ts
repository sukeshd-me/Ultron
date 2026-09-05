// src/main/services/agent.service.ts — Unified Computer Agent Loop & Hybrid Action Engine
import { toolsRegistry } from './tools.registry'
import { modelService } from './model.service'
import { memoryService } from './memory.service'
import { taskService } from './task.service'
import {
  AgentPlan,
  StructuredToolCall,
  ToolExecutionResult,
  AgentTelemetryBreakdown,
  AgentExecutionOutput
} from '../../shared/tools/tool.types'
import { ConcurrentTask, TaskExecutionReport } from '../../shared/types'
import { OfflineCapabilityRouter } from './providers/model.provider'
import * as path from 'path'
import * as fs from 'fs'

export class AgentService {
  private lastCreatedFolder: string | null = null
  private lastCreatedFile: string | null = null

  /**
   * Normalize user input:
   * 1. Unstick fused words like "opencalculator" -> "open calculator"
   * 2. Unstick fused query prefixes like "showcpu" -> "show cpu"
   */
  normalizeInput(raw: string): string {
    let s = raw.trim()

    // Unstick fused "open" + app name
    s = s.replace(
      /\bopen(calculator|calc|notepad|chrome|explorer|settings|vscode|taskmanager|terminal|paint|spotify|edge|word|excel|powerpoint|vlc|steam|control|devmgmt)\b/gi,
      'open $1 '
    )

    // Unstick fused query prefixes
    s = s.replace(
      /\b(show|get|check)(cpu|memory|ram|disk|wifi|ip|ports|firewall|defender|brightness|battery|gpu)\b/gi,
      '$1 $2'
    )

    return s.replace(/\s+/g, ' ').trim()
  }

  /**
   * Determine if request is a fast-track local Windows operation
   * (e.g. "what time is it", "show cpu", "open calculator", "create folder")
   */
  isLocalOnlyRequest(lower: string): boolean {
    // Pure local telemetry
    if (lower.includes('what time') || lower.includes("what's the time") || lower.includes('current time') || lower === 'time') return true
    if (lower.includes('today') && lower.includes('date') || lower === 'date') return true
    if (lower.includes('show cpu') || lower.includes('cpu usage') || lower === 'cpu') return true
    if (lower.includes('show memory') || lower.includes('ram usage') || lower === 'memory' || lower === 'ram') return true
    if (lower.includes('disk usage') || lower.includes('disk space')) return true
    if (lower.includes('running processes') || lower.includes('process list')) return true

    // Pure local apps
    if (lower.startsWith('open ') || lower.startsWith('launch ') || lower.startsWith('start ')) {
      const target = lower.replace(/^(open|launch|start)\s+/i, '').trim()
      const knownLocal = ['calculator', 'calc', 'notepad', 'chrome', 'explorer', 'file explorer', 'settings', 'windows settings', 'vscode', 'task manager', 'terminal']
      if (knownLocal.some(k => target.includes(k))) return true
    }

    // Pure local filesystem
    if (lower.includes('create a folder') || lower.includes('create folder') || lower.includes('create a file') || lower.includes('create file')) return true
    if (lower.startsWith('read ') || lower.startsWith('copy ') || lower.startsWith('move ') || lower.startsWith('find ') || lower.startsWith('delete ')) return true

    // Pure local network
    if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('network adapters') || lower.includes('my ip') || lower.includes('ip address')) return true

    // Android ADB phone control (STRICTLY ADB ONLY)
    if (
      lower.includes('connect my phone') ||
      lower.includes('connect phone') ||
      lower.includes('my phone') ||
      (lower.includes('phone') && (lower.includes('connect') || lower.includes('status') || lower.includes('battery') || lower.includes('devices') || lower.includes('adb'))) ||
      lower.includes('adb')
    ) {
      return true
    }

    // Android app control via voice (v1.0.2)
    if (
      (lower.includes('on my phone') || lower.includes('on phone') || lower.includes('on android')) &&
      (lower.startsWith('open ') || lower.startsWith('launch ') || lower.startsWith('start '))
    ) {
      return true
    }

    // Call control via voice (v1.0.2)
    if (lower.startsWith('call ') || lower.startsWith('dial ') || lower.startsWith('ring ')) return true
    if (lower === 'end call' || lower === 'hang up' || lower.includes('end call') || lower.includes('hang up')) return true
    if (lower.includes('mute call') || lower === 'mute' || lower === 'unmute' || lower.includes('unmute')) return true
    if (lower.includes('phone state') || lower.includes('call state') || lower.includes('call status')) return true

    // Windows settings
    if (lower.includes('windows settings') || lower.includes('bluetooth settings') || lower.includes('network settings')) return true

    return false
  }

  /**
   * The Master UNIFIED AGENT LOOP
   */
  async executeAgentLoop(
    rawUserInput: string,
    history: Array<{ role: string; content: string }> = []
  ): Promise<AgentExecutionOutput & { report?: TaskExecutionReport; handled: boolean }> {
    const overallStart = performance.now()

    // ────────────────────────────────────────────────────────────────
    // STEP 1: INTENT UNDERSTANDING & NORMALIZATION
    // ────────────────────────────────────────────────────────────────
    const understandStart = performance.now()
    const normalizedInput = this.normalizeInput(rawUserInput)
    const lowerInput = normalizedInput.toLowerCase()
    const understandingMs = parseFloat((performance.now() - understandStart).toFixed(2))

    // ────────────────────────────────────────────────────────────────
    // STEP 2: CONTEXT & SELECTIVE MEMORY RETRIEVAL
    // ────────────────────────────────────────────────────────────────
    const memStart = performance.now()
    let memoryContext = ''
    try {
      memoryContext = await memoryService.getRelevantContext(normalizedInput)
    } catch {}
    const memoryMs = parseFloat((performance.now() - memStart).toFixed(2))

    // ────────────────────────────────────────────────────────────────
    // STEP 3: PLANNING (HYBRID ONLINE / OFFLINE)
    // ────────────────────────────────────────────────────────────────
    const planStart = performance.now()
    let agentPlan: AgentPlan

    // Intelligent fast-track: If purely local PC command, execute immediately without cloud round-trip
    const isPureLocal = this.isLocalOnlyRequest(lowerInput)
    const providerStatus = await modelService.getProviderStatus()

    if (isPureLocal || providerStatus.mode === 'OFFLINE' || !providerStatus.online) {
      // Use deterministic OfflineCapabilityRouter
      const router = new OfflineCapabilityRouter()
      agentPlan = await router.plan(normalizedInput)
    } else {
      // Use active configured AI model (Cloud or Local)
      try {
        const planned = await modelService.plan(
          normalizedInput,
          history,
          memoryContext,
          toolsRegistry.getNames()
        )
        agentPlan = planned.plan
      } catch (err: any) {
        console.warn('[AgentService] Model planning fallback:', err.message)
        const router = new OfflineCapabilityRouter()
        agentPlan = await router.plan(normalizedInput)
      }
    }
    const planningMs = parseFloat((performance.now() - planStart).toFixed(2))

    // If clarification needed
    if (agentPlan.needsClarification) {
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))
      return {
        handled: true,
        plan: agentPlan,
        telemetry: {
          understandingMs,
          planningMs,
          memoryMs,
          toolExecutionMs: 0,
          verificationMs: 0,
          responseMs: 0,
          totalMs,
          tools: []
        },
        results: [],
        naturalResponse: agentPlan.clarificationQuestion || 'Could you please clarify your request?',
        success: true
      }
    }

    // If no tools required
    if (!agentPlan.plan || agentPlan.plan.length === 0) {
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))
      return {
        handled: Boolean(agentPlan.directResponse),
        plan: agentPlan,
        telemetry: {
          understandingMs,
          planningMs,
          memoryMs,
          toolExecutionMs: 0,
          verificationMs: 0,
          responseMs: 0,
          totalMs,
          tools: []
        },
        results: [],
        naturalResponse: agentPlan.directResponse || 'I am ready. How can I help you control Windows today?',
        success: true
      }
    }

    // ────────────────────────────────────────────────────────────────
    // STEP 4: VALIDATION, SAFETY CHECK & EXECUTION
    // ────────────────────────────────────────────────────────────────
    const toolExecStart = performance.now()
    const concurrentTasks: ConcurrentTask[] = agentPlan.plan.map((call, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      name: this.formatTaskName(call),
      category: this.mapToolCategory(call.tool),
      status: 'PENDING',
      durationMs: 0
    }))

    // Register with task service for UI streaming
    taskService.addTaskBatch(concurrentTasks)

    // Check if tasks have ordering dependencies (e.g. create folder -> create file in folder)
    const hasDependencies = agentPlan.plan.some((c, idx) => {
      if (idx === 0) return false
      return c.tool.startsWith('filesystem.') && agentPlan.plan[idx - 1].tool.startsWith('filesystem.')
    })

    const toolResults: ToolExecutionResult[] = []

    if (hasDependencies) {
      // Sequential execution
      for (let i = 0; i < agentPlan.plan.length; i++) {
        const call = agentPlan.plan[i]
        const taskId = concurrentTasks[i].id
        taskService.updateTask(taskId, { status: 'RUNNING' })
        const res = await toolsRegistry.execute(call.tool, call.arguments)
        toolResults.push(res)
        taskService.updateTask(taskId, {
          status: res.success ? 'COMPLETED' : 'FAILED',
          durationMs: res.durationMs,
          result: res.data,
          error: res.error
        })
        if (!res.success && call.tool.includes('createDirectory')) {
          break // Don't proceed if folder creation failed
        }
      }
    } else {
      // Parallel Execution for independent safe actions
      const promises = agentPlan.plan.map(async (call, i) => {
        const taskId = concurrentTasks[i].id
        taskService.updateTask(taskId, { status: 'RUNNING' })
        const res = await toolsRegistry.execute(call.tool, call.arguments)
        taskService.updateTask(taskId, {
          status: res.success ? 'COMPLETED' : 'FAILED',
          durationMs: res.durationMs,
          result: res.data,
          error: res.error
        })
        return res
      })

      const executed = await Promise.all(promises)
      toolResults.push(...executed)
    }

    const toolExecutionMs = parseFloat((performance.now() - toolExecStart).toFixed(2))

    // ────────────────────────────────────────────────────────────────
    // STEP 5: OS VERIFICATION
    // ────────────────────────────────────────────────────────────────
    const verifyStart = performance.now()
    const allSucceeded = toolResults.every((r) => r.success)
    const verificationMs = parseFloat((performance.now() - verifyStart).toFixed(2))

    // ────────────────────────────────────────────────────────────────
    // STEP 6: NATURAL LANGUAGE RESPONSE SYNTHESIS
    // ────────────────────────────────────────────────────────────────
    const respStart = performance.now()
    const naturalResponse = this.synthesizeResponse(agentPlan.plan, toolResults, toolExecutionMs)
    const responseMs = parseFloat((performance.now() - respStart).toFixed(2))

    const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

    const telemetry: AgentTelemetryBreakdown = {
      understandingMs,
      planningMs,
      memoryMs,
      toolExecutionMs,
      verificationMs,
      responseMs,
      totalMs,
      tools: toolResults
    }

    const report: TaskExecutionReport = {
      totalTasks: concurrentTasks.length,
      completedTasks: toolResults.filter((r) => r.success).length,
      failedTasks: toolResults.filter((r) => !r.success).length,
      totalDurationMs: toolExecutionMs,
      tasks: concurrentTasks.map((t, idx) => ({
        ...t,
        durationMs: toolResults[idx]?.durationMs ?? 0,
        status: toolResults[idx]?.success ? 'COMPLETED' : 'FAILED',
        error: toolResults[idx]?.error
      }))
    }

    // ────────────────────────────────────────────────────────────────
    // STEP 7: MEMORY UPDATE (SELECTIVE PERSISTENCE)
    // ────────────────────────────────────────────────────────────────
    if (allSucceeded) {
      memoryService.saveMemory({
        category: 'task',
        content: `Executed ${agentPlan.plan.map((c) => c.tool).join(', ')} in ${totalMs}ms`,
        metadata: {
          prompt: rawUserInput,
          tools: agentPlan.plan.map((c) => c.tool),
          totalMs
        }
      }).catch(() => {})
    }

    return {
      handled: true,
      plan: agentPlan,
      telemetry,
      results: toolResults,
      naturalResponse,
      success: allSucceeded,
      report
    }
  }

  /**
   * Synthesize cohesive response from executed tool results
   */
  private synthesizeResponse(
    calls: StructuredToolCall[],
    results: ToolExecutionResult[],
    wallTimeMs: number
  ): string {
    const isCompound = results.length > 1

    if (isCompound) {
      let output = ''
      results.forEach((r, idx) => {
        const call = calls[idx]
        const icon = r.success ? '✓' : '❌'
        const desc = this.formatResultLine(call, r)
        output += `${icon} ${desc} — \`${r.durationMs}ms\`\n`
      })

      output += `\n**Total wall time: \`${wallTimeMs}ms\`**\n\n---\n\n`

      results.forEach((r, idx) => {
        const call = calls[idx]
        output += `${idx + 1}. ${this.formatDetailedResult(call, r)}\n\n`
      })

      return output.trim()
    }

    // Single result
    const r = results[0]
    const call = calls[0]
    return this.formatDetailedResult(call, r)
  }

  private formatResultLine(call: StructuredToolCall, r: ToolExecutionResult): string {
    if (!r.success) return `${call.tool} failed: ${r.error || 'Execution error'}`
    const d = r.data

    switch (call.tool) {
      case 'apps.open':
        return `Opened ${call.arguments.app || 'Application'}`
      case 'system.getTime':
        return `Current Time: ${d?.time || 'Verified'}`
      case 'system.getDate':
        return `Today's Date: ${d?.date || 'Verified'}`
      case 'system.getCpu':
        return `CPU Load: ${d?.loadPercentage ?? d?.load ?? 'Active'}%`
      case 'system.getMemory':
        return `RAM Usage: ${d?.usedPercent ?? d?.load ?? 'Active'}%`
      case 'system.getDisk':
        return `Disk Space: ${d?.freeGB ?? 'Verified'} GB Free`
      case 'system.getProcesses':
        return `Active Processes (${d?.count || 'Top'})`
      case 'filesystem.createDirectory':
        return `Folder created: ${path.basename(call.arguments.path)}`
      case 'filesystem.createFile':
        return `File created: ${path.basename(call.arguments.path)}`
      case 'filesystem.read':
        return `File read: ${path.basename(call.arguments.path)}`
      case 'filesystem.copy':
        return `Copied to ${path.basename(call.arguments.destination)}`
      case 'filesystem.move':
        return `Moved to ${path.basename(call.arguments.destination)}`
      case 'filesystem.delete':
        return `Deleted ${path.basename(call.arguments.path)}`
      case 'filesystem.search':
        return `Found ${d?.totalMatches ?? 0} matches`
      case 'network.getWifiStatus':
        return `Wi-Fi: ${d?.state?.toUpperCase() ?? 'Connected'} (${d?.ssid || 'SSID'})`
      case 'network.getIp':
        return `IP Address: ${d?.primaryIP || 'Configured'}`
      case 'network.getAdapters':
        return `Adapters: ${d?.count ?? 'Active'}`
      case 'settings.open':
        return `Windows Settings (${call.arguments.page || 'System'})`
      case 'research.youtube':
        return `YouTube Search for '${call.arguments.query}'`
      case 'research.search':
        return `Web Search for '${call.arguments.query}'`
      case 'adb.connect':
        return d?.connected
          ? `Connected to ${d?.device?.manufacturer || 'Android'} ${d?.device?.model || 'Phone'} via ADB`
          : (d?.message || 'ADB Phone Connection Attempted')
      case 'adb.getDevices':
        return `ADB Devices (${Array.isArray(d?.devices) ? d.devices.length : 0} detected)`
      case 'adb.makeCall':
        return `Calling ${call.arguments.phoneNumber} via Android ADB`
      case 'adb.sendMessage':
        return `SMS Sent to ${call.arguments.phoneNumber} via Android ADB`
      default:
        return `${call.tool} completed`
    }
  }

  private formatDetailedResult(call: StructuredToolCall, r: ToolExecutionResult): string {
    if (!r.success) {
      return `┌─ EXECUTION FAILED ─┐\nTool: \`${call.tool}\`\nDuration: \`${r.durationMs}ms\`\nError: ${r.error || 'Execution failure'}\n└────────────────────┘`
    }

    const d = r.data
    const dur = r.durationMs

    switch (call.tool) {
      case 'system.getTime':
        return `🕒 **Windows System Time**: **${d?.time}** (\`${dur}ms\`)`

      case 'system.getDate':
        return `📅 **Current Date**: **${d?.date}** (\`${dur}ms\`)`

      case 'system.getCpu':
        return `🖥️ **CPU Load**: **${d?.loadPercentage ?? d?.load ?? 'N/A'}%** (Cores: **${d?.cores || 8}**, Clock: \`${d?.clockSpeed || '3.2GHz'}\`)\n` +
          `• Processor: \`${d?.name || 'Processor'}\`\n` +
          `• Execution: \`${dur}ms\``

      case 'system.getMemory':
        return `🧠 **Physical RAM Utilization**: **${d?.usedPercent ?? d?.load ?? 'N/A'}%**\n` +
          `• Free: **${d?.freeGB ?? 'N/A'} GB** / Total: **${d?.totalGB ?? 'N/A'} GB**\n` +
          `• Execution: \`${dur}ms\``

      case 'system.getDisk':
        return `💾 **Disk Storage Breakdown**:\n` +
          (Array.isArray(d?.drives)
            ? d.drives.map((drv: any) => `• Drive \`${drv.drive}\`: **${drv.freeGB} GB free** of ${drv.totalGB} GB (${drv.percentFree}% free)`).join('\n')
            : `• Storage free: **${d?.freeGB} GB**`) +
          `\n• Execution: \`${dur}ms\``

      case 'system.getProcesses':
        return `⚡ **Top Windows Processes** (\`${dur}ms\`):\n` +
          (Array.isArray(d?.processes)
            ? d.processes.slice(0, 8).map((p: any) => `• \`${p.name}\` (PID: ${p.pid}, Memory: ${p.memoryMB} MB, CPU: ${p.cpu}%)`).join('\n')
            : '• Running processes active')

      case 'apps.open': {
        const appName = call.arguments.app || 'App'
        const pidStr = d?.pid ? ` (PID: ${d.pid})` : ''
        return `✓ Opened **${appName.toUpperCase()}**${pidStr}\nProcess spawn: \`${d?.duration_ms ?? dur}ms\`\nTotal: \`${dur}ms\``
      }

      case 'filesystem.createDirectory':
        return `📁 **Directory Created**: \`${d?.path || call.arguments.path}\` in \`${dur}ms\`.`

      case 'filesystem.createFile':
        return `📄 **File Created**: \`${d?.path || call.arguments.path}\` (${d?.size || 0} bytes) in \`${dur}ms\`.`

      case 'filesystem.read': {
        const content = d?.content || ''
        const preview = content.length > 400 ? `${content.slice(0, 400)}...` : content
        return `📄 **File Content** (\`${d?.path || call.arguments.path}\` in \`${dur}ms\`):\n\`\`\`\n${preview}\n\`\`\``
      }

      case 'filesystem.copy':
        return `📦 **File Copied**: Transferred to \`${d?.destination || call.arguments.destination}\` in \`${dur}ms\`.`

      case 'filesystem.move':
        return `🚚 **File Moved**: Relocated to \`${d?.destination || call.arguments.destination}\` in \`${dur}ms\`.`

      case 'filesystem.search':
        return `🔍 **File Search Results** (\`${dur}ms\`, ${d?.totalMatches || 0} matches):\n` +
          (Array.isArray(d?.matches)
            ? d.matches.slice(0, 5).map((m: any) => `• \`${m.path}\` (${(m.size / 1024).toFixed(1)} KB)`).join('\n')
            : '• No matches found.')

      case 'filesystem.delete':
        return `🗑️ **Filesystem Item Deleted**: Removed \`${d?.path || call.arguments.path}\` in \`${dur}ms\`.`

      case 'network.getWifiStatus':
        return `📶 **Wi-Fi Status**: **${d?.state?.toUpperCase() || 'ACTIVE'}**\n` +
          `• Connected SSID: **${d?.ssid || 'N/A'}**\n` +
          `• Signal: **${d?.signal || '100%'}**\n` +
          `• Interface: \`${d?.adapter || 'WLAN'}\` in \`${dur}ms\``

      case 'network.getIp':
        return `🌐 **Network IP Configuration** (\`${dur}ms\`):\n` +
          `• Primary IPv4: **${d?.primaryIP || 'N/A'}**\n` +
          (Array.isArray(d?.interfaces)
            ? d.interfaces.map((i: any) => `• \`${i.alias}\`: **${i.ip}**`).join('\n')
            : '')

      case 'network.getAdapters':
        return `🔌 **Network Adapters (${d?.count || 0})** in \`${dur}ms\`:\n` +
          (Array.isArray(d?.adapters)
            ? d.adapters.map((a: any) => `• **${a.Name}**: ${a.Status} (${a.LinkSpeed || 'N/A'})`).join('\n')
            : '')

      case 'settings.open':
        return `⚙️ **Windows Settings**: Launched **${d?.target || call.arguments.page}** in \`${dur}ms\`.`

      case 'research.youtube':
        return `🌐 **YouTube Search**: Launched search for \`${call.arguments.query}\` in \`${dur}ms\`.`

      case 'research.search':
        return `🌐 **Web Search**: Executed search query \`${call.arguments.query}\` in \`${dur}ms\`.`

      case 'adb.connect': {
        if (!d?.connected) {
          return `📱 **Android Phone Connection (ADB)** (\`${dur}ms\`):\n` +
            `• Status: **NOT CONNECTED**\n` +
            `• Details: ${d?.message || d?.error || 'No device detected via ADB.'}\n` +
            `• Guidance: Connect your phone via USB or enable Wireless ADB, and ensure USB Debugging is turned ON in Developer Options.`
        }
        const dev = d.device
        const batt = dev?.battery
        const battStr = batt ? `• Battery: **${batt.level}%** (${batt.charging ? '⚡ Charging' : 'On Battery'})\n` : ''
        return `📱 **Android Phone Connected via ADB** (\`${dur}ms\`):\n` +
          `• Device: **${dev?.manufacturer || ''} ${dev?.model || 'Android Phone'}** (\`${dev?.id || 'Connected'}\`)\n` +
          `• OS Version: **${dev?.androidVersion || 'Android'}**\n` +
          `• Connection: **${dev?.connectionType || 'USB'} (Authorized)**\n` +
          battStr +
          `• State: **Ready for Automation, Dialing & Messaging**`
      }

      case 'adb.getDevices': {
        const devices = d?.devices || []
        if (devices.length === 0) {
          return `📱 **Android Devices (ADB)** (\`${dur}ms\`):\n• No attached devices detected via ADB.`
        }
        return `📱 **Attached Android Devices (ADB)** (\`${dur}ms\`):\n` +
          devices.map((dev: any) =>
            `• **${dev.manufacturer} ${dev.model}** (\`${dev.id}\`) — State: **${dev.state}**, ${dev.androidVersion}, ${dev.connectionType}` +
            (dev.battery ? ` (Battery: ${dev.battery.level}%)` : '')
          ).join('\n')
      }

      case 'adb.makeCall':
        return `📞 **Android Phone Call Initiated** (\`${dur}ms\`):\n• Dialing: **${call.arguments.phoneNumber}** via ADB.`

      case 'adb.sendMessage':
        return `💬 **Android SMS Sent** (\`${dur}ms\`):\n• Recipient: **${call.arguments.phoneNumber}**\n• Message: \`${call.arguments.message}\``

      default:
        return `⚡ Tool **${call.tool}** completed successfully in \`${dur}ms\`.`
    }
  }

  private formatTaskName(call: StructuredToolCall): string {
    const parts = call.tool.split('.')
    const verb = parts[1] || parts[0]
    if (call.arguments?.app) return `Open ${call.arguments.app}`
    if (call.arguments?.path) return `${verb} ${path.basename(call.arguments.path)}`
    if (call.arguments?.query) return `Search '${call.arguments.query}'`
    if (call.tool === 'adb.connect') return 'Connect Phone via ADB'
    if (call.tool === 'adb.getDevices') return 'Query ADB Devices'
    if (call.tool === 'adb.makeCall') return `Call ${call.arguments.phoneNumber}`
    if (call.tool === 'adb.sendMessage') return `SMS ${call.arguments.phoneNumber}`
    return `${parts[0].toUpperCase()} ${verb}`
  }

  private mapToolCategory(toolName: string): ConcurrentTask['category'] {
    if (toolName.startsWith('system.')) return 'POWERSHELL'
    if (toolName.startsWith('apps.')) return 'APP'
    if (toolName.startsWith('filesystem.')) return 'FILESYSTEM'
    if (toolName.startsWith('network.')) return 'NETWORK'
    if (toolName.startsWith('security.')) return 'SECURITY'
    if (toolName.startsWith('settings.')) return 'APP'
    if (toolName.startsWith('research.')) return 'RESEARCH'
    if (toolName.startsWith('adb.')) return 'ADB'
    return 'POWERSHELL'
  }

  /**
   * Backward-compatible intent executor matching existing interface
   */
  async executeIntent(userInput: string): Promise<{
    handled: boolean
    response?: string
    toolResult?: any
    report?: TaskExecutionReport
    telemetry?: AgentTelemetryBreakdown
  }> {
    const res = await this.executeAgentLoop(userInput)
    return {
      handled: res.handled,
      response: res.naturalResponse,
      toolResult: res.results,
      report: res.report,
      telemetry: res.telemetry
    }
  }
}

export const agentService = new AgentService()