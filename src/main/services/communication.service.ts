// src/main/services/communication.service.ts — Unified Communication Center Service for ULTRON V1.0.7
import { v4 as uuidv4 } from 'uuid'
import {
  CommunicationItem,
  CommunicationSummary,
  CommunicationType,
  CommunicationStatus
} from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'
import { adbService } from './adb.service'
import { inboxService } from './inbox.service'

export interface SendMessageOptions {
  recipient: string
  message: string
  contactName?: string
  previewOnly?: boolean
  source?: string
}

export interface SendMessageResult {
  success: boolean
  status: 'preview' | 'sent' | 'failed' | 'cancelled'
  item?: CommunicationItem
  message: string
  durationMs: number
}

export class CommunicationService {
  /**
   * Check communication connectivity status across available channels
   */
  async getStatus(): Promise<{
    androidConnected: boolean
    deviceName?: string
    smsAvailable: boolean
    callAvailable: boolean
    activeProviders: string[]
  }> {
    try {
      const details = await adbService.getDeviceDetails()
      const isConnected = details.state === 'device'
      return {
        androidConnected: isConnected,
        deviceName: isConnected ? `${details.manufacturer} ${details.model}`.trim() : undefined,
        smsAvailable: isConnected,
        callAvailable: isConnected,
        activeProviders: isConnected ? ['Android Companion', 'Windows System'] : ['Windows System']
      }
    } catch {
      return {
        androidConnected: false,
        smsAvailable: false,
        callAvailable: false,
        activeProviders: ['Windows System']
      }
    }
  }

  /**
   * Get communication items summary and recent log
   */
  async getSummary(limit = 30): Promise<CommunicationSummary> {
    const items = memoryDatabase.getRecentCommunications(limit)
    const unreadCount = items.filter(i => i.status === 'received').length
    return {
      totalCount: items.length,
      unreadCount,
      recentItems: items,
      lastSync: Date.now()
    }
  }

  /**
   * Retrieve recent communications with optional type filter
   */
  async getRecent(limit = 50, type?: CommunicationType): Promise<CommunicationItem[]> {
    return memoryDatabase.getRecentCommunications(limit, type)
  }

  /**
   * Prepare preview or send an SMS message via Android connection
   */
  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const startMs = performance.now()

    if (!options.recipient || !options.message) {
      return {
        success: false,
        status: 'failed',
        message: 'Recipient and message content are required.',
        durationMs: 0
      }
    }

    // Preview mode: never send silently
    if (options.previewOnly) {
      return {
        success: true,
        status: 'preview',
        message: `Message preview prepared for ${options.contactName || options.recipient}: "${options.message}"`,
        durationMs: parseFloat((performance.now() - startMs).toFixed(2))
      }
    }

    // Verify Android connection before execution
    const status = await this.getStatus()
    if (!status.androidConnected) {
      return {
        success: false,
        status: 'failed',
        message: 'Android device is not connected via ADB. Cannot dispatch SMS.',
        durationMs: parseFloat((performance.now() - startMs).toFixed(2))
      }
    }

    try {
      // Execute SMS dispatch via adb shell
      const escapedBody = options.message.replace(/"/g, '\\"')
      const escapedRecipient = options.recipient.replace(/[^0-9+]/g, '')

      // Send SMS via service command or intent
      const cmd = `service call isms 7 i32 0 s16 "com.android.mms" s16 "${escapedRecipient}" s16 "null" s16 "${escapedBody}" s16 "null" s16 "null"`
      const out = await adbService.executeShellCommand(cmd)

      // Record to communication database
      const item = memoryDatabase.saveCommunicationItem({
        type: 'sms',
        source: 'Android Companion',
        target: options.recipient,
        sender: 'Self',
        title: `SMS to ${options.contactName || options.recipient}`,
        content: options.message,
        status: 'sent',
        metadata: {
          contactName: options.contactName,
          recipient: options.recipient,
          rawOutput: out
        }
      })

      // Also record into universal inbox as an event
      inboxService.addItem({
        source: 'android_sms',
        title: `Sent SMS to ${options.contactName || options.recipient}`,
        content: options.message,
        importance: 'NORMAL',
        actionAvailable: false
      })

      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: true,
        status: 'sent',
        item,
        message: `Successfully sent SMS to ${options.contactName || options.recipient}`,
        durationMs
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: false,
        status: 'failed',
        message: `Failed to send SMS: ${err.message}`,
        durationMs
      }
    }
  }

  /**
   * Ingest an incoming message or notification into the Communication Center
   */
  recordIncoming(item: {
    type: CommunicationType
    source: string
    sender: string
    title: string
    content: string
    metadata?: Record<string, any>
  }): CommunicationItem {
    const commItem = memoryDatabase.saveCommunicationItem({
      type: item.type,
      source: item.source,
      sender: item.sender,
      title: item.title,
      content: item.content,
      status: 'received',
      metadata: item.metadata
    })

    // Forward to universal inbox
    inboxService.addItem({
      source: item.type === 'sms' ? 'android_sms' : 'android_notification',
      title: item.title,
      content: item.content,
      importance: 'NORMAL',
      actionAvailable: true,
      actionLabel: 'View Communication',
      actionPayload: { communicationId: commItem.id }
    })

    return commItem
  }
}

export const communicationService = new CommunicationService()
