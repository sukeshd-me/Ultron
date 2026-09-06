import React, { useState, useEffect } from 'react'
import { ContextNode, ContextEdge } from '../../../shared/types'

interface ContextGraphModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ContextGraphModal: React.FC<ContextGraphModalProps> = ({ isOpen, onClose }) => {
  const [nodes, setNodes] = useState<ContextNode[]>([])
  const [edges, setEdges] = useState<ContextEdge[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedNode, setSelectedNode] = useState<ContextNode | null>(null)
  const [queryAnswer, setQueryAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchGraph = async () => {
    setLoading(true)
    try {
      if ((window as any).ultron?.contextGraph) {
        const data = await (window as any).ultron.contextGraph.getGraph()
        setNodes(data.nodes || [])
        setEdges(data.edges || [])
        if (data.nodes?.length > 0 && !selectedNode) {
          setSelectedNode(data.nodes[0])
        }
      }
    } catch (err) {
      console.error('Failed to load context graph:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchGraph()
      setQueryAnswer(null)
    }
  }, [isOpen])

  const handleQuery = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      if ((window as any).ultron?.contextGraph) {
        const res = await (window as any).ultron.contextGraph.query(searchQuery)
        setQueryAnswer(res.answer || 'No specific relationship found.')
        if (res.nodes?.length > 0) {
          setSelectedNode(res.nodes[0])
        }
      }
    } catch (err) {
      console.error('Failed to query context graph:', err)
      setQueryAnswer('Query failed: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const filteredNodes = nodes.filter((n) => {
    const matchesType = selectedType === 'all' || n.type === selectedType
    const matchesSearch =
      !searchQuery ||
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.type.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const connectedEdges = edges.filter(
    (e) => e.sourceId === selectedNode?.id || e.targetId === selectedNode?.id
  )

  const typeIcons: Record<string, string> = {
    project: '📁',
    file: '📄',
    task: '✅',
    mission: '🎯',
    goal: '🌟',
    workspace: '🏢',
    git_repo: '🌿',
    contact: '👤',
    app: '💻',
    skill: '⚡',
    automation: '⚙️'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-5xl h-[80vh] bg-[#090a0f] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span className="text-xl">🕸️</span>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-white uppercase font-mono">
                Personal Context Graph
              </h2>
              <p className="text-[11px] text-gray-400">
                Connected intelligence linking projects, files, tasks, workspaces, git repositories, and goals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
              {nodes.length} Entities • {edges.length} Relations
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Natural Query Bar */}
        <div className="p-4 border-b border-white/10 bg-black/40 flex gap-2">
          <input
            type="text"
            placeholder='Ask: "What is connected to my ULTRON project?" or filter entities...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            className="flex-1 bg-[#12141c] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60"
          />
          <button
            onClick={handleQuery}
            disabled={loading}
            className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold transition-all"
          >
            {loading ? 'Searching...' : 'Ask Graph ↵'}
          </button>
        </div>

        {/* Natural Query Answer Card */}
        {queryAnswer && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2 animate-fade-in">
            <span className="text-base">💡</span>
            <div className="flex-1 font-mono text-[12px] leading-relaxed">{queryAnswer}</div>
            <button
              onClick={() => setQueryAnswer(null)}
              className="text-gray-400 hover:text-white text-[11px]"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content Split: Left Entity List, Right Connection Detail */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Entities */}
          <div className="w-1/2 border-r border-white/10 flex flex-col bg-[#0b0d13]/60">
            {/* Filter Pills */}
            <div className="flex gap-1.5 p-3 overflow-x-auto border-b border-white/5 text-[10px] font-mono">
              {['all', 'project', 'workspace', 'git_repo', 'task', 'mission', 'goal', 'app'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-2.5 py-1 rounded-lg uppercase tracking-wider transition-colors ${
                    selectedType === t
                      ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Entity List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredNodes.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-500 font-mono">No entities found in context graph.</div>
              ) : (
                filteredNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id
                  const icon = typeIcons[node.type] || '📌'
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3 rounded-xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-white'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/15 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{icon}</span>
                          <div>
                            <div className="text-xs font-semibold">{node.name}</div>
                            <div className="text-[10px] text-gray-500 font-mono uppercase">{node.type}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">
                          ID: {node.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Right: Selected Node Detail & Graph Relations */}
          <div className="w-1/2 p-5 overflow-y-auto bg-black/20 flex flex-col space-y-4">
            {selectedNode ? (
              <>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeIcons[selectedNode.type] || '📌'}</span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{selectedNode.name}</h3>
                      <span className="text-[10px] font-mono uppercase text-cyan-400">
                        {selectedNode.type}
                      </span>
                    </div>
                  </div>
                  {selectedNode.data && Object.keys(selectedNode.data).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-1">
                        Metadata
                      </div>
                      <pre className="text-[11px] font-mono text-gray-300 bg-black/40 p-2 rounded-lg overflow-x-auto">
                        {JSON.stringify(selectedNode.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Connections */}
                <div>
                  <div className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mb-2 flex items-center justify-between">
                    <span>Direct Graph Connections ({connectedEdges.length})</span>
                  </div>
                  {connectedEdges.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-500 border border-dashed border-white/10 rounded-xl">
                      No direct graph relations mapped for this entity yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {connectedEdges.map((edge) => {
                        const isOutgoing = edge.sourceId === selectedNode.id
                        const otherId = isOutgoing ? edge.targetId : edge.sourceId
                        const otherNode = nodes.find((n) => n.id === otherId)
                        return (
                          <div
                            key={edge.id}
                            className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between hover:border-cyan-500/30 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-cyan-400 font-mono">
                                {isOutgoing ? '→' : '←'}
                              </span>
                              <div>
                                <div className="text-xs font-semibold text-white">
                                  {otherNode?.name || otherId}
                                </div>
                                <div className="text-[10px] font-mono text-gray-500 uppercase">
                                  {edge.relationship} ({otherNode?.type || 'node'})
                                </div>
                              </div>
                            </div>
                            {edge.weight && (
                              <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                                weight: {edge.weight}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-gray-500 font-mono">
                Select an entity to explore its context relationships.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
