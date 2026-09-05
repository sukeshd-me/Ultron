// src/main/services/contacts.service.ts — Enhanced Contact Resolver (v1.0.2)
import { adbService } from './adb.service'

export interface Contact {
  id: string
  name: string
  aliases: string[]
  phone: string
  email?: string
  source: 'configured' | 'device'
}

export class ContactsService {
  private configuredContacts: Contact[] = [
    {
      id: 'c1',
      name: 'Sukesh',
      aliases: ['sukesh', 'boss', 'master', 'me'],
      phone: '+1234567890',
      email: 'sukesh@ultron.ai',
      source: 'configured'
    }
  ]

  /**
   * Resolve a contact by query string.
   * Priority: configured contacts -> device contacts via ADB.
   * Returns all matches for ambiguity detection.
   */
  async resolveContact(query: string): Promise<{
    contacts: Contact[]
    exact: boolean
    source: 'configured' | 'device' | 'none'
    duration_ms: number
  }> {
    const startMs = performance.now()
    const q = query.toLowerCase().trim()

    // 1. Check configured contacts first (exact name)
    const exactConfigured = this.configuredContacts.filter(
      (c) =>
        c.name.toLowerCase() === q ||
        c.aliases.some((a) => a.toLowerCase() === q)
    )
    if (exactConfigured.length === 1) {
      return {
        contacts: exactConfigured,
        exact: true,
        source: 'configured',
        duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
      }
    }

    // 2. Check configured contacts (partial match)
    const partialConfigured = this.configuredContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.aliases.some((a) => a.includes(q))
    )
    if (partialConfigured.length > 0) {
      return {
        contacts: partialConfigured,
        exact: partialConfigured.length === 1,
        source: 'configured',
        duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
      }
    }

    // 3. Search device contacts via ADB
    try {
      const deviceResult = await adbService.searchDeviceContacts(q)
      if (deviceResult.contacts.length > 0) {
        const mapped: Contact[] = deviceResult.contacts.map((dc, i) => ({
          id: `device-${i}`,
          name: dc.name,
          aliases: [],
          phone: dc.phone,
          source: 'device' as const
        }))
        return {
          contacts: mapped,
          exact: mapped.length === 1,
          source: 'device',
          duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
        }
      }
    } catch {
      // Device contacts unavailable; fall through
    }

    return {
      contacts: [],
      exact: false,
      source: 'none',
      duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
    }
  }

  /**
   * Legacy sync resolve for configured contacts only
   */
  resolveContactSync(query: string): Contact | null {
    const q = query.toLowerCase().trim()
    return (
      this.configuredContacts.find(
        (c) =>
          c.name.toLowerCase() === q ||
          c.aliases.some((a) => a.toLowerCase() === q) ||
          c.name.toLowerCase().includes(q)
      ) || null
    )
  }

  getAll(): Contact[] {
    return this.configuredContacts
  }
}

export const contactsService = new ContactsService()