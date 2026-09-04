import React, { useState, useRef, useEffect } from 'react'
import { Send, Mic, Square } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'

export function ChatInput({ onSendMessage }: { onSendMessage: (text: string) => void }) {
  const [input, setInput] = useState('')
  const isStreaming = useChatStore((s) => s.isStreaming)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    onSendMessage(input.trim())
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCancel = () => {
    if ((window as any).ultron?.chat?.cancel) {
      (window as any).ultron.chat.cancel()
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const [isListening, setIsListening] = useState(false)
  const [sttAvailable, setSttAvailable] = useState(false)
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setSttAvailable(true)
      try {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('')
          setInput(transcript)
        }

        recognition.onerror = (event: any) => {
          console.warn('[ULTRON Voice] Recognition error:', event.error)
          setIsListening(false)
          setVoiceNotice(`Voice engine error: ${event.error}`)
          setTimeout(() => setVoiceNotice(null), 3000)
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      } catch (err) {
        setSttAvailable(false)
      }
    } else {
      setSttAvailable(false)
    }
  }, [])

  const handleMicClick = () => {
    if (!sttAvailable || !recognitionRef.current) {
      setVoiceNotice('Voice Engine: Offline / Not Configured in current environment')
      setTimeout(() => setVoiceNotice(null), 3500)
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        setVoiceNotice('Listening...')
      } catch (err: any) {
        setIsListening(false)
        setVoiceNotice('Mic capture initialization failed')
        setTimeout(() => setVoiceNotice(null), 3000)
      }
    }
  }

  return (
    <div className="chat-input-container">
      {voiceNotice && (
        <div
          style={{
            fontSize: '11px',
            color: isListening ? '#00e676' : '#ffab40',
            background: 'rgba(15, 15, 40, 0.95)',
            border: `1px solid ${isListening ? 'rgba(0, 230, 118, 0.4)' : 'rgba(255, 171, 64, 0.4)'}`,
            borderRadius: '6px',
            padding: '4px 10px',
            marginBottom: '6px',
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span className={`status-dot ${isListening ? 'online' : 'warning'}`} style={{ width: '6px', height: '6px' }} />
          {voiceNotice}
        </div>
      )}

      <div className="chat-input-wrapper">
        <button
          className={`chat-btn mic ${isListening ? 'active' : ''}`}
          title={
            sttAvailable
              ? isListening
                ? 'Listening... Click to stop'
                : 'Click to speak'
              : 'Voice Engine: Offline / Not Configured'
          }
          onClick={handleMicClick}
          style={{
            opacity: sttAvailable ? 1 : 0.45,
            color: isListening ? '#00e676' : undefined
          }}
        >
          <Mic size={16} />
        </button>

        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder="Command ULTRON (e.g. 'Open VS Code', 'Call Sukesh', 'Run vulnerability scan')..."
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {isStreaming ? (
          <button className="chat-btn stop" onClick={handleCancel} title="Stop generation">
            <Square size={14} />
          </button>
        ) : (
          <button
            className="chat-btn send"
            onClick={handleSend}
            disabled={!input.trim()}
            title="Send Command"
          >
            <Send size={16} />
          </button>
        )}
      </div>
    </div>
  )
}