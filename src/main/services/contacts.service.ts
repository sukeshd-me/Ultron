// src/main/services/contacts.service.ts — High-Performance Real Android Contact Resolver (v1.0.2)
import { adbService } from './adb.service'

export interface ContactNumber {
  number: string
  cleanNumber: string
  type: 'mobile' | 'home' | 'work' | 'other'
  isPrimary: boolean
}

export interface DeviceContact {
  id: string
  name: string
  normalizedName: string
  nameTokens: string[]
  numbers: ContactNumber[]
}

export type ContactResolutionStatus =
  | 'RESOLVED'
  | 'MULTIPLE_MATCHES'
  | 'NO_NUMBER'
  | 'AMBIGUOUS_NUMBERS'
  | 'NOT_FOUND'
  | 'DISCONNECTED'

export interface ContactResolutionResult {
  status: ContactResolutionStatus
  contact?: DeviceContact
  selectedNumber?: string
  matchingNames?: string[]
  availableNumbers?: ContactNumber[]
  message: string
  telemetry: {
    contact_cache_lookup_ms: number
    contact_resolution_ms: number
    total_ms: number
  }
}

/**
 * Checks whether two phone number representations represent the same telephone destination
 * (e.g. +919842609507 vs 09842609507, or with/without country prefix / domestic trunk 0).
 */
export function arePhoneNumbersEquivalent(num1: string, num2: string): boolean {
  if (!num1 || !num2) return false
  const d1 = num1.replace(/[^0-9]/g, '')
  const d2 = num2.replace(/[^0-9]/g, '')
  if (d1 === d2) return true
  // Standard national number matching: compare last 10 digits
  if (d1.length >= 10 && d2.length >= 10 && d1.slice(-10) === d2.slice(-10)) {
    return true
  }
  // Check if one suffix matches the other (e.g. 09842609507 and 9842609507) if length >= 7
  if (d1.length >= 7 && d2.length >= 7 && (d1.endsWith(d2) || d2.endsWith(d1))) {
    return true
  }
  return false
}

/**
 * Validates whether a phone number is plausible, non-empty, and NOT a placeholder/test number.
 * Reject: +1234567890, 1234567890, all identical repeating digits, obvious trivial sequences.
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') return false
  const clean = phoneNumber.replace(/[^0-9+]/g, '')
  const digits = clean.replace(/[^0-9]/g, '')

  // Length check: min 3 digits (emergency numbers), max 16 digits
  if (digits.length < 3 || digits.length > 16) return false

  // Reject hardcoded fake/test numbers
  if (clean === '+1234567890' || clean === '1234567890') return false

  // Reject all repeated identical digits (e.g. 0000000000, 1111111111) if length > 3
  if (/^(\d)\1+$/.test(digits) && digits.length > 3) return false

  // Reject obvious trivial sequential digits if length >= 7
  if (digits.length >= 7) {
    if ('0123456789'.includes(digits) || '9876543210'.includes(digits)) return false
  }

  return true
}

/**
 * Normalizes contact names for deterministic matching:
 * - Lowercases text
 * - Preserves Unicode letters and digits (e.g. regional scripts or accents)
 * - Normalizes whitespace and strips punctuation
 */
export function normalizeName(name: string): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export class ContactsService {
  private cachedContacts: DeviceContact[] = []
  private exactNameMap = new Map<string, DeviceContact[]>()
  private tokenMap = new Map<string, Set<DeviceContact>>()
  private lastLoadedAt: number = 0
  private cacheTtlMs: number = 5 * 60 * 1000 // 5 minutes cache TTL

  /**
   * Check if the in-memory contact index is warm and fresh
   */
  isCacheFresh(): boolean {
    return this.cachedContacts.length > 0 && Date.now() - this.lastLoadedAt < this.cacheTtlMs
  }

  /**
   * Invalidate the in-memory cache (called on phone disconnect/reconnect or explicit refresh)
   */
  invalidateCache(): void {
    this.cachedContacts = []
    this.exactNameMap.clear()
    this.tokenMap.clear()
    this.lastLoadedAt = 0
  }

  /**
   * Populate the in-memory contact index from the connected device via ADB
   */
  async loadDeviceContacts(force = false): Promise<{ count: number; duration_ms: number; error?: string }> {
    if (!force && this.isCacheFresh()) {
      return { count: this.cachedContacts.length, duration_ms: 0 }
    }

    const startMs = performance.now()
    const rawResult = await adbService.fetchRawDeviceContacts()

    if (rawResult.error || rawResult.rows.length === 0) {
      this.invalidateCache()
      return {
        count: 0,
        duration_ms: rawResult.duration_ms,
        error: rawResult.error || 'No contacts found on device'
      }
    }

    // Group rows by normalized displayName so multi-account contacts (SIM, Google, WhatsApp) consolidate
    const contactMap = new Map<string, { id: string; name: string; numbers: ContactNumber[] }>()

    for (const row of rawResult.rows) {
      const cleanNum = row.phoneNumber.replace(/[^0-9+]/g, '')
      if (!isValidPhoneNumber(cleanNum)) continue

      let type: ContactNumber['type'] = 'other'
      if (row.type === 1) type = 'home'
      else if (row.type === 2) type = 'mobile'
      else if (row.type === 3) type = 'work'

      const normName = normalizeName(row.displayName)
      if (!normName) continue

      const key = `name_${normName}`
      let existing = contactMap.get(key)
      if (!existing) {
        existing = {
          id: row.contactId || `c_${contactMap.size + 1}`,
          name: row.displayName,
          numbers: []
        }
        contactMap.set(key, existing)
      }

      // Check if this contact already has an equivalent phone number
      const existingNum = existing.numbers.find((n) => arePhoneNumbersEquivalent(n.cleanNumber, cleanNum))
      if (!existingNum) {
        existing.numbers.push({
          number: row.phoneNumber,
          cleanNumber: cleanNum,
          type,
          isPrimary: row.isPrimary
        })
      } else {
        // Upgrade format: prefer international prefix (+...) over domestic prefix (0...)
        if (cleanNum.startsWith('+') && !existingNum.cleanNumber.startsWith('+')) {
          existingNum.number = row.phoneNumber
          existingNum.cleanNumber = cleanNum
        }
        if (row.isPrimary) {
          existingNum.isPrimary = true
        }
      }
    }

    // Build indexing structures
    this.cachedContacts = []
    this.exactNameMap.clear()
    this.tokenMap.clear()

    for (const rawContact of contactMap.values()) {
      const normalized = normalizeName(rawContact.name)
      if (!normalized) continue

      const tokens = normalized.split(' ').filter(Boolean)

      const deviceContact: DeviceContact = {
        id: rawContact.id,
        name: rawContact.name,
        normalizedName: normalized,
        nameTokens: tokens,
        numbers: rawContact.numbers
      }

      this.cachedContacts.push(deviceContact)

      // Exact name index
      const exactList = this.exactNameMap.get(normalized) || []
      exactList.push(deviceContact)
      this.exactNameMap.set(normalized, exactList)

      // Token index
      for (const token of tokens) {
        let set = this.tokenMap.get(token)
        if (!set) {
          set = new Set()
          this.tokenMap.set(token, set)
        }
        set.add(deviceContact)
      }
    }

    this.lastLoadedAt = Date.now()
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { count: this.cachedContacts.length, duration_ms }
  }

  /**
   * Resolve a contact strictly against the connected Android phone's real contacts.
   * Zero fabricated numbers, zero cloud queries, zero fallback numbers.
   */
  async resolveContact(query: string): Promise<ContactResolutionResult> {
    const totalStartMs = performance.now()
    const qRaw = (query || '').trim()
    const qNorm = normalizeName(qRaw)

    if (!qNorm) {
      const dur = parseFloat((performance.now() - totalStartMs).toFixed(2))
      return {
        status: 'NOT_FOUND',
        message: "I couldn't find that contact on your phone.",
        telemetry: { contact_cache_lookup_ms: dur, contact_resolution_ms: dur, total_ms: dur }
      }
    }

    // Ensure cache is loaded
    if (!this.isCacheFresh()) {
      const loadRes = await this.loadDeviceContacts()
      if (loadRes.error && this.cachedContacts.length === 0) {
        const dur = parseFloat((performance.now() - totalStartMs).toFixed(2))
        return {
          status: 'DISCONNECTED',
          message: "I couldn't access your phone's contacts. Please ensure your Android phone is connected and unlocked.",
          telemetry: { contact_cache_lookup_ms: 0, contact_resolution_ms: dur, total_ms: dur }
        }
      }
    }

    const lookupStartMs = performance.now()

    // ── STAGE 1: Exact Name Lookup (Map lookup) ──
    const exactMatches = this.exactNameMap.get(qNorm) || []
    let matchedContacts: DeviceContact[] = []

    if (exactMatches.length > 0) {
      matchedContacts = exactMatches
    } else {
      // ── STAGE 2: Token / Word Matching ──
      const qTokens = qNorm.split(' ').filter(Boolean)
      if (qTokens.length === 1) {
        const tokenSet = this.tokenMap.get(qTokens[0])
        if (tokenSet) {
          matchedContacts = Array.from(tokenSet)
        }
      } else if (qTokens.length > 1) {
        // Multi-token: find contacts that contain all tokens
        const candidateSets = qTokens
          .map((t) => this.tokenMap.get(t) || new Set<DeviceContact>())
          .sort((a, b) => a.size - b.size)

        if (candidateSets[0] && candidateSets[0].size > 0) {
          matchedContacts = Array.from(candidateSets[0]).filter((c) =>
            qTokens.every((t) => c.nameTokens.includes(t) || c.normalizedName.includes(t))
          )
        }
      }

      // ── STAGE 3: Substring Fallback if still 0 matches ──
      if (matchedContacts.length === 0) {
        matchedContacts = this.cachedContacts.filter(
          (c) => c.normalizedName.includes(qNorm) || qNorm.includes(c.normalizedName)
        )
      }
    }

    const lookupEndMs = performance.now()
    const cacheLookupMs = parseFloat((lookupEndMs - lookupStartMs).toFixed(2))

    // ── EVALUATION ──

    // Case 1: No match found
    if (matchedContacts.length === 0) {
      const totalDur = parseFloat((performance.now() - totalStartMs).toFixed(2))
      return {
        status: 'NOT_FOUND',
        message: `I couldn't find ${qRaw} in your phone contacts.`,
        telemetry: {
          contact_cache_lookup_ms: cacheLookupMs,
          contact_resolution_ms: totalDur,
          total_ms: totalDur
        }
      }
    }

    // Case 2: Multiple distinct contacts match
    // E.g., user said "Call Sukesh", and phone has "Sukesh D", "Sukesh Friend Sri Hari", etc.
    if (matchedContacts.length > 1) {
      const exactCandidate = matchedContacts.find((c) => c.normalizedName === qNorm)
      if (exactCandidate && matchedContacts.filter((c) => c.normalizedName === qNorm).length === 1) {
        // One of the candidates is an EXACT match to the entire query!
        matchedContacts = [exactCandidate]
      } else {
        // Truly ambiguous: return compact list and refuse to dial
        const candidateNames = Array.from(new Set(matchedContacts.map((c) => c.name))).slice(0, 6)
        const totalDur = parseFloat((performance.now() - totalStartMs).toFixed(2))
        return {
          status: 'MULTIPLE_MATCHES',
          matchingNames: candidateNames,
          message: `I found multiple contacts named ${qRaw}: ${candidateNames.join(', ')}. Which one did you mean?`,
          telemetry: {
            contact_cache_lookup_ms: cacheLookupMs,
            contact_resolution_ms: totalDur,
            total_ms: totalDur
          }
        }
      }
    }

    // Exactly 1 contact resolved
    const contact = matchedContacts[0]

    // Deduplicate equivalent phone numbers for this contact
    const distinctNumbers: ContactNumber[] = []
    for (const num of contact.numbers) {
      if (!distinctNumbers.some((d) => arePhoneNumbersEquivalent(d.cleanNumber, num.cleanNumber))) {
        distinctNumbers.push(num)
      }
    }

    // Case 3: Contact has no valid phone numbers
    if (distinctNumbers.length === 0) {
      const totalDur = parseFloat((performance.now() - totalStartMs).toFixed(2))
      return {
        status: 'NO_NUMBER',
        contact,
        message: `Contact "${contact.name}" has no phone number saved on your phone.`,
        telemetry: {
          contact_cache_lookup_ms: cacheLookupMs,
          contact_resolution_ms: totalDur,
          total_ms: totalDur
        }
      }
    }

    // Case 4: Contact has phone numbers -> Select primary/mobile or ask
    let selectedNumber: string | null = null

    if (distinctNumbers.length === 1) {
      selectedNumber = distinctNumbers[0].cleanNumber
    } else {
      // Multiple distinct numbers:
      // Priority 1: Marked as isPrimary
      const primaryNum = distinctNumbers.find((n) => n.isPrimary)
      if (primaryNum) {
        selectedNumber = primaryNum.cleanNumber
      } else {
        // Priority 2: Unique mobile number
        const mobileNums = distinctNumbers.filter((n) => n.type === 'mobile')
        if (mobileNums.length === 1) {
          selectedNumber = mobileNums[0].cleanNumber
        }
      }

      // If still ambiguous without single clear primary/mobile, ask user
      if (!selectedNumber) {
        const totalDur = parseFloat((performance.now() - totalStartMs).toFixed(2))
        const numOptions = distinctNumbers.map((n) => `[${n.type.toUpperCase()}: ${n.number}]`).join(' ')
        return {
          status: 'AMBIGUOUS_NUMBERS',
          contact,
          availableNumbers: distinctNumbers,
          message: `Which number should I call for ${contact.name}? ${numOptions}`,
          telemetry: {
            contact_cache_lookup_ms: cacheLookupMs,
            contact_resolution_ms: totalDur,
            total_ms: totalDur
          }
        }
      }
    }

    if (!selectedNumber || !isValidPhoneNumber(selectedNumber)) {
      const totalDur = parseFloat((performance.now() - totalStartMs).toFixed(2))
      return {
        status: 'NO_NUMBER',
        contact,
        message: `Contact "${contact.name}" does not have a valid phone number.`,
        telemetry: {
          contact_cache_lookup_ms: cacheLookupMs,
          contact_resolution_ms: totalDur,
          total_ms: totalDur
        }
      }
    }

    const totalDur = parseFloat((performance.now() - totalStartMs).toFixed(2))
    return {
      status: 'RESOLVED',
      contact,
      selectedNumber,
      message: `Found ${contact.name}`,
      telemetry: {
        contact_cache_lookup_ms: cacheLookupMs,
        contact_resolution_ms: totalDur,
        total_ms: totalDur
      }
    }
  }

  /**
   * Sync resolver over the in-memory contact index
   */
  resolveContactSync(query: string): DeviceContact | null {
    const qNorm = normalizeName(query)
    if (!qNorm) return null
    const exact = this.exactNameMap.get(qNorm)
    if (exact && exact.length > 0) return exact[0]
    return this.cachedContacts.find((c) => c.normalizedName.includes(qNorm) || c.nameTokens.includes(qNorm)) || null
  }

  /**
   * Get all currently indexed device contacts
   */
  getAll(): DeviceContact[] {
    return this.cachedContacts
  }

  /**
   * Inspect cache health
   */
  getContactIndexStats(): { totalContacts: number; isFresh: boolean; lastLoadedAt: number } {
    return {
      totalContacts: this.cachedContacts.length,
      isFresh: this.isCacheFresh(),
      lastLoadedAt: this.lastLoadedAt
    }
  }
}

export const contactsService = new ContactsService()