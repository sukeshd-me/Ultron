import React, { useState, useEffect, useMemo } from 'react'
import {
  Brain,
  Search,
  Trash2,
  RefreshCw,
  AlertTriangle,
  FileText,
  Clock,
  Tag,
  Check,
  X,
  Database,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { MemoryRecord, MemoryCategory, MemoryStats } from '../../../shared/types'

const CATEGORY_TABS: Array<{ id: string; label: string; icon?: string }> = [
  { id: 'all', label: 'All Records' },
  { id: 'conversation', label: 'Conversations' },
  { id: 'fact', label: 'Facts' },
  { id: 'preference', label: 'Preferences' },
  { id: 'task', label: 'Tasks' },
  { id: 'tool_execution', label: 'Tools' },
  { id: 'research', label: 'Research' },
  { id: 'context', label: 'Context' }
]

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  conversation: { bg: 'rgba(0, 212, 255, 0.12)', text: '#00d4ff', border: 'rgba(0, 212, 255, 0.3)' },
  fact: { bg: 'rgba(0, 230, 118, 0.12)', text: '#00e676', border: 'rgba(0, 230, 118, 0.3)' },
  preference: { bg: 'rgba(157, 0, 255, 0.12)', text: '#b347ff', border: 'rgba(157, 0, 255, 0.3)' },
  task: { bg: 'rgba(255, 171, 64, 0.12)', text: '#ffab40', border: 'rgba(255, 171, 64, 0.3)' },
  tool_execution: { bg: 'rgba(68, 138, 255, 0.12)', text: '#448aff', border: 'rgba(68, 138, 255, 0.3)' },
  research: { bg: 'rgba(255, 0, 187, 0.12)', text: '#ff55dd', border: 'rgba(255, 0, 187, 0.3)' },
  context: { bg: 'rgba(0, 255, 204, 0.12)', text: '#00ffcc', border: 'rgba(0, 255, 204, 0.3)' }
}

export function MemoryInspector() {
  const [records, setRecords] = useState<MemoryRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState<MemoryStats | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals state
  const [selectedRecord, setSelectedRecord] = useState<MemoryRecord | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchMemories = async () => {
    setLoading(true)
    setError(null)
    const ultron = (window as any).ultron

    try {
      if (ultron?.memory) {
        const statsRes = await ultron.memory.getStats()
        setStats(statsRes)

        if (searchQuery.trim()) {
          const searchRes = await ultron.memory.search({
            query: searchQuery.trim(),
            category: activeCategory !== 'all' ? activeCategory : undefined,
            limit: 100
          })
          setRecords(searchRes || [])
          setTotalCount(searchRes ? searchRes.length : 0)
        } else {
          const listRes = await ultron.memory.list({
            category: activeCategory !== 'all' ? activeCategory : undefined,
            limit: 100
          })
          setRecords(listRes.records || [])
          setTotalCount(listRes.total || 0)
        }
      } else {
        setError('ULTRON Memory IPC bridge is not connected.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load memories from SQLite database.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [activeCategory, searchQuery])

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const ultron = (window as any).ultron
    if (ultron?.memory?.delete) {
      try {
        const success = await ultron.memory.delete(id)
        if (success) {
          setRecords((prev) => prev.filter((r) => r.id !== id))
          setTotalCount((prev) => Math.max(0, prev - 1))
          if (selectedRecord?.id === id) {
            setSelectedRecord(null)
          }
        }
      } catch (err) {
        console.error('Delete memory error:', err)
      }
    }
  }

  const handleClearAll = async () => {
    const ultron = (window as any).ultron
    if (ultron?.memory?.clear) {
      try {
        const success = await ultron.memory.clear()
        if (success) {
          setRecords([])
          setTotalCount(0)
          setSelectedRecord(null)
          setShowClearConfirm(false)
          fetchMemories()
        }
      } catch (err) {
        console.error('Clear memory error:', err)
      }
    }
  }

  const handleCopyContent = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts)
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header Card */}
      <div className="panel-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Brain size={22} color="#00d4ff" />
            <h2 style={{ color: '#00d4ff', fontSize: '18px', margin: 0, letterSpacing: '1px' }}>
              SQLITE MEMORY INSPECTOR
            </h2>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(0, 212, 255, 0.15)',
                color: '#00d4ff',
                fontWeight: 600,
                border: '1px solid rgba(0, 212, 255, 0.3)'
              }}
            >
              {totalCount} RECORDS
            </span>
          </div>
          <p style={{ color: '#9aa0a8', fontSize: '13px', margin: 0 }}>
            Local persistent SQLite storage for conversations, user preferences, task history, and agent context.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={fetchMemories}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: 'rgba(0, 212, 255, 0.1)',
              border: '1px solid rgba(0, 212, 255, 0.3)',
              color: '#00d4ff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={records.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: records.length === 0 ? 'rgba(255, 82, 82, 0.05)' : 'rgba(255, 82, 82, 0.15)',
              border: '1px solid rgba(255, 82, 82, 0.3)',
              color: records.length === 0 ? '#666' : '#ff5252',
              cursor: records.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 500
            }}
          >
            <Trash2 size={14} />
            Clear All
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px'
          }}
        >
          {Object.entries(stats.byCategory).map(([cat, count]) => {
            const style = CATEGORY_COLORS[cat] || { bg: 'rgba(255,255,255,0.05)', text: '#aaa', border: 'rgba(255,255,255,0.1)' }
            return (
              <div
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '10px 14px',
                  background: activeCategory === cat ? style.bg : 'var(--bg-glass)',
                  border: `1px solid ${activeCategory === cat ? style.border : 'var(--glass-border)'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: style.text, fontWeight: 600, letterSpacing: '0.8px' }}>
                  {cat.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                  {count}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Search & Category Filter Tabs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#5f6570' }}
          />
          <input
            type="text"
            placeholder="Search SQLite memories by content, key, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 40px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              color: '#e8eaed',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#9aa0a8',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {CATEGORY_TABS.map((tab) => {
            const active = activeCategory === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  background: active ? 'rgba(0, 212, 255, 0.15)' : 'var(--bg-glass)',
                  border: `1px solid ${active ? 'rgba(0, 212, 255, 0.4)' : 'var(--glass-border)'}`,
                  color: active ? '#00d4ff' : '#9aa0a8',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Records List / View */}
      {loading ? (
        <div className="panel-card" style={{ padding: '40px', textAlign: 'center' }}>
          <RefreshCw size={24} className="spin" style={{ color: '#00d4ff', marginBottom: '12px' }} />
          <p style={{ color: '#9aa0a8', fontSize: '13px', margin: 0 }}>Querying SQLite memory engine...</p>
        </div>
      ) : error ? (
        <div
          className="panel-card"
          style={{
            padding: '24px',
            border: '1px solid rgba(255, 82, 82, 0.3)',
            background: 'rgba(255, 82, 82, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <AlertTriangle size={20} color="#ff5252" />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#ff5252', fontWeight: 600, fontSize: '13px' }}>Memory Access Error</div>
            <div style={{ color: '#e8eaed', fontSize: '12px' }}>{error}</div>
          </div>
          <button
            onClick={fetchMemories}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#ff5252',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Retry
          </button>
        </div>
      ) : records.length === 0 ? (
        <div className="panel-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Database size={32} style={{ color: '#5f6570', marginBottom: '12px' }} />
          <h3 style={{ color: '#e8eaed', fontSize: '15px', margin: '0 0 6px 0' }}>No Memory Records Found</h3>
          <p style={{ color: '#5f6570', fontSize: '13px', margin: 0 }}>
            {searchQuery
              ? `No memories match query "${searchQuery}".`
              : `No memories recorded under category "${activeCategory}". Send commands in chat to generate history.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {records.map((record) => {
            const catStyle = CATEGORY_COLORS[record.category] || {
              bg: 'rgba(255,255,255,0.08)',
              text: '#aaa',
              border: 'rgba(255,255,255,0.15)'
            }

            return (
              <div
                key={record.id}
                onClick={() => setSelectedRecord(record)}
                className="panel-card"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: '1px solid var(--glass-border)',
                  padding: '14px 16px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)'
                  e.currentTarget.style.background = 'rgba(0, 212, 255, 0.04)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--glass-border)'
                  e.currentTarget.style.background = 'var(--bg-glass)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: catStyle.bg,
                        color: catStyle.text,
                        border: `1px solid ${catStyle.border}`
                      }}
                    >
                      {record.category.replace('_', ' ')}
                    </span>
                    {record.key && (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#00d4ff',
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(0, 212, 255, 0.08)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {record.key}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#5f6570', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      {formatTimestamp(record.created_at)}
                    </span>
                    <button
                      onClick={(e) => handleDelete(record.id, e)}
                      title="Delete record"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#5f6570',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#ff5252')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#5f6570')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content snippet */}
                <div
                  style={{
                    fontSize: '13px',
                    color: '#e8eaed',
                    lineHeight: '1.5',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'pre-wrap',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {record.content}
                </div>

                {/* Tags / Metadata pill badges */}
                {record.metadata && Object.keys(record.metadata).length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {Object.entries(record.metadata).slice(0, 3).map(([k, v]) => (
                      <span
                        key={k}
                        style={{
                          fontSize: '10px',
                          color: '#9aa0a8',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {k}: {typeof v === 'object' ? '{...}' : String(v).slice(0, 20)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '24px'
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="panel-card"
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: '#0d0d24',
              border: '1px solid rgba(0, 212, 255, 0.4)',
              boxShadow: '0 0 40px rgba(0, 212, 255, 0.2)',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={18} color="#00d4ff" />
                <h3 style={{ margin: 0, color: '#00d4ff', fontSize: '15px' }}>MEMORY RECORD DETAILS</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'transparent', border: 'none', color: '#9aa0a8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="panel-card-row">
                <span className="label">ID:</span>
                <span className="value" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{selectedRecord.id}</span>
              </div>
              <div className="panel-card-row">
                <span className="label">Category:</span>
                <span className="value" style={{ textTransform: 'uppercase', color: '#00d4ff' }}>{selectedRecord.category}</span>
              </div>
              {selectedRecord.key && (
                <div className="panel-card-row">
                  <span className="label">Key:</span>
                  <span className="value" style={{ fontFamily: 'var(--font-mono)' }}>{selectedRecord.key}</span>
                </div>
              )}
              <div className="panel-card-row">
                <span className="label">Created At:</span>
                <span className="value">{formatTimestamp(selectedRecord.created_at)}</span>
              </div>
              <div className="panel-card-row">
                <span className="label">Updated At:</span>
                <span className="value">{formatTimestamp(selectedRecord.updated_at)}</span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span className="panel-card-title" style={{ margin: 0 }}>Content</span>
                  <button
                    onClick={() => handleCopyContent(selectedRecord.content, selectedRecord.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'transparent',
                      border: 'none',
                      color: copiedId === selectedRecord.id ? '#00e676' : '#00d4ff',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    {copiedId === selectedRecord.id ? <Check size={12} /> : null}
                    {copiedId === selectedRecord.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div
                  style={{
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: '#e8eaed',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}
                >
                  {selectedRecord.content}
                </div>
              </div>

              {selectedRecord.metadata && Object.keys(selectedRecord.metadata).length > 0 && (
                <div>
                  <div className="panel-card-title" style={{ marginBottom: '6px' }}>Metadata JSON</div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '12px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      color: '#00e676',
                      overflowX: 'auto',
                      maxHeight: '160px'
                    }}
                  >
                    {JSON.stringify(selectedRecord.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => handleDelete(selectedRecord.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '6px',
                    background: 'rgba(255, 82, 82, 0.15)',
                    border: '1px solid rgba(255, 82, 82, 0.4)',
                    color: '#ff5252',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  <Trash2 size={14} />
                  Delete Memory
                </button>
                <button
                  onClick={() => setSelectedRecord(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    background: 'rgba(0, 212, 255, 0.15)',
                    border: '1px solid rgba(0, 212, 255, 0.4)',
                    color: '#00d4ff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '24px'
          }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="panel-card"
            style={{
              maxWidth: '460px',
              width: '100%',
              background: '#120b1c',
              border: '1px solid rgba(255, 82, 82, 0.5)',
              boxShadow: '0 0 50px rgba(255, 82, 82, 0.25)',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff5252', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '16px' }}>CONFIRM MEMORY PURGE</h3>
            </div>
            <p style={{ color: '#e8eaed', fontSize: '13px', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              Are you sure you want to permanently clear all <strong>{totalCount}</strong> records from the ULTRON SQLite memory database?
              This will wipe conversation histories, user facts, preferences, and task telemetry permanently.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e8eaed',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: '#ff5252',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                Confirm Wipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
