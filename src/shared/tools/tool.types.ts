// src/shared/tools/tool.types.ts — Centralized Tool Definitions & Telemetry Types

export type ToolCategory =
  | 'SYSTEM'
  | 'NETWORK'
  | 'APPS'
  | 'FILESYSTEM'
  | 'SECURITY'
  | 'SETTINGS'
  | 'MEMORY'
  | 'RESEARCH'
  | 'ADB'

export type ToolRiskLevel =
  | 'LEVEL_1_SAFE'
  | 'LEVEL_2_MODIFYING'
  | 'LEVEL_3_DESTRUCTIVE'

export interface ToolParamProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required?: boolean
  default?: any
}

export interface UltronToolDefinition<TArgs = any, TResult = any> {
  name: string
  description: string
  category: ToolCategory
  riskLevel: ToolRiskLevel
  parameters: Record<string, ToolParamProperty>
  timeoutMs: number
  requiresConfirmation?: boolean
  validate: (args: TArgs) => { valid: boolean; error?: string }
  executor: (args: TArgs) => Promise<TResult>
}

export interface StructuredToolCall {
  tool: string
  arguments: Record<string, any>
}

export interface AgentPlan {
  thought: string
  plan: StructuredToolCall[]
  needsClarification?: boolean
  clarificationQuestion?: string | null
  directResponse?: string | null
}

export interface ToolExecutionResult {
  tool: string
  category: ToolCategory
  success: boolean
  durationMs: number
  data?: any
  error?: string
}

export interface AgentTelemetryBreakdown {
  understandingMs: number
  planningMs: number
  memoryMs: number
  toolExecutionMs: number
  verificationMs: number
  responseMs: number
  totalMs: number
  tools: ToolExecutionResult[]
}

import { ConfirmationCard } from '../types'

export interface AgentExecutionOutput {
  plan: AgentPlan
  telemetry: AgentTelemetryBreakdown
  results: ToolExecutionResult[]
  naturalResponse: string
  success: boolean
  confirmationCard?: ConfirmationCard
}
