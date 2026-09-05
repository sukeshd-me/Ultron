// src/renderer/components/security/SecurityCenterModal.tsx — V1.0.5 Defensive Security Center
import React, { useEffect, useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  Lock,
  Wifi,
  Radio,
  Cpu,
  RefreshCw,
  X
} from 'lucide-react'

interface SecurityCenterModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SecurityCenterModal({ isOpen, onClose }: SecurityCenterModalProps) {
  const [report, setReport] = useState<any>(null)
  const [auditEvents, setAuditEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadSecurityData = async () => {
    setLoading(true)
    const ultron = (window as any).ultron
    if (ultron?.securityCenter?.getReport) {
      try {
        const rep = await ultron.securityCenter.getReport()
        setReport(rep)
        const audit = await ultron.securityCenter.getAudit(20)
        setAuditEvents(audit || [])
      } catch (err) {
        console.error('Failed to load security report', err)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadSecurityData()
    }
  }, [isOpen])

  if (!isOpen) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SECURE':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 font-semibold">SECURE</span>
      case 'WARNING':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 font-semibold">WARNING</span>
      case 'CHECK FAILED':
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 font-semibold">CHECK FAILED</span>
      default:
        return <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#1f1f28] text-gray-400 font-semibold">UNAVAILABLE</span>
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#0a0a0f] border border-[#1f1f28] rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1f1f28]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#00ff88]" />
            <div>
              <h2 className="text-base font-bold text-white">Security Center</h2>
              <p className="text-xs text-gray-400">Defensive diagnostics, firewall, defender & permission auditing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadSecurityData}
              className="p-1.5 rounded-lg bg-[#14141c] text-gray-400 hover:text-white border border-[#1f1f28] transition"
              title="Refresh security status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 custom-scrollbar">
          {/* Status Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Windows Defender */}
            <div className="p-3.5 rounded-xl bg-[#0d0d12] border border-[#1f1f28] flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">Windows Defender</span>
                {getStatusBadge(report?.defender || 'SECURE')}
              </div>
              <div className="text-[11px] text-gray-400">Real-time antivirus shield</div>
            </div>

            {/* Windows Firewall */}
            <div className="p-3.5 rounded-xl bg-[#0d0d12] border border-[#1f1f28] flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">Windows Firewall</span>
                {getStatusBadge(report?.firewall || 'SECURE')}
              </div>
              <div className="text-[11px] text-gray-400">Inbound & outbound rules active</div>
            </div>

            {/* Permission State */}
            <div className="p-3.5 rounded-xl bg-[#0d0d12] border border-[#1f1f28] flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">ULTRON Permissions</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40 font-semibold">
                  Zero-Trust Enforced
                </span>
              </div>
              <div className="text-[11px] text-gray-400">Explicit confirmation required for risky actions</div>
            </div>
          </div>

          {/* Open Listening Ports */}
          <div className="p-4 rounded-xl bg-[#0d0d12] border border-[#1f1f28] space-y-2">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Local Listening Ports
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1 custom-scrollbar">
              {report?.openPorts && report.openPorts.length > 0 ? (
                report.openPorts.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 rounded bg-[#111118] border border-[#1f1f28] text-xs font-mono"
                  >
                    <span className="text-[#00d4ff]">Port {p.port}</span>
                    <span className="text-gray-400">{p.address}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500 py-2">No unusual open listening ports detected.</div>
              )}
            </div>
          </div>

          {/* Suspicious Process Audit */}
          <div className="p-4 rounded-xl bg-[#0d0d12] border border-[#1f1f28] space-y-2">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Process Defense Audit
            </span>
            <div className="text-xs text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff88]"></span>
              <span>
                {report?.suspiciousProcesses?.length === 0
                  ? 'No unusual or unauthorized background processes detected.'
                  : `${report?.suspiciousProcesses?.length} process indicators flagged for review.`}
              </span>
            </div>
          </div>

          {/* Security Events Audit Log */}
          <div className="p-4 rounded-xl bg-[#0d0d12] border border-[#1f1f28] space-y-2">
            <span className="text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Recent Security Events
            </span>
            <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar">
              {auditEvents.length === 0 ? (
                <div className="text-xs text-gray-500 py-3 text-center">No security incidents logged.</div>
              ) : (
                auditEvents.map((evt: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-[#111118] border border-[#1f1f28] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-mono text-[10px]">{evt.type}</span>
                      <span className="text-white">{evt.description}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
