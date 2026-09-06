// src/main/services/android-agent.service.ts — Android Agent 2.0 Subsystem for ULTRON V1.0.7
import { AndroidContact, AndroidCallState, AndroidAppInfo } from '../../shared/types'
import { adbService } from './adb.service'
import { communicationService } from './communication.service'

const KNOWN_PACKAGE_MAP: Record<string, string> = {
  youtube: 'com.google.android.youtube',
  whatsapp: 'com.whatsapp',
  spotify: 'com.spotify.music',
  chrome: 'com.android.chrome',
  maps: 'com.google.android.apps.maps',
  gmail: 'com.google.android.gm',
  camera: 'com.android.camera2',
  settings: 'com.android.settings',
  phone: 'com.google.android.dialer',
  messages: 'com.google.android.apps.messaging',
  telegram: 'org.telegram.messenger',
  instagram: 'com.instagram.android',
  twitter: 'com.twitter.android',
  x: 'com.twitter.android'
}

export class AndroidAgentService {
  /**
   * Comprehensive phone status verification (battery, model, connectivity, call state)
   */
  async getPhoneStatus(): Promise<{
    connected: boolean
    state: string
    model?: string
    manufacturer?: string
    androidVersion?: string
    battery?: { level: number; charging: boolean }
    callState: 'IDLE' | 'RINGING' | 'OFFHOOK'
    message: string
  }> {
    try {
      const details = await adbService.getDeviceDetails()
      if (details.state !== 'device') {
        return {
          connected: false,
          state: details.state,
          callState: 'IDLE',
          message: 'Android device is not connected or unauthorized.'
        }
      }

      // Check active telephony state
      let callState: 'IDLE' | 'RINGING' | 'OFFHOOK' = 'IDLE'
      try {
        const teleOutput = await adbService.executeShellCommand('dumpsys telephony.registry | grep mCallState')
        if (teleOutput.includes('mCallState=2')) {
          callState = 'OFFHOOK'
        } else if (teleOutput.includes('mCallState=1')) {
          callState = 'RINGING'
        }
      } catch {}

      return {
        connected: true,
        state: 'device',
        model: details.model,
        manufacturer: details.manufacturer,
        androidVersion: details.androidVersion,
        battery: details.battery,
        callState,
        message: `${details.manufacturer} ${details.model} connected (Android ${details.androidVersion}). Battery: ${details.battery?.level ?? 'N/A'}%. Call state: ${callState}.`
      }
    } catch (err: any) {
      return {
        connected: false,
        state: 'error',
        callState: 'IDLE',
        message: `Phone status error: ${err.message}`
      }
    }
  }

  /**
   * Search contacts on Android device via content provider
   */
  async searchContacts(query: string): Promise<AndroidContact[]> {
    const status = await this.getPhoneStatus()
    if (!status.connected) {
      throw new Error('Android companion is not connected via ADB.')
    }

    try {
      const script = `content query --uri content://com.android.contacts/data/phones --projection display_name:data1`
      const out = await adbService.executeShellCommand(script)

      const contacts: AndroidContact[] = []
      const lines = out.split('\n')

      for (const line of lines) {
        // format: Row: 0 display_name=Sukesh, data1=+919876543210
        const nameMatch = line.match(/display_name=([^,]+)/)
        const phoneMatch = line.match(/data1=([^\r\n,]+)/)

        if (nameMatch && phoneMatch) {
          const name = nameMatch[1].trim()
          const phoneNumber = phoneMatch[1].trim()

          if (!query || name.toLowerCase().includes(query.toLowerCase()) || phoneNumber.includes(query)) {
            contacts.push({
              id: `contact-${contacts.length + 1}`,
              name,
              phoneNumber
            })
          }
        }
      }

      return contacts.slice(0, 20)
    } catch (err: any) {
      console.warn('[AndroidAgent] Contacts query fallback:', err)
      return []
    }
  }

  /**
   * Open an application on Android phone by name or package
   */
  async openApp(appNameOrPackage: string): Promise<{ success: boolean; message: string; packageName: string }> {
    const status = await this.getPhoneStatus()
    if (!status.connected) {
      return {
        success: false,
        packageName: '',
        message: 'Cannot launch app: Android device is not connected.'
      }
    }

    const cleanInput = appNameOrPackage.toLowerCase().trim()
    const packageName = KNOWN_PACKAGE_MAP[cleanInput] || cleanInput

    try {
      // Launch package through monkey or am start
      const out = await adbService.executeShellCommand(`monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`)
      if (out.includes('No activities found') || out.includes('** Error')) {
        return {
          success: false,
          packageName,
          message: `Package "${packageName}" was not found or has no launchable activity on the phone.`
        }
      }

      return {
        success: true,
        packageName,
        message: `Successfully opened ${appNameOrPackage} (${packageName}) on your phone.`
      }
    } catch (err: any) {
      return {
        success: false,
        packageName,
        message: `Failed to open ${appNameOrPackage}: ${err.message}`
      }
    }
  }

  /**
   * Initiate a phone call to contact or phone number
   */
  async makeCall(target: string): Promise<{ success: boolean; message: string }> {
    const status = await this.getPhoneStatus()
    if (!status.connected) {
      return { success: false, message: 'Android device is offline.' }
    }

    let phoneNumber = target
    // Check if target is a contact name
    if (!/^\+?[0-9\s\-]+$/.test(target)) {
      const contacts = await this.searchContacts(target)
      if (contacts.length > 0) {
        phoneNumber = contacts[0].phoneNumber
      } else {
        return { success: false, message: `Could not find contact "${target}" in phone contacts.` }
      }
    }

    try {
      const res = await adbService.makePhoneCall(phoneNumber)
      return {
        success: res.success,
        message: res.message
      }
    } catch (err: any) {
      return { success: false, message: `Call initiation failed: ${err.message}` }
    }
  }

  /**
   * End the current active call
   */
  async endCall(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await adbService.endCall()
      return {
        success: res.success,
        message: res.message
      }
    } catch (err: any) {
      return { success: false, message: `Failed to end call: ${err.message}` }
    }
  }
}

export const androidAgentService = new AndroidAgentService()
