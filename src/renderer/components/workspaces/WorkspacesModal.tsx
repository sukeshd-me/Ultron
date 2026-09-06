import React, { useState, useEffect } from 'react'
import { WorkspaceProfile, WorkspaceItem } from '../../../shared/types'

interface WorkspacesModalProps {
  isOpen: boolean
  onClose: () => void
}

export const WorkspacesModal: React.FC<WorkspacesModalProps> = ({ isOpen, onClose }) => {
  const [workspaces, setWorkspaces] = useState<Array<WorkspaceProfile & { items: WorkspaceItem[] }>>([])
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const loadWorkspaces = async () => {
    setLoading(true)
    try {
      if (bridge?.workspaces) {
        const list = await bridge.workspaces.list()
        setWorkspaces(list || [])
      }
    } catch (err) {
      console.warn('Failed to load workspaces:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) loadWorkspaces()
  }, [isOpen])

  const handleSwitch = async (id: string) => {
    try {
      if (bridge?.workspaces) {
        const res = await bridge.workspaces.switch(id)
        setStatusMsg(res.message)
        loadWorkspaces()
      }
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-4xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🏢</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Multiple Workspaces</h2>
              <p className="text-[11px] text-gray-400">Environment profiles (Development, Research, Study, Security Lab)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
        </div>

        {statusMsg && (
          <div className="px-6 py-2.5 bg-cyan-950/30 border-b border-cyan-500/20 text-xs text-cyan-300">
            {statusMsg}
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            {workspaces.map(ws => (
              <div
                key={ws.id}
                className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                  ws.isActive ? 'bg-cyan-950/20 border-cyan-500/40 shadow-lg' : 'bg-black/40 border-white/10'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{ws.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400">{ws.category}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{ws.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] text-gray-500 font-mono">
                    {ws.items?.length || 0} configured items
                  </span>
                  {ws.isActive ? (
                    <span className="text-[10px] text-cyan-400 font-mono font-bold flex items-center gap-1">
                      ● Active Workspace
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSwitch(ws.id)}
                      className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-[11px] transition"
                    >
                      Switch To
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
