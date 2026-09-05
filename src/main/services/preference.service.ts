// src/main/services/preference.service.ts — User Preference Engine for ULTRON V1.0.5
import { memoryDatabase } from '../database/memory.db'
import { UserPreference } from '../../shared/types'

export class PreferenceService {
  set(key: string, value: any, category = 'general'): boolean {
    return memoryDatabase.setPreference(key, value, category)
  }

  get(key: string): any {
    return memoryDatabase.getPreference(key)
  }

  getAll(): UserPreference[] {
    return memoryDatabase.getAllPreferences()
  }

  delete(key: string): boolean {
    return memoryDatabase.deletePreference(key)
  }

  reset(): boolean {
    return memoryDatabase.resetPreferences()
  }
}

export const preferenceService = new PreferenceService()
