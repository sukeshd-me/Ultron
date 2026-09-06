import React, { useState, useEffect } from 'react'
import { UpdateCheckResult } from '../../../shared/types'

interface UpdateManagerModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UpdateManagerModal: React.FC<UpdateManagerModalProps> = ({ isOpen, onClose }) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [backupMsg, setBackupMsg] = useState<string | null>(null)

  const bridge = (window as any).electronBridge || (window as any).ultron

  const checkForUpdates = async () => {
    setLoading(true)
    try {
      if (bridge?.updates) {
        const res = await bridge.updates.check()
        setUpdateInfo(res)
      }
    } catch (err) {
      console.warn('Update check failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) checkForUpdates()
  }, [isOpen])

  const handlePrepareBackup = async () => {
    try {
      if (bridge?.updates) {
        const res = await bridge.updates.prepareBackup()
        setBackupMsg(res.message)
      }
    } catch (err: any) {
      setBackupMsg(`Backup failed: ${err.message}`)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0a0a0c] border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 text-xl">🚀</span>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">ULTRON Update Manager</h2>
              <p className="text-[11px] text-gray-400">Official Release Authority: UPAI Technologies / Ultron</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded bg-white/5">✕</button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status Panel */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">Current Version</span>
              <span className="text-xs font-mono font-bold text-cyan-400">v{updateInfo?.currentVersion || '1.0.7'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">Latest Stable Release</span>
              <span className="text-xs font-mono font-bold text-emerald-400">v{updateInfo?.latestVersion || '1.0.7'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">Official GitHub Authority</span>
              <span className="text-xs font-mono text-gray-300">{updateInfo?.officialRepo || 'upai-technologies/ultron'}</span>
            </div>
          </div>

          {/* Release Notes */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase">Release Notes & Verification</span>
            <div className="p-4 rounded-xl bg-black/60 border border-white/5 text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
              {updateInfo?.releaseNotes || 'Running official release v1.0.7.'}
            </div>
          </div>

          {/* Safety Action */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
            <span className="text-xs font-semibold text-white">Data Preservation Guarantee</span>
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Updates preserve all local SQLite memory, credentials, and configurations. You can create a pre-update snapshot below at any time.
            </p>
            <button
              onClick={handlePrepareBackup}
              className="text-xs text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition"
            >
              Create Pre-Update Backup
            </button>
            {backupMsg && <p className="text-xs text-emerald-400">{backupMsg}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={checkForUpdates}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
            >
              {loading ? 'Checking GitHub...' : 'Check For Updates'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:text-white text-xs font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
