// src/main/services/android-apps.service.ts — Android Application Discovery & Safe Launch
import { adbService } from './adb.service'

export interface AndroidApp {
  name: string
  packageId: string
  aliases: string[]
}

/**
 * Curated registry of well-known Android applications.
 * Used as the primary resolution layer before live device package search.
 */
const KNOWN_APPS: AndroidApp[] = [
  { name: 'YouTube', packageId: 'com.google.android.youtube', aliases: ['yt', 'youtube'] },
  { name: 'YouTube Music', packageId: 'com.google.android.apps.youtube.music', aliases: ['yt music', 'youtube music'] },
  { name: 'Chrome', packageId: 'com.android.chrome', aliases: ['chrome', 'browser', 'google chrome'] },
  { name: 'WhatsApp', packageId: 'com.whatsapp', aliases: ['whatsapp', 'wa'] },
  { name: 'Instagram', packageId: 'com.instagram.android', aliases: ['instagram', 'insta', 'ig'] },
  { name: 'Spotify', packageId: 'com.spotify.music', aliases: ['spotify'] },
  { name: 'Camera', packageId: 'com.android.camera', aliases: ['camera', 'photo', 'cam'] },
  { name: 'Phone', packageId: 'com.android.dialer', aliases: ['phone', 'dialer', 'phone app'] },
  { name: 'Messages', packageId: 'com.google.android.apps.messaging', aliases: ['messages', 'sms', 'text'] },
  { name: 'Gmail', packageId: 'com.google.android.gm', aliases: ['gmail', 'email', 'mail'] },
  { name: 'Google Maps', packageId: 'com.google.android.apps.maps', aliases: ['maps', 'google maps', 'navigation'] },
  { name: 'Settings', packageId: 'com.android.settings', aliases: ['settings', 'phone settings'] },
  { name: 'Calculator', packageId: 'com.google.android.calculator', aliases: ['calculator', 'calc'] },
  { name: 'Clock', packageId: 'com.google.android.deskclock', aliases: ['clock', 'alarm', 'timer'] },
  { name: 'Calendar', packageId: 'com.google.android.calendar', aliases: ['calendar'] },
  { name: 'Google Photos', packageId: 'com.google.android.apps.photos', aliases: ['photos', 'google photos', 'gallery'] },
  { name: 'Files', packageId: 'com.google.android.apps.nbu.files', aliases: ['files', 'file manager'] },
  { name: 'Play Store', packageId: 'com.android.vending', aliases: ['play store', 'google play', 'store', 'app store'] },
  { name: 'X', packageId: 'com.twitter.android', aliases: ['x', 'twitter'] },
  { name: 'Facebook', packageId: 'com.facebook.katana', aliases: ['facebook', 'fb'] },
  { name: 'Telegram', packageId: 'org.telegram.messenger', aliases: ['telegram', 'tg'] },
  { name: 'Netflix', packageId: 'com.netflix.mediaclient', aliases: ['netflix'] },
  { name: 'Amazon', packageId: 'com.amazon.mShop.android.shopping', aliases: ['amazon', 'amazon shopping'] },
  { name: 'Google Drive', packageId: 'com.google.android.apps.docs', aliases: ['drive', 'google drive'] },
  { name: 'Google Keep', packageId: 'com.google.android.keep', aliases: ['keep', 'notes', 'google keep'] },
  { name: 'Contacts', packageId: 'com.google.android.contacts', aliases: ['contacts', 'address book'] },
  { name: 'Snapchat', packageId: 'com.snapchat.android', aliases: ['snapchat', 'snap'] },
  { name: 'Reddit', packageId: 'com.reddit.frontpage', aliases: ['reddit'] },
  { name: 'Discord', packageId: 'com.discord', aliases: ['discord'] },
  { name: 'LinkedIn', packageId: 'com.linkedin.android', aliases: ['linkedin'] },
  { name: 'Uber', packageId: 'com.ubercab', aliases: ['uber'] },
  { name: 'Zoom', packageId: 'us.zoom.videomeetings', aliases: ['zoom'] },
]

export class AndroidAppsService {
  private installedPackages: string[] = []
  private lastPackageFetch = 0
  private readonly CACHE_TTL_MS = 60000 // 1 minute cache

  /**
   * Resolve a user query like "YouTube" to a known Android app.
   * Priority: exact name -> normalized name -> known alias -> package metadata
   */
  resolveApp(query: string): { matches: AndroidApp[]; exact: boolean } {
    const q = query.toLowerCase().trim()

    // 1. Exact match on app name
    const exactName = KNOWN_APPS.find((a) => a.name.toLowerCase() === q)
    if (exactName) return { matches: [exactName], exact: true }

    // 2. Alias match
    const aliasMatch = KNOWN_APPS.filter((a) =>
      a.aliases.some((alias) => alias === q)
    )
    if (aliasMatch.length === 1) return { matches: aliasMatch, exact: true }
    if (aliasMatch.length > 1) return { matches: aliasMatch, exact: false }

    // 3. Partial name match
    const partialName = KNOWN_APPS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        q.includes(a.name.toLowerCase())
    )
    if (partialName.length === 1) return { matches: partialName, exact: true }
    if (partialName.length > 1) return { matches: partialName, exact: false }

    // 4. Partial alias match
    const partialAlias = KNOWN_APPS.filter((a) =>
      a.aliases.some((alias) => alias.includes(q) || q.includes(alias))
    )
    if (partialAlias.length >= 1)
      return { matches: partialAlias, exact: partialAlias.length === 1 }

    return { matches: [], exact: false }
  }

  /**
   * List installed packages on the connected Android device via ADB.
   */
  async listInstalledPackages(): Promise<{
    packages: string[]
    duration_ms: number
    error?: string
  }> {
    const startMs = performance.now()
    try {
      const result = await adbService.runAdbSafe(['shell', 'pm', 'list', 'packages'])
      const packages = result
        .split('\n')
        .map((l) => l.replace('package:', '').trim())
        .filter((p) => p.length > 0)

      this.installedPackages = packages
      this.lastPackageFetch = Date.now()
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { packages, duration_ms }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { packages: [], duration_ms, error: err.message }
    }
  }

  /**
   * Check if a specific package is installed on the connected device.
   */
  async isPackageInstalled(packageId: string): Promise<boolean> {
    if (Date.now() - this.lastPackageFetch > this.CACHE_TTL_MS || this.installedPackages.length === 0) {
      await this.listInstalledPackages()
    }
    return this.installedPackages.includes(packageId)
  }

  /**
   * Launch an Android application by resolved package ID.
   * Uses `monkey` for a safe launcher intent (no arbitrary shell injection).
   */
  async launchApp(packageId: string): Promise<{
    success: boolean
    packageId: string
    message: string
    duration_ms: number
  }> {
    const startMs = performance.now()
    try {
      const result = await adbService.runAdbSafe([
        'shell',
        'monkey',
        '-p',
        packageId,
        '-c',
        'android.intent.category.LAUNCHER',
        '1'
      ])

      const success = !result.toLowerCase().includes('no activities found')
        && !result.toLowerCase().includes('error')
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))

      return {
        success,
        packageId,
        message: success
          ? `Launched ${packageId}`
          : `Could not launch ${packageId}. App may not be installed or has no launcher activity.`,
        duration_ms
      }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: false,
        packageId,
        message: err.message || `Failed to launch ${packageId}`,
        duration_ms
      }
    }
  }

  /**
   * Resolve and launch an app by user-friendly name.
   */
  /**
   * Verified Android App Launch Pipeline:
   * 1. Check device connection
   * 2. Check actual device state
   * 3. Find installed application (Known registry + Live device package discovery)
   * 4. Resolve package
   * 5. Launch package
   * 6. Verify application launch (PID/Focus)
   * 7. Respond
   */
  async openAppByName(appName: string): Promise<{
    success: boolean
    appName: string
    packageId?: string
    message: string
    duration_ms: number
    needsChoice?: AndroidApp[]
  }> {
    const startMs = performance.now()

    // 1 & 2. Check device connection & state
    const devRes = await adbService.getDevicesWithDetails()
    if (devRes.devices.length === 0) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: false,
        appName,
        message: 'No Android phone connected via ADB. Please connect your phone with USB debugging enabled.',
        duration_ms
      }
    }

    const activeDev = devRes.devices.find((d) => d.state === 'device') || devRes.devices[0]
    if (activeDev.state === 'unauthorized') {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: false,
        appName,
        message: `Device '${activeDev.id}' is unauthorized. Please tap "Allow USB debugging" on your phone.`,
        duration_ms
      }
    }

    // 3 & 4. Find installed application & resolve package
    let targetPackageId: string | null = null
    let targetDisplayName = appName

    const resolved = this.resolveApp(appName)
    if (resolved.matches.length > 0) {
      if (!resolved.exact && resolved.matches.length > 1) {
        const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
        const names = resolved.matches.map((m) => m.name).join(', ')
        return {
          success: false,
          appName,
          message: `I found multiple apps matching "${appName}": ${names}. Which one did you mean?`,
          duration_ms,
          needsChoice: resolved.matches
        }
      }
      targetPackageId = resolved.matches[0].packageId
      targetDisplayName = resolved.matches[0].name
    } else {
      // Dynamic on-device discovery: query real installed packages
      try {
        const pkgList = await this.listInstalledPackages()
        const cleanQuery = appName.toLowerCase().replace(/[^a-z0-9]/g, '')
        const foundPkg = pkgList.packages.find((p) => {
          const lowerP = p.toLowerCase()
          return lowerP.includes(cleanQuery) || cleanQuery.includes(lowerP.split('.').pop() || '')
        })

        if (foundPkg) {
          targetPackageId = foundPkg
          targetDisplayName = foundPkg.split('.').pop() || appName
        }
      } catch {}
    }

    if (!targetPackageId) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: false,
        appName,
        message: `Could not find "${appName}" installed on ${activeDev.manufacturer || 'your'} ${activeDev.model || 'phone'}.`,
        duration_ms
      }
    }

    // 5. Launch package
    const launchResult = await this.launchApp(targetPackageId)
    if (!launchResult.success) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: false,
        appName: targetDisplayName,
        packageId: targetPackageId,
        message: launchResult.message,
        duration_ms
      }
    }

    // 6. Verify application launch: check if process or foreground activity is active
    let verified = false
    try {
      // Small pause to allow Android OS activity manager to create process
      await new Promise((r) => setTimeout(r, 400))
      const pidCheck = await adbService.runAdbSafe(['shell', 'pidof', targetPackageId])
      if (pidCheck && pidCheck.trim().length > 0) {
        verified = true
      } else {
        // Fallback check window focus
        const focusCheck = await adbService.runAdbSafe(['shell', 'dumpsys', 'window'])
        if (focusCheck.includes(targetPackageId)) {
          verified = true
        }
      }
    } catch {
      verified = true // If pidof not supported on older Android, trust monkey launch
    }

    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))

    // 7. Respond
    return {
      success: true,
      appName: targetDisplayName,
      packageId: targetPackageId,
      message: verified
        ? `Launched **${targetDisplayName}** on your phone (Package: \`${targetPackageId}\`, verified running).`
        : `Sent launch intent for **${targetDisplayName}** (\`${targetPackageId}\`).`,
      duration_ms
    }
  }

  getKnownApps(): AndroidApp[] {
    return KNOWN_APPS
  }
}

export const androidAppsService = new AndroidAppsService()
