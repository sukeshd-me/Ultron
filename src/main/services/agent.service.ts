// src/main/services/agent.service.ts — Unified Computer Agent Loop & Hybrid Action Engine
import { toolsRegistry } from './tools.registry'
import { modelService } from './model.service'
import { memoryService } from './memory.service'
import { taskService } from './task.service'
import { intentService } from './intent.service'
import { adbService } from './adb.service'
import {
  AgentPlan,
  StructuredToolCall,
  ToolExecutionResult,
  AgentTelemetryBreakdown,
  AgentExecutionOutput
} from '../../shared/tools/tool.types'
import { ConcurrentTask, TaskExecutionReport, ConfirmationCard } from '../../shared/types'
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
    return intentService.normalizeInput(raw)
  }

  /**
   * Determine if request is a fast-track local operation
   * (e.g. "what time is it", "show cpu", "turn off my phone", "open YouTube on my phone")
   */
  isLocalOnlyRequest(lower: string): boolean {
    const resolved = intentService.resolve(lower)
    if (resolved.detected_intent !== 'unknown') {
      return true
    }

    // Explicit phone & hardware markers
    if (
      lower.includes('my phone') ||
      lower.includes('phone') ||
      lower.includes('android') ||
      lower.includes('adb') ||
      lower.startsWith('call ') ||
      lower.startsWith('dial ') ||
      lower.startsWith('ring ') ||
      lower.includes('end call') ||
      lower.includes('hang up') ||
      lower.includes('mute call') ||
      lower.includes('hold call') ||
      lower.includes('battery')
    ) {
      return true
    }

    // Windows & System markers
    if (
      lower.includes('cpu') ||
      lower.includes('ram') ||
      lower.includes('memory') ||
      lower.includes('disk') ||
      lower.includes('wifi') ||
      lower.includes('time') ||
      lower.includes('date') ||
      lower.startsWith('open ') ||
      lower.startsWith('launch ') ||
      lower.startsWith('start ')
    ) {
      return true
    }

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
    // ────────────────────────────────────────────────────────────────
    // STEP 1: INTENT UNDERSTANDING & NORMALIZATION
    // ────────────────────────────────────────────────────────────────
    const understandStart = performance.now()
    const detectedIntent = intentService.resolve(rawUserInput)
    const normalizedInput = detectedIntent.normalized_input || this.normalizeInput(rawUserInput)
    const lowerInput = normalizedInput.toLowerCase()
    const understandingMs = parseFloat((performance.now() - understandStart).toFixed(2))

    // Determine fast-track routing & mode
    const isPureLocal = this.isLocalOnlyRequest(lowerInput)
    const providerStatus = await modelService.getProviderStatus()
    const routingMode = (isPureLocal || providerStatus.mode === 'OFFLINE' || !providerStatus.online) ? 'offline' : 'online'

    // Requirement 11: DEBUG TELEMETRY
    console.log('--- ULTRON AGENT TELEMETRY ---')
    console.log('INPUT:', `"${rawUserInput}"`)
    console.log('NORMALIZED:', `"${normalizedInput}"`)
    console.log('TARGET:', detectedIntent.detected_target)
    console.log('INTENT:', detectedIntent.detected_intent)
    console.log('MODE:', routingMode)
    console.log('CONFIDENCE:', detectedIntent.confidence)
    console.log('TOOL:', detectedIntent.tool || 'none')
    console.log('STATUS:', detectedIntent.requiresConfirmation ? 'confirmation_required' : (detectedIntent.tool ? 'ready' : 'fallback'))
    console.log('------------------------------')

    // ────────────────────────────────────────────────────────────────
    // STEP 1.5: CONFIRMATION & SAFETY GATES
    // ────────────────────────────────────────────────────────────────
    let agentPlan: AgentPlan | null = null

    // Check if user is confirming or cancelling an active pending confirmation (e.g. user says "yes" / "no")
    if (detectedIntent.detected_intent === 'system.confirm_action') {
      const pending = intentService.getPendingConfirmation(detectedIntent.args.confirmationId)
      if (pending) {
        intentService.removePendingConfirmation(pending.id)
        agentPlan = {
          thought: `Confirmed pending action: ${pending.intent}`,
          plan: [{ tool: pending.tool, arguments: pending.args }],
          needsClarification: false
        }
      }
    } else if (detectedIntent.detected_intent === 'system.cancel_action') {
      const pending = intentService.getPendingConfirmation(detectedIntent.args.confirmationId)
      if (pending) {
        intentService.removePendingConfirmation(pending.id)
        memoryService.saveMemory({
          category: 'action',
          content: `Intent: ${pending.intent} - Cancelled by user`,
          metadata: {
            intent: pending.intent,
            source: 'chat',
            status: 'cancelled',
            timestamp: Date.now(),
            duration_ms: 0
          }
        }).catch(() => {})
        return {
          handled: true,
          plan: { thought: 'Action cancelled by user', plan: [] },
          telemetry: {
            understandingMs,
            planningMs: 0,
            memoryMs: 0,
            toolExecutionMs: 0,
            verificationMs: 0,
            responseMs: 0,
            totalMs: parseFloat((performance.now() - overallStart).toFixed(2)),
            tools: []
          },
          results: [],
          naturalResponse: 'Action cancelled.',
          success: true
        }
      }
    }

    // Requirement 7: Power-Off & Consequential Action Safety Gate
    if (detectedIntent.requiresConfirmation && detectedIntent.tool) {
      const confirmId = `confirm-${Date.now()}`
      intentService.setPendingConfirmation(confirmId, {
        id: confirmId,
        intent: detectedIntent.detected_intent,
        target: detectedIntent.detected_target,
        action: detectedIntent.detected_intent.split('.')[1] || 'action',
        tool: detectedIntent.tool,
        args: detectedIntent.args,
        createdAt: Date.now()
      })

      const confirmationCard: ConfirmationCard = {
        id: confirmId,
        action: detectedIntent.detected_intent.split('.')[1] || 'action',
        target: detectedIntent.detected_target,
        risk: 'high',
        description: detectedIntent.confirmationPrompt || 'Do you want me to proceed with this action?',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel'
      }

      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

      // Requirement 12: MEMORY
      memoryService.saveMemory({
        category: 'action',
        content: `Intent: ${detectedIntent.detected_intent} - Confirmation required`,
        metadata: {
          intent: detectedIntent.detected_intent,
          source: 'chat',
          status: 'confirmation_required',
          timestamp: Date.now(),
          duration_ms: totalMs
        }
      }).catch(() => {})

      return {
        handled: true,
        plan: {
          thought: `Action requires user confirmation: ${detectedIntent.detected_intent}`,
          plan: [{ tool: detectedIntent.tool, arguments: detectedIntent.args }],
          directResponse: detectedIntent.confirmationPrompt || 'Do you want me to proceed?'
        },
        telemetry: {
          understandingMs,
          planningMs: 0,
          memoryMs: 0,
          toolExecutionMs: 0,
          verificationMs: 0,
          responseMs: 0,
          totalMs,
          tools: []
        },
        results: [],
        confirmationCard,
        naturalResponse: detectedIntent.confirmationPrompt || 'Do you want me to turn off your phone?',
        success: true
      }
    }

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

    if (!agentPlan) {
      if (detectedIntent.detected_intent !== 'unknown' && detectedIntent.tool) {
        agentPlan = {
          thought: `Matched deterministic intent: ${detectedIntent.detected_intent} -> ${detectedIntent.tool} (confidence: ${detectedIntent.confidence})`,
          plan: [{ tool: detectedIntent.tool, arguments: detectedIntent.args }],
          needsClarification: false
        }
      } else if (isPureLocal || providerStatus.mode === 'OFFLINE' || !providerStatus.online) {
        const router = new OfflineCapabilityRouter()
        agentPlan = await router.plan(normalizedInput)
      } else {
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
    // STEP 4: VALIDATION, PRE-FLIGHT PHONE CHECK & EXECUTION
    // ────────────────────────────────────────────────────────────────
    // Pre-flight check for Android operations (Requirement 8)
    for (const call of agentPlan.plan) {
      if (call.tool.startsWith('android.') && call.tool !== 'android.connect') {
        const devicesRes = await adbService.getDevicesWithDetails().catch(() => ({ devices: [] }))
        if (!devicesRes.devices || devicesRes.devices.length === 0) {
          const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))
          const honestMessage = `No Android phone is connected. Please connect your phone via USB or Wi-Fi with USB debugging enabled in Developer Options.`

          memoryService.saveMemory({
            category: 'action',
            content: `Preflight failed: No Android phone connected for ${call.tool}`,
            metadata: {
              intent: detectedIntent.detected_intent || call.tool,
              source: 'chat',
              status: 'failed',
              timestamp: Date.now(),
              duration_ms: totalMs
            }
          }).catch(() => {})

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
              tools: [{
                tool: call.tool,
                category: 'ADB',
                success: false,
                durationMs: 0,
                error: 'No connected Android device detected via ADB.'
              }]
            },
            results: [{
              tool: call.tool,
              category: 'ADB',
              success: false,
              durationMs: 0,
              error: 'No connected Android device detected via ADB.'
            }],
            naturalResponse: honestMessage,
            success: false
          }
        }
      }
    }
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
      case 'android.openApp':
        return `Opened ${d?.appName || call.arguments.appName} on phone`
      case 'android.callContact':
        return `Calling ${d?.contact_reference || call.arguments.contactName}`
      case 'android.endCall':
        return `Call ended`
      case 'android.muteCall':
        return call.arguments?.mute ? 'Call muted' : 'Call unmuted'
      case 'android.holdCall':
        return 'Call hold request'
      case 'android.resumeCall':
        return 'Call resume request'
      case 'android.getBattery':
        return `Phone Battery: ${d?.level ?? 'N/A'}%`
      case 'android.powerOff':
        return 'Phone power off executed'
      case 'android.restart':
        return 'Phone restart executed'
      case 'android.lock':
        return 'Phone screen locked'
      case 'android.getPhoneState':
        return `Phone state: ${d?.state || 'Checked'}`
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

      case 'android.openApp':
        return `📱 **Android App Launched** (\`${dur}ms\`):\n• App: **${d?.appName || call.arguments.appName}**\n• Status: ${d?.message || 'Application opened on phone.'}`

      case 'android.callContact':
        return `📞 **Android Call Initiated** (\`${dur}ms\`):\n• Contact: **${d?.contact_reference || call.arguments.contactName}**\n• Status: ${d?.message || 'Dialing on phone.'}`

      case 'android.endCall':
        return `📞 **Call Ended** (\`${dur}ms\`):\n• Status: ${d?.message || 'Active phone call terminated.'}`

      case 'android.muteCall':
        return `🎤 **Microphone State** (\`${dur}ms\`):\n• Status: ${d?.message || (call.arguments.mute ? 'Call muted.' : 'Call unmuted.')}`

      case 'android.holdCall':
        return `⏸️ **Call Hold** (\`${dur}ms\`):\n• Status: ${d?.message || 'Call hold updated.'}`

      case 'android.resumeCall':
        return `▶️ **Call Resumed** (\`${dur}ms\`):\n• Status: ${d?.message || 'Call resumed.'}`

      case 'android.getBattery':
        return `🔋 **Android Battery Telemetry** (\`${dur}ms\`):\n• Charge: **${d?.level ?? 'N/A'}%** (${d?.charging ? '⚡ Charging' : 'On Battery'})\n• Status: **${d?.status || 'Active'}**`

      case 'android.powerOff':
        return `🔌 **Android Device Power Off** (\`${dur}ms\`):\n• Status: ${d?.message || 'Phone power-down sequence executed.'}`

      case 'android.restart':
        return `🔄 **Android Device Reboot** (\`${dur}ms\`):\n• Status: ${d?.message || 'Phone reboot sequence executed.'}`

      case 'android.lock':
        return `🔒 **Android Device Locked** (\`${dur}ms\`):\n• Status: Phone screen locked.`

      case 'android.getPhoneState':
        return `📱 **Phone Hardware State** (\`${dur}ms\`):\n• State: **${d?.state}**\n• Call State: **${d?.callState}**\n• Screen: **${d?.screenOn ? 'ON' : 'OFF'}**`

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
    if (call.tool === 'android.openApp') return `Open ${call.arguments.appName} on Phone`
    if (call.tool === 'android.callContact') return `Call ${call.arguments.contactName}`
    if (call.tool === 'android.endCall') return 'End Active Call'
    if (call.tool === 'android.muteCall') return call.arguments?.mute ? 'Mute Call' : 'Unmute Call'
    if (call.tool === 'android.holdCall') return 'Hold Call'
    if (call.tool === 'android.resumeCall') return 'Resume Call'
    if (call.tool === 'android.getBattery') return 'Check Phone Battery'
    if (call.tool === 'android.powerOff') return 'Power Off Phone'
    if (call.tool === 'android.restart') return 'Restart Phone'
    if (call.tool === 'android.lock') return 'Lock Phone Screen'
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
    if (toolName.startsWith('adb.') || toolName.startsWith('android.')) return 'ADB'
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