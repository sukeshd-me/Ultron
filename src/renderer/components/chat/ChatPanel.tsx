import React, { useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { ChatMessageItem } from './ChatMessageItem'
import { ChatInput } from './ChatInput'
import { Cpu, Smartphone, Grid, MessageSquareCode } from 'lucide-react'

export function ChatPanel({ onSendMessage }: { onSendMessage: (msg: string) => void }) {
  const messages = useChatStore((s) => s.messages)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const suggestions = [
    { label: 'Check my PC', icon: Cpu, prompt: 'Check my PC status, hardware performance, and running tasks' },
    { label: 'Check my phone', icon: Smartphone, prompt: 'Check my phone connection and battery status' },
    { label: 'Open an app', icon: Grid, prompt: 'What applications can you launch on my system?' },
    { label: 'Ask ULTRON', icon: MessageSquareCode, prompt: 'What commands and workflows are you capable of, ULTRON?' }
  ]

  return (
    <div className="chat-container">
      {messages.length === 0 ? (
        /* Empty State: Uncluttered overlay in front of the central neural particle intelligence */
        <div className="chat-empty-state">
          <div className="empty-state-content">
            <h1 className="empty-title">ULTRON</h1>
            <p className="empty-subtitle">How can I help?</p>

            {/* Suggestion Chips */}
            <div className="empty-suggestions-row">
              {suggestions.map((item, i) => {
                const Icon = item.icon
                return (
                  <button
                    key={i}
                    className="suggestion-chip"
                    onClick={() => onSendMessage(item.prompt)}
                    type="button"
                  >
                    <Icon size={14} className="suggestion-icon" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="chat-messages custom-scrollbar">
          {messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              onConfirmAction={(cardId, confirmed) => {
                if ((window as any).ultron?.tools?.confirm) {
                  (window as any).ultron.tools.confirm(cardId, confirmed).then((res: any) => {
                    if (res?.message) {
                      useChatStore.getState().addMessage({
                        id: `confirm-res-${Date.now()}`,
                        role: 'assistant',
                        content: res.message,
                        timestamp: Date.now()
                      })
                    }
                  })
                }
              }}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      <ChatInput onSendMessage={onSendMessage} />
    </div>
  )
}