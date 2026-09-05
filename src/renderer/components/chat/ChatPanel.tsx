import React, { useRef, useEffect } from 'react'
import { useChatStore } from '../../stores/chatStore'
import { ChatMessageItem } from './ChatMessageItem'
import { ChatInput } from './ChatInput'

export function ChatPanel({ onSendMessage }: { onSendMessage: (msg: string) => void }) {
  const messages = useChatStore((s) => s.messages)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="chat-container">
      <div className="chat-messages">
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

      <ChatInput onSendMessage={onSendMessage} />
    </div>
  )
}