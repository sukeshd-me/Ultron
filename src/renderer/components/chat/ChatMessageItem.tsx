import React from 'react'
import { ChatMessage } from '../../../shared/types'
import { ActionCardView, ConfirmationCardView } from './ActionCard'
import { Bot, User, Sparkles, Copy, Check } from 'lucide-react'

export function ChatMessageItem({
  message,
  onConfirmAction
}: {
  message: ChatMessage
  onConfirmAction?: (cardId: string, confirmed: boolean) => void
}) {
  const isAssistant = message.role === 'assistant'
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Format message content with millisecond highlighted badges
  const renderFormattedContent = (content: string) => {
    if (!content) return null

    const isMultitaskReport = content.includes('CONCURRENT MULTITASKING')

    return (
      <div className={`message-text ${isMultitaskReport ? 'multitask-report-bubble' : ''}`}>
        {content}
      </div>
    )
  }

  if (!isAssistant) {
    // User message bubble (sleek dark pill)
    return (
      <div className="chat-message-row user-row">
        <div className="user-message-pill">
          <div className="user-content-text">{message.content}</div>
          <div className="user-avatar-circle">
            <User size={13} color="#00d4ff" />
          </div>
        </div>
      </div>
    )
  }

  // Assistant message (frosted glass container with thinking progress bar & avatar ring)
  return (
    <div className="chat-message-row assistant-row">
      <div className="assistant-message-card">
        <div className="assistant-header-row">
          <div className="assistant-avatar-ring">
            <Bot size={15} color="#00d4ff" />
          </div>
          <div className="assistant-name-group">
            <span className="assistant-title">ULTRON</span>
            <span className="assistant-tag">NEURAL CORE</span>
          </div>

          {message.content && (
            <button
              className="copy-content-btn"
              onClick={handleCopy}
              title="Copy response"
              aria-label="Copy response"
            >
              {copied ? <Check size={12} color="#00e676" /> : <Copy size={12} />}
            </button>
          )}
        </div>

        {/* Live Thinking Progress Bar (displayed during generation before/during streaming) */}
        {message.streaming && !message.content && (
          <div className="thinking-progress-card">
            <div className="thinking-progress-header">
              <div className="thinking-label-row">
                <Sparkles size={13} color="#00d4ff" className="thinking-spin" />
                <span className="thinking-label">THINKING...</span>
              </div>
              <span className="thinking-subtext">
                Analyzing your request and generating intelligent response
              </span>
            </div>
            <div className="thinking-progress-track">
              <div className="thinking-progress-bar" />
            </div>
          </div>
        )}

        {/* Message body */}
        <div className="assistant-content-body">
          {message.content ? (
            <>
              {renderFormattedContent(message.content)}
              {message.streaming && <span className="streaming-cursor" />}
            </>
          ) : message.streaming ? null : (
            <span style={{ color: 'var(--text-muted)' }}>No content generated</span>
          )}

          {/* Action and Confirmation Cards */}
          {message.actionCard && <ActionCardView card={message.actionCard} />}
          {message.confirmationCard && onConfirmAction && (
            <ConfirmationCardView
              card={message.confirmationCard}
              onConfirm={(confirmed) => onConfirmAction(message.confirmationCard!.id, confirmed)}
            />
          )}
        </div>
      </div>
    </div>
  )
}