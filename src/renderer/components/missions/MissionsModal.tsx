// src/renderer/components/missions/MissionsModal.tsx — V1.0.5 Agent Mission Mode UI
import React, { useEffect, useState } from 'react'
import {
  Compass,
  Play,
  Pause,
  RotateCw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  X
} from 'lucide-react'
import { Mission, MissionStep, MissionStatus } from '../../../shared/types'

interface MissionsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MissionsModal({ isOpen, onClose }: MissionsModalProps) {
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newSteps, setNewSteps] = useState<string[]>(['Inspect repository', 'Run automated verification', 'Build application artifact'])

  const loadMissions = async () => {
    const ultron = (window as any).ultron
    if (ultron?.missions?.list) {
      try {
        const list = await ultron.missions.list()
        setMissions(list || [])
        if (selectedMission) {
          const updated = (list || []).find((m: Mission) => m.id === selectedMission.id)
          if (updated) setSelectedMission(updated)
        } else if (list && list.length > 0) {
          setSelectedMission(list[0])
        }
      } catch (err) {
        console.error('Failed to load missions', err)
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadMissions()
      const interval = setInterval(loadMissions, 2000)
      return () => clearInterval(interval)
    }
  }, [isOpen, selectedMission?.id])

  const handleStart = async (id: string) => {
    const ultron = (window as any).ultron
    if (ultron?.missions?.start) {
      await ultron.missions.start(id)
      loadMissions()
    }
  }

  const handlePause = async (id: string) => {
    const ultron = (window as any).ultron
    if (ultron?.missions?.pause) {
      await ultron.missions.pause(id)
      loadMissions()
    }
  }

  const handleResume = async (id: string) => {
    const ultron = (window as any).ultron
    if (ultron?.missions?.resume) {
      await ultron.missions.resume(id)
      loadMissions()
    }
  }

  const handleCancel = async (id: string) => {
    const ultron = (window as any).ultron
    if (ultron?.missions?.cancel) {
      await ultron.missions.cancel(id)
      loadMissions()
    }
  }

  const handleRetryStep = async (missionId: string, stepId: string) => {
    const ultron = (window as any).ultron
    if (ultron?.missions?.retryStep) {
      await ultron.missions.retryStep(missionId, stepId)
      loadMissions()
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    const ultron = (window as any).ultron
    if (ultron?.missions?.create) {
      const stepsFormatted = newSteps.filter((s) => s.trim().length > 0).map((title, idx) => ({
        title,
        description: `Step ${idx + 1}: ${title}`
      }))
      const created = await ultron.missions.create(newTitle.trim(), newDesc.trim(), stepsFormatted)
      setIsCreating(false)
      setNewTitle('')
      setNewDesc('')
      loadMissions()
      if (created) setSelectedMission(created)
    }
  }

  if (!isOpen) return null

  const getStatusBadge = (status: MissionStatus) => {
    switch (status) {
      case 'RUNNING':
        return <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 font-semibold"><Clock className="w-3 h-3 animate-spin" /> RUNNING</span>
      case 'COMPLETED':
        return <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 font-semibold"><CheckCircle2 className="w-3 h-3" /> COMPLETED</span>
      case 'FAILED':
        return <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-semibold"><XCircle className="w-3 h-3" /> FAILED</span>
      case 'WAITING_PERMISSION':
        return <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold"><AlertTriangle className="w-3 h-3" /> WAITING APPROVAL</span>
      case 'PAUSED':
        return <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-semibold"><Pause className="w-3 h-3" /> PAUSED</span>
      default:
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1f1f28] text-gray-400 font-semibold">PLANNED</span>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f1f28]">
          <div className="flex items-center gap-2.5">
            <Compass className="w-5 h-5 text-[#00d4ff]" />
            <div>
              <h2 className="text-base font-bold text-white">Agent Mission Mode</h2>
              <p className="text-xs text-gray-400">Autonomous multi-step goals with continuous verification & safety</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#00d4ff] bg-[#00d4ff]/15 border border-[#00d4ff]/30 rounded-lg hover:bg-[#00d4ff]/25 transition"
            >
              <Plus className="w-3.5 h-3.5" /> New Mission
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Create Mission Drawer */}
        {isCreating && (
          <form onSubmit={handleCreate} className="p-4 rounded-xl bg-[#111118] border border-[#1f1f28] mt-3 space-y-3">
            <div className="text-xs font-bold text-white">Define New Mission</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Mission Title (e.g. Prepare ULTRON for release)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-[#0a0a0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00d4ff] outline-none"
              />
              <input
                type="text"
                placeholder="Description of the overall goal"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="bg-[#0a0a0f] border border-[#1f1f28] rounded-lg px-3 py-2 text-xs text-white focus:border-[#00d4ff] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-gray-400 font-medium">Steps in Workflow:</label>
              {newSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-4">{idx + 1}.</span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => {
                      const updated = [...newSteps]
                      updated[idx] = e.target.value
                      setNewSteps(updated)
                    }}
                    className="flex-1 bg-[#0a0a0f] border border-[#1f1f28] rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00d4ff] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setNewSteps(newSteps.filter((_, i) => i !== idx))}
                    className="text-gray-500 hover:text-red-400 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setNewSteps([...newSteps, ''])}
                className="text-[11px] text-[#00d4ff] hover:underline"
              >
                + Add another step
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-lg bg-[#1a1a24] text-gray-300 text-xs hover:bg-[#252535] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#00d4ff] text-black font-semibold text-xs hover:bg-[#33ddff] transition"
              >
                Create Mission
              </button>
            </div>
          </form>
        )}

        {/* Master-Detail Split */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 min-h-0">
          {/* Mission List */}
          <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Missions</span>
            {missions.length === 0 ? (
              <div className="text-xs text-gray-500 py-6 text-center">No missions created yet.</div>
            ) : (
              missions.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMission(m)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-2 ${
                    selectedMission?.id === m.id
                      ? 'bg-[#14141e] border-[#00d4ff]'
                      : 'bg-[#0e0e14] border-[#1f1f28] hover:border-[#00d4ff]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-white leading-tight">{m.title}</span>
                    {getStatusBadge(m.status)}
                  </div>
                  <div className="text-[11px] text-gray-400 line-clamp-2">{m.description}</div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 border-t border-[#1f1f28]">
                    <span>{m.steps?.length || 0} steps</span>
                    <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Mission Details & Step Timeline */}
          <div className="md:col-span-2 flex flex-col bg-[#0d0d12] border border-[#1f1f28] rounded-xl p-4 overflow-hidden">
            {selectedMission ? (
              <div className="flex flex-col h-full space-y-4">
                {/* Detail Header & Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f1f28]">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{selectedMission.title}</h3>
                      {getStatusBadge(selectedMission.status)}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedMission.description}</p>
                  </div>

                  {/* Mission Controls */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedMission.status === 'PLANNED' && (
                      <button
                        onClick={() => handleStart(selectedMission.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00d4ff] text-black font-semibold text-xs hover:bg-[#33ddff] transition"
                      >
                        <Play className="w-3.5 h-3.5" /> Start
                      </button>
                    )}
                    {selectedMission.status === 'RUNNING' && (
                      <button
                        onClick={() => handlePause(selectedMission.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 text-black font-semibold text-xs hover:bg-yellow-400 transition"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </button>
                    )}
                    {selectedMission.status === 'PAUSED' && (
                      <button
                        onClick={() => handleResume(selectedMission.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00ff88] text-black font-semibold text-xs hover:bg-[#33ffaa] transition"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume
                      </button>
                    )}
                    {(selectedMission.status === 'RUNNING' || selectedMission.status === 'PAUSED' || selectedMission.status === 'WAITING_PERMISSION') && (
                      <button
                        onClick={() => handleCancel(selectedMission.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 text-xs hover:bg-red-500/30 transition"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Steps List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Execution Steps</span>
                  {selectedMission.steps?.map((step: MissionStep, idx: number) => {
                    const isStepRunning = step.status === 'RUNNING'
                    const isStepDone = step.status === 'COMPLETED'
                    const isStepFailed = step.status === 'FAILED'
                    const isStepWaiting = step.status === 'WAITING_PERMISSION'

                    return (
                      <div
                        key={step.id}
                        className={`p-3 rounded-xl border flex flex-col gap-1.5 transition ${
                          isStepRunning
                            ? 'bg-[#121824] border-[#00d4ff]/60 shadow-lg shadow-[#00d4ff]/5'
                            : isStepDone
                            ? 'bg-[#0f1712] border-[#00ff88]/30'
                            : isStepFailed
                            ? 'bg-[#1a0f12] border-red-500/40'
                            : 'bg-[#111116] border-[#1f1f28]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-500">{idx + 1}.</span>
                            <span className="text-xs font-bold text-white">{step.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {step.durationMs && <span className="text-[10px] text-gray-400">{step.durationMs}ms</span>}
                            {getStatusBadge(step.status)}
                          </div>
                        </div>

                        <div className="text-[11px] text-gray-400">{step.description}</div>

                        {step.error && (
                          <div className="text-[11px] text-red-400 bg-red-950/40 border border-red-800/40 rounded p-1.5 mt-1">
                            Error: {step.error}
                          </div>
                        )}

                        {isStepFailed && (
                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleRetryStep(selectedMission.id, step.id)}
                              className="flex items-center gap-1 text-xs text-[#00d4ff] hover:underline"
                            >
                              <RotateCw className="w-3 h-3" /> Retry Failed Step
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-500">
                Select a mission from the list to view step timeline and execution status.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
