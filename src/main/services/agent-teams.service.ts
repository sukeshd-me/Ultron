// src/main/services/agent-teams.service.ts — Specialized Internal Agent Teams for ULTRON V1.0.8
import { memoryDatabase } from '../database/memory.db'
import { AgentRole, AgentTeamRole, AgentRunRecord, ModelTier } from '../../shared/types'
import { permissionsService } from './permissions.service'
import { actionRiskEngine } from './risk-engine.service'

export interface AgentTeamDispatchParams {
  role: AgentRole
  input: string
  modelTier: ModelTier
  taskId?: string
  missionId?: string
}

export class AgentTeamsService {
  /**
   * Execute task under specialized internal role while enforcing central safety boundaries
   */
  async runRole(params: AgentTeamDispatchParams, executionFn: () => Promise<string>): Promise<AgentRunRecord> {
    const { role, input, modelTier, taskId, missionId } = params
    const start = performance.now()

    // 1. Enforce risk boundary
    const risk = actionRiskEngine.evaluateToolRisk(`role.${role.toLowerCase()}`, { input })
    if (risk.level === 'CRITICAL' || risk.level === 'IRREVERSIBLE') {
      const isGranted = await permissionsService.requestPermission({
        tool: `role.${role.toLowerCase()}`,
        target: input,
        description: `Agent role ${role} executing critical action: "${input}"`
      })
      if (!isGranted) {
        return memoryDatabase.recordAgentRun({
          agentRole: role,
          taskId,
          missionId,
          input,
          output: 'Operation blocked by security permissions.',
          modelTier,
          durationMs: parseFloat((performance.now() - start).toFixed(2)),
          status: 'BLOCKED'
        })
      }
    }

    try {
      const output = await executionFn()
      const durationMs = parseFloat((performance.now() - start).toFixed(2))

      return memoryDatabase.recordAgentRun({
        agentRole: role,
        taskId,
        missionId,
        input,
        output,
        modelTier,
        durationMs,
        status: 'SUCCESS'
      })
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - start).toFixed(2))
      return memoryDatabase.recordAgentRun({
        agentRole: role,
        taskId,
        missionId,
        input,
        output: `Error: ${err.message}`,
        modelTier,
        durationMs,
        status: 'FAILED'
      })
    }
  }

  getRuns(role?: AgentRole, limit = 50): AgentRunRecord[] {
    return memoryDatabase.getAgentRuns(limit, role)
  }

  /**
   * Return catalog of internal specialized roles under ONE ULTRON identity
   */
  getRoles(): AgentTeamRole[] {
    return [
      {
        id: 'PLANNER',
        name: 'Planner Agent',
        description: 'Breaks complex goals into multi-step DAG dependency plans with parallel execution stages.',
        capabilities: ['decompose_goals', 'dag_dependencies', 'parallel_scheduling'],
        assignedTier: 'HIGH'
      },
      {
        id: 'RESEARCH',
        name: 'Research Agent',
        description: 'Investigates documents, web knowledge, and contextual facts with source verification.',
        capabilities: ['search_knowledge', 'synthesize_facts', 'verify_sources'],
        assignedTier: 'HIGH'
      },
      {
        id: 'CODING',
        name: 'Coding Agent 2.0',
        description: 'Analyzes repository architecture, executes pre-flight code impact analysis, and generates verified code edits.',
        capabilities: ['repo_mapping', 'impact_analysis', 'safe_edits', 'typecheck'],
        assignedTier: 'HIGH'
      },
      {
        id: 'PC',
        name: 'PC Agent',
        description: 'Controls Windows desktop, workspace arrangements, and local processes with zero-trust safety.',
        capabilities: ['window_management', 'process_audit', 'workspace_switch'],
        assignedTier: 'FAST'
      },
      {
        id: 'ANDROID',
        name: 'Android Agent 2.0',
        description: 'Coordinates connected Android devices, SMS, contacts, and mobile cross-device continuity.',
        capabilities: ['adb_bridge', 'notifications', 'contacts_sync', 'screen_continuity'],
        assignedTier: 'FAST'
      },
      {
        id: 'VERIFICATION',
        name: 'Verification Agent',
        description: 'Audits execution outcomes against physical reality before reporting success.',
        capabilities: ['file_confirmation', 'exit_code_check', 'fact_classification'],
        assignedTier: 'MEDIUM'
      }
    ]
  }

  getRole(id: AgentRole): AgentTeamRole | undefined {
    return this.getRoles().find(r => r.id === id)
  }
}

export const agentTeamsService = new AgentTeamsService()