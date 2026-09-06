// src/renderer/components/history/TaskHistoryModal.tsx — V1.0.5 Detailed Task History
import React, { useEffect, useState } from 'react'
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  Shield,
  FileCode,
  X
} from 'lucide-react'
import { TaskHistoryRecord } from '../../../shared/types'
import { ModalNavHeader } from '../nav/ModalNavHeader'

interface TaskHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORIES = ['ALL', 'MISSIONS', 'WINDOWS', 'ANDROID', 'FILES', 'BROWSER', 'RESEARCH', 'CODING', 'SECURITY', 'SYSTEM', 'AI']
const STATUSES = ['ALL', 'SUCCESS', 'FAILED', 'CANCELLED', 'BLOCKED', 'WAITING', 'PARTIAL']

export function TaskHistoryModal({ isOpen, onClose }: TaskHistoryModalProps) {
  const [records, setRecords] = useState<TaskHistoryRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<TaskHistoryRecord | null>(null)
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const loadHistory = async () => {
    setLoading(true)
    const ultron = (window as any).ultron
    if (ultron?.history?.list) {
      try {
        const filter: any = { limit: 100 }
        if (activeCategory !== 'ALL') filter.category = activeCategory.toLowerCase()
        if (activeStatus !== 'ALL') filter.status = activeStatus
        if (searchQuery.trim()) filter.query = searchQuery.trim()

        const list = await ultron.history.list(filter)
        setRecords(list || [])
        if (list && list.length > 0 && !selectedRecord) {
          setSelectedRecord(list[0])
        }
      } catch (err) {
        console.error('Failed to load history', err)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen, activeCategory, activeStatus])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loadHistory()
  }

  const handleRollback = async (actionId?: string) => {
    const ultron = (window as any).ultron
    if (ultron?.recovery?.undo) {
      await ultron.recovery.undo(actionId)
      loadHistory()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <ModalNavHeader
          title="Detailed Task History"
          subtitle="Complete audit log of goals, tools executed, durations & verification results"
          icon={<History className="w-5 h-5 text-[#00d4ff]" />}
          onBack={onClose}
          onClose={onClose}
        />

        {/* Filters and Search Bar */}
        <div className="py-3 space-y-2.5 border-b border-[#1f1f28]">
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search requests, tools, intents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0e0e14] border border-[#1f1f28] rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-[#00d4ff] outline-none"
              />
            </form>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wider uppercase transition flex-shrink-0 ${
                  activeCategory === cat
                    ? 'bg-[#00d4ff] text-black'
                    : 'bg-[#121218] text-gray-400 hover:text-white hover:bg-[#1a1a24]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Master Detail Split */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 min-h-0">
          {/* History List */}
          <div className="overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {records.length === 0 ? (
              <div className="text-xs text-gray-500 py-8 text-center">No matching history events found.</div>
            ) : (
              records.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRecord(rec)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex flex-col gap-1.5 ${
                    selectedRecord?.id === rec.id
                      ? 'bg-[#14141e] border-[#00d4ff]'
                      : 'bg-[#0e0e14] border-[#1f1f28] hover:border-[#00d4ff]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        rec.status === 'SUCCESS' ? 'bg-[#00ff88]' : rec.status === 'FAILED' ? 'bg-red-500' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-[10px] text-gray-500">
                      {new Date(rec.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white line-clamp-2">{rec.userRequest}</div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-[#1f1f28]/60">
                    <span className="font-mono text-gray-500">{rec.intent}</span>
                    <span>{rec.durationMs ? `${rec.durationMs}ms` : ''}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Record Details Panel */}
          <div className="md:col-span-2 bg-[#0d0d12] border border-[#1f1f28] rounded-xl p-4 overflow-y-auto custom-scrollbar">
            {selectedRecord ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between pb-3 border-b border-[#1f1f28]">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Record Details</span>
                    <h3 className="text-sm font-bold text-white mt-0.5">{selectedRecord.userRequest}</h3>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                      selectedRecord.status === 'SUCCESS'
                        ? 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/40'
                        : 'bg-red-500/20 text-red-400 border-red-500/40'
                    }`}
                  >
                    {selectedRecord.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg bg-[#111118] border border-[#1f1f28]">
                    <div className="text-[10px] text-gray-500">Intent</div>
                    <div className="text-xs font-bold text-[#00d4ff] truncate">{selectedRecord.intent}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#111118] border border-[#1f1f28]">
                    <div className="text-[10px] text-gray-500">Duration</div>
                    <div className="text-xs font-bold text-white">{selectedRecord.durationMs || 0}ms</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#111118] border border-[#1f1f28]">
                    <div className="text-[10px] text-gray-500">Skill Activated</div>
                    <div className="text-xs font-bold text-white truncate">{selectedRecord.skill || 'Default'}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#111118] border border-[#1f1f28]">
                    <div className="text-[10px] text-gray-500">Permission</div>
                    <div className="text-xs font-bold text-[#00ff88] truncate">{selectedRecord.permissionState || 'GRANTED'}</div>
                  </div>
                </div>

                {selectedRecord.tool && (
                  <div className="p-3 rounded-lg bg-[#111118] border border-[#1f1f28]">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Tools Executed</div>
                    <div className="text-xs font-mono text-[#00d4ff]">{selectedRecord.tool}</div>
                  </div>
                )}

                {selectedRecord.resultSummary && (
                  <div className="p-3 rounded-lg bg-[#111118] border border-[#1f1f28]">
                    <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Execution Result</div>
                    <div className="text-xs text-gray-200 leading-relaxed">{selectedRecord.resultSummary}</div>
                  </div>
                )}

                {selectedRecord.recoveryActionId && (
                  <div className="p-3 rounded-lg bg-[#1a140f] border border-amber-500/40 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-amber-300">Reversible Operation Available</div>
                      <div className="text-[11px] text-gray-400">This action modified local files and can be reverted safely.</div>
                    </div>
                    <button
                      onClick={() => handleRollback(selectedRecord.recoveryActionId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-lg hover:bg-amber-400 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Undo Action
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-500">
                Select an entry from the list to inspect execution metrics and tool traces.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
