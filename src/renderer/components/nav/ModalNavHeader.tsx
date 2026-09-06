import React, { useEffect } from 'react'
import { ArrowLeft, X } from 'lucide-react'

interface ModalNavHeaderProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  onBack: () => void
  onClose?: () => void
  backLabel?: string
  rightActions?: React.ReactNode
}

export function ModalNavHeader({
  title,
  subtitle,
  icon,
  onBack,
  onClose,
  backLabel = 'Back',
  rightActions
}: ModalNavHeaderProps) {
  // Support Escape key to go back / close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onBack()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  return (
    <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#222222] select-none">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#202020] active:bg-[#0c0c0c] text-zinc-300 hover:text-white border border-[#2a2a2a] transition-all text-xs font-medium focus:outline-none focus:ring-1 focus:ring-zinc-500 shadow-sm"
          title={`${backLabel} (Esc)`}
        >
          <ArrowLeft size={13} />
          <span>{backLabel}</span>
        </button>

        <div className="h-4 w-px bg-[#262626]" />

        <div className="flex items-center gap-2">
          {icon && <div className="text-zinc-300 shrink-0">{icon}</div>}
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              {title}
            </h2>
            {subtitle && <p className="text-[11px] text-zinc-400">{subtitle}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {rightActions}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition"
            title="Close (Esc)"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  )
}
