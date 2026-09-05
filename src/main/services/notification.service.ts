// src/main/services/notification.service.ts — Smart Notifications for ULTRON V1.0.5
import { memoryDatabase } from '../database/memory.db'
import { UltronNotification } from '../../shared/types'

export class NotificationService {
  private listeners: Set<(notif: UltronNotification) => void> = new Set()

  subscribe(callback: (notif: UltronNotification) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  sendNotification(title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', actionUrl?: string): UltronNotification {
    const notif = memoryDatabase.saveNotification({ title, message, type, actionUrl })
    for (const listener of this.listeners) {
      try { listener(notif) } catch {}
    }
    return notif
  }

  list(limit = 20): UltronNotification[] {
    return memoryDatabase.listNotifications(limit)
  }

  dismiss(id: string): boolean {
    return memoryDatabase.dismissNotification(id)
  }

  clearAll(): boolean {
    return memoryDatabase.clearNotifications()
  }
}

export const notificationService = new NotificationService()
