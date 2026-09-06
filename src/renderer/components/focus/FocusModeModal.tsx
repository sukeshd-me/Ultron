import React, { useState, useEffect } from 'react'
import { FocusModeType, FocusSession } from '../../../shared/types'

interface FocusModeModalProps {
  isOpen: boolean
  onClose: () => void
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({ isOpen, onClose }) => {
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null)
  const [selectedMode, setSelectedMode] = useState<FocusModeType>('Coding')
  const [duration, setDuration] = useState(45)
  const [feedback, setFeedback] = useState<string | null>(null)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const checkActive = async () => {
    try {
      if (bridge?.focus) {
        const session = await bridge.focus.getActive()
        setActiveSession(session)
      }
    } catch {}
  }

  useEffect(() => {
    if (isOpen) {
      checkActive()
      const interval = setInterval(checkActive, 2000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  const handleStart = async () => {
    try {
      if (bridge?.focus) {
        const res = await bridge.focus.start(selectedMode, duration)
        setActiveSession(res.session)
        setFeedback(res.message)
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`)
    }
  }

  const handleEnd = async () => {
    try {
      if (bridge?.focus) {
        const res = await bridge.focus.end()
        setActiveSession(null)
        setFeedback(res.message)
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`)
    }
  }

  if (!isOpen) return null

  const modes: FocusModeType[] = ['Coding', 'Research', 'Study', 'Writing', 'General Focus']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🧘</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">ULTRON Focus Mode</h2>
              <p className="text-[11px] text-gray-400">Dedicated workspace focus, timer control, and distraction suppression</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {activeSession ? (
            /* Active Focus Timer View */
            <div className="text-center py-8 space-y-4">
              <div className="w-28 h-28 rounded-full border-4 border-cyan-500/40 border-t-cyan-400 mx-auto flex items-center justify-center animate-pulse">
                <span className="text-xl font-mono text-cyan-400 font-bold">
                  {Math.floor(activeSession.elapsedSeconds / 60)}:
                  {String(activeSession.elapsedSeconds % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase">{activeSession.mode} Focus Active</h3>
                <p className="text-xs text-gray-400">Target duration: {activeSession.durationMinutes} minutes</p>
              </div>
              <button
                onClick={handleEnd}
                className="px-6 py-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition text-xs font-semibold"
              >
                End Focus Mode
              </button>
            </div>
          ) : (
            /* Setup Focus View */
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-mono text-cyan-400 uppercase">Select Focus Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {modes.map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSelectedMode(mode)}
                      className={`p-3 rounded-xl border text-xs font-medium text-left transition ${
                        selectedMode === mode ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400' : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-cyan-400 uppercase">Duration (Minutes)</label>
                <div className="flex gap-3">
                  {[15, 25, 45, 60, 90].map(m => (
                    <button
                      key={m}
                      onClick={() => setDuration(m)}
                      className={`px-4 py-2 rounded-xl border text-xs font-mono transition ${
                        duration === m ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 font-bold' : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStart}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition shadow-lg"
              >
                Begin Focus Session
              </button>
            </div>
          )}

          {feedback && (
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300">
              {feedback}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
