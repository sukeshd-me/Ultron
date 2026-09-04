import { create } from 'zustand'
import { UltronSettings } from '../../shared/types'

interface SettingsState {
  settings: UltronSettings
  isLoaded: boolean
  updateSettings: (partial: Partial<UltronSettings>) => void
  loadSettings: () => Promise<void>
}

const defaultSettings: UltronSettings = {
  ai: {
    model: 'meta/llama-3.2-11b-vision-instruct',
    endpoint: 'https://integrate.api.nvidia.com/v1',
    temperature: 0.6,
    maxTokens: 4096,
    systemPrompt: ''
  },
  voice: {
    enabled: false,
    pushToTalk: true,
    wakeWord: false,
    inputDevice: 'default'
  },
  tts: {
    enabled: true,
    voice: 'default',
    speed: 1.0,
    volume: 0.8,
    outputDevice: 'default'
  },
  appearance: {
    theme: 'midnight',
    orbIntensity: 1.0,
    reducedMotion: false,
    fontSize: 14
  },
  security: {
    confirmationPolicy: 'medium-and-above',
    trustedContacts: ['Sukesh']
  },
  adb: {
    executablePath: 'E:\\ULTRON\\Tools\\ADB\\adb.exe',
    autoConnect: true,
    wifiDebugging: true
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaultSettings,
  isLoaded: false,
  updateSettings: (partial) => {
    set((state) => ({ settings: { ...state.settings, ...partial } }))
    if ((window as any).ultron?.settings) {
      (window as any).ultron.settings.set(get().settings)
    }
  },
  loadSettings: async () => {
    if ((window as any).ultron?.settings) {
      try {
        const loaded = await (window as any).ultron.settings.get()
        if (loaded) {
          set({ settings: loaded, isLoaded: true })
        }
      } catch (err) {
        console.error('Failed to load settings from electron IPC:', err)
      }
    }
  }
}))