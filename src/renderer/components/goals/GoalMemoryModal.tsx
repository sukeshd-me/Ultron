import React, { useState, useEffect } from 'react'
import { Goal, GoalStatus } from '../../../shared/types'

interface GoalMemoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export const GoalMemoryModal: React.FC<GoalMemoryModalProps> = ({ isOpen, onClose }) => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newProject, setNewProject] = useState('ULTRON')
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  const loadGoals = async () => {
    setLoading(true)
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.goals?.list) {
        const list = await bridge.goals.list()
        setGoals(list || [])
      }
    } catch (err) {
      console.warn('Failed to load goals:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadGoals()
    }
  }, [isOpen])

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.goals?.create) {
        await bridge.goals.create({ title: newTitle, project: newProject })
        setNewTitle('')
        loadGoals()
      }
    } catch (err) {
      console.warn('Failed to create goal:', err)
    }
  }

  const handleUpdateStatus = async (id: string, status: GoalStatus) => {
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.goals?.update) {
        await bridge.goals.update(id, { status })
        loadGoals()
      }
    } catch (err) {
      console.warn('Failed to update goal:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.goals?.delete) {
        await bridge.goals.delete(id)
        if (selectedGoal?.id === id) setSelectedGoal(null)
        loadGoals()
      }
    } catch (err) {
      console.warn('Failed to delete goal:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🌟</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Goal Memory Engine</h2>
              <p className="text-[11px] text-gray-400">Persistent multi-session goals & project milestones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-6">
          {/* Left Column: Create & List */}
          <div className="col-span-1 border-r border-white/10 pr-6 space-y-4">
            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-gray-400 block mb-1">NEW GOAL TITLE</label>
                <input
                  type="text"
                  placeholder="e.g. Build ULTRON V1.0.6"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-gray-400 block mb-1">PROJECT</label>
                <input
                  type="text"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs py-2 rounded-lg transition-colors"
              >
                + Add Goal
              </button>
            </form>

            <div className="pt-4 border-t border-white/10">
              <h3 className="text-xs font-mono text-gray-400 uppercase mb-3">Active Goals ({goals.length})</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {goals.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGoal(g)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedGoal?.id === g.id
                        ? 'bg-cyan-500/20 border-cyan-500 text-white'
                        : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate">{g.title}</span>
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        g.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {g.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">Project: {g.project}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Goal Detail & Context */}
          <div className="col-span-2 space-y-4">
            {selectedGoal ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedGoal.title}</h3>
                    <p className="text-xs text-gray-400">Project: {selectedGoal.project} • ID: {selectedGoal.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(selectedGoal.id, selectedGoal.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white"
                    >
                      {selectedGoal.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedGoal.id, 'COMPLETED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs border border-emerald-500/40"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleDelete(selectedGoal.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs border border-red-500/40"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-mono text-cyan-400 uppercase">Linked Artifacts & Decisions</div>
                  <div className="text-[11px] text-gray-400">
                    When you tell ULTRON <span className="text-white italic">"Continue the {selectedGoal.title} work"</span>, all project files, recent git activity, and completed steps are recovered automatically.
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 py-16">
                <span className="text-4xl mb-2">🎯</span>
                <p className="text-xs">Select a goal to view linked missions, decisions, and context.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
