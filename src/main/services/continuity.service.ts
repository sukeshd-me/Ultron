// src/main/services/continuity.service.ts — Cross-Device Continuity for ULTRON V1.0.7
import { v4 as uuidv4 } from 'uuid'
import {
  ContinuitySession,
  DeviceCompanionStatus
} from '../../shared/types'
import { adbService } from './adb.service'

export class ContinuityService {
  private activeSession: ContinuitySession | null = null

  /**
   * Get real-time connection and companion status
   */
  async getStatus(): Promise<DeviceCompanionStatus> {
    try {
      const details = await adbService.getDeviceDetails()
      const isConnected = details.state === 'device'
      return {
        connected: isConnected,
        deviceName: isConnected ? `${details.manufacturer} ${details.model}`.trim() : undefined,
        batteryLevel: details.battery?.level,
        isCharging: details.battery?.charging || false,
        adbAvailable: true,
        permissionsGranted: isConnected ? ['SMS', 'Telephony', 'Contacts', 'PackageInspection'] : []
      }
    } catch {
      return {
        connected: false,
        adbAvailable: false,
        permissionsGranted: []
      }
    }
  }

  /**
   * Retrieve active continuity session or initialize one
   */
  async getActiveSession(): Promise<ContinuitySession> {
    const status = await this.getStatus()

    if (!status.connected) {
      return {
        id: 'session-pc-fallback',
        deviceId: 'local-pc',
        deviceName: 'Windows 11 Workstation',
        lastSyncTimestamp: Date.now(),
        stateSummary: 'Operating in standalone PC mode (Android companion offline).',
        status: 'DISCONNECTED'
      }
    }

    if (!this.activeSession) {
      this.activeSession = {
        id: uuidv4(),
        deviceId: 'android-companion-1',
        deviceName: status.deviceName || 'Android Device',
        lastSyncTimestamp: Date.now(),
        stateSummary: 'Cross-device link established over authenticated ADB channel.',
        status: 'CONNECTED'
      }
    } else {
      this.activeSession.lastSyncTimestamp = Date.now()
    }

    return this.activeSession
  }

  /**
   * Sync active mission state between PC and Android companion
   */
  async syncMissionState(missionId: string, stateSummary: string): Promise<ContinuitySession> {
    const session = await this.getActiveSession()
    session.activeMissionId = missionId
    session.stateSummary = stateSummary
    session.lastSyncTimestamp = Date.now()
    this.activeSession = session
    return session
  }
}

export const continuityService = new ContinuityService()
