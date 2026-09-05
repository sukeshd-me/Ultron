// src/renderer/components/SmartWorkspaceBar.tsx — V1.0.4 Smart Project Workspace Context Bar
import React, { useState, useEffect } from 'react'
import { FolderGit2, GitBranch, Folder, ChevronDown, Check, RefreshCw } from 'lucide-react'
import { WorkspaceContext } from '../../shared/types'

export function SmartWorkspaceBar() {
  const [context, setContext] = useState<WorkspaceContext | null>(null)
  const [recent, setRecent] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchContext = async () => {
    const ultron = (window as any).ultron
    if (!ultron?.workspace?.getContext) return

    try {
      setLoading(true)
      const ctx = await ultron.workspace.getContext()
      setContext(ctx)
      if (ultron.workspace.getRecentWorkspaces) {
        const rec = await ultron.workspace.getRecentWorkspaces()
        setRecent(rec || [])
      }
    } catch (err) {
      console.error('[Workspace] Fetch context error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContext()
    const interval = setInterval(fetchContext, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleSwitch = async (path: string) => {
    const ultron = (window as any).ultron
    if (!ultron?.workspace?.switchProject) return

    try {
      await ultron.workspace.switchProject(path)
      setIsOpen(false)
      fetchContext()
    } catch (err) {
      console.error('[Workspace] Switch project error:', err)
    }
  }

  if (!context) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1 rounded bg-black border border-cyan-500/20 hover:border-cyan-500/40 text-gray-300 hover:text-white transition-all text-xs font-mono"
        title={`Active Workspace: ${context.projectPath}`}
      >
        <FolderGit2 size={13} className="text-cyan-400 shrink-0" />
        <span className="font-semibold text-white max-w-[130px] truncate">{context.projectName}</span>

        {context.git?.isGit && (
          <span className="flex items-center gap-1 text-[11px] text-purple-300 bg-purple-950/30 px-1.5 py-0.5 rounded border border-purple-500/30">
            <GitBranch size={10} />
            <span>{context.git.branch || 'main'}</span>
            {context.git.isDirty && <span className="text-amber-400 font-bold">*</span>}
          </span>
        )}

        <ChevronDown size={11} className="text-gray-500" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-1 w-72 bg-black border border-cyan-500/30 rounded-lg shadow-2xl z-50 p-2 text-xs font-mono">
            <div className="px-2 py-1 border-b border-white/5 text-[10px] text-gray-500 uppercase flex items-center justify-between">
              <span>Active Workspace</span>
              <button
                onClick={fetchContext}
                className="hover:text-cyan-400 text-gray-400 flex items-center gap-1"
              >
                <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="p-2 space-y-1">
              <div className="text-white font-bold flex items-center gap-1.5">
                <Folder size={12} className="text-cyan-400" />
                <span>{context.projectName}</span>
              </div>
              <div className="text-[10px] text-gray-400 truncate" title={context.projectPath}>
                {context.projectPath}
              </div>

              {context.git?.isGit && (
                <div className="mt-2 text-[11px] text-gray-300 bg-white/5 p-1.5 rounded border border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Branch:</span>
                    <span className="text-purple-300 font-bold">{context.git.branch}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={context.git.isDirty ? 'text-amber-400' : 'text-emerald-400'}>
                      {context.git.isDirty ? 'Uncommitted changes' : 'Clean tree'}
                    </span>
                  </div>
                  {context.git.lastCommit && (
                    <div className="text-[10px] text-gray-400 truncate pt-1 border-t border-white/5">
                      Commit: {context.git.lastCommit}
                    </div>
                  )}
                </div>
              )}
            </div>

            {recent.length > 0 && (
              <>
                <div className="mt-2 px-2 py-1 border-t border-white/5 text-[10px] text-gray-500 uppercase">
                  Recent Workspaces
                </div>
                <div className="space-y-0.5 mt-1 max-h-36 overflow-y-auto custom-scrollbar">
                  {recent.map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => handleSwitch(rec.path)}
                      className={`w-full text-left px-2 py-1.5 rounded hover:bg-white/5 flex items-center justify-between group ${
                        rec.path === context.projectPath ? 'bg-cyan-950/30 text-cyan-300' : 'text-gray-300'
                      }`}
                    >
                      <div className="truncate min-w-0 pr-2">
                        <div className="text-xs truncate font-medium">{rec.name}</div>
                        <div className="text-[9px] text-gray-500 truncate">{rec.path}</div>
                      </div>
                      {rec.path === context.projectPath && <Check size={12} className="text-cyan-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
