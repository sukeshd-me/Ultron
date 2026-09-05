// src/renderer/components/notifications/NotificationToast.tsx — V1.0.5 Smart Notification Toasts
import React, { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Compass, X } from 'lucide-react'
import { UltronNotification } from '../../../shared/types'

export function NotificationToastContainer() {
  const [notifications, setNotifications] = useState<UltronNotification[]>([])

  useEffect(() => {
    const ultron = (window as any).ultron
    if (!ultron?.notifications?.onNotification) return

    const unsub = ultron.notifications.onNotification((notification: UltronNotification) => {
      setNotifications((prev) => [notification, ...prev].slice(0, 5))

      // Auto-dismiss after 6 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      }, 6000)
    })

    return unsub
  }, [])

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    const ultron = (window as any).ultron
    if (ultron?.notifications?.dismiss) {
      ultron.notifications.dismiss(id).catch(() => {})
    }
  }

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-16 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {notifications.map((n) => {
        const isSuccess = n.type === 'success'
        const isError = n.type === 'error'
        const isWarning = n.type === 'warning'
        const isMission = n.type === 'mission'

        return (
          <div
            key={n.id}
            className={`pointer-events-auto p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slideInRight flex items-start gap-3 ${
              isSuccess
                ? 'bg-[#002b18]/90 border-[#00ff88]/40 text-white'
                : isError
                ? 'bg-[#2b0c10]/90 border-red-500/40 text-white'
                : isWarning
                ? 'bg-[#2b1f0c]/90 border-amber-500/40 text-white'
                : isMission
                ? 'bg-[#121124]/90 border-[#00d4ff]/40 text-white'
                : 'bg-[#0d0d12]/90 border-[#1f1f28] text-white'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />}
              {isError && <AlertCircle className="w-4 h-4 text-red-400" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {isMission && <Compass className="w-4 h-4 text-[#00d4ff] animate-spin" />}
              {!isSuccess && !isError && !isWarning && !isMission && <Info className="w-4 h-4 text-[#00d4ff]" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold leading-tight">{n.title}</div>
              <div className="text-[11px] text-gray-300 mt-0.5 leading-normal break-words">{n.message}</div>
            </div>

            <button
              onClick={() => handleDismiss(n.id)}
              className="flex-shrink-0 text-gray-400 hover:text-white transition p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
