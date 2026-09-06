import { ipcMain } from 'electron'
import type { UltronSettings } from '../../shared/types'
import { modelService } from '../services/model.service'
import { MODEL_REGISTRY, getModelsByTier, ModelTier } from '../../shared/models.registry'
import { modelRouter } from '../services/router.service'

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
    enabled: false,
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
    trustedContacts: []
  },
  adb: {
    executablePath: 'E:\\ULTRON\\Tools\\ADB\\adb.exe',
    autoConnect: false,
    wifiDebugging: false
  }
}

let currentSettings = { ...defaultSettings }

export function registerSettingsIPC(): void {
  ipcMain.handle('settings:get', async () => {
    return {
      ...currentSettings,
      ai: {
        ...currentSettings.ai,
        model: modelService.getModel(),
        endpoint: modelService.getEndpoint(),
        isConfigured: modelService.isConfigured()
      }
    }
  })

  ipcMain.handle('settings:set', async (_event, updates: Partial<UltronSettings>) => {
    currentSettings = {
      ...currentSettings,
      ...updates,
      ai: {
        ...currentSettings.ai,
        ...(updates.ai || {})
      }
    }

    if (updates.ai?.model) {
      modelService.setModel(updates.ai.model)
    }
    if (updates.ai?.endpoint) {
      modelService.setEndpoint(updates.ai.endpoint)
    }

    return currentSettings
  })

  ipcMain.handle('models:getAll', async () => {
    return MODEL_REGISTRY
  })

  ipcMain.handle('models:getByTier', async (_event, tier: ModelTier) => {
    return getModelsByTier(tier)
  })

  ipcMain.handle('models:getConnectionStatus', async () => {
    return modelService.getConnectionStatus()
  })

  ipcMain.handle('models:testConnection', async () => {
    return modelService.getConnectionStatus()
  })

  ipcMain.handle('router:getTelemetry', async () => {
    return modelRouter.getRecentTelemetry()
  })
}