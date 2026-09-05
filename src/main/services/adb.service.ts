// src/main/services/adb.service.ts — Android Debug Bridge Service
import { execFile } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import { credentialService } from './credential.service'

const execFileAsync = promisify(execFile)

export interface PhoneDeviceDetails {
  id: string
  state: 'device' | 'unauthorized' | 'offline' | 'recovery' | string
  model: string
  manufacturer: string
  androidVersion: string
  connectionType: 'USB' | 'Wireless (TCP/IP)'
  battery?: {
    level: number
    charging: boolean
    acPowered: boolean
    usbPowered: boolean
  }
}

export class ADBService {
  private adbPath: string

  constructor() {
    this.adbPath = this.resolveAdbPath(process.env.ADB_PATH || 'E:\\ULTRON\\Tools\\ADB\\adb.exe')
  }

  private resolveAdbPath(configuredPath: string): string {
    if (configuredPath && fs.existsSync(configuredPath)) return configuredPath
    if (fs.existsSync('E:\\ULTRON\\Tools\\ADB\\adb.exe')) return 'E:\\ULTRON\\Tools\\ADB\\adb.exe'

    const localAppData = process.env.LOCALAPPDATA || ''
    if (localAppData) {
      const sdkPath = path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe')
      if (fs.existsSync(sdkPath)) return sdkPath
    }

    return 'adb'
  }

  setAdbPath(customPath: string) {
    this.adbPath = this.resolveAdbPath(customPath)
  }

  getAdbPath(): string {
    return this.adbPath
  }

  private async runAdb(args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync(this.adbPath, args, {
        windowsHide: true,
        timeout: 10000
      })
      return (stdout || '').trim()
    } catch (error: any) {
      // If error still has stdout, return that
      if (error.stdout) return error.stdout.trim()
      throw new Error(`ADB error: ${error.message}`)
    }
  }

  /**
   * Public safe ADB runner for use by other services (e.g. AndroidAppsService).
   * Only allows pre-validated argument arrays — never raw shell strings.
   */
  async runAdbSafe(args: string[]): Promise<string> {
    return this.runAdb(args)
  }

  /**
   * Connect to user's phone via ADB (USB or Wireless IP)
   */
  async connectPhone(target?: string): Promise<{
    success: boolean
    connected: boolean
    device?: PhoneDeviceDetails
    message?: string
    error?: string
    duration_ms: number
  }> {
    const startMs = performance.now()

    try {
      // 1. Ensure server is started
      try {
        await this.runAdb(['start-server'])
      } catch {}

      // 2. If wireless target provided (e.g. 192.168.x.x:5555), connect directly
      if (target && (target.includes('.') || target.includes(':'))) {
        const connectRes = await this.runAdb(['connect', target])
        if (connectRes.includes('unable to connect') || connectRes.includes('failed')) {
          const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
          return {
            success: false,
            connected: false,
            error: `Could not connect to wireless ADB target '${target}'. Output: ${connectRes}`,
            duration_ms
          }
        }
      }

      // 3. Query attached devices
      const devicesRes = await this.getDevicesWithDetails()
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))

      if (devicesRes.devices.length === 0) {
        return {
          success: false,
          connected: false,
          message: 'No Android phone detected via ADB. Please ensure USB debugging is enabled in your phone\'s Developer Options and the cable is firmly connected.',
          duration_ms
        }
      }

      const activeDevice = devicesRes.devices.find((d) => d.state === 'device') || devicesRes.devices[0]

      if (activeDevice.state === 'unauthorized') {
        return {
          success: false,
          connected: false,
          device: activeDevice,
          message: `Device '${activeDevice.id}' detected but unauthorized. Please unlock your phone and tap "Allow USB debugging".`,
          duration_ms
        }
      }

      return {
        success: true,
        connected: true,
        device: activeDevice,
        message: `Connected to ${activeDevice.manufacturer} ${activeDevice.model} (${activeDevice.id}) via ${activeDevice.connectionType}.`,
        duration_ms
      }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: false,
        connected: false,
        error: err.message || 'Failed to connect phone via ADB',
        duration_ms
      }
    }
  }

  /**
   * Enumerate all attached devices and inspect hardware metadata
   */
  async getDevicesWithDetails(): Promise<{
    devices: PhoneDeviceDetails[]
    duration_ms: number
  }> {
    const startMs = performance.now()
    try {
      const output = await this.runAdb(['devices', '-l'])
      const lines = output.split('\n').slice(1)
      const rawDevices: Array<{ id: string; state: string }> = []

      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length >= 2 && !parts[0].startsWith('*')) {
          rawDevices.push({ id: parts[0], state: parts[1] })
        }
      }

      const detailedDevices: PhoneDeviceDetails[] = []

      for (const raw of rawDevices) {
        const isWireless = raw.id.includes('.') && raw.id.includes(':')
        const connType = isWireless ? 'Wireless (TCP/IP)' : 'USB'

        if (raw.state === 'device') {
          let model = 'Android Phone'
          let manufacturer = 'Android'
          let androidVersion = 'Unknown'
          let battery: PhoneDeviceDetails['battery']

          try {
            const [modelOut, mfgOut, verOut] = await Promise.all([
              this.runAdb(['-s', raw.id, 'shell', 'getprop', 'ro.product.model']).catch(() => ''),
              this.runAdb(['-s', raw.id, 'shell', 'getprop', 'ro.product.manufacturer']).catch(() => ''),
              this.runAdb(['-s', raw.id, 'shell', 'getprop', 'ro.build.version.release']).catch(() => '')
            ])

            if (modelOut) model = modelOut.trim()
            if (mfgOut) manufacturer = mfgOut.trim()
            if (verOut) androidVersion = `Android ${verOut.trim()}`

            const battOut = await this.runAdb(['-s', raw.id, 'shell', 'dumpsys', 'battery']).catch(() => '')
            if (battOut) {
              const levelMatch = battOut.match(/level:\s*(\d+)/i)
              const statusMatch = battOut.match(/status:\s*(\d+)/i)
              const acMatch = battOut.match(/AC powered:\s*true/i)
              const usbMatch = battOut.match(/USB powered:\s*true/i)

              const level = levelMatch ? parseInt(levelMatch[1], 10) : 0
              const status = statusMatch ? parseInt(statusMatch[1], 10) : 0
              const charging = status === 2 || Boolean(acMatch || usbMatch)

              battery = {
                level,
                charging,
                acPowered: Boolean(acMatch),
                usbPowered: Boolean(usbMatch)
              }
            }
          } catch {}

          detailedDevices.push({
            id: raw.id,
            state: raw.state,
            model,
            manufacturer,
            androidVersion,
            connectionType: connType,
            battery
          })
        } else {
          detailedDevices.push({
            id: raw.id,
            state: raw.state,
            model: 'Android Device',
            manufacturer: 'Generic',
            androidVersion: 'Unknown',
            connectionType: connType
          })
        }
      }

      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { devices: detailedDevices, duration_ms }
    } catch {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { devices: [], duration_ms }
    }
  }

  async getDevices(): Promise<{ devices: Array<{ id: string; state: string }>; duration_ms: number }> {
    const res = await this.getDevicesWithDetails()
    return {
      devices: res.devices.map((d) => ({ id: d.id, state: d.state })),
      duration_ms: res.duration_ms
    }
  }

  async makeCall(phoneNumber: string): Promise<{ success: boolean; target: string; result: string; duration_ms: number }> {
    const startMs = performance.now()
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '')
    const result = await this.runAdb(['shell', 'am', 'start', '-a', 'android.intent.action.CALL', '-d', `tel:${cleanNumber}`])
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { success: true, target: cleanNumber, result, duration_ms }
  }

  async sendMessage(phoneNumber: string, body: string): Promise<{ success: boolean; target: string; result: string; duration_ms: number }> {
    const startMs = performance.now()
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '')
    const result = await this.runAdb([
      'shell',
      'am',
      'start',
      '-a',
      'android.intent.action.SENDTO',
      '-d',
      `sms:${cleanNumber}`,
      '--es',
      'sms_body',
      body
    ])
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { success: true, target: cleanNumber, result, duration_ms }
  }

  /**
   * Wake up device screen
   */
  async wakeScreen(): Promise<{ success: boolean; duration_ms: number }> {
    const startMs = performance.now()
    await this.runAdb(['shell', 'input', 'keyevent', '224'])
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return { success: true, duration_ms }
  }

  /**
   * Unlock Android phone screen using securely vaulted PIN or explicit PIN.
   * PIN is immediately cleared from memory and never logged.
   */
  async unlockPhone(explicitPin?: string): Promise<{ success: boolean; message: string; duration_ms: number }> {
    const startMs = performance.now()
    try {
      let pinToUse = explicitPin?.trim() || null
      if (!pinToUse) {
        pinToUse = await credentialService.getPhonePinTransient()
      }

      // Step 1: Wake up device
      await this.runAdb(['shell', 'input', 'keyevent', '224'])
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Step 2: Dismiss lock screen swipe / show PIN entry
      await this.runAdb(['shell', 'input', 'keyevent', '82'])
      await new Promise((resolve) => setTimeout(resolve, 350))

      if (pinToUse && /^\d{4,8}$/.test(pinToUse)) {
        // Step 3: Enter PIN and press ENTER
        await this.runAdb(['shell', 'input', 'text', pinToUse])
        await new Promise((resolve) => setTimeout(resolve, 200))
        await this.runAdb(['shell', 'input', 'keyevent', '66'])
        pinToUse = null // Clear immediately
        const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
        return { success: true, message: 'Phone unlocked successfully with secure PIN.', duration_ms }
      }

      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: true,
        message: 'Phone screen awakened and swipe dismissed.',
        duration_ms
      }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { success: false, message: `Failed to unlock phone: ${err.message}`, duration_ms }
    }
  }

  // ────────────────────────────────────────────────────────────────
  // PHONE STATE MACHINE & CALL CONTROLS (v1.0.2)
  // ────────────────────────────────────────────────────────────────

  /**
   * Query current phone/call state from the device.
   */
  async getPhoneState(): Promise<{
    state: PhoneState
    callState: string
    screenOn: boolean
    duration_ms: number
  }> {
    const startMs = performance.now()
    try {
      const devices = await this.getDevicesWithDetails()
      if (devices.devices.length === 0) {
        return { state: 'DISCONNECTED', callState: 'none', screenOn: false, duration_ms: parseFloat((performance.now() - startMs).toFixed(2)) }
      }
      const device = devices.devices.find((d) => d.state === 'device')
      if (!device) {
        return { state: device?.state === 'unauthorized' ? 'CONNECTING' : 'DISCONNECTED', callState: 'none', screenOn: false, duration_ms: parseFloat((performance.now() - startMs).toFixed(2)) }
      }

      // Check screen state
      const screenState = await this.runAdb(['shell', 'dumpsys', 'power']).catch(() => '')
      const screenOn = /Display Power: state=ON/i.test(screenState)

      // Check call state via telephony registry
      const callInfo = await this.runAdb(['shell', 'dumpsys', 'telephony.registry']).catch(() => '')
      const callStateMatch = callInfo.match(/mCallState\s*=?\s*(\d+)/i)
      const rawCallState = callStateMatch ? parseInt(callStateMatch[1], 10) : 0

      // 0=IDLE, 1=RINGING, 2=OFFHOOK (in call)
      let state: PhoneState = 'CONNECTED'
      let callState = 'idle'
      if (rawCallState === 1) {
        state = 'RINGING'
        callState = 'ringing'
      } else if (rawCallState === 2) {
        state = 'IN_CALL'
        callState = 'active'
      } else {
        state = screenOn ? 'UNLOCKED' : 'LOCKED'
        callState = 'idle'
      }

      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { state, callState, screenOn, duration_ms }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { state: 'DISCONNECTED', callState: 'none', screenOn: false, duration_ms }
    }
  }

  /**
   * End the currently active phone call.
   */
  async endCall(): Promise<{ success: boolean; message: string; duration_ms: number }> {
    const startMs = performance.now()
    try {
      await this.runAdb(['shell', 'input', 'keyevent', '6'])
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { success: true, message: 'Call ended.', duration_ms }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { success: false, message: `Failed to end call: ${err.message}`, duration_ms }
    }
  }

  /**
   * Toggle mute on the active phone call.
   */
  async muteCall(mute: boolean): Promise<{ success: boolean; message: string; duration_ms: number }> {
    const startMs = performance.now()
    try {
      // KEYCODE_MUTE = 91
      await this.runAdb(['shell', 'input', 'keyevent', '91'])
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { success: true, message: mute ? 'Call muted.' : 'Call unmuted.', duration_ms }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { success: false, message: `Failed to toggle mute: ${err.message}`, duration_ms }
    }
  }

  /**
   * Hold/resume the current call. Honest feedback if unsupported.
   */
  async holdCall(hold: boolean): Promise<{ success: boolean; message: string; duration_ms: number }> {
    const startMs = performance.now()
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return {
      success: false,
      message: hold
        ? 'Call hold is not reliably supported through ADB on all devices. Please use the on-screen hold button on your phone.'
        : 'Call resume is not reliably supported through ADB on all devices. Please use the on-screen resume button on your phone.',
      duration_ms
    }
  }

  /**
   * Merge calls. Honest feedback about limitations.
   */
  async mergeCalls(): Promise<{ success: boolean; message: string; duration_ms: number }> {
    const startMs = performance.now()
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return {
      success: false,
      message: "Your device does not expose call merging through the available ADB interface. Please use the on-screen merge button on your phone.",
      duration_ms
    }
  }

  /**
   * Check if the device screen is currently on/off.
   */
  async isScreenOn(): Promise<boolean> {
    try {
      const output = await this.runAdb(['shell', 'dumpsys', 'power'])
      return /Display Power: state=ON/i.test(output)
    } catch {
      return false
    }
  }

  /**
   * Search contacts on the connected Android device.
   * Queries the device contact provider via ADB content resolver.
   */
  async searchDeviceContacts(query: string): Promise<{
    contacts: Array<{ name: string; phone: string }>
    duration_ms: number
    error?: string
  }> {
    const startMs = performance.now()
    try {
      const output = await this.runAdb([
        'shell',
        'content',
        'query',
        '--uri',
        'content://contacts/phones',
        '--projection',
        'display_name:number'
      ])

      const contacts: Array<{ name: string; phone: string }> = []
      const q = query.toLowerCase().trim()

      const rows = output.split('\n').filter((line) => line.includes('display_name='))
      for (const row of rows) {
        const nameMatch = row.match(/display_name=([^,]+)/)
        const numMatch = row.match(/number=([^,\s]+)/)
        if (nameMatch && numMatch) {
          const name = nameMatch[1].trim()
          const phone = numMatch[1].trim()
          if (name.toLowerCase().includes(q) || q.includes(name.toLowerCase())) {
            contacts.push({ name, phone })
          }
        }
      }

      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { contacts, duration_ms }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return { contacts: [], duration_ms, error: err.message }
    }
  }

  /**
   * Power off connected Android device cleanly via ADB.
   */
  async powerOffPhone(): Promise<{ success: boolean; message: string; duration_ms: number }> {
    const startMs = performance.now()
    try {
      const devices = await this.getDevices()
      if (devices.devices.length === 0) {
        return {
          success: false,
          message: 'No Android device detected over ADB to power off.',
          duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
        }
      }
      await this.runAdb(['reboot', '-p'])
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: true,
        message: 'Sent shutdown command to Android device. Powering off.',
        duration_ms
      }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: false,
        message: `Failed to power off phone: ${err.message}`,
        duration_ms
      }
    }
  }

  /**
   * Restart/reboot connected Android device cleanly via ADB.
   */
  async restartPhone(): Promise<{ success: boolean; message: string; duration_ms: number }> {
    const startMs = performance.now()
    try {
      const devices = await this.getDevices()
      if (devices.devices.length === 0) {
        return {
          success: false,
          message: 'No Android device detected over ADB to restart.',
          duration_ms: parseFloat((performance.now() - startMs).toFixed(2))
        }
      }
      await this.runAdb(['reboot'])
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: true,
        message: 'Sent reboot command to Android device. Restarting.',
        duration_ms
      }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: false,
        message: `Failed to restart phone: ${err.message}`,
        duration_ms
      }
    }
  }

  /**
   * Lock phone screen cleanly.
   */
  async lockPhone(): Promise<{ success: boolean; message: string; duration_ms: number }> {
    const startMs = performance.now()
    try {
      const isOn = await this.isScreenOn()
      if (isOn) {
        await this.runAdb(['shell', 'input', 'keyevent', '26'])
      }
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: true,
        message: 'Phone screen locked.',
        duration_ms
      }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        success: false,
        message: `Failed to lock phone: ${err.message}`,
        duration_ms
      }
    }
  }

  /**
   * Get standalone battery status of connected device.
   */
  async getBattery(): Promise<{
    level: number
    charging: boolean
    acPowered: boolean
    usbPowered: boolean
    duration_ms: number
    error?: string
  }> {
    const startMs = performance.now()
    try {
      const battOut = await this.runAdb(['shell', 'dumpsys', 'battery'])
      const levelMatch = battOut.match(/level:\s*(\d+)/i)
      const statusMatch = battOut.match(/status:\s*(\d+)/i)
      const acMatch = battOut.match(/AC powered:\s*true/i)
      const usbMatch = battOut.match(/USB powered:\s*true/i)

      const level = levelMatch ? parseInt(levelMatch[1], 10) : 0
      const status = statusMatch ? parseInt(statusMatch[1], 10) : 0
      const charging = status === 2 || Boolean(acMatch || usbMatch)

      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        level,
        charging,
        acPowered: Boolean(acMatch),
        usbPowered: Boolean(usbMatch),
        duration_ms
      }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
      return {
        level: 0,
        charging: false,
        acPowered: false,
        usbPowered: false,
        duration_ms,
        error: err.message
      }
    }
  }

  /**
   * Resume active held call.
   */
  async resumeCall(): Promise<{ success: boolean; message: string; duration_ms: number }> {
    return this.holdCall(false)
  }

  /**
   * Swap active and held calls.
   */
  async swapCalls(): Promise<{ success: boolean; message: string; duration_ms: number }> {
    const startMs = performance.now()
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return {
      success: false,
      message: 'Swapping calls requires carrier InCallService privileges. Please use the on-screen swap button on your phone.',
      duration_ms
    }
  }

  /**
   * Answer second incoming call.
   */
  async secondCall(): Promise<{ success: boolean; message: string; duration_ms: number }> {
    const startMs = performance.now()
    const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
    return {
      success: false,
      message: 'Managing multiple active calls is restricted by Android carrier telephony policy. Please answer on your phone.',
      duration_ms
    }
  }
}

export type PhoneState =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'LOCKED'
  | 'UNLOCKED'
  | 'IDLE'
  | 'RINGING'
  | 'IN_CALL'
  | 'CALL_HELD'
  | 'SECOND_CALL'
  | 'CALL_MERGED'
  | 'CALL_ERROR'

export const adbService = new ADBService()