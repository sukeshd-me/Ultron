import React, { useState } from 'react'

interface ImportExportModalProps {
  isOpen: boolean
  onClose: () => void
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ isOpen, onClose }) => {
  const [statusMsg, setStatusMsg] = useState('')

  const handleExport = async () => {
    try {
      setStatusMsg('Exporting configuration...')
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.importExport?.exportConfig) {
        const res = await bridge.importExport.exportConfig({
          includePreferences: true,
          includeSkills: true,
          includeWorkspaces: true
        })
        setStatusMsg(res.success ? 'Export completed successfully.' : `Export cancelled or failed: ${res.message}`)
      }
    } catch (err: any) {
      setStatusMsg(`Export error: ${err.message}`)
    }
  }

  const handleImport = async () => {
    try {
      setStatusMsg('Importing configuration...')
      const bridge = (window as any).electronBridge || (window as any).ultron
      if (bridge?.importExport?.importConfig) {
        const res = await bridge.importExport.importConfig()
        setStatusMsg(res.success ? res.message : `Import failed: ${res.message}`)
      }
    } catch (err: any) {
      setStatusMsg(`Import error: ${err.message}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">📦</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Configuration Portability</h2>
              <p className="text-[11px] text-gray-400">Export & import preferences, skills, and memory</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200">
            <span className="font-bold">Credential Exclusion Notice:</span> Vault tokens, API keys, and device passcodes are strictly excluded from configuration exports for security.
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleExport}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs py-3 rounded-xl transition-colors flex flex-col items-center justify-center gap-1"
            >
              <span className="text-lg">💾</span>
              <span>Export Config (JSON)</span>
            </button>
            <button
              onClick={handleImport}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-xs py-3 rounded-xl transition-colors flex flex-col items-center justify-center gap-1 border border-white/10"
            >
              <span className="text-lg">📥</span>
              <span>Import Config (JSON)</span>
            </button>
          </div>

          {statusMsg && (
            <div className="text-xs font-mono text-center text-cyan-400 p-2 bg-black/40 rounded-lg">
              {statusMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
