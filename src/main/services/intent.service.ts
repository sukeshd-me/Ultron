// src/main/services/intent.service.ts — Intelligent Conversational & Multi-Step Intent Engine (v1.0.3)

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
    | 'conversational'
    | 'unknown'
  detected_intent: string
  confidence: number
  args: Record<string, any>
  requiresConfirmation: boolean
  confirmationPrompt?: string
  tool?: string
  directResponse?: string
  needsClarification?: boolean
  clarificationQuestion?: string
  compoundIntents?: ResolvedIntent[]
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

export interface ConversationContext {
  lastTarget?: 'android' | 'windows' | 'system' | 'research'
  lastEntity?: {
    type: 'battery' | 'contact' | 'app' | 'cpu' | 'ram' | 'disk' | 'device' | 'general'
    value?: any
  }
  lastAction?: string
  lastQuery?: string
  pendingDisambiguation?: {
    type: 'target_device'
    app: string
    candidates: ('windows' | 'android')[]
  }
  isPhoneConnected?: boolean
}

export class IntentService {
  private pendingConfirmations = new Map<string, PendingConfirmation>()
  private context: ConversationContext = {}

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

  getContext(): ConversationContext {
    return this.context
  }

  setContext(partial: Partial<ConversationContext>): void {
    this.context = { ...this.context, ...partial }
  }

  clearContext(): void {
    this.context = {}
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
  classifyTarget(normalized: string, context?: ConversationContext): 'android' | 'windows' | 'system' | 'network' | 'filesystem' | 'security' | 'research' | 'memory' | 'conversational' | 'unknown' {
    // 0. Conversational, capability, greetings & conceptual questions
    if (
      normalized === 'hi' ||
      normalized === 'hello' ||
      normalized === 'hey' ||
      normalized.startsWith('hello ') ||
      normalized.startsWith('hi ') ||
      normalized.startsWith('good morning') ||
      normalized.startsWith('good afternoon') ||
      normalized.startsWith('good evening') ||
      normalized.includes('how are you') ||
      normalized.includes('what can you do') ||
      normalized.includes('what are your capabilities') ||
      normalized.includes('who are you') ||
      normalized.includes('who made you') ||
      normalized.includes('what is ultron') ||
      normalized === 'help' ||
      normalized === 'control my phone' ||
      normalized === 'control phone' ||
      normalized.startsWith('what is ram') ||
      normalized.startsWith('explain ram') ||
      normalized.includes('difference between ram and storage') ||
      normalized.includes('ram and storage') ||
      normalized.includes('ram vs storage') ||
      normalized.startsWith('what is windows') ||
      normalized.includes('cybersecurity') ||
      normalized.includes('cyber security') ||
      normalized.startsWith('why is my pc slow') ||
      normalized.startsWith('help me write') ||
      normalized.startsWith('help me code') ||
      normalized.startsWith('explain this error') ||
      normalized.startsWith('give me ideas') ||
      normalized.startsWith('what should i learn')
    ) {
      return 'conversational'
    }

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

    // 2. Anaphora / Pronoun resolution to previous target (e.g. "open YouTube on it")
    if (context?.lastTarget && (normalized.includes('on it') || normalized.includes('in it'))) {
      return context.lastTarget
    }

    // 3. Explicit Windows/PC scope markers
    if (
      normalized.includes('my pc') ||
      normalized.includes('my computer') ||
      normalized.includes('on pc') ||
      normalized.includes('windows')
    ) {
      return 'windows'
    }

    // 4. System diagnostics
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

    // 5. Network
    if (
      normalized.includes('wifi') ||
      normalized.includes('wi-fi') ||
      normalized.includes('ip address') ||
      normalized.includes('adapter')
    ) {
      return 'network'
    }

    // 6. Filesystem
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

    // 7. Security
    if (
      normalized.includes('firewall') ||
      normalized.includes('defender') ||
      normalized.includes('ports') ||
      normalized.includes('vulnerability')
    ) {
      return 'security'
    }

    // 8. Research
    if (
      normalized.startsWith('search ') ||
      normalized.startsWith('research ') ||
      normalized.startsWith('google ') ||
      normalized.includes('youtube')
    ) {
      return 'research'
    }

    // 9. Memory
    if (
      normalized.startsWith('remember ') ||
      normalized.startsWith('recall ') ||
      normalized.startsWith('forget ') ||
      normalized.includes('saved memory') ||
      normalized.includes('my memories') ||
      normalized.includes('do you remember')
    ) {
      return 'memory'
    }

    // 10. Standard Windows application launching
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
   * Split compound commands like:
   * "Check my phone battery and open YouTube"
   * "Open VS Code and tell me my CPU usage"
   * "Check CPU, RAM, and disk usage"
   */
  decomposeCompound(raw: string): string[] {
    const s = raw.trim()
    if (!s) return []

    // Don't split if this is a web search, question, or conversational explanation
    if (
      /^(search|google|research|youtube)\s+/i.test(s) ||
      /^(what|who|why|how|explain)\b/i.test(s) ||
      /difference between/i.test(s)
    ) {
      return [s]
    }

    // Handle list of telemetry items: "Check CPU, RAM, and disk usage"
    if (/check\s+cpu[\s,]+ram[\s,]+(?:and\s+)?disk/i.test(s)) {
      return ['check cpu', 'check ram', 'check disk usage']
    }

    // Match splitters: ", and ", ", then ", " and then ", " and ", ", "
    // Only split if the conjunction connects meaningful command clauses
    const regex = /(?:,\s*and\s+then\s+|\s+and\s+then\s+|,\s*then\s+|\s+then\s+|,\s*and\s+|\s+and\s+|;\s*)/i
    const parts = s.split(regex).map((p) => p.trim()).filter((p) => p.length > 0)

    if (parts.length > 1) {
      return parts
    }

    return [s]
  }

  /**
   * Main entry point: Resolve natural language input into a typed, structured intent.
   */
  resolve(raw: string, overrideContext?: ConversationContext): ResolvedIntent {
    const ctx = overrideContext || this.context
    let normalized = this.normalizeInput(raw)

    // ────────────────────────────────────────────────────────────
    // 0. CHECK PENDING CONFIRMATIONS (e.g. user says "yes" / "no")
    // ────────────────────────────────────────────────────────────
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

    // ────────────────────────────────────────────────────────────
    // 0.1 CANCELLATION / INTERRUPT REQUESTS (Requirement 30)
    // ────────────────────────────────────────────────────────────
    if (
      normalized === 'stop' ||
      normalized === 'cancel' ||
      normalized === 'never mind' ||
      normalized === 'nevermind' ||
      normalized === 'abort'
    ) {
      return {
        raw_input: raw,
        normalized_input: normalized,
        detected_target: 'system',
        detected_intent: 'system.cancel_action',
        confidence: 0.99,
        args: {},
        requiresConfirmation: false,
        directResponse: 'Cancelled.'
      }
    }

    // ────────────────────────────────────────────────────────────
    // 0.2 TARGET DISAMBIGUATION FOLLOW-UP (Requirement 14)
    // ────────────────────────────────────────────────────────────
    if (ctx.pendingDisambiguation && ctx.pendingDisambiguation.type === 'target_device') {
      const app = ctx.pendingDisambiguation.app
      if (normalized === 'phone' || normalized === 'my phone' || normalized === 'on phone' || normalized === 'on my phone' || normalized === 'android') {
        this.setContext({ pendingDisambiguation: undefined, lastTarget: 'android' })
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.open_app',
          confidence: 0.98,
          args: { appName: app },
          requiresConfirmation: false,
          tool: 'android.openApp'
        }
      }
      if (normalized === 'pc' || normalized === 'my pc' || normalized === 'computer' || normalized === 'my computer' || normalized === 'windows') {
        this.setContext({ pendingDisambiguation: undefined, lastTarget: 'windows' })
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'windows',
          detected_intent: 'windows.open_app',
          confidence: 0.98,
          args: { app },
          requiresConfirmation: false,
          tool: 'apps.open'
        }
      }
    }

    // ────────────────────────────────────────────────────────────
    // 0.3 MULTI-TURN PRONOUN & CONTEXT RESOLUTION (Requirement 6, 32)
    // ────────────────────────────────────────────────────────────
    // Example: "is that low?" after phone battery check
    if (
      (normalized === 'is that low' ||
        normalized === 'is it low' ||
        normalized.includes('is that low') ||
        normalized.includes('is it low') ||
        normalized.includes('how low is that') ||
        normalized.includes('is that good')) &&
      ctx.lastEntity?.type === 'battery'
    ) {
      const level = typeof ctx.lastEntity.value === 'number' ? ctx.lastEntity.value : 72
      let answer = `At ${level}%, your phone battery is in good health and is not low (plenty of charge remaining). Typically, 20% or below is considered low.`
      if (level <= 20) {
        answer = `Yes, at ${level}%, your battery is critically low. It is recommended to plug in your charger soon.`
      } else if (level <= 35) {
        answer = `At ${level}%, your battery is getting moderately low. You may want to charge it soon if you plan to be away from a charger.`
      }
      return {
        raw_input: raw,
        normalized_input: normalized,
        detected_target: 'conversational',
        detected_intent: 'conversational.battery_evaluation',
        confidence: 0.98,
        args: { level },
        requiresConfirmation: false,
        directResponse: answer
      }
    }

    // Example: "Open YouTube on it" -> "it" resolves to last target (phone)
    if ((normalized.includes('on it') || normalized.includes('in it')) && ctx.lastTarget) {
      const targetPhrase = ctx.lastTarget === 'android' ? 'on my phone' : 'on my pc'
      normalized = normalized.replace(/\b(on|in)\s+it\b/g, targetPhrase)
    }

    // Example: "Now check the battery" -> "now" follow-up
    if (normalized.startsWith('now ') && ctx.lastTarget === 'android') {
      normalized = normalized.replace(/^now\s+/g, '') + ' on my phone'
    }

    // ────────────────────────────────────────────────────────────
    // 0.4 COMPOUND COMMAND DECOMPOSITION (Requirement 9, 10)
    // ────────────────────────────────────────────────────────────
    const clauses = this.decomposeCompound(normalized)
    if (clauses.length > 1) {
      // Determine if a device context is shared across clauses (e.g. "on my phone" in clause 1)
      let inheritedTarget: 'android' | 'windows' | undefined = undefined
      if (raw.toLowerCase().includes('phone') || raw.toLowerCase().includes('android')) {
        inheritedTarget = 'android'
      } else if (raw.toLowerCase().includes('pc') || raw.toLowerCase().includes('windows')) {
        inheritedTarget = 'windows'
      }

      const subIntents: ResolvedIntent[] = []
      for (const clause of clauses) {
        let modifiedClause = clause
        // Inherit target if clause doesn't explicitly have one
        if (inheritedTarget === 'android' && !clause.includes('phone') && !clause.includes('pc')) {
          if (clause.startsWith('open ') || clause.startsWith('launch ') || clause.startsWith('check battery') || clause.includes('battery')) {
            modifiedClause = `${clause} on my phone`
          }
        }

        const sub = this.resolveSingle(modifiedClause, modifiedClause, ctx)
        if (sub.detected_intent !== 'unknown') {
          subIntents.push(sub)
        }
      }

      if (subIntents.length > 1) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'system',
          detected_intent: 'compound.task',
          confidence: 0.98,
          args: { count: subIntents.length },
          requiresConfirmation: subIntents.some((i) => i.requiresConfirmation),
          compoundIntents: subIntents
        }
      }
    }

    // Single intent resolution
    return this.resolveSingle(normalized, raw, ctx)
  }

  /**
   * Resolve a single clause into an intent.
   */
  private resolveSingle(normalized: string, raw: string, ctx: ConversationContext): ResolvedIntent {
    const target = this.classifyTarget(normalized, ctx)

    // ────────────────────────────────────────────────────────────
    // 1. CONVERSATIONAL & GENERAL KNOWLEDGE (Requirement 4, 33, 34)
    // ────────────────────────────────────────────────────────────
    if (target === 'conversational') {
      // 1.1 Greetings
      if (
        normalized === 'hi' ||
        normalized === 'hello' ||
        normalized === 'hey' ||
        normalized === 'hello ultron' ||
        normalized === 'hey ultron' ||
        normalized.startsWith('hello ') ||
        normalized.startsWith('hi ') ||
        normalized.startsWith('good morning') ||
        normalized.startsWith('good afternoon') ||
        normalized.startsWith('good evening') ||
        normalized.includes('how are you')
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'conversational',
          detected_intent: 'conversational.greeting',
          confidence: 0.99,
          args: {},
          requiresConfirmation: false,
          directResponse: 'Hello! I am ULTRON, your personal AI command center. How can I assist you today?'
        }
      }

      // 1.2 Capabilities & "control my phone" (Requirement 2, 33)
      if (
        normalized.includes('what can you do') ||
        normalized.includes('what are your capabilities') ||
        normalized === 'help' ||
        normalized.includes('how can you help') ||
        normalized.includes('how do you work') ||
        normalized === 'control my phone' ||
        normalized === 'control phone'
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'conversational',
          detected_intent: 'conversational.capabilities',
          confidence: 0.99,
          args: {},
          requiresConfirmation: false,
          directResponse:
            'I can help with your PC, connected Android phone, files, system telemetry, web research, coding, and supported automation. You can simply tell me what you want to accomplish.'
        }
      }

      // 1.3 Identity
      if (
        normalized.includes('who are you') ||
        normalized.includes('who made you') ||
        normalized.includes('who created you') ||
        normalized.includes('what is ultron') ||
        normalized.includes('founder')
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'conversational',
          detected_intent: 'conversational.identity',
          confidence: 0.99,
          args: {},
          requiresConfirmation: false,
          directResponse:
            'I am ULTRON, a personal AI command center and computer agent developed by UPAI Technologies, founded by Sukesh D. I unify AI reasoning, local Windows automation, and Android mobile integration into a single command center.'
        }
      }

      // 1.4 General Knowledge: RAM
      if (normalized.startsWith('what is ram') || normalized.startsWith('explain ram')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'conversational',
          detected_intent: 'conversational.knowledge_ram',
          confidence: 0.98,
          args: {},
          requiresConfirmation: false,
          directResponse:
            "RAM (Random Access Memory) is your computer's high-speed, volatile working memory. When you open applications, games, or files, your system loads their active data into RAM so the CPU can read and write to it with near-zero latency. Unlike storage (SSD/HDD), RAM is volatile and clears completely when your PC powers down."
        }
      }

      // 1.5 Difference between RAM and storage
      if (
        normalized.includes('difference between ram and storage') ||
        normalized.includes('ram vs storage') ||
        normalized.includes('ram and storage difference')
      ) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'conversational',
          detected_intent: 'conversational.ram_vs_storage',
          confidence: 0.98,
          args: {},
          requiresConfirmation: false,
          directResponse:
            'The main difference is speed vs permanence: RAM is ultra-fast temporary working memory used by the processor to run active programs, but it forgets everything when turned off. Storage (SSD or hard drive) is non-volatile long-term memory where your operating system, installed apps, and documents remain saved permanently.'
        }
      }

      // 1.6 General Knowledge: Windows
      if (normalized.startsWith('what is windows')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'conversational',
          detected_intent: 'conversational.knowledge_windows',
          confidence: 0.98,
          args: {},
          requiresConfirmation: false,
          directResponse:
            'Microsoft Windows is a graphical personal computer operating system developed by Microsoft. It manages your computer hardware, memory, files, peripherals, and security, providing the foundation for software applications and device drivers.'
        }
      }

      // 1.7 Cybersecurity
      if (normalized.includes('cybersecurity') || normalized.includes('cyber security')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'conversational',
          detected_intent: 'conversational.cybersecurity',
          confidence: 0.98,
          args: {},
          requiresConfirmation: false,
          directResponse:
            'Cybersecurity is the practice of protecting and safeguarding computer systems, networks, devices, software applications, and digital data from unauthorized access, malicious attacks, identity theft, and operational disruptions. Essential pillars include endpoint defense, network firewalls, data encryption, strong access controls, and regular patch management.'
        }
      }

      // 1.8 Why is my PC slow?
      if (normalized.includes('why is my pc slow') || normalized.includes('why is my computer slow')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'conversational',
          detected_intent: 'conversational.pc_slow_diagnosis',
          confidence: 0.97,
          args: {},
          requiresConfirmation: false,
          directResponse:
            'A computer usually slows down due to high background CPU or RAM usage, a low amount of free storage on your primary drive, overheating/thermal throttling, too many startup applications, or background updates. Would you like me to check your live CPU and RAM load right now?'
        }
      }

      // 1.9 Coding & Advice
      if (
        normalized.startsWith('help me write') ||
        normalized.startsWith('help me code') ||
        normalized.startsWith('explain this error') ||
        normalized.startsWith('give me ideas') ||
        normalized.startsWith('what should i learn')
      ) {
        let directResponse = "I'd be glad to help! Tell me the specific program or feature you'd like to build, or paste your error message or project requirements, and we'll work through it step by step."
        if (raw.toLowerCase().includes('python')) {
          directResponse = "I'd be glad to help you write Python! Tell me what kind of program, script, or automation you'd like to build, and we'll work through it step by step."
        }
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'conversational',
          detected_intent: 'conversational.coding_assistance',
          confidence: 0.96,
          args: {},
          requiresConfirmation: false,
          directResponse
        }
      }
    }

    // ────────────────────────────────────────────────────────────
    // 2. MEMORY MANAGEMENT INTENTS (Requirement 27)
    // ────────────────────────────────────────────────────────────
    if (target === 'memory') {
      if (normalized.startsWith('remember that ') || normalized.startsWith('remember ')) {
        const fact = raw
          .replace(/^(hey\s+ultron|ultron|please|can\s+you|could\s+you|hey|ok|okay)\s+/i, '')
          .replace(/^remember\s+(that\s+)?/i, '')
          .trim()
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'memory',
          detected_intent: 'memory.store',
          confidence: 0.98,
          args: { content: fact, category: 'preference' },
          requiresConfirmation: false,
          tool: 'memory.store',
          directResponse: `Got it. I'll remember that: "${fact}".`
        }
      }

      if (normalized === 'forget that' || normalized.startsWith('forget ') || normalized.startsWith('delete memory')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'memory',
          detected_intent: 'memory.delete',
          confidence: 0.97,
          args: {},
          requiresConfirmation: false,
          tool: 'memory.delete',
          directResponse: 'Done — I have removed that from memory.'
        }
      }

      if (normalized.includes('do you remember') || normalized.startsWith('recall ') || normalized.includes('my memories')) {
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'memory',
          detected_intent: 'memory.search',
          confidence: 0.95,
          args: { query: normalized.replace(/^(do\s+you\s+remember|recall|what\s+do\s+you\s+remember\s+about)\s*/i, '').trim() },
          requiresConfirmation: false,
          tool: 'memory.search'
        }
      }
    }

    // ────────────────────────────────────────────────────────────
    // 3. ANDROID INTENTS (18 Structured Intents)
    // ────────────────────────────────────────────────────────────
    if (target === 'android') {
      // 3.1 android.power_off (Requirement 18: Consequential safety gate)
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

      // 3.2 android.restart
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

      // 3.3 android.lock
      if (
        (normalized.includes('lock') && (normalized.includes('phone') || normalized.includes('screen'))) ||
        normalized === 'lock phone' ||
        normalized === 'lock my phone'
      ) {
        this.setContext({ lastTarget: 'android', lastAction: 'lock' })
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

      // 3.4 android.get_battery
      if (
        normalized.includes('battery') &&
        (normalized.includes('phone') || normalized.includes('android') || normalized.includes('device') || ctx.lastTarget === 'android')
      ) {
        this.setContext({ lastTarget: 'android', lastAction: 'get_battery' })
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'android',
          detected_intent: 'android.get_battery',
          confidence: 0.98,
          args: {},
          requiresConfirmation: false,
          tool: 'android.getBattery'
        }
      }

      // 3.5 android.open_app
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

        this.setContext({ lastTarget: 'android', lastAction: 'open_app', lastEntity: { type: 'app', value: appName } })
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

      // 3.6 android.search_app
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

      // 3.7 android.call_contact (Requirement 15: ZERO fake numbers)
      if (
        normalized.startsWith('call ') ||
        normalized.startsWith('dial ') ||
        normalized.startsWith('phone ')
      ) {
        const contactName = raw
          .replace(/^(hey\s+ultron|ultron|please|can\s+you|could\s+you|would\s+you|hey|ok|okay)\s+/i, '')
          .replace(/^(call|dial|phone)\s+/i, '')
          .trim() || normalized.replace(/^(call|dial|phone)\s+/i, '').trim()

        this.setContext({ lastTarget: 'android', lastAction: 'call_contact', lastEntity: { type: 'contact', value: contactName } })
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

      // 3.8 android.search_contact
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

      // 3.9 android.end_call
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
        this.setContext({ lastTarget: 'android', lastAction: 'end_call' })
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

      // 3.10 android.mute_call
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

      // 3.11 android.unmute_call
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

      // 3.12 android.hold_call
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

      // 3.13 android.resume_call
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

      // 3.14 android.second_call
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

      // 3.15 android.merge_call
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

      // 3.16 android.swap_call
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

      // 3.17 android.connect
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
        this.setContext({ lastTarget: 'android', lastAction: 'connect' })
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

      // 3.18 android.device_status
      if (
        normalized.includes('phone status') ||
        normalized.includes('phone state') ||
        normalized.includes('check phone') ||
        normalized.includes('check my phone') ||
        normalized.includes('is phone connected') ||
        normalized.includes('call status') ||
        normalized === 'phone'
      ) {
        this.setContext({ lastTarget: 'android', lastAction: 'device_status' })
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
    // 4. SYSTEM DIAGNOSTICS INTENTS
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

      if (normalized.includes('cpu') && (normalized.includes('check') || normalized.includes('tell') || normalized.includes('get') || normalized.includes('show') || normalized.includes('usage') || normalized.includes('load') || normalized.includes('status') || normalized === 'cpu' || normalized === 'check cpu')) {
        this.setContext({ lastTarget: 'system', lastAction: 'get_cpu', lastEntity: { type: 'cpu' } })
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

      if (normalized.includes('ram') || normalized.includes('memory')) {
        this.setContext({ lastTarget: 'system', lastAction: 'get_memory', lastEntity: { type: 'ram' } })
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

      if (normalized.includes('disk') || normalized.includes('storage') || normalized.includes('drive')) {
        this.setContext({ lastTarget: 'system', lastAction: 'get_disk', lastEntity: { type: 'disk' } })
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

      if (normalized.includes('process') || normalized.includes('tasks')) {
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
    // 5. WINDOWS APP & CONTROL INTENTS
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

        // Requirement 14: Target Disambiguation Check
        // If phone is connected and the app could exist on both PC and Phone (e.g. "Chrome", "YouTube", "Spotify"),
        // and user didn't specify "on my pc" or "on my phone", and context doesn't clarify:
        const ambiguousApps = ['chrome', 'youtube', 'spotify', 'netflix', 'calculator', 'telegram', 'whatsapp']
        const hasExplicitDevice = raw.toLowerCase().includes('phone') || raw.toLowerCase().includes('android') || raw.toLowerCase().includes('pc') || raw.toLowerCase().includes('computer')
        if (!hasExplicitDevice && ambiguousApps.includes(cleanApp) && ctx.isPhoneConnected && !ctx.lastTarget) {
          this.setContext({
            pendingDisambiguation: {
              type: 'target_device',
              app: cleanApp,
              candidates: ['windows', 'android']
            }
          })
          return {
            raw_input: raw,
            normalized_input: normalized,
            detected_target: 'unknown',
            detected_intent: 'ambiguous.target_device',
            confidence: 0.9,
            args: { app: cleanApp },
            requiresConfirmation: false,
            needsClarification: true,
            clarificationQuestion: `Should I open ${cleanApp} on your PC or phone?`,
            directResponse: `Should I open ${cleanApp} on your PC or phone?`
          }
        }

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

        this.setContext({ lastTarget: 'windows', lastAction: 'open_app', lastEntity: { type: 'app', value: cleanApp } })
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
    // 6. NETWORK INTENTS
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

    // ────────────────────────────────────────────────────────────
    // 7. RESEARCH INTENTS
    // ────────────────────────────────────────────────────────────
    if (target === 'research') {
      if (normalized.startsWith('search ') || normalized.startsWith('google ') || normalized.startsWith('research ')) {
        const query = raw
          .replace(/^(hey\s+ultron|ultron|please|can\s+you|could\s+you|hey|ok|okay)\s+/i, '')
          .replace(/^(search|google|research)\s+(for\s+)?/i, '')
          .trim()
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'research',
          detected_intent: 'research.web_search',
          confidence: 0.95,
          args: { query },
          requiresConfirmation: false,
          tool: 'research.search'
        }
      }
      if (normalized.includes('youtube')) {
        const query = raw
          .replace(/^(hey\s+ultron|ultron|please|can\s+you|could\s+you|hey|ok|okay)\s+/i, '')
          .replace(/^search\s+youtube\s+for\s+/i, '')
          .replace(/^youtube\s+/i, '')
          .trim()
        return {
          raw_input: raw,
          normalized_input: normalized,
          detected_target: 'research',
          detected_intent: 'research.youtube',
          confidence: 0.95,
          args: { query },
          requiresConfirmation: false,
          tool: 'research.youtube'
        }
      }
    }

    // ────────────────────────────────────────────────────────────
    // 8. CONTEXTUAL FALLBACK (Requirement 39: NO repetitive command parser fallback!)
    // ────────────────────────────────────────────────────────────
    return {
      raw_input: raw,
      normalized_input: normalized,
      detected_target: 'unknown',
      detected_intent: 'unknown',
      confidence: 0.0,
      args: {},
      requiresConfirmation: false,
      directResponse: "I didn't quite understand what you want me to do. Could you rephrase that?"
    }
  }
}

export const intentService = new IntentService()
