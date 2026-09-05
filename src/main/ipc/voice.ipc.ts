// src/main/ipc/voice.ipc.ts — Voice Pipeline IPC Handlers (v1.0.2)
import { ipcMain, BrowserWindow } from 'electron'
import { whisperService } from '../services/whisper.service'
import { agentService } from '../services/agent.service'
import { memoryService } from '../services/memory.service'
import { v4 as uuidv4 } from 'uuid'

export function registerVoiceIPC(): void {
  /**
   * Transcribe raw audio (base64 WAV) to text using local Whisper.
   */
  ipcMain.handle(
    'voice:transcribe',
    async (_event, audioBase64: string, language?: string) => {
      const result = await whisperService.transcribeBase64Audio(audioBase64, language || 'en')
      return result
    }
  )

  /**
   * Full end-to-end voice command pipeline:
   * Audio -> Whisper STT -> Intent -> Agent Loop -> Tool Execution -> Memory -> Response
   */
  ipcMain.handle(
    'voice:processCommand',
    async (event, audioBase64: string, language?: string) => {
      const overallStart = performance.now()
      const sender = event.sender
      const messageId = uuidv4()

      // ── STEP 1: Audio Capture Timing (already captured by renderer) ──
      const audio_capture_ms = 0 // Placeholder — actual value passed from renderer

      // ── STEP 2: Local Whisper Transcription ──
      if (!sender.isDestroyed()) sender.send('voice:state', 'TRANSCRIBING')
      const sttStart = performance.now()
      const sttResult = await whisperService.transcribeBase64Audio(audioBase64, language || 'en')
      const stt_ms = parseFloat((performance.now() - sttStart).toFixed(2))

      if (!sttResult.success || !sttResult.text) {
        const total_ms = parseFloat((performance.now() - overallStart).toFixed(2))
        if (!sender.isDestroyed()) sender.send('voice:state', 'ERROR')
        return {
          success: false,
          error: sttResult.error || 'Speech not recognized',
          telemetry: { audio_capture_ms, vad_ms: sttResult.vad_ms, stt_ms, intent_ms: 0, planning_ms: 0, tool_ms: 0, verification_ms: 0, total_ms }
        }
      }

      const transcript = sttResult.text.trim()
      if (!sender.isDestroyed()) {
        sender.send('voice:state', 'RECOGNIZED')
        sender.send('voice:transcript', transcript)
      }

      // ── STEP 3: Intent Parsing & Agent Loop ──
      const intentStart = performance.now()
      if (!sender.isDestroyed()) sender.send('voice:state', 'EXECUTING')

      const agentResult = await agentService.executeAgentLoop(transcript, [])
      const intent_ms = agentResult.telemetry?.understandingMs || parseFloat((performance.now() - intentStart).toFixed(2))
      const planning_ms = agentResult.telemetry?.planningMs || 0
      const tool_ms = agentResult.telemetry?.toolExecutionMs || 0
      const verification_ms = agentResult.telemetry?.verificationMs || 0

      const total_ms = parseFloat((performance.now() - overallStart).toFixed(2))

      // ── STEP 4: Response ──
      if (!sender.isDestroyed()) {
        if (agentResult.handled && agentResult.naturalResponse) {
          sender.send('chat:chunk', { id: messageId, chunk: agentResult.naturalResponse })
          sender.send('chat:done', {
            id: messageId,
            report: agentResult.report,
            telemetry: agentResult.telemetry
          })
          sender.send('voice:state', agentResult.success ? 'COMPLETED' : 'ERROR')
        } else {
          sender.send('voice:state', 'ERROR')
        }
        setTimeout(() => {
          if (!sender.isDestroyed()) sender.send('voice:state', 'IDLE')
        }, 2000)
      }

      // ── STEP 5: Action Memory ──
      memoryService
        .saveMemory({
          category: 'action',
          content: `Voice command: "${transcript}" → ${agentResult.success ? 'success' : 'failed'}`,
          metadata: {
            source: 'voice',
            transcript,
            intent: agentResult.plan?.plan?.[0]?.tool || 'unknown',
            status: agentResult.success ? 'success' : 'failed',
            duration_ms: total_ms,
            timestamp: Date.now()
          }
        })
        .catch((e: any) => console.warn('[VoiceIPC] Memory save error:', e.message))

      const voiceTelemetry = {
        audio_capture_ms,
        vad_ms: sttResult.vad_ms,
        stt_ms,
        intent_ms,
        planning_ms,
        tool_ms,
        verification_ms,
        total_ms
      }

      return {
        success: agentResult.success ?? false,
        transcript,
        response: agentResult.naturalResponse || '',
        telemetry: voiceTelemetry,
        report: agentResult.report
      }
    }
  )

  /**
   * Get current Whisper engine status.
   */
  ipcMain.handle('voice:getStatus', async () => {
    return whisperService.getStatus()
  })

  /**
   * Switch Whisper model (e.g. tiny.en -> base.en -> turbo).
   */
  ipcMain.handle('voice:switchModel', async (_event, modelName: string) => {
    return whisperService.switchModel(modelName)
  })

  /**
   * Pre-warm the Whisper worker process.
   */
  ipcMain.handle('voice:warmup', async () => {
    const startMs = performance.now()
    const success = await whisperService.ensureWorker()
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { success, duration_ms }
  })
}
