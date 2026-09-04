import React from 'react'
import { ChatMessage } from '../../../shared/types'
import { ActionCardView, ConfirmationCardView } from './ActionCard'
import { Bot, User, Zap } from 'lucide-react'

export function ChatMessageItem({
  message,
  onConfirmAction
}: {
  message: ChatMessage
  onConfirmAction?: (cardId: string, confirmed: boolean) => void
}) {
  const isAssistant = message.role === 'assistant'

  // Format message content with millisecond highlighted badges
  const renderFormattedContent = (content: string) => {
    if (!content) return null

    // Check if content contains multi-task headers
    const isMultitaskReport = content.includes('CONCURRENT MULTITASKING')

    return (
      <div className={`message-text ${isMultitaskReport ? 'multitask-report-bubble' : ''}`} style={{ whiteSpace: 'pre-wrap' }}>
        {content}
      </div>
    )
  }

  return (
    <div className={`chat-message ${isAssistant ? 'assistant' : 'user'}`}>
      <div className="chat-avatar">
        {isAssistant ? <Bot size={18} /> : <User size={18} />}
      </div>
      <div className="chat-bubble">
        {message.content ? (
          renderFormattedContent(message.content)
        ) : message.streaming ? (
          <div className="thinking-indicator">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="thinking-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={13} className="spin-icon" color="#00ff88" />
              ULTRON Multitasking Parallel Engine Processing...
            </span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>No content</span>
        )}
        {message.streaming && message.content ? <span className="streaming-cursor" /> : null}

        {message.actionCard && <ActionCardView card={message.actionCard} />}
        {message.confirmationCard && onConfirmAction && (
          <ConfirmationCardView
            card={message.confirmationCard}
            onConfirm={(confirmed) => onConfirmAction(message.confirmationCard!.id, confirmed)}
          />
        )}
      </div>
    </div>
  )
}