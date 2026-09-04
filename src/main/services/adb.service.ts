// src/main/services/adb.service.ts — Android Debug Bridge Service
import { execFile } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'

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
}

export const adbService = new ADBService()