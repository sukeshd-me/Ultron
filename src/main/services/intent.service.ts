// src/main/services/intent.service.ts — Deterministic Natural Language Intent Normalizer & Router
export interface ResolvedIntent {
  raw_input: string
  normalized_input: string
  detected_target:
    | 'android'
    | 'windows'
    | 'system'
    | 'network'
    | 'filesystem'
    | 'security'
    | 'research'
    | 'memory'
    | 'unknown'
  detected_intent: string
  confidence: number
  args: Record<string, any>
  requiresConfirmation: boolean
  confirmationPrompt?: string
  tool?: string
}

export interface PendingConfirmation {
  id: string
  intent: string
  target: string
  action: string
  tool: string
  args: Record<string, any>
  createdAt: number
}

export class IntentService {
  private pendingConfirmations = new Map<string, PendingConfirmation>()

  setPendingConfirmation(id: string, conf: PendingConfirmation): void {
    this.pendingConfirmations.set(id, conf)
  }

  getPendingConfirmation(id: string): PendingConfirmation | undefined {
    return this.pendingConfirmations.get(id)
  }

  removePendingConfirmation(id: string): boolean {
    return this.pendingConfirmations.delete(id)
  }

  getLatestPendingConfirmation(): PendingConfirmation | undefined {
    let latest: PendingConfirmation | undefined
    for (const conf of this.pendingConfirmations.values()) {
      if (!latest || conf.createdAt > latest.createdAt) {
        latest = conf
      }
    }
    return latest
  }

  clearPendingConfirmations(): void {
    this.pendingConfirmations.clear()
  }

  /**
   * Normalize user input: lowercase, trim, normalize whitespace, and standardize common variations.
   */
  normalizeInput(raw: string): string {
    if (!raw) return ''
    let s = raw.toLowerCase().trim()

    // Remove polite prefixes
    s = s.replace(/^(hey\s+ultron|ultron|please|can\s+you|could\s+you|would\s+you|hey|ok|okay)\s+/i, '')

    // Standardize contractions
    s = s.replace(/\bwhat's\b/g, 'what is')
    s = s.replace(/\bwho's\b/g, 'who is')
    s = s.replace(/\bhow's\b/g, 'how is')
    s = s.replace(/\blet's\b/g, 'let us')

    // Standardize spacing around punctuation
    s = s.replace(/[?!.,;]/g, ' ')
    return s.replace(/\s+/g, ' ').trim()
  }

  /**
   * Determine target environment: 'android' vs 'windows' vs 'system' vs etc.
   */
  classifyTarget(normalized: string): 'android' | 'windows' | 'system' | 'network' | 'filesystem' | 'security' | 'research' | 'memory' | 'unknown' {
    // 1. Explicit Android scope markers
    if (
      normalized.includes('on my phone') ||
      normalized.includes('on phone') ||
      normalized.includes('on android') ||
      normalized.includes('my phone') ||
      normalized.includes('phone') ||
      normalized.includes('android') ||
      normalized.includes('adb') ||
      normalized.startsWith('call ') ||
      normalized.startsWith('dial ') ||
      normalized.startsWith('ring ') ||
      normalized === 'hang up' ||
      normalized.includes('hang up') ||
      normalized.includes('end call') ||
      normalized.includes('cut the call') ||
      normalized.includes('mute call') ||
      normalized.includes('hold call')
    ) {
      return 'android'
    }

    // 2. Explicit Windows/PC scope markers
    if (
      normalized.includes('my pc') ||
      normalized.includes('my computer') ||
      normalized.includes('on pc') ||
      normalized.includes('windows')
    ) {
      return 'windows'
    }

    // 3. System diagnostics
    if (
      normalized.includes('cpu') ||
      normalized.includes('ram') ||
      normalized.includes('memory') ||
      normalized.includes('disk') ||
      normalized.includes('storage') ||
      normalized.includes('process') ||
      normalized.includes('time') ||
      normalized.includes('date')
    ) {
      return 'system'
    }

    // 4. Network
    if (
      normalized.includes('wifi') ||
      normalized.includes('wi-fi') ||
      normalized.includes('ip address') ||
      normalized.includes('adapter')
    ) {
      return 'network'
    }

    // 5. Filesystem
    if (
      normalized.includes('folder') ||
      normalized.includes('file') ||
      normalized.startsWith('mkdir') ||
      normalized.startsWith('read ') ||
      normalized.startsWith('copy ') ||
      normalized.startsWith('move ') ||
      normalized.startsWith('delete ')
    ) {
      return 'filesystem'
    }

    // 6. Security
    if (
      normalized.includes('firewall') ||
      normalized.includes('defender') ||
      normalized.includes('ports') ||
      normalized.includes('vulnerability')
    ) {
      return 'security'
    }

    // 7. Research
    if (
      normalized.startsWith('search ') ||
      normalized.startsWith('research ') ||
      normalized.startsWith('google ') ||
      normalized.includes('youtube')
    ) {
      return 'research'
    }

    // 8. Memory
    if (
      normalized.startsWith('remember ') ||
      normalized.startsWith('recall ') ||
      normalized.includes('saved memory') ||
      normalized.includes('my memories')
    ) {
      return 'memory'
    }

    // 9. Standard Windows application launching
    if (
      normalized.startsWith('open ') ||
      normalized.startsWith('launch ') ||
      normalized.startsWith('start ')
    ) {
      return 'windows'
    }

    return 'unknown'
  }

  /**
   * Main entry point: Resolve natural language input into a typed, structured intent.
   */
  resolve(raw: string): ResolvedIntent {
    const normalized = this.normalizeInput(raw)

    // Check if confirming/cancelling an active pending confirmation (e.g. user says "yes" / "no")
    const pending = this.getLatestPendingConfirmation()
    if (pending && Date.now() - pending.createdAt < 60000) {
      if (['yes', 'confirm', 'proceed', 'sure', 'do it', 'yep', 'yeah', 'ok', 'okay', 'approve'].includes(normalized)) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: pending.target as any,
          detected_intent: 'system.confirm_action',
          confidence: 0.99,
          args: { confirmationId: pending.id, confirmed: true },
          requiresConfirmation: false,
          tool: pending.tool
        }
      }
      if (['no', 'cancel', 'stop', 'abort', "don't", 'do not', 'nevermind', 'nope'].includes(normalized)) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: pending.target as any,
          detected_intent: 'system.cancel_action',
          confidence: 0.99,
          args: { confirmationId: pending.id, confirmed: false },
          requiresConfirmation: false
        }
      }
    }

    const target = this.classifyTarget(normalized)

    // ────────────────────────────────────────────────────────────
    // A. ANDROID INTENTS (18 Structured Intents)
    // ────────────────────────────────────────────────────────────
    if (target === 'android') {
      // 1. android.power_off
      // "turn off my phone", "power off my phone", "switch off my phone", "shut down my phone"
      if (
        (normalized.includes('turn off') ||
          normalized.includes('power off') ||
          normalized.includes('switch off') ||
          normalized.includes('shut down') ||
          normalized.includes('shutdown')) &&
        (normalized.includes('phone') || normalized.includes('android'))
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.power_off',
          confidence: 0.99,
          args: {},
          requiresConfirmation: true,
          confirmationPrompt: 'Do you want me to turn off your phone?',
          tool: 'android.powerOff'
        }
      }

      // 2. android.restart
      // "restart my phone", "reboot my phone"
      if (
        (normalized.includes('restart') || normalized.includes('reboot')) &&
        (normalized.includes('phone') || normalized.includes('android'))
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.restart',
          confidence: 0.98,
          args: {},
          requiresConfirmation: true,
          confirmationPrompt: 'Do you want me to restart your phone?',
          tool: 'android.restart'
        }
      }

      // 3. android.lock
      // "lock my phone", "lock phone", "turn off phone screen"
      if (
        (normalized.includes('lock') && (normalized.includes('phone') || normalized.includes('screen'))) ||
        normalized === 'lock phone' ||
        normalized === 'lock my phone'
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.lock',
          confidence: 0.95,
          args: {},
          requiresConfirmation: false,
          tool: 'android.lock'
        }
      }

      // 4. android.get_battery
      // "what is my phone battery", "phone battery level", "check phone battery", "battery of my phone"
      if (
        normalized.includes('battery') &&
        (normalized.includes('phone') || normalized.includes('android') || normalized.includes('device'))
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.get_battery',
          confidence: 0.96,
          args: {},
          requiresConfirmation: false,
          tool: 'android.getBattery'
        }
      }

      // 5. android.open_app
      // "open YouTube on my phone", "launch Spotify on phone", "start WhatsApp on android"
      if (
        (normalized.includes('on my phone') ||
          normalized.includes('on phone') ||
          normalized.includes('on android') ||
          normalized.includes('in my phone')) &&
        (normalized.startsWith('open ') || normalized.startsWith('launch ') || normalized.startsWith('start '))
      ) {
        const appName = raw
          .replace(/^(hey\s+ultron|ultron|please|can\s+you|could\s+you|would\s+you|hey|ok|okay)\s+/i, '')
          .replace(/^(open|launch|start)\s+/i, '')
          .replace(/\s*(on\s+my\s+phone|on\s+phone|on\s+my\s+android|on\s+android|in\s+my\s+phone)\s*$/i, '')
          .trim() || normalized
          .replace(/^(open|launch|start)\s+/i, '')
          .replace(/\s*(on\s+my\s+phone|on\s+phone|on\s+my\s+android|on\s+android|in\s+my\s+phone)\s*$/i, '')
          .trim()

        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.open_app',
          confidence: 0.98,
          args: { appName },
          requiresConfirmation: false,
          tool: 'android.openApp'
        }
      }

      // 6. android.search_app
      // "find YouTube on phone", "search app Spotify on phone"
      if (
        (normalized.startsWith('search app') || normalized.startsWith('find app') || normalized.startsWith('search for app')) &&
        (normalized.includes('phone') || normalized.includes('android'))
      ) {
        const appName = raw
          .replace(/^(hey\s+ultron|ultron|please|can\s+you|could\s+you|would\s+you|hey|ok|okay)\s+/i, '')
          .replace(/^(search\s+app|find\s+app|search\s+for\s+app)\s+/i, '')
          .replace(/\s*(on\s+my\s+phone|on\s+phone|on\s+android)\s*$/i, '')
          .trim() || normalized
          .replace(/^(search\s+app|find\s+app|search\s+for\s+app)\s+/i, '')
          .replace(/\s*(on\s+my\s+phone|on\s+phone|on\s+android)\s*$/i, '')
          .trim()

        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.search_app',
          confidence: 0.92,
          args: { appName },
          requiresConfirmation: false,
          tool: 'android.openApp'
        }
      }

      // 7. android.call_contact
      // "call Sukesh", "dial Sukesh", "phone Sukesh"
      if (
        normalized.startsWith('call ') ||
        normalized.startsWith('dial ') ||
        normalized.startsWith('phone ')
      ) {
        const contactName = raw
          .replace(/^(hey\s+ultron|ultron|please|can\s+you|could\s+you|would\s+you|hey|ok|okay)\s+/i, '')
          .replace(/^(call|dial|phone)\s+/i, '')
          .trim() || normalized.replace(/^(call|dial|phone)\s+/i, '').trim()
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.call_contact',
          confidence: 0.97,
          args: { contactName },
          requiresConfirmation: false,
          tool: 'android.callContact'
        }
      }

      // 8. android.search_contact
      // "search contact Sukesh", "find contact Sukesh", "find Sukesh in contacts"
      if (
        normalized.startsWith('search contact') ||
        normalized.startsWith('find contact') ||
        (normalized.includes('in contacts') && (normalized.startsWith('find') || normalized.startsWith('search')))
      ) {
        const contactName = normalized
          .replace(/^(search\s+contact|find\s+contact)\s+/i, '')
          .replace(/\s+in\s+contacts\s*$/i, '')
          .replace(/^(find|search)\s+/i, '')
          .trim()

        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.search_contact',
          confidence: 0.94,
          args: { contactName },
          requiresConfirmation: false,
          tool: 'android.searchContact'
        }
      }

      // 9. android.end_call
      // "hang up", "end call", "cut the call", "disconnect call", "stop call"
      if (
        normalized === 'hang up' ||
        normalized === 'end call' ||
        normalized === 'end the call' ||
        normalized === 'cut the call' ||
        normalized === 'cut call' ||
        normalized === 'disconnect call' ||
        normalized === 'stop the call' ||
        normalized.includes('hang up') ||
        normalized.includes('end call') ||
        normalized.includes('cut the call')
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.end_call',
          confidence: 0.98,
          args: {},
          requiresConfirmation: false,
          tool: 'android.endCall'
        }
      }

      // 10. android.mute_call
      // "mute call", "mute the call", "mute my call", "mute phone"
      if (
        normalized === 'mute call' ||
        normalized === 'mute the call' ||
        normalized === 'mute my call' ||
        normalized === 'mute phone' ||
        normalized.includes('mute call') ||
        normalized.includes('mute the call') ||
        normalized.includes('mute my call')
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.mute_call',
          confidence: 0.96,
          args: { mute: true },
          requiresConfirmation: false,
          tool: 'android.muteCall'
        }
      }

      // 11. android.unmute_call
      // "unmute call", "unmute the call", "unmute my call", "unmute phone"
      if (
        normalized === 'unmute call' ||
        normalized === 'unmute the call' ||
        normalized === 'unmute my call' ||
        normalized === 'unmute phone' ||
        normalized.includes('unmute')
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.unmute_call',
          confidence: 0.96,
          args: { mute: false },
          requiresConfirmation: false,
          tool: 'android.muteCall'
        }
      }

      // 12. android.hold_call
      // "put the call on hold", "hold this call", "hold call", "put on hold"
      if (
        normalized.includes('hold call') ||
        normalized.includes('hold the call') ||
        normalized.includes('hold this call') ||
        normalized.includes('put on hold') ||
        normalized.includes('put the call on hold')
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.hold_call',
          confidence: 0.95,
          args: { hold: true },
          requiresConfirmation: false,
          tool: 'android.holdCall'
        }
      }

      // 13. android.resume_call
      // "resume call", "take call off hold", "unhold call"
      if (
        normalized.includes('resume call') ||
        normalized.includes('resume the call') ||
        normalized.includes('off hold') ||
        normalized.includes('unhold')
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.resume_call',
          confidence: 0.95,
          args: { hold: false },
          requiresConfirmation: false,
          tool: 'android.resumeCall'
        }
      }

      // 14. android.second_call
      // "answer second call", "take second call"
      if (normalized.includes('second call') && (normalized.includes('answer') || normalized.includes('take'))) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.second_call',
          confidence: 0.92,
          args: {},
          requiresConfirmation: false,
          tool: 'android.secondCall'
        }
      }

      // 15. android.merge_call
      // "merge call", "merge calls", "conference call", "merge the call"
      if (normalized.includes('merge call') || normalized.includes('merge calls') || normalized.includes('conference call')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.merge_call',
          confidence: 0.94,
          args: {},
          requiresConfirmation: false,
          tool: 'android.mergeCalls'
        }
      }

      // 16. android.swap_call
      // "swap call", "switch call", "swap between calls"
      if (normalized.includes('swap call') || normalized.includes('switch call') || normalized.includes('swap calls')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.swap_call',
          confidence: 0.93,
          args: {},
          requiresConfirmation: false,
          tool: 'android.swapCalls'
        }
      }

      // 17. android.connect
      // "connect my phone", "connect phone", "link phone", "pair phone", "adb connect"
      if (
        normalized.includes('connect my phone') ||
        normalized.includes('connect phone') ||
        normalized.includes('connect to phone') ||
        normalized.includes('connect to my phone') ||
        normalized.includes('connect android') ||
        normalized.includes('link phone') ||
        normalized.includes('pair phone') ||
        normalized.includes('adb connect')
      ) {
        const ipMatch = raw.match(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/)
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.connect',
          confidence: 0.98,
          args: ipMatch ? { target: ipMatch[0] } : {},
          requiresConfirmation: false,
          tool: 'adb.connect'
        }
      }

      // 18. android.device_status
      // "phone status", "check my phone", "what is my phone status", "is phone connected", "phone state"
      if (
        normalized.includes('phone status') ||
        normalized.includes('phone state') ||
        normalized.includes('check phone') ||
        normalized.includes('check my phone') ||
        normalized.includes('is phone connected') ||
        normalized.includes('call status') ||
        normalized === 'phone'
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.device_status',
          confidence: 0.96,
          args: {},
          requiresConfirmation: false,
          tool: 'android.getPhoneState'
        }
      }
    }

    // ────────────────────────────────────────────────────────────
    // B. SYSTEM DIAGNOSTICS INTENTS
    // ────────────────────────────────────────────────────────────
    if (target === 'system') {
      if (normalized.includes('time') && (normalized.includes('what') || normalized.includes('tell') || normalized.includes('current') || normalized.includes('show') || normalized === 'time')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'system',
          detected_intent: 'system.get_time',
          confidence: 0.99,
          args: {},
          requiresConfirmation: false,
          tool: 'system.getTime'
        }
      }

      if (normalized.includes('date') || normalized.includes('today') || normalized.includes('day')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'system',
          detected_intent: 'system.get_date',
          confidence: 0.98,
          args: {},
          requiresConfirmation: false,
          tool: 'system.getDate'
        }
      }

      if (normalized.includes('cpu') || normalized.includes('processor')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'system',
          detected_intent: 'system.get_cpu',
          confidence: 0.98,
          args: {},
          requiresConfirmation: false,
          tool: 'system.getCpu'
        }
      }

      if (normalized.includes('memory') || normalized.includes('ram')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'system',
          detected_intent: 'system.get_memory',
          confidence: 0.98,
          args: {},
          requiresConfirmation: false,
          tool: 'system.getMemory'
        }
      }

      if (normalized.includes('disk') || normalized.includes('storage') || normalized.includes('drive space')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'system',
          detected_intent: 'system.get_disk',
          confidence: 0.97,
          args: {},
          requiresConfirmation: false,
          tool: 'system.getDisk'
        }
      }

      if (normalized.includes('process') || normalized.includes('running processes') || normalized.includes('tasks')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'system',
          detected_intent: 'system.get_processes',
          confidence: 0.95,
          args: {},
          requiresConfirmation: false,
          tool: 'system.getProcesses'
        }
      }
    }

    // ────────────────────────────────────────────────────────────
    // C. WINDOWS APP & CONTROL INTENTS
    // ────────────────────────────────────────────────────────────
    if (target === 'windows') {
      // Disambiguation: "turn off my PC" -> Windows power operation
      if (
        (normalized.includes('turn off') ||
          normalized.includes('shut down') ||
          normalized.includes('shutdown') ||
          normalized.includes('power off')) &&
        (normalized.includes('pc') || normalized.includes('computer') || normalized.includes('windows'))
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'windows',
          detected_intent: 'windows.power_off',
          confidence: 0.98,
          args: {},
          requiresConfirmation: true,
          confirmationPrompt: 'Do you want me to shut down your PC?',
          tool: 'system.power'
        }
      }

      if (
        normalized.startsWith('open ') ||
        normalized.startsWith('launch ') ||
        normalized.startsWith('start ') ||
        normalized.startsWith('run ')
      ) {
        const cleanApp = normalized.replace(/^(open|launch|start|run)\s+/i, '').trim()
        if (cleanApp.includes('settings')) {
          const page = cleanApp.includes('wifi') ? 'wifi' : cleanApp.includes('bluetooth') ? 'bluetooth' : 'system'
          return {
            raw_input: raw,
            normalized_input: normalized,
            detected_target: 'windows',
            detected_intent: 'windows.open_settings',
            confidence: 0.95,
            args: { page },
            requiresConfirmation: false,
            tool: 'settings.open'
          }
        }

        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'windows',
          detected_intent: 'windows.open_app',
          confidence: 0.97,
          args: { app: cleanApp },
          requiresConfirmation: false,
          tool: 'apps.open'
        }
      }
    }

    // ────────────────────────────────────────────────────────────
    // D. NETWORK & SECURITY & OTHER
    // ────────────────────────────────────────────────────────────
    if (target === 'network') {
      if (normalized.includes('wifi') || normalized.includes('wi-fi')) {
        if (normalized.includes('turn on') || normalized.includes('enable')) {
          return {
            raw_input: raw,
            normalized_input: normalized,
            detected_target: 'network',
            detected_intent: 'network.enable_wifi',
            confidence: 0.96,
            args: {},
            requiresConfirmation: false,
            tool: 'network.enableWifi'
          }
        }
        if (normalized.includes('turn off') || normalized.includes('disable')) {
          return {
            raw_input: raw,
            normalized_input: normalized,
            detected_target: 'network',
            detected_intent: 'network.disable_wifi',
            confidence: 0.96,
            args: {},
            requiresConfirmation: false,
            tool: 'network.disableWifi'
          }
        }
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'network',
          detected_intent: 'network.get_wifi_status',
          confidence: 0.97,
          args: {},
          requiresConfirmation: false,
          tool: 'network.getWifiStatus'
        }
      }

      if (normalized.includes('ip')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'network',
          detected_intent: 'network.get_ip',
          confidence: 0.96,
          args: {},
          requiresConfirmation: false,
          tool: 'network.getIp'
        }
      }
    }

    // Default: Unrecognized intent
    return {
      raw_input: raw,
      normalized_input: normalized,
      detected_target: 'unknown',
      detected_intent: 'unknown',
      confidence: 0.0,
      args: {},
      requiresConfirmation: false
    }
  }
}

export const intentService = new IntentService()
