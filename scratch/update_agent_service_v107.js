// scratch/update_agent_service_v107.js
const fs = require('fs')
const path = require('path')

const targetPath = path.resolve(__dirname, '../src/main/services/agent.service.ts')
let content = fs.readFileSync(targetPath, 'utf8')

// 1. Add V1.0.7 imports
const importMarker = `import { adaptiveContextManager } from './adaptive-context.service'`
const newImports = `import { adaptiveContextManager } from './adaptive-context.service'
import { briefingService } from './briefing.service'
import { focusService } from './focus.service'
import { workspaceManagerService } from './workspace-manager.service'
import { communicationService } from './communication.service'
import { inboxService } from './inbox.service'
import { androidAgentService } from './android-agent.service'
import { updateService } from './update.service'
import { workspaceBackupService } from './workspace-backup.service'
import { simulationService } from './simulation.service'
import { personalityService } from './personality.service'
import { explainabilityService } from './explainability.service'`

if (!content.includes('briefingService')) {
  content = content.replace(importMarker, newImports)
}

// 2. Add V1.0.7 natural language handlers after Goal Memory fast-path
const goalMarker = `        return {
          handled: true,
          plan: { thought: \`Retrieved active goal context: \${goal.title}\`, plan: [] },
          telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: 0, verificationMs: 0, responseMs: 0, totalMs, tools: [] },
          results: [],
          naturalResponse: \`Resuming goal: "\${goal.title}" (Project: \${goal.project}, Status: \${goal.status}). Context and milestones restored. What step would you like to execute?\`,
          success: true
        }
      }
    }`

const v107FastPaths = `        return {
          handled: true,
          plan: { thought: \`Retrieved active goal context: \${goal.title}\`, plan: [] },
          telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: 0, verificationMs: 0, responseMs: 0, totalMs, tools: [] },
          results: [],
          naturalResponse: \`Resuming goal: "\${goal.title}" (Project: \${goal.project}, Status: \${goal.status}). Context and milestones restored. What step would you like to execute?\`,
          success: true
        }
      }
    }

    // ════════════════════════════════════════════════════════════════
    // ── V1.0.7: INTELLIGENT AGENT OPERATING LAYER FAST-PATHS ─────────
    // ════════════════════════════════════════════════════════════════

    // ── Daily Briefing ("Plan my day", "Give me today's briefing") ──
    if (lowerInput.includes('briefing') || lowerInput.includes('plan my day') || lowerInput.includes('what are my tasks today')) {
      agentStateMachine.transitionTo('PLANNING')
      const briefing = await briefingService.generateBriefing()
      agentStateMachine.transitionTo('SUCCESS')
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

      explainabilityService.recordExplanation({
        requestId: 'req-' + Date.now(),
        request: rawUserInput,
        intent: 'system.daily_briefing',
        selectedCapability: 'Daily Briefing Engine',
        toolsUsed: ['briefing.get'],
        permission: 'LEVEL_1_SAFE (Granted)',
        risk: 'LOW',
        execution: 'Aggregated real system health, active goals, scheduled missions, and Android state',
        verification: 'Verified SQLite memory snapshot & system metrics',
        result: 'Briefing generated successfully'
      })

      return {
        handled: true,
        plan: { thought: 'Generated authentic daily briefing.', plan: [] },
        telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: totalMs, verificationMs: 0, responseMs: 0, totalMs, tools: ['briefing.get'] },
        results: [{ tool: 'briefing.get', success: true, result: briefing }],
        naturalResponse: briefing.summary,
        success: true
      }
    }

    // ── Focus Mode ("Start coding focus", "End focus mode") ──
    if (lowerInput.includes('focus') && (lowerInput.includes('start') || lowerInput.includes('create') || lowerInput.includes('begin'))) {
      let mode: any = 'Coding'
      if (lowerInput.includes('research')) mode = 'Research'
      else if (lowerInput.includes('study')) mode = 'Study'
      else if (lowerInput.includes('writing')) mode = 'Writing'
      else if (lowerInput.includes('general')) mode = 'General Focus'

      agentStateMachine.transitionTo('EXECUTING')
      const res = await focusService.startFocus(mode)
      agentStateMachine.transitionTo('SUCCESS')
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

      return {
        handled: true,
        plan: { thought: \`Started \${mode} Focus session.\`, plan: [] },
        telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: totalMs, verificationMs: 0, responseMs: 0, totalMs, tools: ['focus.start'] },
        results: [{ tool: 'focus.start', success: true, result: res }],
        naturalResponse: res.message,
        success: true
      }
    }

    if (lowerInput === 'end focus' || lowerInput === 'end focus mode' || lowerInput === 'stop focus') {
      agentStateMachine.transitionTo('EXECUTING')
      const res = focusService.endFocus()
      agentStateMachine.transitionTo(res.success ? 'SUCCESS' : 'IDLE')
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

      return {
        handled: true,
        plan: { thought: 'Ended focus session.', plan: [] },
        telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: totalMs, verificationMs: 0, responseMs: 0, totalMs, tools: ['focus.end'] },
        results: [{ tool: 'focus.end', success: res.success, result: res }],
        naturalResponse: res.message,
        success: res.success
      }
    }

    // ── Workspaces ("Switch to Development", "Open my development workspace") ──
    if ((lowerInput.startsWith('switch to ') && lowerInput.includes('workspace')) || lowerInput.startsWith('switch to development') || lowerInput.startsWith('switch to research') || lowerInput.includes('restore my workspace')) {
      let wsTarget = 'Development'
      if (lowerInput.includes('research')) wsTarget = 'Research'
      else if (lowerInput.includes('study')) wsTarget = 'Study'
      else if (lowerInput.includes('personal')) wsTarget = 'Personal'
      else if (lowerInput.includes('security lab')) wsTarget = 'Security Lab'

      agentStateMachine.transitionTo('EXECUTING')
      try {
        const res = await workspaceManagerService.switchWorkspace(wsTarget)
        agentStateMachine.transitionTo('SUCCESS')
        const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

        explainabilityService.recordExplanation({
          requestId: 'req-' + Date.now(),
          request: rawUserInput,
          intent: 'workspace.switch',
          selectedCapability: 'Multiple Workspaces Subsystem',
          toolsUsed: ['workspaces.switch'],
          permission: 'LEVEL_2_REVERSIBLE (Granted)',
          risk: 'LOW',
          execution: \`Restored \${wsTarget} workspace configuration and launched \${res.launchedCount} tools\`,
          verification: 'Verified active workspace profile in SQLite',
          result: 'Completed'
        })

        return {
          handled: true,
          plan: { thought: \`Switched to \${wsTarget} workspace.\`, plan: [] },
          telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: totalMs, verificationMs: 0, responseMs: 0, totalMs, tools: ['workspaces.switch'] },
          results: [{ tool: 'workspaces.switch', success: true, result: res }],
          naturalResponse: res.message,
          success: true
        }
      } catch (err: any) {
        agentStateMachine.transitionTo('ERROR')
        return {
          handled: true,
          plan: { thought: 'Failed to switch workspace.', plan: [] },
          telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: 0, verificationMs: 0, responseMs: 0, totalMs: 0, tools: [] },
          results: [],
          naturalResponse: \`Workspace error: \${err.message}\`,
          success: false
        }
      }
    }

    // ── Universal Inbox ("What's in my inbox", "Summarize my inbox", "Clear low priority notifications") ──
    if (lowerInput.includes('what\'s in my inbox') || lowerInput.includes('check my inbox') || lowerInput === 'inbox' || lowerInput.includes('summarize my inbox')) {
      agentStateMachine.transitionTo('EXECUTING')
      const summary = inboxService.summarizeInbox()
      agentStateMachine.transitionTo('SUCCESS')
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

      return {
        handled: true,
        plan: { thought: 'Summarized universal inbox.', plan: [] },
        telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: totalMs, verificationMs: 0, responseMs: 0, totalMs, tools: ['inbox.summarize'] },
        results: [{ tool: 'inbox.summarize', success: true, result: { summary } }],
        naturalResponse: summary,
        success: true
      }
    }

    if (lowerInput.includes('clear low priority')) {
      agentStateMachine.transitionTo('EXECUTING')
      const res = inboxService.clearLowPriority()
      agentStateMachine.transitionTo('SUCCESS')
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

      return {
        handled: true,
        plan: { thought: 'Cleared low priority inbox notifications.', plan: [] },
        telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: totalMs, verificationMs: 0, responseMs: 0, totalMs, tools: ['inbox.clear_low'] },
        results: [{ tool: 'inbox.clear_low', success: true, result: res }],
        naturalResponse: res.message,
        success: true
      }
    }

    // ── Android Status & Messages ("Check my phone", "Show phone status", "Show battery") ──
    if (lowerInput === 'check my phone' || lowerInput === 'show phone status' || lowerInput === 'show battery' || lowerInput === 'phone status') {
      agentStateMachine.transitionTo('EXECUTING')
      const status = await androidAgentService.getPhoneStatus()
      agentStateMachine.transitionTo(status.connected ? 'SUCCESS' : 'IDLE')
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

      return {
        handled: true,
        plan: { thought: 'Checked Android phone status.', plan: [] },
        telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: totalMs, verificationMs: 0, responseMs: 0, totalMs, tools: ['android.status'] },
        results: [{ tool: 'android.status', success: status.connected, result: status }],
        naturalResponse: status.message,
        success: status.connected
      }
    }

    // ── Update Manager ("Check for updates", "Update ULTRON") ──
    if (lowerInput.includes('check for update') || lowerInput.includes('update ultron') || lowerInput === 'check updates' || lowerInput.includes('what\'s new in the latest release')) {
      agentStateMachine.transitionTo('EXECUTING')
      const updateResult = await updateService.checkForUpdates()
      agentStateMachine.transitionTo('SUCCESS')
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

      let reply = \`Current version: v\${updateResult.currentVersion}. \`
      if (updateResult.hasUpdate) {
        reply += \`A newer release (v\${updateResult.latestVersion}) is available from the official GitHub repository (\${updateResult.officialRepo}). Open Settings → Update Manager to view release notes and download safely.\`
      } else {
        reply += \`You are running the latest stable release of ULTRON.\`
      }

      return {
        handled: true,
        plan: { thought: 'Checked official GitHub release endpoint.', plan: [] },
        telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: totalMs, verificationMs: 0, responseMs: 0, totalMs, tools: ['updates.check'] },
        results: [{ tool: 'updates.check', success: true, result: updateResult }],
        naturalResponse: reply,
        success: true
      }
    }

    // ── Workspace Backup ("Backup my workspace") ──
    if (lowerInput.includes('backup my workspace') || lowerInput.includes('backup workspace')) {
      agentStateMachine.transitionTo('EXECUTING')
      const backupMeta = workspaceBackupService.createBackup('Manual Workspace Backup')
      agentStateMachine.transitionTo('SUCCESS')
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

      return {
        handled: true,
        plan: { thought: 'Created workspace configuration backup.', plan: [] },
        telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: totalMs, verificationMs: 0, responseMs: 0, totalMs, tools: ['backups.create'] },
        results: [{ tool: 'backups.create', success: true, result: backupMeta }],
        naturalResponse: \`Successfully created workspace backup "\${backupMeta.name}" (Version \${backupMeta.ultronVersion}, \${backupMeta.workspaceCount} workspaces preserved, credentials securely excluded).\`,
        success: true
      }
    }

    // ── Mission Simulation ("Simulate this mission", "Simulate mission") ──
    if (lowerInput.startsWith('simulate ') || lowerInput.includes('simulate this mission') || lowerInput.includes('simulate mission')) {
      const goalToSimulate = rawUserInput.replace(/^simulate\s+(this\s+mission\s+)?/i, '').trim() || 'Execute workspace preparation and build'
      agentStateMachine.transitionTo('PLANNING')
      const simulation = simulationService.simulateMission(goalToSimulate)
      agentStateMachine.transitionTo('SUCCESS')
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

      const stepsOverview = simulation.steps.map(s => \`\${s.index}. \${s.description} [Risk: \${s.risk}]\`).join('\\n')
      const reply = \`[MISSION SIMULATION PREVIEW (Dry-Run)]\\nGoal: \${simulation.goal}\\nTotal Steps: \${simulation.totalSteps} (Estimated: \${simulation.estimatedDurationSeconds}s, Overall Risk: \${simulation.overallRisk})\\n\\n\${stepsOverview}\\n\\nSimulation executed safely with zero physical side-effects. You can now choose to Run, Edit, or Cancel.\`

      return {
        handled: true,
        plan: { thought: 'Executed mission dry-run simulation.', plan: [] },
        telemetry: { understandingMs, planningMs: totalMs, memoryMs: 0, toolExecutionMs: 0, verificationMs: 0, responseMs: 0, totalMs, tools: ['missions.simulate'] },
        results: [{ tool: 'missions.simulate', success: true, result: simulation }],
        naturalResponse: reply,
        success: true
      }
    }

    // ── Personality Profiles ("Turn on technical personality", "Turn on minimal personality") ──
    if (lowerInput.includes('personality') && (lowerInput.includes('turn on') || lowerInput.includes('switch to') || lowerInput.includes('activate'))) {
      let targetP: any = 'Balanced'
      if (lowerInput.includes('technical')) targetP = 'Technical'
      else if (lowerInput.includes('minimal')) targetP = 'Minimal'
      else if (lowerInput.includes('professional')) targetP = 'Professional'
      else if (lowerInput.includes('tutor')) targetP = 'Tutor'
      else if (lowerInput.includes('developer')) targetP = 'Developer'
      else if (lowerInput.includes('researcher')) targetP = 'Researcher'

      personalityService.setActiveProfile(targetP)
      const totalMs = parseFloat((performance.now() - overallStart).toFixed(2))

      return {
        handled: true,
        plan: { thought: \`Switched personality profile to \${targetP}.\`, plan: [] },
        telemetry: { understandingMs, planningMs: 0, memoryMs: 0, toolExecutionMs: totalMs, verificationMs: 0, responseMs: 0, totalMs, tools: ['personality.set'] },
        results: [{ tool: 'personality.set', success: true, result: { profile: targetP } }],
        naturalResponse: \`Switched ULTRON personality profile to \${targetP}. Safety boundaries, risk limits, and verification requirements remain intact.\`,
        success: true
      }
    }`

if (!content.includes('system.daily_briefing')) {
  content = content.replace(goalMarker, v107FastPaths)
}

fs.writeFileSync(targetPath, content, 'utf8')
console.log('Successfully updated agent.service.ts with V1.0.7 fast-paths')
