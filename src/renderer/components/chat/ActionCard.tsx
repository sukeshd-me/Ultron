import React from 'react'
import { ActionCard as ActionCardType, ConfirmationCard as ConfirmationCardType } from '../../../shared/types'
import { CheckCircle2, AlertTriangle, Play, XCircle } from 'lucide-react'

export function ActionCardView({ card }: { card: ActionCardType }) {
  const getStatusIcon = () => {
    switch (card.status) {
      case 'running':
        return <span className="status-dot" style={{ backgroundColor: '#00d4ff' }} />
      case 'success':
        return <CheckCircle2 size={16} color="#00e676" />
      case 'error':
        return <XCircle size={16} color="#ff5252" />
      default:
        return <Play size={16} color="#ffab40" />
    }
  }

  return (
    <div style={{
      marginTop: '8px',
      padding: '10px 14px',
      borderRadius: '8px',
      background: 'rgba(0, 212, 255, 0.06)',
      border: '1px solid rgba(0, 212, 255, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      fontSize: '13px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#00d4ff' }}>
          {getStatusIcon()}
          <span>{card.tool}.{card.action}</span>
        </div>
        <span style={{ textTransform: 'uppercase', fontSize: '10px', color: '#9aa0a8' }}>{card.status}</span>
      </div>
      <div style={{ color: '#e8eaed', fontSize: '12px' }}>Target: {card.target}</div>
      {card.result && (
        <div style={{ color: '#00e676', fontSize: '12px', marginTop: '4px', fontFamily: 'monospace' }}>
          ✓ {card.result}
        </div>
      )}
      {card.error && (
        <div style={{ color: '#ff5252', fontSize: '12px', marginTop: '4px' }}>
          ✗ {card.error}
        </div>
      )}
    </div>
  )
}

export function ConfirmationCardView({
  card,
  onConfirm
}: {
  card: ConfirmationCardType
  onConfirm: (confirmed: boolean) => void
}) {
  return (
    <div style={{
      marginTop: '8px',
      padding: '12px 16px',
      borderRadius: '8px',
      background: 'rgba(255, 171, 64, 0.1)',
      border: '1px solid rgba(255, 171, 64, 0.3)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffab40', fontWeight: 600 }}>
        <AlertTriangle size={18} />
        <span>Authorization Required — [{card.risk} RISK]</span>
      </div>
      <div style={{ fontSize: '13px', color: '#e8eaed' }}>{card.description}</div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
        <button
          onClick={() => onConfirm(true)}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            background: '#00d4ff',
            color: '#000',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Approve & Execute
        </button>
        <button
          onClick={() => onConfirm(false)}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#e8eaed',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}