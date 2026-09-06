import React, { useState, useEffect } from 'react'
import { AgentDebugEvent } from '../../../shared/types'

interface AgentDebuggerModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AgentDebuggerModal: React.FC<AgentDebuggerModalProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<AgentDebugEvent[]>([])

  const loadEvents = async () => {
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.debugger?.listEvents) {
        const list = await bridge.debugger.listEvents(100)
        setEvents(list || [])
      }
    } catch (err) {
      console.warn('Failed to load debugger events:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadEvents()
    }
  }, [isOpen])

  const handleClear = async () => {
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.debugger?.clearEvents) {
        await bridge.debugger.clearEvents()
        setEvents([])
      }
    } catch (err) {
      console.warn('Failed to clear debugger events:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🐞</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Agent Pipeline Debugger</h2>
              <p className="text-[11px] text-gray-400">Observable decision pipeline • No chain-of-thought exposure</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleClear} className="text-xs px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-400">
              Clear
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 font-mono">
          {events.length === 0 ? (
            <div className="text-gray-500 text-xs py-12 text-center">No agent decision events logged yet.</div>
          ) : (
            events.map((evt) => (
              <div key={evt.id} className="bg-black/50 border border-white/10 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">STAGE: {evt.stage}</span>
                  <span className="text-[10px] text-gray-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
                {evt.intent && <div className="text-gray-300">Intent: <span className="text-white">{evt.intent}</span></div>}
                {evt.risk && <div className="text-amber-400">Risk Level: {evt.risk}</div>}
                {evt.result && <div className="text-emerald-400">Result: {evt.result}</div>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
