import React, { useState, useEffect } from 'react'
import { InboxItem, InboxSummary } from '../../../shared/types'

interface UniversalInboxModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UniversalInboxModal: React.FC<UniversalInboxModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<InboxItem[]>([])
  const [summary, setSummary] = useState<InboxSummary | null>(null)
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'URGENT'>('ALL')
  const [loading, setLoading] = useState(false)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const loadInbox = async () => {
    setLoading(true)
    try {
      if (bridge?.inbox) {
        const sum = await bridge.inbox.getSummary()
        setSummary(sum)
        const unreadOnly = activeTab === 'UNREAD'
        const importance = activeTab === 'URGENT' ? 'URGENT' : undefined
        const list = await bridge.inbox.getItems({ unreadOnly, importance })
        setItems(list || [])
      }
    } catch (err) {
      console.warn('Failed to load inbox:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) loadInbox()
  }, [isOpen, activeTab])

  const handleMarkRead = async (id: string) => {
    if (bridge?.inbox?.markRead) {
      await bridge.inbox.markRead(id)
      loadInbox()
    }
  }

  const handleClearLow = async () => {
    if (bridge?.inbox?.clearLowPriority) {
      await bridge.inbox.clearLowPriority()
      loadInbox()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">📥</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Universal Inbox</h2>
              <p className="text-[11px] text-gray-400">Aggregated notifications, Android messages, and priority alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
        </div>

        {/* Summary Banner */}
        {summary && (
          <div className="px-6 py-3 bg-cyan-950/20 border-b border-cyan-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-gray-300">Total: <strong className="text-white">{summary.totalCount}</strong></span>
              <span className="text-gray-300">Unread: <strong className="text-cyan-400">{summary.unreadCount}</strong></span>
              {summary.urgentCount > 0 && (
                <span className="text-red-400 font-bold animate-pulse">⚠️ {summary.urgentCount} Urgent</span>
              )}
            </div>
            <button
              onClick={handleClearLow}
              className="text-[11px] text-gray-400 hover:text-cyan-300 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded transition"
            >
              Clear Low Priority
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 px-6 pt-4">
          {(['ALL', 'UNREAD', 'URGENT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition ${activeTab === tab ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-gray-400 hover:text-white bg-white/5'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="text-center py-12 text-gray-500 text-xs font-mono">Syncing inbox items...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-xs font-mono">No notifications matching filter.</div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                  item.isRead ? 'bg-black/30 border-white/5 opacity-70' : 'bg-black/60 border-cyan-500/20 shadow-lg'
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      item.importance === 'URGENT' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      item.importance === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {item.importance}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">[{item.source}]</span>
                    <span className="text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                  <p className="text-[11px] text-gray-300 leading-relaxed">{item.content}</p>
                </div>
                {!item.isRead && (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-200 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30 whitespace-nowrap"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
