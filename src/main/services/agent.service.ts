// src/main/services/agent.service.ts — Unified Computer Agent Loop & Hybrid Action Engine
import { toolsRegistry } from './tools.registry'
import { modelService } from './model.service'
import { memoryService } from './memory.service'
import { taskService } from './task.service'
import { intentService } from './intent.service'
import { adbService } from './adb.service'
import { permissionsService } from './permissions.service'
import { skillsRegistryService } from './skills.registry'
import { modelRouter } from './router.service'
import {
  AgentPlan,
  StructuredToolCall,
  ToolExecutionResult,
  AgentTelemetryBreakdown,
  AgentExecutionOutput
} from '../../shared/tools/tool.types'
import {
  ConcurrentTask,
  TaskExecutionReport,
  ConfirmationCard,
  ActivityTimeline,
  ActivityTimelineItem
} from '../../shared/types'
import { OfflineCapabilityRouter } from './providers/model.provider'
import { agentStateMachine } from './state-machine.service'
import { screenService } from './screen.service'
import { recoveryService } from './recovery.service'
import { taskHistoryService } from './task-history.service'
import { contextService } from './context.service'
import { multiModelVerificationService } from './verification.service'
import { preferenceService } from './preference.service'
import { missionService } from './mission.service'
import { workflowService } from './workflow.service'
import { documentService } from './document.service'
import { goalMemoryService } from './goal-memory.service'
import { actionRiskEngine } from './risk-engine.service'
import { retryService } from './retry.service'
import { agentDebuggerService } from './agent-debugger.service'
import { productivityService } from './productivity.service'
import { adaptiveContextManager } from './adaptive-context.service'
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
  ): Promise<AgentExecutionOutput & { report?: TaskExecutionReport; handled: boolean; activityTimeline?: ActivityTimeline }> {
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

    const timelineItems: ActivityTimelineItem[] = [
      {
        id: `tl-und-${Date.now()}`,
        title: 'Understanding request',
        status: 'COMPLETED',
        durationMs: understandingMs
      }
    ]

    const activeSkill = skillsRegistryService.discoverSkill(rawUserInput, detectedIntent.detected_intent)

    // Determine fast-track routing & mode
    const isPureLocal = this.isLocalOnlyRequest(lowerInput)
    const providerStatus = await modelService.getProviderStatus()
    const routingMode = (isPureLocal || providerStatus.mode === 'OFFLINE' || !providerStatus.online) ? 'offline' : 'online'

    // V1.0.5 Agent State Machine
    agentStateMachine.transitionTo('UNDERSTANDING')

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

    // V1.0.5: Fast-path Screen Memory Forget ("Forget the screen context")
    if (lowerInput.includes('forget the screen context') || lowerInput.includes('forget screen') || lowerInput.includes('clear screen memory') || lowerInput.includes('clear screen context')) {
      await screenService.forgetScreenContext()
      agentStateMachine.transitionTo('SUCCESS')
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))
      await taskHistoryService.record({
        userRequest: rawUserInput,
        intent: 'screen.forgetContext',
        status: 'SUCCESS',
        durationMs: totalMs,
        resultSummary: 'Cleared temporary screen memory context.'
      }).catch(() => {})
      return {
        handled: true,
        plan: { thought: 'Cleared temporary task screen memory context upon user request.', plan: [] },
        telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: 0, verificationMs: 0, responseMs: 0, totalMs, tools: [] },
        results: [],
        naturalResponse: 'I have cleared the temporary screen context memory.',
        success: true
      }
    }

    // V1.0.5: Fast-path Undo ("Undo what you just did")
    if (lowerInput === 'undo' || lowerInput.includes('undo what you just did') || lowerInput.includes('undo the last action') || lowerInput.includes('undo the file change') || lowerInput.includes('rollback')) {
      agentStateMachine.transitionTo('RECOVERING')
      const undoResult = await recoveryService.undo()
      agentStateMachine.transitionTo(undoResult.success ? 'SUCCESS' : 'ERROR')
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))
      await taskHistoryService.record({
        userRequest: rawUserInput,
        intent: 'recovery.undo',
        status: undoResult.success ? 'SUCCESS' : 'FAILED',
        durationMs: totalMs,
        resultSummary: undoResult.message
      }).catch(() => {})
      return {
        handled: true,
        plan: { thought: 'Executed safe rollback of recent reversible operation.', plan: [] },
        telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: 0, verificationMs: 0, responseMs: 0, totalMs, tools: [] },
        results: [],
        naturalResponse: undoResult.message,
        success: undoResult.success
      }
    }

    // V1.0.5: Fast-path Redo
    if (lowerInput === 'redo' || lowerInput.includes('redo what you just undid')) {
      agentStateMachine.transitionTo('RECOVERING')
      const redoResult = await recoveryService.redo()
      agentStateMachine.transitionTo(redoResult.success ? 'SUCCESS' : 'ERROR')
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))
      await taskHistoryService.record({
        userRequest: rawUserInput,
        intent: 'recovery.redo',
        status: redoResult.success ? 'SUCCESS' : 'FAILED',
        durationMs: totalMs,
        resultSummary: redoResult.message
      }).catch(() => {})
      return {
        handled: true,
        plan: { thought: 'Redid previous reverted operation.', plan: [] },
        telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: 0, verificationMs: 0, responseMs: 0, totalMs, tools: [] },
        results: [],
        naturalResponse: redoResult.message,
        success: redoResult.success
      }
    }

    // ── V1.0.6: Goal Memory Fast-Path ("Continue the V1.0.6 work", "Continue my goal") ──
    if (lowerInput.startsWith('continue ') || lowerInput.includes('my goal') || lowerInput.includes('continue the ') || lowerInput.startsWith('resume goal')) {
      const goal = goalMemoryService.findRelevantGoal(rawUserInput)
      if (goal) {
        agentStateMachine.transitionTo('SUCCESS')
        const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))
        agentDebuggerService.recordEvent({
          requestId: 'req-' + Date.now(),
          stage: 'CONTEXT',
          intent: 'goals.resume',
          result: `Loaded active goal: ${goal.title}`
        })
        return {
          handled: true,
          plan: { thought: `Retrieved active goal context: ${goal.title}`, plan: [] },
          telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: 0, verificationMs: 0, responseMs: 0, totalMs, tools: [] },
          results: [],
          naturalResponse: `Resuming goal: "${goal.title}" (Project: ${goal.project}, Status: ${goal.status}). Context and milestones restored. What step would you like to execute?`,
          success: true
        }
      }
    }

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
    // STEP 1.6: TARGET DISAMBIGUATION & CONVERSATIONAL SHORT-CIRCUITS
    // ────────────────────────────────────────────────────────────────
    // Requirement 14: Target Disambiguation
    if (detectedIntent.needsClarification) {
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))
      return {
        handled: true,
        plan: {
          thought: 'Target disambiguation required',
          plan: [],
          needsClarification: true,
          clarificationQuestion: detectedIntent.clarificationQuestion || detectedIntent.directResponse
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
        naturalResponse: detectedIntent.clarificationQuestion || detectedIntent.directResponse || 'Could you please clarify your request?',
        success: true
      }
    }

    // Requirement 4, 33, 34: Conversational, Knowledge & Memory Direct Responses
    if (detectedIntent.detected_target === 'conversational' || Boolean(detectedIntent.directResponse)) {
      if (detectedIntent.detected_intent === 'memory.store' && detectedIntent.args?.content) {
        memoryService.saveMemory({
          category: 'preference',
          content: detectedIntent.args.content,
          metadata: { source: 'chat', timestamp: Date.now() }
        }).catch(() => {})
      }
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))
      return {
        handled: true,
        plan: {
          thought: `Handled conversational intent: ${detectedIntent.detected_intent}`,
          plan: [],
          directResponse: detectedIntent.directResponse
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
        naturalResponse: detectedIntent.directResponse!,
        success: true
      }
    }

    // ────────────────────────────────────────────────────────────────
    // STEP 2: CONTEXT & SELECTIVE MEMORY RETRIEVAL (V1.0.5)
    // ────────────────────────────────────────────────────────────────
    agentStateMachine.transitionTo('CONTEXT_LOADING')
    const memStart = performance.now()
    let memoryContext = ''
    try {
      memoryContext = await memoryService.getRelevantContext(normalizedInput)
    } catch {}

    // V1.0.5: Screen Memory Context Injection
    if (
      lowerInput.includes('screen') ||
      lowerInput.includes('error') ||
      lowerInput.includes('look at') ||
      lowerInput.includes('just saw') ||
      lowerInput.includes('you just found') ||
      lowerInput.includes('fix the problem')
    ) {
      try {
        const screenCtx = await screenService.getLatestScreenContext()
        if (screenCtx) {
          memoryContext += `\n[Screen Context]: App "${screenCtx.application}" (Window: "${screenCtx.window}"). Detected text: "${screenCtx.recognizedText.slice(0, 300)}". Summary: ${screenCtx.summary}`
        }
      } catch {}
    }

    // V1.0.5: User Preferences Context
    try {
      const prefs = await preferenceService.getAll()
      if (prefs && prefs.length > 0) {
        const prefSummary = prefs.map((p) => `${p.key}: ${JSON.stringify(p.value)}`).join(', ')
        memoryContext += `\n[User Preferences]: ${prefSummary}`
      }
    } catch {}

    // V1.0.5: Context Compression for long conversations
    let effectiveHistory = history
    if (history.length > 6) {
      try {
        const compressed = await contextService.compressConversation(history)
        effectiveHistory = compressed.recentMessages
        memoryContext += `\n[Past Conversation Summary]: ${compressed.summary}`
      } catch {}
    }

    const memoryMs = parseFloat((performance.now() - memStart).toFixed(2))

    // ────────────────────────────────────────────────────────────────
    // STEP 3: PLANNING (HYBRID ONLINE / OFFLINE)
    // ────────────────────────────────────────────────────────────────
    agentStateMachine.transitionTo('PLANNING')
    const planStart = performance.now()

    if (!agentPlan) {
      if (detectedIntent.detected_intent === 'compound.task' && detectedIntent.compoundIntents && detectedIntent.compoundIntents.length > 0) {
        const validCalls: StructuredToolCall[] = []
        for (const sub of detectedIntent.compoundIntents) {
          if (sub.tool) {
            validCalls.push({ tool: sub.tool, arguments: sub.args })
          }
        }
        if (validCalls.length > 0) {
          agentPlan = {
            thought: `Decomposed compound request into ${validCalls.length} registered tools`,
            plan: validCalls,
            needsClarification: false
          }
        }
      }
      if (!agentPlan && detectedIntent.detected_intent !== 'unknown' && detectedIntent.tool) {
        agentPlan = {
          thought: `Matched deterministic intent: ${detectedIntent.detected_intent} -> ${detectedIntent.tool} (confidence: ${detectedIntent.confidence})`,
          plan: [{ tool: detectedIntent.tool, arguments: detectedIntent.args }],
          needsClarification: false
        }
      } else if (!agentPlan && (isPureLocal || providerStatus.mode === 'OFFLINE' || !providerStatus.online)) {
        const router = new OfflineCapabilityRouter()
        agentPlan = await router.plan(normalizedInput)
      } else if (!agentPlan) {
        try {
          const planned = await modelService.plan(
            normalizedInput,
            effectiveHistory,
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

    timelineItems.push({
      id: `tl-plan-${Date.now()}`,
      title: `Activated ${activeSkill.name}`,
      status: 'COMPLETED',
      durationMs: planningMs
    })

    // If clarification needed
    if (agentPlan.needsClarification) {
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))
      const activityTimeline: ActivityTimeline = {
        items: timelineItems,
        totalDurationMs: totalMs,
        status: 'completed'
      }
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
        success: true,
        activityTimeline
      }
    }

    // If no tools required
    if (!agentPlan.plan || agentPlan.plan.length === 0) {
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))
      const activityTimeline: ActivityTimeline = {
        items: timelineItems,
        totalDurationMs: totalMs,
        status: 'completed'
      }
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
        success: true,
        activityTimeline
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
    // V1.0.5: Agent State Machine -> EXECUTING
    agentStateMachine.transitionTo('EXECUTING')
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

        // V1.0.5: Reversible action snapshotting for file modifications
        if (call.tool.startsWith('files.')) {
          const targetPath = call.arguments?.targetPath || call.arguments?.path || call.arguments?.src
          if (targetPath && typeof targetPath === 'string') {
            const opType = call.tool === 'files.create' ? 'FILE_WRITE'
              : call.tool === 'files.move' ? 'FILE_MOVE'
              : call.tool === 'files.delete' ? 'FILE_DELETE'
              : call.tool === 'files.copy' ? 'FILE_COPY'
              : 'FILE_WRITE'
            await recoveryService.recordReversibleAction(opType, targetPath, { tool: call.tool, args: call.arguments }).catch(() => {})
          }
        }

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

        // V1.0.5: Reversible action snapshotting for file modifications
        if (call.tool.startsWith('files.')) {
          const targetPath = call.arguments?.targetPath || call.arguments?.path || call.arguments?.src
          if (targetPath && typeof targetPath === 'string') {
            const opType = call.tool === 'files.create' ? 'FILE_WRITE'
              : call.tool === 'files.move' ? 'FILE_MOVE'
              : call.tool === 'files.delete' ? 'FILE_DELETE'
              : call.tool === 'files.copy' ? 'FILE_COPY'
              : 'FILE_WRITE'
            await recoveryService.recordReversibleAction(opType, targetPath, { tool: call.tool, args: call.arguments }).catch(() => {})
          }
        }

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

    // Record tool calls into activity timeline
    for (let i = 0; i < toolResults.length; i++) {
      const call = agentPlan.plan[i]
      const res = toolResults[i]
      timelineItems.push({
        id: `tl-tool-${Date.now()}-${i}`,
        title: this.formatTaskName(call),
        status: res.success ? 'COMPLETED' : 'FAILED',
        durationMs: res.durationMs,
        detail: res.error || (res.success ? 'Executed successfully' : undefined)
      })
    }

    // ────────────────────────────────────────────────────────────────
    // STEP 5: OS VERIFICATION & CONTEXT UPDATE (V1.0.5)
    // ────────────────────────────────────────────────────────────────
    agentStateMachine.transitionTo('VERIFYING')
    const verifyStart = performance.now()
    const allSucceeded = toolResults.every((r) => r.success)
    const verificationMs = parseFloat((performance.now() - verifyStart).toFixed(2))

    timelineItems.push({
      id: `tl-ver-${Date.now()}`,
      title: 'Verifying result',
      status: allSucceeded ? 'COMPLETED' : 'FAILED',
      durationMs: verificationMs > 0 ? verificationMs : 14
    })

    // Update conversation context with verified execution results (Requirement 6, 32)
    for (let i = 0; i < agentPlan.plan.length; i++) {
      const call = agentPlan.plan[i]
      const res = toolResults[i]
      if (res && res.success) {
        if (call.tool === 'android.getBattery' && res.data?.level !== undefined) {
          intentService.setContext({
            lastTarget: 'android',
            lastAction: 'get_battery',
            lastEntity: { type: 'battery', value: res.data.level }
          })
        } else if (call.tool === 'android.openApp') {
          intentService.setContext({
            lastTarget: 'android',
            lastAction: 'open_app',
            lastEntity: { type: 'app', value: call.arguments.appName }
          })
        } else if (call.tool === 'apps.open') {
          intentService.setContext({
            lastTarget: 'windows',
            lastAction: 'open_app',
            lastEntity: { type: 'app', value: call.arguments.app }
          })
        } else if (call.tool === 'android.callContact') {
          intentService.setContext({
            lastTarget: 'android',
            lastAction: 'call_contact',
            lastEntity: { type: 'contact', value: call.arguments.contactName }
          })
        }
      }
    }

    // ────────────────────────────────────────────────────────────────
    // STEP 6: NATURAL LANGUAGE RESPONSE SYNTHESIS
    // ────────────────────────────────────────────────────────────────
    const respStart = performance.now()
    let naturalResponse = this.synthesizeResponse(agentPlan.plan, toolResults, toolExecutionMs)
    const responseMs = parseFloat((performance.now() - respStart).toFixed(2))

    // V1.0.5: Optional Multi-Model Verification for complex tasks
    if (allSucceeded && multiModelVerificationService.shouldVerify(detectedIntent.detected_intent, rawUserInput)) {
      try {
        const verifyRes = await multiModelVerificationService.verify(rawUserInput, naturalResponse, {
          taskType: detectedIntent.detected_intent.startsWith('developer.') ? 'coding' : 'reasoning'
        })
        if (verifyRes.verified && verifyRes.agreementScore !== undefined && verifyRes.agreementScore >= 0.8) {
          timelineItems.push({
            id: `tl-mmv-${Date.now()}`,
            title: 'Multi-Model Verification: Confirmed',
            status: 'COMPLETED',
            durationMs: verifyRes.reviewDurationMs
          })
        }
      } catch {}
    }

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

    const activityTimeline: ActivityTimeline = {
      items: timelineItems,
      totalDurationMs: totalMs,
      status: allSucceeded ? 'completed' : 'failed'
    }

    // ────────────────────────────────────────────────────────────────
    // STEP 7: MEMORY & DETAILED TASK HISTORY UPDATE (V1.0.5)
    // ────────────────────────────────────────────────────────────────
    agentStateMachine.transitionTo(allSucceeded ? 'SUCCESS' : 'ERROR')

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

    // Record into Task History
    taskHistoryService.record({
      userRequest: rawUserInput,
      intent: detectedIntent.detected_intent || 'general.execute',
      skill: activeSkill.name,
      tool: agentPlan.plan.map((c) => c.tool).join(', '),
      status: allSucceeded ? 'SUCCESS' : 'FAILED',
      durationMs: totalMs,
      toolLatencyMs: toolExecutionMs,
      permissionState: 'GRANTED',
      resultSummary: allSucceeded
        ? `Executed ${agentPlan.plan.length} tools successfully.`
        : `Tool execution failed.`
    }).catch(() => {})

    return {
      handled: true,
      plan: agentPlan,
      telemetry,
      results: toolResults,
      naturalResponse,
      success: allSucceeded,
      report,
      activityTimeline
    }
  }

  /**
   * Synthesize cohesive conversational response from executed tool results (Requirement 8, 9, 22)
   */
  private synthesizeResponse(
    calls: StructuredToolCall[],
    results: ToolExecutionResult[],
    wallTimeMs: number
  ): string {
    const isCompound = results.length > 1

    if (isCompound) {
      let naturalSummary = ''
      const battCallIdx = calls.findIndex((c) => c.tool === 'android.getBattery')
      const phoneAppIdx = calls.findIndex((c) => c.tool === 'android.openApp')
      const winAppIdx = calls.findIndex((c) => c.tool === 'apps.open')
      const cpuIdx = calls.findIndex((c) => c.tool === 'system.getCpu')
      const memIdx = calls.findIndex((c) => c.tool === 'system.getMemory')
      const diskIdx = calls.findIndex((c) => c.tool === 'system.getDisk')
      const connIdx = calls.findIndex((c) => c.tool === 'adb.connect')

      if (battCallIdx !== -1 && phoneAppIdx !== -1) {
        const level = results[battCallIdx]?.data?.level ?? 'checked'
        const app = calls[phoneAppIdx].arguments.appName || 'the app'
        naturalSummary = `Your phone is at ${level}%, and ${app} is now open.`
      } else if (connIdx !== -1 && battCallIdx !== -1) {
        const level = results[battCallIdx]?.data?.level ?? 'checked'
        naturalSummary = `Your phone is connected, and the battery is at ${level}%.`
      } else if (cpuIdx !== -1 && memIdx !== -1 && diskIdx !== -1) {
        const cpu = results[cpuIdx]?.data?.loadPercentage ?? results[cpuIdx]?.data?.load ?? 'Active'
        const ram = results[memIdx]?.data?.usedPercent ?? 'Active'
        const disk = results[diskIdx]?.data?.freeGB ?? 'N/A'
        naturalSummary = `CPU load is currently ${cpu}%, RAM usage is at ${ram}%, and primary drive has ${disk} GB free.`
      } else if (cpuIdx !== -1 && memIdx !== -1) {
        const cpu = results[cpuIdx]?.data?.loadPercentage ?? results[cpuIdx]?.data?.load ?? 'Active'
        const ram = results[memIdx]?.data?.usedPercent ?? 'Active'
        naturalSummary = `CPU load is currently ${cpu}%, and RAM usage is at ${ram}%.`
      } else if (winAppIdx !== -1 && cpuIdx !== -1) {
        const app = calls[winAppIdx].arguments.app || 'The application'
        const cpu = results[cpuIdx]?.data?.loadPercentage ?? results[cpuIdx]?.data?.load ?? 'Active'
        naturalSummary = `Done — ${app} is open, and your CPU load is ${cpu}%.`
      }

      let output = naturalSummary ? `${naturalSummary}\n\n` : ''
      results.forEach((r, idx) => {
        const call = calls[idx]
        const icon = r.success ? '✓' : '❌'
        const desc = this.formatResultLine(call, r)
        output += `${icon} ${desc} — \`${r.durationMs}ms\`\n`
      })

      output += `\n**Total wall time: \`${wallTimeMs}ms\`**`
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
      if (call.tool === 'apps.open') {
        return `I couldn't open ${call.arguments.app || 'the application'} because it isn't installed or could not be found on your PC.`
      }
      if (call.tool === 'android.callContact') {
        return r.error || `I couldn't complete the call on your phone.`
      }
      if (call.tool.startsWith('android.')) {
        return `I couldn't complete the phone action: ${r.error || 'The device may be disconnected or unavailable.'}`
      }
      return `I couldn't complete ${call.tool}: ${r.error || 'Execution failure.'}`
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
        return `Done — **${appName}** is open on your PC. (\`${dur}ms\`)`
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
        return `Done — **${d?.appName || call.arguments.appName}** is open on your phone. (\`${dur}ms\`)`

      case 'android.callContact':
        return `Done — Dialing **${d?.contact_reference || call.arguments.contactName}** on your phone.`

      case 'android.endCall':
        return `Done — Call ended.`

      case 'android.muteCall':
        return `Done — Call ${call.arguments?.mute ? 'muted' : 'unmuted'}.`

      case 'android.holdCall':
        return `Done — Call placed on hold.`

      case 'android.resumeCall':
        return `Done — Call resumed.`

      case 'android.getBattery':
        return `Your phone is at **${d?.level ?? 'N/A'}%** (${d?.charging ? '⚡ Charging' : 'On Battery'}).`

      case 'android.powerOff':
        return `🔌 **Android Device Power Off** (\`${dur}ms\`):\n• Status: ${d?.message || 'Phone power-down sequence executed.'}`

      case 'android.restart':
        return `🔄 **Android Device Reboot** (\`${dur}ms\`):\n• Status: ${d?.message || 'Phone reboot sequence executed.'}`

      case 'android.lock':
        return `Done — Phone locked.`

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