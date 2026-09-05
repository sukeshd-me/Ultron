// src/renderer/components/repair/SafeRepairModal.tsx — V1.0.5 One-Click Safe Repair
import React, { useEffect, useState } from 'react'
import { Wrench, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, X } from 'lucide-react'
import { SafeRepairItem } from '../../../shared/types'

interface SafeRepairModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SafeRepairModal({ isOpen, onClose }: SafeRepairModalProps) {
  const [fixes, setFixes] = useState<SafeRepairItem[]>([])
  const [selectedFix, setSelectedFix] = useState<SafeRepairItem | null>(null)
  const [repairing, setRepairing] = useState(false)
  const [repairResult, setRepairResult] = useState<any>(null)

  const loadFixes = async () => {
    const ultron = (window as any).ultron
    if (ultron?.repair?.listKnownFixes) {
      try {
        const list = await ultron.repair.listKnownFixes()
        setFixes(list || [])
      } catch (err) {
        console.error('Failed to list repairs', err)
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadFixes()
    }
  }, [isOpen])

  const handleExecute = async (repairId: string) => {
    setRepairing(true)
    setRepairResult(null)
    const ultron = (window as any).ultron
    if (ultron?.repair?.executeRepair) {
      try {
        const res = await ultron.repair.executeRepair(repairId)
        setRepairResult(res)
        loadFixes()
      } catch (err) {
        console.error('Repair failed', err)
      } finally {
        setRepairing(false)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f1f28]">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-[#00d4ff]" />
            <div>
              <h2 className="text-base font-bold text-white">One-Click Safe Repair</h2>
              <p className="text-xs text-gray-400">Automated, verified remedies for known local configuration issues</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
          {repairResult && (
            <div className={`p-4 rounded-xl border ${
              repairResult.success ? 'bg-[#0a2016] border-[#00ff88]/40' : 'bg-[#200a0d] border-red-500/40'
            }`}>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                {repairResult.success ? <CheckCircle2 className="w-4 h-4 text-[#00ff88]" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}
                {repairResult.success ? 'Repair Verified Successfully' : 'Repair Encountered An Issue'}
              </div>
              <div className="text-xs text-gray-300 mt-1">{repairResult.message}</div>
            </div>
          )}

          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Available Safe Repairs</span>
            {fixes.length === 0 ? (
              <div className="text-xs text-gray-500 py-6 text-center">No known issues detected. System configuration is clean.</div>
            ) : (
              fixes.map((fix) => (
                <div
                  key={fix.id}
                  className="p-4 rounded-xl bg-[#0e0e14] border border-[#1f1f28] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> PROBLEM
                      </div>
                      <div className="text-xs font-semibold text-white mt-0.5">{fix.problem}</div>
                    </div>
                  </div>

                  <div className="bg-[#08080c] p-3 rounded-lg border border-[#1f1f28]">
                    <div className="text-[10px] uppercase font-bold text-[#00d4ff] tracking-wider mb-0.5">
                      POSSIBLE FIX
                    </div>
                    <div className="text-xs text-gray-300">{fix.possibleFix}</div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleExecute(fix.id)}
                      disabled={repairing}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#00d4ff] text-black font-semibold text-xs hover:bg-[#33ddff] disabled:opacity-50 transition"
                    >
                      <Wrench className="w-3.5 h-3.5" /> {repairing ? 'Repairing...' : 'Repair'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
