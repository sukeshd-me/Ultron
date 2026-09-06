// src/main/services/inbox.service.ts — Universal Inbox Service for ULTRON V1.0.7
import {
  InboxItem,
  InboxSummary,
  InboxImportance,
  InboxItemSource
} from '../../shared/types'
import { memoryDatabase } from '../database/memory.db'

export class InboxService {
  /**
   * Add a new item to the universal inbox
   */
  addItem(item: {
    source: InboxItemSource
    title: string
    content: string
    importance?: InboxImportance
    actionAvailable?: boolean
    actionLabel?: string
    actionPayload?: Record<string, any>
  }): InboxItem {
    return memoryDatabase.saveInboxItem({
      source: item.source,
      title: item.title,
      content: item.content,
      importance: item.importance || 'NORMAL',
      actionAvailable: Boolean(item.actionAvailable),
      actionLabel: item.actionLabel,
      actionPayload: item.actionPayload
    })
  }

  /**
   * Retrieve list of inbox items matching filter criteria
   */
  getItems(filter?: { unreadOnly?: boolean; importance?: string; limit?: number }): InboxItem[] {
    return memoryDatabase.listInboxItems(filter)
  }

  /**
   * Get high-level summary and counts for the universal inbox
   */
  getSummary(): InboxSummary {
    return memoryDatabase.getInboxSummary()
  }

  /**
   * Mark a single inbox item as read
   */
  markRead(id: string): boolean {
    return memoryDatabase.markInboxItemRead(id)
  }

  /**
   * Clear all low-priority notifications
   */
  clearLowPriority(): { clearedCount: number; message: string } {
    const clearedCount = memoryDatabase.clearLowPriorityInbox()
    return {
      clearedCount,
      message: clearedCount > 0
        ? `Successfully cleared ${clearedCount} low-priority inbox items.`
        : 'No low-priority items found in inbox.'
    }
  }

  /**
   * Generate an authentic natural language summary of the current inbox
   */
  summarizeInbox(): string {
    const summary = this.getSummary()
    if (summary.totalCount === 0) {
      return 'Your inbox is completely clear. No new messages or system alerts.'
    }

    const unread = summary.unreadCount
    const urgent = summary.urgentCount
    const high = summary.highCount

    let overview = `You have ${unread} unread item${unread === 1 ? '' : 's'} (${summary.totalCount} total).`
    if (urgent > 0) {
      overview += ` Notice: ${urgent} URGENT notification${urgent === 1 ? '' : 's'} require immediate attention!`
    } else if (high > 0) {
      overview += ` ${high} high-importance notification${high === 1 ? '' : 's'} are waiting.`
    }

    const unreadItems = summary.items.filter(i => !i.isRead).slice(0, 3)
    if (unreadItems.length > 0) {
      const snippets = unreadItems.map(i => `• [${i.importance}] ${i.title}: ${i.content}`).join('\n')
      overview += `\n\nTop unread items:\n${snippets}`
    }

    return overview
  }
}

export const inboxService = new InboxService()
