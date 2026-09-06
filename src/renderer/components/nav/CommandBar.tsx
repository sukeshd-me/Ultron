import React, { useState, useEffect, useRef } from 'react'

interface CommandBarProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (prompt: string) => void
}

export const CommandBar: React.FC<CommandBarProps> = ({ isOpen, onClose, onSubmit }) => {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Ctrl+Space or Cmd+Space to toggle if window is focused
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault()
        if (isOpen) onClose()
      } else if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSend = (textToSend?: string) => {
    const prompt = (textToSend || query).trim()
    if (!prompt) return
    onSubmit(prompt)
    setQuery('')
    onClose()
  }

  const quickPills = [
    { label: 'Check Git Status', prompt: 'Check Git status' },
    { label: 'Open Dev Workspace', prompt: 'Open my development workspace' },
    { label: 'What Was I Doing?', prompt: 'What was I doing today?' },
    { label: 'Explain Architecture', prompt: "Explain this project's architecture" },
    { label: 'Show Briefing', prompt: "Show today's briefing" },
    { label: "What's Running?", prompt: "What windows and applications are running?" }
  ]

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-28 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl mx-4 bg-[#0a0c10]/95 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-500/20 backdrop-blur-xl overflow-hidden flex flex-col p-4 space-y-3">
        {/* Header Badge */}
        <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-cyan-400 font-bold tracking-wider">ULTRON COMMAND BAR</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">GLOBAL OVERLAY</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300">Ctrl+Space</span>
            <span>to toggle</span>
          </div>
        </div>

        {/* Input Bar */}
        <div className="relative flex items-center bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-cyan-400/80 focus-within:ring-1 focus-within:ring-cyan-400/40 transition-all">
          <span className="text-cyan-400 mr-3 text-lg font-bold">⌘</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask ULTRON anything or invoke a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSend()
              }
            }}
            className="w-full bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => handleSend()}
              className="ml-2 px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold rounded-lg transition-colors"
            >
              Run ↵
            </button>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {quickPills.map((pill, i) => (
            <button
              key={i}
              onClick={() => handleSend(pill.prompt)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/5 hover:bg-cyan-500/15 text-gray-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 transition-all text-left"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
