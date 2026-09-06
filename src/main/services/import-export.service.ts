import * as fs from 'fs'
import { memoryDatabase } from '../database/memory.db'
import { ImportExportData } from '../../shared/types'

export class ImportExportService {
  exportConfiguration(targetPath: string, includePreferences = true, includeSkills = true, includeWorkspaces = true): { success: boolean; data: ImportExportData } {
    const data: ImportExportData = {
      version: '1.0.6',
      exportedAt: Date.now(),
      included: [],
      excluded: ['credentials', 'vault_keys', 'api_tokens', 'phone_pin']
    }

    if (includePreferences) {
      data.preferences = memoryDatabase.listPreferences()
      data.included.push('preferences')
    }
    if (includeSkills) {
      data.customSkills = memoryDatabase.listCustomSkills()
      data.included.push('custom_skills')
    }
    if (includeWorkspaces) {
      data.workspaces = memoryDatabase.listWorkspaces()
      data.included.push('workspaces')
    }

    if (targetPath) {
      fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8')
    }

    return { success: true, data }
  }

  importConfiguration(filePathOrData: string | ImportExportData): { success: boolean; importedCount: number; message: string } {
    let data: ImportExportData
    if (typeof filePathOrData === 'string') {
      const raw = fs.readFileSync(filePathOrData, 'utf8')
      data = JSON.parse(raw)
    } else {
      data = filePathOrData
    }

    let count = 0
    if (data.preferences && Array.isArray(data.preferences)) {
      for (const p of data.preferences) {
        memoryDatabase.setPreference(p.key, p.value, p.category)
        count++
      }
    }

    if (data.customSkills && Array.isArray(data.customSkills)) {
      for (const s of data.customSkills) {
        memoryDatabase.saveCustomSkill(s)
        count++
      }
    }

    return {
      success: true,
      importedCount: count,
      message: `Successfully imported ${count} items. Credentials remained strictly excluded.`
    }
  }
}

export const importExportService = new ImportExportService()
