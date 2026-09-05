// src/main/services/screen.service.ts — Native Screen Capture & Multimodal Vision Analysis
import { desktopCapturer } from 'electron'
import { ScreenSource, ScreenMemoryEntry } from '../../shared/types'
import { modelService } from './model.service'
import { getVisionModel } from '../../shared/models.registry'
import { memoryDatabase } from '../database/memory.db'

export class ScreenService {
  private activeSourceId: string | null = null
  private isSharing = false

  /**
   * Enumerate local screens and application windows via desktopCapturer
   */
  async getSources(): Promise<ScreenSource[]> {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 480, height: 270 },
        fetchWindowIcons: true
      })

      return sources.map((s) => ({
        id: s.id,
        name: s.name,
        thumbnail: s.thumbnail.toDataURL(),
        display_id: s.display_id,
        appIcon: s.appIcon ? s.appIcon.toDataURL() : undefined
      }))
    } catch (err: any) {
      console.error('[ScreenService] getSources error:', err)
      return []
    }
  }

  setSharingState(active: boolean, sourceId?: string): void {
    this.isSharing = active
    this.activeSourceId = active ? (sourceId || null) : null
  }

  getSharingState(): { isSharing: boolean; activeSourceId: string | null } {
    return {
      isSharing: this.isSharing,
      activeSourceId: this.activeSourceId
    }
  }

  /**
   * Capture a single frame on demand for visual comprehension.
   * Controlled sampling: downscales to 1280x720 for optimal bandwidth and latency.
   * Does NOT save permanently to disk.
   */
  async captureFrame(sourceId?: string): Promise<{
    success: boolean
    dataUrl?: string
    error?: string
    width?: number
    height?: number
  }> {
    try {
      const targetId = sourceId || this.activeSourceId
      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 1280, height: 720 }
      })

      const matched = targetId
        ? sources.find((s) => s.id === targetId) || sources[0]
        : sources[0]

      if (!matched) {
        return { success: false, error: 'No display or window source available for capture.' }
      }

      const dataUrl = matched.thumbnail.toDataURL()
      const size = matched.thumbnail.getSize()

      return {
        success: true,
        dataUrl,
        width: size.width,
        height: size.height
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to capture screen frame.' }
    }
  }

  /**
   * Screen Understanding Pipeline:
   * CAPTURE -> SAMPLE -> VISION MODEL -> UNDERSTAND -> DESCRIBE
   */
  async analyzeScreen(
    userQuestion = 'What am I looking at on this screen? Describe the active application, visible UI elements, and any errors or code visible.',
    sourceId?: string
  ): Promise<{
    success: boolean
    description?: string
    error?: string
    durationMs: number
  }> {
    const startMs = performance.now()
    try {
      const frame = await this.captureFrame(sourceId)
      if (!frame.success || !frame.dataUrl) {
        return {
          success: false,
          error: frame.error || 'Could not sample screen frame.',
          durationMs: parseFloat((performance.now() - startMs).toFixed(2))
        }
      }

      // Check if NVIDIA cloud model key is configured
      const visionModel = getVisionModel()
      const apiKey = modelService.getApiKey()
      const endpoint = modelService.getEndpoint()

      if (!apiKey) {
        return {
          success: true,
          description: `[LOCAL SCREEN CAPTURE ACTIVE]\nFrame captured at ${frame.width}x${frame.height}. (To obtain deep multimodal visual reasoning, configure your NVIDIA API key in Settings to activate ${visionModel.name}).`,
          durationMs: parseFloat((performance.now() - startMs).toFixed(2))
        }
      }

      // Call NVIDIA multimodal vision endpoint with image payload
      const base64Data = frame.dataUrl.split(',')[1] || frame.dataUrl
      const mediaType = frame.dataUrl.includes('image/png') ? 'image/png' : 'image/jpeg'

      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: visionModel.id,
          messages: [
            {
              role: 'system',
              content:
                'You are ULTRON Vision Engine. Analyze the user screen accurately and concisely. Focus on the active application, window title, visible code, error dialogs, or primary UI controls. Never hallucinate what is not visible.'
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: userQuestion },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mediaType};base64,${base64Data}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1024,
          temperature: 0.2
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Vision API returned status ${response.status}: ${errText}`)
      }

      const json = await response.json()
      const description = json.choices?.[0]?.message?.content || 'Screen frame analyzed, but no text description was returned.'
      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))

      // V1.0.5: Save task-scoped screen memory metadata (no raw image permanently stored)
      const appMatch = description.match(/(?:app|application|window|in|editor|browser)\s*[:=]?\s*([A-Za-z0-9_\-\.\s]{3,30})/i)
      const detectedApp = appMatch ? appMatch[1].trim() : (this.activeSourceId || 'Active Desktop')

      memoryDatabase.saveScreenContext({
        application: detectedApp,
        window: detectedApp,
        detectedElements: [],
        recognizedText: description,
        confidence: 0.95,
        summary: description.slice(0, 200),
        sourceId: sourceId || this.activeSourceId || undefined
      })

      return {
        success: true,
        description,
        durationMs
      }
    } catch (err: any) {
      const durationMs = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: false,
        error: err.message || 'Failed to analyze screen frame.',
        durationMs
      }
    }
  }

  /**
   * V1.0.5: Task-Scoped Screen Memory queries
   */
  getLatestScreenContext(): ScreenMemoryEntry | null {
    return memoryDatabase.getLatestScreenContext()
  }

  listScreenContext(limit = 10): ScreenMemoryEntry[] {
    return memoryDatabase.listScreenContext(limit)
  }

  forgetScreenContext(): boolean {
    return memoryDatabase.clearScreenContext()
  }
}

export const screenService = new ScreenService()
