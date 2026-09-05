// src/renderer/components/UniversalSearchModal.tsx — V1.0.4 Universal PC Search Modal
import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  X,
  Terminal,
  FileCode,
  Folder,
  GitBranch,
  Brain,
  ListTodo,
  ExternalLink,
  ChevronRight,
  ArrowUpDown,
  CornerDownLeft
} from 'lucide-react'
import { UniversalSearchResult, SearchCategory, SearchSafeAction } from '../../shared/types'

interface UniversalSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES: { id: SearchCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'apps', label: 'Apps' },
  { id: 'files', label: 'Files' },
  { id: 'projects', label: 'Projects' },
  { id: 'memory', label: 'Memory' },
  { id: 'tasks', label: 'Tasks' }
]

export function UniversalSearchModal({ isOpen, onClose }: UniversalSearchModalProps) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory | 'all'>('all')
  const [results, setResults] = useState<UniversalSearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus on open
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setActionFeedback(null)
      setTimeout(() => inputRef.current?.focus(), 50)
      runSearch('', selectedCategory)
    }
  }, [isOpen])

  // Perform search
  const runSearch = async (text: string, cat: SearchCategory | 'all') => {
    setIsSearching(true)
    const ultron = (window as any).ultron
    if (!ultron?.search?.query) {
      setIsSearching(false)
      return
    }

    try {
      const filterCats = cat === 'all' ? undefined : [cat]
      const items = await ultron.search.query(text, filterCats)
      setResults(items || [])
      setSelectedIndex(0)
    } catch (err) {
      console.error('[Search] Query error:', err)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle live search typing
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    runSearch(val, selectedCategory)
  }

  // Handle category pill change
  const handleCategoryChange = (cat: SearchCategory | 'all') => {
    setSelectedCategory(cat)
    runSearch(query, cat)
  }

  // Execute safe action
  const handleExecuteAction = async (action: SearchSafeAction) => {
    const ultron = (window as any).ultron
    if (!ultron?.search?.executeAction) return

    try {
      const res = await ultron.search.executeAction(action)
      if (res.success) {
        setActionFeedback(res.message || 'Action executed successfully')
        setTimeout(() => {
          onClose()
        }, 800)
      } else {
        setActionFeedback(`Error: ${res.message || 'Execution failed'}`)
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message || String(err)}`)
    }
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = results[selectedIndex]
      if (selected && selected.actions.length > 0) {
        handleExecuteAction(selected.actions[0])
      }
    }
  }

  if (!isOpen) return null

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'apps':
        return <Terminal size={14} className="text-cyan-400" />
      case 'files':
        return <FileCode size={14} className="text-emerald-400" />
      case 'projects':
        return <GitBranch size={14} className="text-purple-400" />
      case 'memory':
        return <Brain size={14} className="text-pink-400" />
      case 'tasks':
        return <ListTodo size={14} className="text-amber-400" />
      default:
        return <Search size={14} className="text-gray-400" />
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-black border border-cyan-500/30 rounded-xl shadow-[0_0_50px_rgba(0,212,255,0.15)] overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header Search Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-cyan-500/20 bg-black">
          <Search size={18} className="text-cyan-400 mr-3 shrink-0 animate-pulse" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 text-sm font-sans focus:outline-none"
            placeholder="Search apps, files, projects, memories, tasks... (↑↓ to navigate, Enter to launch)"
            value={query}
            onChange={handleQueryChange}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('')
                runSearch('', selectedCategory)
              }}
              className="text-gray-400 hover:text-gray-200 mr-2 p-1"
            >
              <X size={14} />
            </button>
          )}
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 border border-cyan-500/30 text-cyan-400 rounded bg-cyan-950/30 shrink-0">
            ESC
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5 bg-[#050505] overflow-x-auto custom-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,212,255,0.2)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          ))}
          {isSearching && (
            <span className="text-[11px] text-cyan-400 animate-pulse ml-auto">Searching...</span>
          )}
        </div>

        {/* Action feedback banner if any */}
        {actionFeedback && (
          <div className="px-4 py-2 bg-cyan-950/40 border-b border-cyan-500/30 text-cyan-300 text-xs flex items-center justify-between">
            <span>{actionFeedback}</span>
            <span className="text-[10px] text-gray-400">Closing...</span>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              {query ? `No matching items found for "${query}"` : 'Type to search across your system and memories'}
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={item.id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors border ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500/40 text-white'
                      : 'border-transparent text-gray-300 hover:bg-white/[0.04]'
                  }`}
                  onClick={() => {
                    setSelectedIndex(idx)
                    if (item.actions.length > 0) {
                      handleExecuteAction(item.actions[0])
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  {/* Left: Icon & Text */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="p-1.5 rounded bg-black/60 border border-white/10 shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded font-mono bg-white/5 text-gray-400 border border-white/5">
                          {item.category}
                        </span>
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-gray-500 truncate font-mono mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.actions.map((act) => (
                      <button
                        key={act.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleExecuteAction(act)
                        }}
                        className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-cyan-500/20 text-gray-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 flex items-center gap-1 transition-all"
                      >
                        <span>{act.label}</span>
                        <ChevronRight size={10} />
                      </button>
                    ))}
                    {isSelected && (
                      <span className="text-[9px] font-mono text-cyan-400 px-1 py-0.5 border border-cyan-500/20 rounded ml-1 bg-cyan-950/20 flex items-center gap-0.5">
                        <CornerDownLeft size={9} />
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-[#030303] text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="font-mono text-[10px] bg-white/5 px-1 rounded border border-white/10">↑↓</span> Navigate
            </span>
            <span className="flex items-center gap-1">
              <span className="font-mono text-[10px] bg-white/5 px-1 rounded border border-white/10">↵</span> Select
            </span>
            <span className="flex items-center gap-1">
              <span className="font-mono text-[10px] bg-white/5 px-1 rounded border border-white/10">ESC</span> Close
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400/80">
            ULTRON UNIVERSAL SEARCH V1.0.4
          </span>
        </div>
      </div>
    </div>
  )
}
