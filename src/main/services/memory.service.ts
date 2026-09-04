// src/main/services/memory.service.ts — High-Level Memory Management & Context Retrieval
import { memoryDatabase, MemoryDatabase } from '../database/memory.db'
import { MemoryRecord, MemoryCategory, MemorySearchParams, MemoryStats } from '../../shared/types'

export class MemoryService {
  private db: MemoryDatabase

  constructor(dbInstance?: MemoryDatabase) {
    this.db = dbInstance || memoryDatabase
  }

  async saveMemory(entry: {
    category: MemoryCategory
    key?: string
    content: string
    metadata?: Record<string, unknown>
    tags?: string[]
  }): Promise<MemoryRecord> {
    try {
      return this.db.save(entry)
    } catch (err: any) {
      console.error('[MemoryService] saveMemory error:', err)
      throw err
    }
  }

  async getMemory(id: string): Promise<MemoryRecord | null> {
    try {
      return this.db.get(id)
    } catch (err: any) {
      console.error('[MemoryService] getMemory error:', err)
      return null
    }
  }

  async searchMemories(params: MemorySearchParams): Promise<MemoryRecord[]> {
    try {
      return this.db.search(params)
    } catch (err: any) {
      console.error('[MemoryService] searchMemories error:', err)
      return []
    }
  }

  async listMemories(options?: {
    category?: string
    limit?: number
    offset?: number
  }): Promise<{ records: MemoryRecord[]; total: number }> {
    try {
      return this.db.list(options)
    } catch (err: any) {
      console.error('[MemoryService] listMemories error:', err)
      return { records: [], total: 0 }
    }
  }

  async deleteMemory(id: string): Promise<boolean> {
    try {
      return this.db.delete(id)
    } catch (err: any) {
      console.error('[MemoryService] deleteMemory error:', err)
      return false
    }
  }

  async clearMemories(): Promise<boolean> {
    try {
      return this.db.clear()
    } catch (err: any) {
      console.error('[MemoryService] clearMemories error:', err)
      return false
    }
  }

  async getStats(): Promise<MemoryStats> {
    try {
      return this.db.stats()
    } catch (err: any) {
      console.error('[MemoryService] getStats error:', err)
      return { total: 0, byCategory: {}, lastUpdated: Date.now() }
    }
  }

  /**
   * Intelligently detect if user input explicitly declares facts, preferences, or notes
   */
  extractUserFactsAndPreferences(userInput: string): Array<{
    category: 'fact' | 'preference'
    key: string
    content: string
  }> {
    const results: Array<{ category: 'fact' | 'preference'; key: string; content: string }> = []
    const trimmed = userInput.trim()
    const lower = trimmed.toLowerCase()

    // 1. User Name: "my name is Sukesh", "call me Sukesh"
    const nameMatch = trimmed.match(/(?:my name is|call me|i am)\s+([A-Za-z0-9_-]+)/i)
    if (nameMatch && !lower.includes('called') && !lower.includes('file') && !lower.includes('folder')) {
      const name = nameMatch[1].trim()
      if (name.length > 1 && !['a', 'the', 'writing', 'creating', 'testing'].includes(name.toLowerCase())) {
        results.push({
          category: 'fact',
          key: 'user:name',
          content: `User's name is ${name}.`
        })
      }
    }

    // 2. Preferences: "i prefer python", "always use typescript", "my favorite language is rust"
    const prefMatch = trimmed.match(/(?:i prefer|always use|my preferred\s+\w+\s+is|my favorite\s+\w+\s+is)\s+([^.,;!?]+)/i)
    if (prefMatch) {
      const pref = prefMatch[1].trim()
      if (pref.length > 2) {
        results.push({
          category: 'preference',
          key: `pref:${pref.slice(0, 20).replace(/\s+/g, '_').toLowerCase()}`,
          content: `User preference: ${trimmed}`
        })
      }
    }

    // 3. Explicit Notes: "remember that ...", "note that ..."
    const noteMatch = trimmed.match(/(?:remember that|note that|keep in mind that)\s+([^.,;!?]+)/i)
    if (noteMatch) {
      const note = noteMatch[1].trim()
      if (note.length > 3) {
        results.push({
          category: 'fact',
          key: `fact:${note.slice(0, 20).replace(/\s+/g, '_').toLowerCase()}`,
          content: `Important fact: ${note}`
        })
      }
    }

    return results
  }

  /**
   * Fast, bounded retrieval of relevant memories to enrich prompt without slowing down LLM
   */
  async getRelevantContext(query: string, maxItems: number = 4): Promise<string> {
    if (!query || !query.trim()) return ''

    const clean = query.trim()
    const terms = clean
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['what', 'where', 'when', 'which', 'there', 'about', 'please', 'could', 'would'].includes(w))

    const contextItems: string[] = []
    const seenIds = new Set<string>()

    // 1. Always prioritize persistent user facts and preferences
    const facts = this.db.search({ category: 'fact', limit: 3 })
    for (const f of facts) {
      if (!seenIds.has(f.id)) {
        seenIds.add(f.id)
        contextItems.push(`• [Fact] ${f.content}`)
      }
    }

    const preferences = this.db.search({ category: 'preference', limit: 3 })
    for (const p of preferences) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id)
        contextItems.push(`• [Preference] ${p.content}`)
      }
    }

    // 2. Search relevant memories matching key terms (tasks, research, tools)
    for (const term of terms.slice(0, 3)) {
      if (contextItems.length >= maxItems) break
      const matched = this.db.search({ query: term, limit: 3 })
      for (const m of matched) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id)
          const catLabel = m.category.toUpperCase().replace('_', ' ')
          const snippet = m.content.length > 120 ? m.content.slice(0, 117) + '...' : m.content
          contextItems.push(`• [${catLabel}] ${snippet}`)
          if (contextItems.length >= maxItems) break
        }
      }
    }

    if (contextItems.length === 0) return ''

    return `\n\n[RELEVANT ULTRON MEMORY ARCHIVE]\n${contextItems.join('\n')}\n[END MEMORY ARCHIVE]\n`
  }
}

export const memoryService = new MemoryService()
