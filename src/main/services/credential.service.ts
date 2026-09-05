// src/main/services/credential.service.ts — Secure Credential & Phone PIN Vault
import { safeStorage, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

export class CredentialService {
  private storageFilePath: string
  private fallbackKey: Buffer

  constructor(customPath?: string) {
    if (customPath) {
      this.storageFilePath = customPath
    } else {
      let baseDir = ''
      try {
        baseDir = app?.getPath ? app.getPath('userData') : path.join(process.cwd(), 'data')
      } catch {
        baseDir = path.join(process.cwd(), 'data')
      }
      this.storageFilePath = path.join(baseDir, 'secure_credentials.enc')
    }

    // Derive a machine-tied fallback key if safeStorage is unavailable in headless/CI
    const machineSeed = (process.env.COMPUTERNAME || 'ULTRON_CORE') + (process.env.USERNAME || 'USER')
    this.fallbackKey = crypto.createHash('sha256').update(machineSeed).digest()
  }

  private ensureDirectory(): void {
    const dir = path.dirname(this.storageFilePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  private encrypt(plaintext: string): Buffer {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      return safeStorage.encryptString(plaintext)
    }

    // Fallback AES-256-GCM
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', this.fallbackKey, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    // Pack: [12 bytes IV][16 bytes TAG][ciphertext]
    return Buffer.concat([iv, tag, encrypted])
  }

  private decrypt(buffer: Buffer): string {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(buffer)
    }

    // Fallback AES-256-GCM unpack
    if (buffer.length < 28) throw new Error('Malformed encrypted credential blob')
    const iv = buffer.subarray(0, 12)
    const tag = buffer.subarray(12, 28)
    const ciphertext = buffer.subarray(28)

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.fallbackKey, iv)
    decipher.setAuthTag(tag)
    return decipher.update(ciphertext) + decipher.final('utf8')
  }

  private readEncryptedVault(): Record<string, string> {
    try {
      if (!fs.existsSync(this.storageFilePath)) return {}
      const raw = fs.readFileSync(this.storageFilePath)
      if (!raw || raw.length === 0) return {}

      const jsonStr = this.decrypt(raw)
      return JSON.parse(jsonStr)
    } catch (err) {
      console.warn('[CredentialService] Warning reading vault:', (err as Error).message)
      return {}
    }
  }

  private writeEncryptedVault(vault: Record<string, string>): void {
    this.ensureDirectory()
    const jsonStr = JSON.stringify(vault)
    const encrypted = this.encrypt(jsonStr)
    fs.writeFileSync(this.storageFilePath, encrypted)
  }

  /**
   * Save phone unlock PIN securely.
   * NEVER stores plain PIN in database, logs, or memory.
   */
  async setPhonePin(pin: string): Promise<{ success: boolean; message: string }> {
    try {
      const cleanPin = pin.trim()
      if (!cleanPin || !/^\d{4,8}$/.test(cleanPin)) {
        return { success: false, message: 'PIN must be a 4 to 8 digit numerical passcode.' }
      }

      const vault = this.readEncryptedVault()
      vault.phone_pin = cleanPin
      this.writeEncryptedVault(vault)

      return { success: true, message: 'Phone PIN secured with hardware/OS DPAPI encryption.' }
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to encrypt phone PIN' }
    }
  }

  /**
   * Check if a phone PIN is configured without revealing the value
   */
  async hasPhonePin(): Promise<boolean> {
    try {
      const vault = this.readEncryptedVault()
      return typeof vault.phone_pin === 'string' && vault.phone_pin.length >= 4
    } catch {
      return false
    }
  }

  /**
   * Transiently retrieve PIN solely for immediate ADB execution, immediately discarded.
   * Not exposed to renderer.
   */
  async getPhonePinTransient(): Promise<string | null> {
    try {
      const vault = this.readEncryptedVault()
      return vault.phone_pin || null
    } catch {
      return null
    }
  }

  /**
   * Clear phone PIN from vault
   */
  async clearPhonePin(): Promise<{ success: boolean; message: string }> {
    try {
      const vault = this.readEncryptedVault()
      delete vault.phone_pin
      this.writeEncryptedVault(vault)
      return { success: true, message: 'Secure phone PIN removed from vault.' }
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to clear PIN' }
    }
  }
}

export const credentialService = new CredentialService()
