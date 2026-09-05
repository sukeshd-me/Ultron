// src/main/services/workflow.service.ts — Multi-App Workflows for ULTRON V1.0.5
import { v4 as uuidv4 } from 'uuid'
import { memoryDatabase } from '../database/memory.db'
import { appsService } from './apps.service'
import { powershellService } from './powershell.service'
import { workspaceService } from './workspace.service'
import { taskHistoryService } from './task-history.service'
import { Workflow, WorkflowStep } from '../../shared/types'

export class WorkflowService {
  /**
   * WorkflowPlanner: parse compound requests into structured sequential steps
   */
  planWorkflow(goal: string): Workflow {
    const lower = goal.toLowerCase()
    const steps: WorkflowStep[] = []
    const workflowId = uuidv4()

    // Example 1: Compound Dev setup ("open VS Code, open my project, start server, open browser")
    if (lower.includes('vs code') || lower.includes('vscode') || lower.includes('code') && (lower.includes('project') || lower.includes('server'))) {
      steps.push({
        id: uuidv4(),
        workflowId,
        stepIndex: 1,
        app: 'Visual Studio Code',
        action: 'launch_editor',
        params: { appName: 'code' },
        verification: { check: 'process_running', expected: 'code', timeoutMs: 8000 },
        status: 'PENDING'
      })

      steps.push({
        id: uuidv4(),
        workflowId,
        stepIndex: 2,
        app: 'Workspace Manager',
        action: 'open_project_directory',
        params: { path: process.cwd() },
        verification: { check: 'file_exists', expected: 'package.json', timeoutMs: 5000 },
        status: 'PENDING'
      })

      if (lower.includes('browser') || lower.includes('website') || lower.includes('site')) {
        steps.push({
          id: uuidv4(),
          workflowId,
          stepIndex: 3,
          app: 'Browser',
          action: 'open_url',
          params: { url: 'http://localhost:5173' },
          verification: { check: 'custom', timeoutMs: 5000 },
          status: 'PENDING'
        })
      }
    } else if (lower.includes('calculator') && lower.includes('notepad')) {
      steps.push({
        id: uuidv4(),
        workflowId,
        stepIndex: 1,
        app: 'Calculator',
        action: 'launch_app',
        params: { appName: 'calc' },
        verification: { check: 'process_running', expected: 'CalculatorApp', timeoutMs: 5000 },
        status: 'PENDING'
      })
      steps.push({
        id: uuidv4(),
        workflowId,
        stepIndex: 2,
        app: 'Notepad',
        action: 'launch_app',
        params: { appName: 'notepad' },
        verification: { check: 'process_running', expected: 'notepad', timeoutMs: 5000 },
        status: 'PENDING'
      })
    } else {
      // General multi-app step generator
      steps.push({
        id: uuidv4(),
        workflowId,
        stepIndex: 1,
        app: 'System',
        action: 'coordinate_apps',
        params: { goal },
        verification: { check: 'custom', timeoutMs: 5000 },
        status: 'PENDING'
      })
    }

    return memoryDatabase.createWorkflow({
      name: goal,
      description: `Coordinated workflow for: ${goal}`,
      steps
    })
  }

  /**
   * WorkflowExecutor & WorkflowVerifier
   */
  async executeWorkflow(workflowId: string): Promise<Workflow> {
    const wf = memoryDatabase.getWorkflow(workflowId)
    if (!wf) throw new Error(`Workflow ${workflowId} not found`)

    memoryDatabase.createWorkflow({ ...wf, status: 'RUNNING' } as any)

    for (const step of wf.steps) {
      const stepStart = performance.now()
      memoryDatabase.saveWorkflowStep({ ...step, status: 'RUNNING' })

      try {
        // Step execution
        if (step.action === 'launch_app' || step.action === 'launch_editor') {
          await appsService.launchApp(step.params.appName)
        } else if (step.action === 'open_url') {
          await powershellService.execute(`Start-Process "${step.params.url}"`)
        } else if (step.action === 'open_project_directory') {
          await workspaceService.switchProject(step.params.path)
        }

        // Step verification
        memoryDatabase.saveWorkflowStep({ ...step, status: 'VERIFYING' })
        const verified = await this.verifyStep(step)
        const durationMs = parseFloat((performance.now() - stepStart).toFixed(2))

        if (!verified) {
          throw new Error(`Verification failed for step ${step.stepIndex}: ${step.app} ${step.action}`)
        }

        memoryDatabase.saveWorkflowStep({ ...step, status: 'SUCCESS', durationMs })

        taskHistoryService.record({
          timestamp: Date.now(),
          userRequest: `Workflow step: ${step.app} - ${step.action}`,
          intent: 'workflow.step',
          skill: 'system',
          status: 'SUCCESS',
          startTime: Date.now() - durationMs,
          endTime: Date.now(),
          durationMs,
          category: 'WINDOWS',
          verificationResult: 'PASS'
        })
      } catch (err: any) {
        const durationMs = parseFloat((performance.now() - stepStart).toFixed(2))
        memoryDatabase.saveWorkflowStep({ ...step, status: 'FAILED', durationMs, error: err.message })
        return memoryDatabase.getWorkflow(workflowId)!
      }
    }

    return memoryDatabase.getWorkflow(workflowId)!
  }

  private async verifyStep(step: WorkflowStep): Promise<boolean> {
    const { check, expected } = step.verification
    if (check === 'process_running' && expected) {
      const psRes = await powershellService.execute(`Get-Process -Name "${expected}*" -ErrorAction SilentlyContinue | Select-Object -First 1 Name`)
      return psRes.success && psRes.stdout.trim().length > 0
    }
    if (check === 'file_exists' && expected) {
      const psRes = await powershellService.execute(`Test-Path "${expected}"`)
      return psRes.stdout.toLowerCase().includes('true')
    }
    return true
  }

  listWorkflows(): Workflow[] {
    return memoryDatabase.listWorkflows()
  }
}

export const workflowService = new WorkflowService()
