// src/main/services/context.service.ts — Context Compression for ULTRON V1.0.5
import { memoryDatabase } from '../database/memory.db'

export interface CompressedContext {
  recentMessages: Array<{ role: string; content: string }>
  memorySummary: string
  activeTaskContext?: string
  projectContext?: string
}

export class ContextService {
  /**
   * Compress older turns into compact structured summaries when conversation exceeds threshold
   */
  compressConversation(
    messages: Array<{ role: string; content: string }>,
    maxRecentTurns = 8
  ): CompressedContext {
    if (messages.length <= maxRecentTurns) {
      return {
        recentMessages: messages,
        memorySummary: 'Standard contextual window'
      }
    }

    const older = messages.slice(0, messages.length - maxRecentTurns)
    const recent = messages.slice(messages.length - maxRecentTurns)

    // Synthesize structured summary of older turns
    const olderHighlights: string[] = []
    for (const m of older) {
      if (m.role === 'user' && m.content.length > 5) {
        olderHighlights.push(`User requested: "${m.content.slice(0, 100)}"`)
      } else if (m.role === 'assistant' && (m.content.includes('Success') || m.content.includes('Completed') || m.content.includes('error'))) {
        olderHighlights.push(`Agent concluded: "${m.content.slice(0, 120)}"`)
      }
    }

    const memorySummary = olderHighlights.length > 0
      ? `[COMPRESSED HISTORY SUMMARY]: ${olderHighlights.join('; ')}`
      : 'Previous conversation history summarized.'

    return {
      recentMessages: recent,
      memorySummary
    }
  }
}

export const contextService = new ContextService()
