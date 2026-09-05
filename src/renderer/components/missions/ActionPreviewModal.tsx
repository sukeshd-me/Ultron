// src/renderer/components/missions/ActionPreviewModal.tsx — V1.0.5 Action Preview Gate
import React, { useEffect, useState } from 'react'
import { ShieldAlert, Check, X, AlertTriangle, FileCode, Terminal } from 'lucide-react'
import { ActionPreview } from '../../../shared/types'

export function ActionPreviewModal() {
  const [preview, setPreview] = useState<ActionPreview | null>(null)

  useEffect(() => {
    const ultron = (window as any).ultron
    if (!ultron?.actionPreview?.onPreview) return

    const unsub = ultron.actionPreview.onPreview((p: ActionPreview) => {
      setPreview(p)
    })

    return unsub
  }, [])

  const handleRespond = async (approved: boolean) => {
    if (!preview) return
    const ultron = (window as any).ultron
    if (ultron?.actionPreview?.respond) {
      await ultron.actionPreview.respond(preview.id, approved)
    }
    setPreview(null)
  }

  if (!preview) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0e0e14] border border-amber-500/50 rounded-2xl p-6 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-[#1f1f28]">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Action Preview Required</span>
            <h2 className="text-base font-bold text-white">{preview.title}</h2>
          </div>
        </div>

        {/* Description */}
        <div className="text-xs text-gray-300 leading-relaxed">
          {preview.description}
        </div>

        {/* Steps Preview */}
        {preview.steps && preview.steps.length > 0 && (
          <div className="space-y-1.5 bg-[#08080c] border border-[#1f1f28] rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Planned Operations</span>
            {preview.steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-200">
                <span className="text-gray-500 text-[10px] w-4">{idx + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Affected targets */}
        {preview.affectedTargets && preview.affectedTargets.length > 0 && (
          <div className="text-[11px] text-gray-400 flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-300">Targets:</span>
            {preview.affectedTargets.map((t, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded bg-[#1a1a24] text-white font-mono text-[10px]">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1f1f28]">
          <button
            onClick={() => handleRespond(false)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#14141c] hover:bg-[#1e1e28] text-gray-300 text-xs font-semibold transition"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={() => handleRespond(true)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-lg shadow-amber-500/20"
          >
            <Check className="w-4 h-4" /> Approve & Execute
          </button>
        </div>
      </div>
    </div>
  )
}
