// src/main/services/permissions.service.ts — Permission Center & Risk Gatekeeper
import {
  PermissionCategory,
  PermissionLevel,
  PermissionRule,
  DEFAULT_PERMISSIONS,
  PermissionAuditEntry
} from '../../shared/permissions.types'
import { RiskLevel } from '../../shared/types'
import { v4 as uuidv4 } from 'uuid'

export class PermissionsService {
  private permissions: Record<PermissionCategory, PermissionRule>
  private auditLog: PermissionAuditEntry[] = []
  private temporaryGrants = new Set<string>() // tool/action IDs allowed once

  constructor() {
    this.permissions = { ...DEFAULT_PERMISSIONS }
  }

  getPermissions(): Record<PermissionCategory, PermissionRule> {
    return { ...this.permissions }
  }

  getAll(): Record<PermissionCategory, PermissionRule> {
    return this.getPermissions()
  }

  getPermission(category: PermissionCategory): PermissionRule {
    return this.permissions[category] || DEFAULT_PERMISSIONS[category]
  }

  setPermission(category: PermissionCategory, level: PermissionLevel): void {
    if (this.permissions[category]) {
      this.permissions[category] = {
        ...this.permissions[category],
        level,
        updatedAt: Date.now()
      }
    }
  }

  set(category: PermissionCategory, level: PermissionLevel): void {
    this.setPermission(category, level)
  }

  resetPermissions(): void {
    this.permissions = { ...DEFAULT_PERMISSIONS }
    this.temporaryGrants.clear()
  }

  reset(): void {
    this.resetPermissions()
  }

  getAuditLog(limit = 50): PermissionAuditEntry[] {
    return this.auditLog.slice(-limit)
  }

  getAudit(limit = 50): PermissionAuditEntry[] {
    return this.getAuditLog(limit)
  }


  grantTemporary(actionToken: string): void {
    this.temporaryGrants.add(actionToken)
  }

  revokeTemporary(actionToken: string): void {
    this.temporaryGrants.delete(actionToken)
  }

  /**
   * Evaluate if an action is permitted, requires explicit confirmation, or is denied.
   */
  evaluateAction(params: {
    category: PermissionCategory
    action: string
    risk: RiskLevel
    actionToken?: string
  }): {
    allowed: boolean
    requiresConfirmation: boolean
    reason: string
  } {
    const { category, action, risk, actionToken } = params
    const rule = this.getPermission(category)

    // 1. Check if user already granted a temporary "Allow Once" token
    if (actionToken && this.temporaryGrants.has(actionToken)) {
      this.temporaryGrants.delete(actionToken)
      this.recordAudit({
        category,
        action,
        risk,
        levelApplied: 'ALLOW',
        outcome: 'ALLOWED',
        details: 'Permitted via temporary one-time grant.'
      })
      return { allowed: true, requiresConfirmation: false, reason: 'Temporary grant active.' }
    }

    // 2. If Category is DENIED -> block immediately
    if (rule.level === 'DENY') {
      this.recordAudit({
        category,
        action,
        risk,
        levelApplied: 'DENY',
        outcome: 'DENIED',
        details: `Category ${category} is set to DENY in Permission Center.`
      })
      return {
        allowed: false,
        requiresConfirmation: false,
        reason: `Action blocked: Permission for ${rule.name} (${category}) is DENIED in Settings.`
      }
    }

    // 3. High Risk Actions ALWAYS require explicit confirmation regardless of level
    if (risk === 'HIGH' || risk === 'CRITICAL') {
      return {
        allowed: true,
        requiresConfirmation: true,
        reason: `High-risk operation (${action}) requires explicit confirmation safety gate.`
      }
    }

    // 4. If Category is ASK -> requires confirmation card
    if (rule.level === 'ASK') {
      return {
        allowed: true,
        requiresConfirmation: true,
        reason: `Category ${category} is set to ASK EVERY TIME.`
      }
    }

    // 5. ALLOW for Low & Medium Risk
    this.recordAudit({
      category,
      action,
      risk,
      levelApplied: 'ALLOW',
      outcome: 'ALLOWED',
      details: `Permitted under category policy ${category}: ALLOW.`
    })
    return { allowed: true, requiresConfirmation: false, reason: 'Allowed by policy.' }
  }

  private recordAudit(entry: Omit<PermissionAuditEntry, 'id' | 'timestamp'>): void {
    this.auditLog.push({
      id: uuidv4(),
      timestamp: Date.now(),
      ...entry
    })
    if (this.auditLog.length > 200) {
      this.auditLog.shift()
    }
  }
}

export const permissionsService = new PermissionsService()
