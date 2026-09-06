import React, { useState, useEffect } from 'react'
import { ProjectTimelineItem, ProjectDecision } from '../../../shared/types'
import { ModalNavHeader } from '../nav/ModalNavHeader'

interface ProjectIntelligenceModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ProjectIntelligenceModal: React.FC<ProjectIntelligenceModalProps> = ({ isOpen, onClose }) => {
  const [timeline, setTimeline] = useState<ProjectTimelineItem[]>([])
  const [projectName, setProjectName] = useState('ULTRON')
  const [title, setTitle] = useState('')
  const [context, setContext] = useState('')
  const [decision, setDecision] = useState('')
  const [rationale, setRationale] = useState('')

  const loadHistory = async () => {
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.projectIntelligence?.getHistory) {
        const items = await bridge.projectIntelligence.getHistory(projectName, 'C:\\Users\\Sukesh D\\Desktop\\ULTRON')
        setTimeline(items || [])
      }
    } catch (err) {
      console.warn('Failed to load project history:', err)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen, projectName])

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !decision.trim()) return
    try {
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.projectIntelligence?.recordDecision) {
        await bridge.projectIntelligence.recordDecision({
          projectName,
          title,
          context,
          decision,
          rationale
        })
        setTitle('')
        setContext('')
        setDecision('')
        setRationale('')
        loadHistory()
      }
    } catch (err) {
      console.warn('Failed to record decision:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="px-6 pt-4">
          <ModalNavHeader
            title="Project Intelligence"
            subtitle="Architecture decisions, Git milestones, and project memory"
            icon={<span className="text-cyan-400 text-xl">🧠</span>}
            onBack={onClose}
            onClose={onClose}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-6">
          {/* Left Column: Record Decision Form */}
          <div className="col-span-1 border-r border-white/10 pr-6 space-y-4">
            <form onSubmit={handleRecordDecision} className="space-y-3">
              <h3 className="text-xs font-mono text-cyan-400 uppercase">Record Architecture Decision</h3>
              <input
                type="text"
                placeholder="Decision title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
              />
              <textarea
                placeholder="Context..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={2}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
              />
              <textarea
                placeholder="Decision taken..."
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                rows={2}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
              />
              <textarea
                placeholder="Rationale..."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={2}
                className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs py-2 rounded-lg transition-colors"
              >
                Log Decision
              </button>
            </form>
          </div>

          {/* Right Column: Timeline */}
          <div className="col-span-2 space-y-3">
            <h3 className="text-xs font-mono text-gray-400 uppercase mb-3">Project History & Milestones</h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {timeline.length === 0 ? (
                <div className="text-gray-500 text-xs py-8 text-center">No recorded project milestones yet.</div>
              ) : (
                timeline.map((item) => (
                  <div key={item.id} className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      <span className="text-[10px] font-mono text-gray-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-gray-400">{item.summary}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
