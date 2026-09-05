import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Mic, Square, Loader2, Paperclip, Sparkles, Monitor } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'
import { ModelSelectorMorph } from '../models/ModelSelectorMorph'
import { ScreenShareModal } from '../screen/ScreenShareModal'
import { ScreenPreviewPanel } from '../screen/ScreenPreviewPanel'
import { ScreenSource } from '../../../shared/types'

// Voice pipeline states
type VoiceState =
  | 'IDLE'
  | 'RECORDING'
  | 'TRANSCRIBING'
  | 'RECOGNIZED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'ERROR'

const STATE_LABELS: Record<VoiceState, string> = {
  IDLE: '',
  RECORDING: 'Listening…',
  TRANSCRIBING: 'Transcribing speech…',
  RECOGNIZED: 'Command recognized',
  EXECUTING: 'Executing…',
  COMPLETED: 'Done!',
  ERROR: 'Voice error'
}

export function ChatInput({ onSendMessage }: { onSendMessage: (text: string) => void }) {
  const [input, setInput] = useState('')
  const isStreaming = useChatStore((s) => s.isStreaming)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Voice State
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE')
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null)
  const [whisperAvailable, setWhisperAvailable] = useState(false)

  // Web fallback STT refs
  const [browserSttAvailable, setBrowserSttAvailable] = useState(false)
  const browserRecognitionRef = useRef<any>(null)

  // MediaRecorder for Whisper pipeline
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStartRef = useRef<number>(0)

  // File attach simulation
  const [attachNotice, setAttachNotice] = useState<string | null>(null)

  // Screen Sharing State (Requirement 3 & 4)
  const [isScreenModalOpen, setIsScreenModalOpen] = useState(false)
  const [sharingSource, setSharingSource] = useState<ScreenSource | null>(null)

  // Initialize: check Whisper availability, set up browser STT fallback
  useEffect(() => {
    const ultron = (window as any).ultron

    if (ultron?.voice?.getStatus) {
      ultron.voice
        .getStatus()
        .then((status: any) => {
          if (status?.available || status?.ready) {
            setWhisperAvailable(true)
          }
        })
        .catch(() => setWhisperAvailable(false))
    }

    if (ultron?.voice?.warmup) {
      ultron.voice
        .warmup()
        .then((result: any) => {
          if (result?.success) setWhisperAvailable(true)
        })
        .catch(() => {})
    }

    if (ultron?.voice?.onState) {
      ultron.voice.onState((state: string) => {
        setVoiceState(state as VoiceState)
        if (state === 'COMPLETED' || state === 'ERROR') {
          setTimeout(() => setVoiceState('IDLE'), 2000)
        }
      })
    }
    if (ultron?.voice?.onTranscript) {
      ultron.voice.onTranscript((text: string) => {
        setInput(text)
      })
    }

    // Browser STT fallback
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setBrowserSttAvailable(true)
      try {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((r: any) => r[0].transcript)
            .join('')
          setInput(transcript)
        }

        recognition.onerror = () => {
          setVoiceState('ERROR')
          setTimeout(() => setVoiceState('IDLE'), 2000)
        }

        recognition.onend = () => {
          setVoiceState((current) => (current === 'RECORDING' ? 'IDLE' : current))
        }

        browserRecognitionRef.current = recognition
      } catch {
        setBrowserSttAvailable(false)
      }
    }
  }, [])

  const sttAvailable = whisperAvailable || browserSttAvailable

  // Adjust textarea height dynamically
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [input, adjustHeight])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    onSendMessage(trimmed)
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCancel = () => {
    useChatStore.getState().setStreaming(false)
    useChatStore.getState().setOrbState('IDLE')
    const ultron = (window as any).ultron
    if (ultron?.chat?.cancel) {
      ultron.chat.cancel()
    }
  }

  const startWhisperRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      recordingStartRef.current = Date.now()

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const durationSec = (Date.now() - recordingStartRef.current) / 1000

        if (durationSec < 0.3) {
          setVoiceNotice('Press and hold to speak, or tap once')
          setVoiceState('IDLE')
          return
        }

        setVoiceState('TRANSCRIBING')
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1]
          try {
            const ultron = (window as any).ultron
            if (ultron?.voice?.transcribe) {
              const res = await ultron.voice.transcribe(base64)
              if (res?.success && res.text) {
                setInput(res.text)
                setVoiceState('RECOGNIZED')
                setTimeout(() => setVoiceState('IDLE'), 1500)
              } else {
                setVoiceState('ERROR')
                setTimeout(() => setVoiceState('IDLE'), 2000)
              }
            }
          } catch {
            setVoiceState('ERROR')
            setTimeout(() => setVoiceState('IDLE'), 2000)
          }
        }
        reader.readAsDataURL(audioBlob)
      }

      mediaRecorder.start(100)
      setVoiceState('RECORDING')
    } catch {
      if (browserSttAvailable && browserRecognitionRef.current) {
        startBrowserRecording()
      } else {
        setVoiceNotice('Microphone access denied')
        setVoiceState('ERROR')
        setTimeout(() => setVoiceState('IDLE'), 2000)
      }
    }
  }

  const stopWhisperRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  const startBrowserRecording = () => {
    try {
      browserRecognitionRef.current?.start()
      setVoiceState('RECORDING')
    } catch {
      setVoiceState('ERROR')
      setTimeout(() => setVoiceState('IDLE'), 2000)
    }
  }

  const stopBrowserRecording = () => {
    try {
      browserRecognitionRef.current?.stop()
    } catch {}
    setVoiceState('IDLE')
  }

  const handleMicClick = () => {
    if (!sttAvailable) {
      setVoiceNotice('Voice Engine Offline')
      setTimeout(() => setVoiceNotice(null), 3000)
      return
    }

    if (voiceState === 'RECORDING') {
      if (whisperAvailable && mediaRecorderRef.current) {
        stopWhisperRecording()
      } else {
        stopBrowserRecording()
      }
    } else if (voiceState === 'IDLE') {
      if (whisperAvailable) {
        startWhisperRecording()
      } else if (browserSttAvailable) {
        startBrowserRecording()
      }
    }
  }

  const handleAttachClick = () => {
    setAttachNotice('Workspace file context attached')
    setTimeout(() => setAttachNotice(null), 3000)
  }

  const handleSelectScreenSource = async (source: ScreenSource) => {
    const ultron = (window as any).ultron
    if (ultron?.screen?.setSharingState) {
      await ultron.screen.setSharingState(true, source.id)
    }
    setSharingSource(source)
  }

  const handleStopSharing = async () => {
    const ultron = (window as any).ultron
    if (ultron?.screen?.setSharingState) {
      await ultron.screen.setSharingState(false)
    }
    setSharingSource(null)
  }

  const handleAskAboutScreen = () => {
    onSendMessage('What am I looking at on my screen right now? Please inspect the visible display.')
  }

  const isRecording = voiceState === 'RECORDING'
  const isProcessing = voiceState === 'TRANSCRIBING' || voiceState === 'EXECUTING'

  return (
    <div className="chat-input-floating-container">
      {/* Live Screen Preview Panel (Requirement 4: Compact Live Preview) */}
      {sharingSource && (
        <ScreenPreviewPanel
          source={sharingSource}
          onStopSharing={handleStopSharing}
          onAskAboutScreen={handleAskAboutScreen}
        />
      )}

      {/* Voice / Attachment notification banner */}
      {(voiceNotice || attachNotice) && (
        <div className="input-floating-notice">
          <Sparkles size={11} color="#00d4ff" />
          <span>{voiceNotice || attachNotice}</span>
        </div>
      )}

      {/* Composer Row: Model Selector (Left) + Composer Pill (Right) */}
      <div className="chat-composer-row">
        <ModelSelectorMorph />

        {/* Floating Pill Input Bar */}
        <div className="chat-input-pill">
          {/* Attachment paperclip */}
          <button
            className="chat-pill-btn attach-btn"
            onClick={handleAttachClick}
            title="Attach workspace file context"
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>

          {/* Share Screen Button (Requirement 3: Explicit control near composer) */}
          <button
            type="button"
            className={`chat-pill-btn screen-btn ${sharingSource ? 'active' : ''}`}
            onClick={() => {
              if (sharingSource) {
                handleStopSharing()
              } else {
                setIsScreenModalOpen(true)
              }
            }}
            title={sharingSource ? 'Stop Screen Sharing' : 'Share Screen'}
            aria-label="Share screen"
          >
            <Monitor size={16} color={sharingSource ? '#00e676' : '#94a3b8'} />
            {sharingSource && <span className="screen-active-dot-pill animate-pulse" />}
          </button>

          {/* Input Textarea */}
          <textarea
            ref={textareaRef}
            className="chat-pill-textarea"
            placeholder="Type your message to ULTRON..."
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Action buttons group: Mic + Send */}
          <div className="chat-pill-actions">

            <button
              className={`chat-pill-btn mic-btn ${isRecording ? 'recording' : ''}`}
              onClick={handleMicClick}
              disabled={isProcessing}
              title={
                isProcessing
                  ? STATE_LABELS[voiceState]
                  : isRecording
                  ? 'Recording... click to stop'
                  : 'Speak to ULTRON'
              }
              aria-label="Voice input"
            >
              {isProcessing ? (
                <Loader2 size={16} className="thinking-spin" color="#ffab40" />
              ) : (
                <>
                  <Mic size={16} color={isRecording ? '#00e676' : '#94a3b8'} />
                  {isRecording && <span className="mic-listening-pulse" />}
                </>
              )}
            </button>

            {isStreaming ? (
              <button
                className="chat-pill-btn stop-btn"
                onClick={handleCancel}
                title="Stop response generation"
                aria-label="Stop generation"
              >
                <Square size={14} color="#ff5252" />
              </button>
            ) : (
              <button
                className="chat-pill-btn send-btn"
                onClick={handleSend}
                disabled={!input.trim()}
                title="Send to ULTRON"
                aria-label="Send message"
              >
                <Send size={15} color="#ffffff" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Screen Share Source Selection Modal */}
      <ScreenShareModal
        isOpen={isScreenModalOpen}
        onClose={() => setIsScreenModalOpen(false)}
        onSelectSource={handleSelectScreenSource}
      />
    </div>
  )
}