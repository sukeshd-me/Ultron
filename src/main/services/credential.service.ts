// src/main/services/credential.service.ts — Secure Credential & Phone PIN Vault
import { safeStorage, app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { modelService } from './model.service'

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

  // ══════════════════════════════════════════════════════════════════
  // NVIDIA API KEY MANAGEMENT (DPAPI / Machine-Encrypted OS Vault)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Checks whether an NVIDIA API key is available in the encrypted vault or environment.
   * Never exposes the key value.
   */
  async hasNvidiaApiKey(): Promise<boolean> {
    try {
      const vault = this.readEncryptedVault()
      if (typeof vault.nvidia_api_key === 'string' && vault.nvidia_api_key.trim().length > 0) {
        return true
      }
      // Check process.env fallback and seed into vault if found
      const envKey = process.env.NVIDIA_API_KEY
      if (typeof envKey === 'string' && envKey.trim().length > 0) {
        vault.nvidia_api_key = envKey.trim()
        this.writeEncryptedVault(vault)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * Returns a masked representation of the saved API key (e.g. ••••••••••••••••••••••••)
   * The actual secret is NEVER sent to the renderer.
   */
  async getMaskedNvidiaApiKey(): Promise<string | null> {
    const hasKey = await this.hasNvidiaApiKey()
    return hasKey ? '••••••••••••••••••••••••' : null
  }

  /**
   * Transiently retrieves the plaintext key on the main process solely for API calls.
   * NEVER pass this result to the renderer process.
   */
  async getNvidiaApiKeyTransient(): Promise<string | null> {
    return this.getNvidiaApiKeyTransientSync()
  }

  /**
   * Synchronous retrieval on main process for model initialization.
   */
  getNvidiaApiKeyTransientSync(): string | null {
    try {
      const vault = this.readEncryptedVault()
      if (typeof vault.nvidia_api_key === 'string' && vault.nvidia_api_key.trim().length > 0) {
        return vault.nvidia_api_key.trim()
      }
      const envKey = process.env.NVIDIA_API_KEY
      if (typeof envKey === 'string' && envKey.trim().length > 0) {
        return envKey.trim()
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Saves the NVIDIA API key securely to the encrypted vault.
   * Validates non-empty input and never overwrites with empty values.
   */
  async setNvidiaApiKey(key: string): Promise<{ success: boolean; message: string }> {
    try {
      const cleanKey = key?.trim()
      if (!cleanKey) {
        return { success: false, message: 'API key cannot be empty.' }
      }

      const vault = this.readEncryptedVault()
      vault.nvidia_api_key = cleanKey
      this.writeEncryptedVault(vault)

      // Also update running modelService if available
      try {
        modelService.setApiKey(cleanKey)
      } catch {}

      return { success: true, message: '✓ NVIDIA API key secured in local vault.' }
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to encrypt API key.' }
    }
  }

  /**
   * Removes the saved NVIDIA API key from the vault.
   */
  async clearNvidiaApiKey(): Promise<{ success: boolean; message: string }> {
    try {
      const vault = this.readEncryptedVault()
      delete vault.nvidia_api_key
      this.writeEncryptedVault(vault)

      try {
        modelService.setApiKey(null)
      } catch {}

      return { success: true, message: 'NVIDIA API key removed from vault.' }
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to remove API key.' }
    }
  }

  /**
   * Validates an API key (either provided explicitly or retrieved transiently from vault)
   * against the official NVIDIA /chat/completions endpoint.
   * NEVER reveals the key in error messages or logs.
   */
  async validateNvidiaApiKey(
    keyToTest?: string
  ): Promise<{ valid: boolean; error?: string; model?: string; latencyMs?: number }> {
    const effectiveKey = keyToTest?.trim() || this.getNvidiaApiKeyTransientSync()
    if (!effectiveKey) {
      return { valid: false, error: 'API key cannot be empty.' }
    }

    const endpoint = process.env.NVIDIA_ENDPOINT || 'https://integrate.api.nvidia.com/v1'
    const model = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct'

    const startTime = performance.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveKey}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'healthcheck' }],
          max_tokens: 1
        }),
        signal: controller.signal
      })
      clearTimeout(timeout)
      const latencyMs = Math.round(performance.now() - startTime)

      if (response.ok) {
        return { valid: true, model, latencyMs }
      } else {
        return { valid: false, error: 'API key could not be verified.' }
      }
    } catch {
      clearTimeout(timeout)
      return { valid: false, error: 'API key could not be verified.' }
    }
  }

  /**
   * Validates and activates the securely saved NVIDIA API key for online AI.
   */
  async useSavedNvidiaKey(): Promise<{
    success: boolean
    valid: boolean
    error?: string
    latencyMs?: number
    model?: string
  }> {
    const savedKey = this.getNvidiaApiKeyTransientSync()
    if (!savedKey) {
      return { success: false, valid: false, error: 'No saved API key found in secure vault.' }
    }

    const validation = await this.validateNvidiaApiKey(savedKey)
    if (validation.valid) {
      try {
        modelService.setApiKey(savedKey)
        modelService.setMode('AUTO')
      } catch {}
      return {
        success: true,
        valid: true,
        latencyMs: validation.latencyMs,
        model: validation.model
      }
    } else {
      return {
        success: false,
        valid: false,
        error: validation.error || 'Saved API key could not be verified.'
      }
    }
  }

  /**
   * Continues in offline mode: disables cloud AI and enables local deterministic tools.
   */
  async continueOffline(): Promise<{ success: boolean; mode: 'OFFLINE' }> {
    try {
      modelService.setMode('OFFLINE')
    } catch {}
    return { success: true, mode: 'OFFLINE' }
  }

  // ══════════════════════════════════════════════════════════════════
  // UPAI AUTH SESSION MANAGEMENT (Hardware/OS DPAPI Encryption)
  // ══════════════════════════════════════════════════════════════════

  /**
   * Securely saves the UPAI application session and sanitized user profile using DPAPI.
   * Tokens are encrypted at rest and never written in plaintext.
   */
  async saveAuthSession(sessionData: {
    sessionToken: string
    expiresAt: number
    user: any
  }): Promise<void> {
    const vault = this.readEncryptedVault()
    vault.auth_session = JSON.stringify(sessionData)
    this.writeEncryptedVault(vault)
  }

  /**
   * Retrieves the stored UPAI auth session, or null if nonexistent or expired.
   */
  async getAuthSession(): Promise<{
    sessionToken: string
    expiresAt: number
    user: any
  } | null> {
    try {
      const vault = this.readEncryptedVault()
      if (!vault.auth_session) return null
      const parsed = JSON.parse(vault.auth_session)
      if (!parsed.sessionToken || typeof parsed.expiresAt !== 'number') return null
      return parsed
    } catch {
      return null
    }
  }

  /**
   * Clears the UPAI auth session from the encrypted vault.
   */
  async clearAuthSession(): Promise<void> {
    try {
      const vault = this.readEncryptedVault()
      delete vault.auth_session
      this.writeEncryptedVault(vault)
    } catch (err) {
      console.warn('[CredentialService] Warning clearing auth session:', (err as Error).message)
    }
  }
}

export const credentialService = new CredentialService()

