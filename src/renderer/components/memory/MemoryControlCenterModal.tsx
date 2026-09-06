import React, { useState, useEffect } from 'react'
import { MemoryItemView, MemoryControlCategory } from '../../../shared/types'

interface MemoryControlCenterModalProps {
  isOpen: boolean
  onClose: () => void
}

export const MemoryControlCenterModal: React.FC<MemoryControlCenterModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<MemoryItemView[]>([])
  const [category, setCategory] = useState<MemoryControlCategory>('Personal preferences')
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const categories: MemoryControlCategory[] = [
    'Personal preferences',
    'Projects',
    'Goals',
    'Conversations',
    'Tasks',
    'Workspace preferences',
    'Temporary memory',
    'Archived memory'
  ]

  const loadMemories = async () => {
    try {
      if (bridge?.memoryControl) {
        const list = await bridge.memoryControl.search({ category, query })
        setItems(list || [])
      }
    } catch (err) {
      console.warn('Failed to load memory:', err)
    }
  }

  useEffect(() => {
    if (isOpen) loadMemories()
  }, [isOpen, category, query])

  const handleForget = async (id: string) => {
    try {
      if (bridge?.memoryControl) {
        const res = await bridge.memoryControl.forget(id, true)
        if (res.success) {
          setFeedback('Memory removed safely. Recovery backup registered.')
          loadMemories()
        }
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🧠</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Memory Control Center</h2>
              <p className="text-[11px] text-gray-400">Scoped memory control, search, and safe deletion with recovery</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 px-6 pt-3 overflow-x-auto border-b border-white/5 pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition ${
                category === cat ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-gray-400 hover:text-white bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="px-6 pt-3">
          <input
            type="text"
            placeholder="Search memories by keyword or scope..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/40"
          />
        </div>

        {feedback && (
          <div className="px-6 py-2 text-xs text-emerald-400 bg-emerald-950/20">
            {feedback}
          </div>
        )}

        {/* Items */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs font-mono">
              No memories found in {category}.
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                      Scope: {item.scope}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed">{item.value}</p>
                </div>
                <button
                  onClick={() => handleForget(item.id)}
                  className="text-[11px] text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1 rounded border border-red-500/30 whitespace-nowrap"
                >
                  Forget
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
