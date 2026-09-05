import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Mic, MicOff, Square, Loader2 } from 'lucide-react'
import { useChatStore } from '../../stores/chatStore'

// ── Voice pipeline states ──
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

const STATE_COLORS: Record<VoiceState, string> = {
  IDLE: '#00d4ff',
  RECORDING: '#00e676',
  TRANSCRIBING: '#ffab40',
  RECOGNIZED: '#00d4ff',
  EXECUTING: '#64b5f6',
  COMPLETED: '#00e676',
  ERROR: '#ff5252'
}

export function ChatInput({ onSendMessage }: { onSendMessage: (text: string) => void }) {
  const [input, setInput] = useState('')
  const isStreaming = useChatStore((s) => s.isStreaming)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ── Voice State ──
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

  // ── Initialize: check Whisper availability, set up browser STT fallback ──
  useEffect(() => {
    const ultron = (window as any).ultron

    // Check Whisper engine
    if (ultron?.voice?.getStatus) {
      ultron.voice.getStatus().then((status: any) => {
        if (status?.available || status?.ready) {
          setWhisperAvailable(true)
        }
      }).catch(() => setWhisperAvailable(false))
    }

    // Warm up Whisper on mount (async, non-blocking)
    if (ultron?.voice?.warmup) {
      ultron.voice.warmup().then((result: any) => {
        if (result?.success) setWhisperAvailable(true)
      }).catch(() => {})
    }

    // Subscribe to voice state changes from main process
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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setBrowserSttAvailable(true)
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
          console.warn('[ULTRON Voice] Browser STT error:', event.error)
          setVoiceState('ERROR')
          setVoiceNotice(`Voice engine error: ${event.error}`)
          setTimeout(() => { setVoiceNotice(null); setVoiceState('IDLE') }, 3000)
        }

        recognition.onend = () => {
          if (voiceState === 'RECORDING') setVoiceState('IDLE')
        }

        browserRecognitionRef.current = recognition
      } catch {
        setBrowserSttAvailable(false)
      }
    }
  }, [])

  // ── Textarea auto-resize ──
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  // ── Send text ──
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

  // ── WAV encoding helper ──
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result as string
        const base64 = dataUrl.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // ── Microphone click handler: Whisper pipeline → browser STT fallback ──
  const handleMicClick = useCallback(async () => {
    const ultron = (window as any).ultron

    // ── STOP RECORDING ──
    if (voiceState === 'RECORDING') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      } else if (browserRecognitionRef.current) {
        browserRecognitionRef.current.stop()
      }
      setVoiceState('TRANSCRIBING')
      return
    }

    // ── START RECORDING ──
    // Priority 1: Local Whisper via MediaRecorder
    if (whisperAvailable || ultron?.voice?.processCommand) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        audioChunksRef.current = []
        recordingStartRef.current = performance.now()

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm'
        })

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data)
        }

        mediaRecorder.onstop = async () => {
          // Stop all tracks
          stream.getTracks().forEach((t) => t.stop())
          const audio_capture_ms = parseFloat((performance.now() - recordingStartRef.current).toFixed(2))

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          if (audioBlob.size < 1000) {
            setVoiceState('ERROR')
            setVoiceNotice('Recording too short')
            setTimeout(() => { setVoiceNotice(null); setVoiceState('IDLE') }, 2500)
            return
          }

          setVoiceState('TRANSCRIBING')
          setVoiceNotice('Processing voice command…')

          try {
            const base64Audio = await blobToBase64(audioBlob)
            const result = await ultron.voice.processCommand(base64Audio)

            if (result?.success) {
              setVoiceState('COMPLETED')
              setVoiceNotice(`✓ ${result.transcript || 'Command executed'}`)
            } else {
              setVoiceState('ERROR')
              setVoiceNotice(result?.error || 'Could not process voice command')
            }
          } catch (err: any) {
            setVoiceState('ERROR')
            setVoiceNotice(err.message || 'Voice pipeline error')
          }

          setTimeout(() => { setVoiceNotice(null); setVoiceState('IDLE') }, 3000)
        }

        mediaRecorderRef.current = mediaRecorder
        mediaRecorder.start()
        setVoiceState('RECORDING')
        setVoiceNotice('Listening…')
        return
      } catch (err: any) {
        console.warn('[ULTRON Voice] Mic access denied or Whisper unavailable:', err.message)
        // Fall through to browser STT
      }
    }

    // Priority 2: Browser SpeechRecognition fallback
    if (browserSttAvailable && browserRecognitionRef.current) {
      try {
        browserRecognitionRef.current.start()
        setVoiceState('RECORDING')
        setVoiceNotice('Listening…')
      } catch (err: any) {
        setVoiceState('ERROR')
        setVoiceNotice('Mic capture initialization failed')
        setTimeout(() => { setVoiceNotice(null); setVoiceState('IDLE') }, 3000)
      }
      return
    }

    // No voice engine available
    setVoiceNotice('Voice Engine: Offline / Not Configured')
    setTimeout(() => setVoiceNotice(null), 3500)
  }, [voiceState, whisperAvailable, browserSttAvailable])

  const isRecording = voiceState === 'RECORDING'
  const isProcessing = voiceState === 'TRANSCRIBING' || voiceState === 'EXECUTING'
  const sttAvailable = whisperAvailable || browserSttAvailable

  return (
    <div className="chat-input-container">
      {voiceNotice && (
        <div
          style={{
            fontSize: '11px',
            color: STATE_COLORS[voiceState] || '#ffab40',
            background: 'rgba(15, 15, 40, 0.95)',
            border: `1px solid ${STATE_COLORS[voiceState] || 'rgba(255,171,64,0.4)'}40`,
            borderRadius: '6px',
            padding: '4px 10px',
            marginBottom: '6px',
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isProcessing ? (
            <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <span
              className={`status-dot ${isRecording ? 'online' : voiceState === 'ERROR' ? 'error' : 'warning'}`}
              style={{ width: '6px', height: '6px' }}
            />
          )}
          {voiceNotice}
        </div>
      )}

      <div className="chat-input-wrapper">
        <button
          className={`chat-btn mic ${isRecording ? 'active' : ''}`}
          title={
            isProcessing
              ? STATE_LABELS[voiceState]
              : sttAvailable
                ? isRecording
                  ? 'Listening… Click to stop'
                  : 'Click to speak'
                : 'Voice Engine: Offline / Not Configured'
          }
          onClick={handleMicClick}
          disabled={isProcessing}
          style={{
            opacity: sttAvailable ? 1 : 0.45,
            color: isRecording ? '#00e676' : isProcessing ? '#ffab40' : undefined,
            position: 'relative'
          }}
        >
          {isRecording ? (
            <>
              <Mic size={16} />
              <span
                className="voice-pulse"
                style={{
                  position: 'absolute',
                  inset: '-4px',
                  borderRadius: '50%',
                  border: '2px solid #00e676',
                  animation: 'voicePulse 1.5s ease-in-out infinite',
                  pointerEvents: 'none'
                }}
              />
            </>
          ) : isProcessing ? (
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Mic size={16} />
          )}
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