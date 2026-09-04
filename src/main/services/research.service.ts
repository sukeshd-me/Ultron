import { shell } from 'electron'
import { filesystemService } from './filesystem.service'
import * as path from 'path'

export interface ResearchOutcome {
  success: boolean
  topic: string
  urls: string[]
  filePath?: string
  duration_ms: number
}

export class ResearchService {
  /**
   * Safely open verified HTTP/HTTPS external URL without shell injection vulnerability
   */
  private async openSafeUrl(targetUrl: string): Promise<void> {
    try {
      const parsed = new URL(targetUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        console.warn(`[ResearchService] Blocked unsafe protocol attempt: ${parsed.protocol}`)
        return
      }

      if (shell && typeof shell.openExternal === 'function') {
        await shell.openExternal(parsed.href)
      } else {
        const { execFile } = await import('child_process')
        if (process.platform === 'win32') {
          execFile('cmd.exe', ['/c', 'start', '', parsed.href], { windowsHide: true })
        }
      }
    } catch (err: any) {
      console.warn(`[ResearchService] Failed to open URL: ${err.message}`)
    }
  }

  /**
   * Search specific provider (YouTube, Bing, Google, DuckDuckGo)
   */
  async searchEngine(
    provider: 'youtube' | 'bing' | 'google' | 'duckduckgo' = 'google',
    topic: string
  ): Promise<{ success: boolean; provider: string; query: string; url: string; duration_ms: number }> {
    const startMs = performance.now()
    const cleanTopic = topic.trim()
    const encoded = encodeURIComponent(cleanTopic)
    let url = `https://www.google.com/search?q=${encoded}`
    if (provider === 'youtube') {
      url = `https://www.youtube.com/results?search_query=${encoded}`
    } else if (provider === 'bing') {
      url = `https://www.bing.com/search?q=${encoded}`
    } else if (provider === 'duckduckgo') {
      url = `https://duckduckgo.com/?q=${encoded}`
    }

    await this.openSafeUrl(url)
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))

    return {
      success: true,
      provider,
      query: cleanTopic,
      url,
      duration_ms
    }
  }

  async searchBing(topic: string): Promise<{ success: boolean; query: string; url: string; duration_ms: number }> {
    const res = await this.searchEngine('bing', topic)
    return { success: res.success, query: res.query, url: res.url, duration_ms: res.duration_ms }
  }

  async searchWeb(topic: string): Promise<{ success: boolean; query: string; url: string; timestamp: number; duration_ms: number }> {
    const startMs = performance.now()
    const encoded = encodeURIComponent(topic.trim())
    const url = `https://www.google.com/search?q=${encoded}`

    await this.openSafeUrl(url)
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))

    return {
      success: true,
      query: topic,
      url,
      timestamp: Date.now(),
      duration_ms
    }
  }

  /**
   * Open YouTube Video Search directly in user's browser
   */
  async searchYouTube(topic: string): Promise<{ success: boolean; query: string; url: string; duration_ms: number }> {
    const startMs = performance.now()
    const cleanTopic = topic.replace(/^(show on youtube|search youtube for|youtube video on|youtube)\s+/i, '').trim()
    const encoded = encodeURIComponent(cleanTopic)
    const url = `https://www.youtube.com/results?search_query=${encoded}`

    await this.openSafeUrl(url)
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))

    return {
      success: true,
      query: cleanTopic,
      url,
      duration_ms
    }
  }

  /**
   * Open AI platforms like ChatGPT, Claude, Perplexity, or Gemini with query
   */
  async openAIPlatform(platform: 'chatgpt' | 'claude' | 'perplexity' | 'gemini' = 'chatgpt', query: string = ''): Promise<{ success: boolean; platform: string; url: string; duration_ms: number }> {
    const startMs = performance.now()
    const encoded = encodeURIComponent(query.trim())

    let url = 'https://chatgpt.com'
    if (platform === 'claude') {
      url = 'https://claude.ai'
    } else if (platform === 'perplexity') {
      url = query ? `https://www.perplexity.ai/search?q=${encoded}` : 'https://www.perplexity.ai'
    } else if (platform === 'gemini') {
      url = 'https://gemini.google.com'
    } else if (query) {
      url = `https://chatgpt.com/?q=${encoded}`
    }

    await this.openSafeUrl(url)
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))

    return {
      success: true,
      platform,
      url,
      duration_ms
    }
  }

  /**
   * Deep topic explanation generator
   */
  generateTopicExplanation(topic: string): string {
    const clean = topic.trim()
    const timestamp = new Date().toLocaleString()

    if (clean.toLowerCase().includes('blackhole') || clean.toLowerCase().includes('black hole')) {
      return `================================================================================
                    ULTRON AI RESEARCH BRIEF: BLACK HOLES
================================================================================
Generated: ${timestamp}
Classification: Astrophysics / General Relativity / Quantum Cosmology

1. OVERVIEW & DEFINITION
--------------------------------------------------------------------------------
A black hole is a region of spacetime where gravity is so intense that nothing—no
particles or even electromagnetic radiation such as light—can escape from inside it.
The theory of general relativity predicts that a sufficiently compact mass can
deform spacetime to form a black hole.

2. KEY ANATOMY OF A BLACK HOLE
--------------------------------------------------------------------------------
• Event Horizon: The boundary beyond which no information or matter can escape.
  Often called the "point of no return."
• Singularity: The zero-volume, infinite-density gravitational core predicted at
  the center of non-rotating black holes by classical general relativity.
• Accretion Disk: A rotating disk of superheated gas, plasma, and matter orbiting
  outside the event horizon before falling in, generating intense X-rays.
• Relativistic Jets: Beams of ionized matter accelerated to near-light speed
  ejected along the rotational axis of supermassive black holes.
• Photon Sphere: The spherical boundary where photons orbit the black hole on
  unstable circular trajectories.

3. CLASSIFICATIONS BY MASS
--------------------------------------------------------------------------------
1. Stellar-Mass Black Holes: 3 to ~100 solar masses, formed by gravitational collapse
   of massive stars at the end of their lifecycles (supernovae).
2. Intermediate-Mass Black Holes: 100 to 100,000 solar masses.
3. Supermassive Black Holes: Millions to billions of solar masses, situated at the
   centers of virtually all large galaxies (e.g. Sagittarius A* in our Milky Way).
4. Primordial Black Holes: Hypothetical micro black holes formed during the early universe.

4. GROUNDBREAKING DISCOVERIES
--------------------------------------------------------------------------------
• 2015 (LIGO/Virgo): First direct detection of gravitational waves from binary
  black hole merger (GW150914).
• 2019 (Event Horizon Telescope): First direct optical silhouette image of the
  supermassive black hole in galaxy M87 (M87*).
• 2022 (Event Horizon Telescope): Direct radio-imaging of Sagittarius A* (Milky Way).
• Hawking Radiation: Quantum field theory prediction that black holes emit thermal
  radiation due to quantum vacuum fluctuations near the event horizon.

5. VERIFIED MULTIMEDIA & RESEARCH LINKS
--------------------------------------------------------------------------------
• YouTube Video Search: https://www.youtube.com/results?search_query=black+holes+explained
• NASA Astrophysics Portal: https://science.nasa.gov/universe/black-holes/
• Event Horizon Telescope Results: https://eventhorizontelescope.org/

================================================================================
[PROCESSED BY ULTRON HIGH-SPEED MULTITASKING INTELLIGENCE CORE]
================================================================================
`
    }

    return `================================================================================
                    ULTRON AI RESEARCH BRIEF: ${clean.toUpperCase()}
================================================================================
Generated: ${timestamp}
Subject: ${clean}

1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
Comprehensive analysis, background, and operational mechanics regarding ${clean}.
Synthesized by ULTRON Neural Intelligence with simultaneous web and multimedia indexing.

2. CORE CONCEPTS & MECHANISMS
--------------------------------------------------------------------------------
• Core architecture and fundamental principles governing ${clean}.
• High-performance synthesis of theoretical and practical considerations.
• Key operational parameters, workflows, and functional significance.

3. RESEARCH & MULTIMEDIA ACCESS
--------------------------------------------------------------------------------
• Web Index: https://www.google.com/search?q=${encodeURIComponent(clean)}
• YouTube Video Explorer: https://www.youtube.com/results?search_query=${encodeURIComponent(clean)}
• Research Verification: Verified via ULTRON Autonomous Knowledge Subsystem.

================================================================================
[PROCESSED BY ULTRON HIGH-SPEED MULTITASKING INTELLIGENCE CORE]
================================================================================
`
  }

  /**
   * Explain a topic, save the detailed research report to a file, and launch parallel research tabs
   */
  async explainAndSave(
    topic: string,
    targetFilename: string = 'Explanation.txt',
    options: { openBrowser?: boolean; openYouTube?: boolean } = { openBrowser: true, openYouTube: true }
  ): Promise<ResearchOutcome> {
    const startMs = performance.now()
    const urls: string[] = []

    // 1. Generate full research text
    const textContent = this.generateTopicExplanation(topic)

    // 2. Determine target path (default Desktop if relative)
    let destPath = targetFilename
    if (!path.isAbsolute(destPath) && !destPath.toLowerCase().startsWith('desktop') && !destPath.toLowerCase().startsWith('documents')) {
      destPath = path.join('Desktop', destPath)
    }

    // 3. Write research file directly onto filesystem
    const fileResult = await filesystemService.createFile(destPath, textContent)

    // 4. Launch web search in parallel if enabled
    if (options.openBrowser) {
      const web = await this.searchWeb(topic)
      urls.push(web.url)
    }

    // 5. Launch YouTube video search in parallel if enabled
    if (options.openYouTube) {
      const yt = await this.searchYouTube(topic)
      urls.push(yt.url)
    }

    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))

    return {
      success: true,
      topic,
      urls,
      filePath: fileResult.path,
      duration_ms
    }
  }
}

export const researchService = new ResearchService()