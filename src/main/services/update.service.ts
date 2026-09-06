// src/main/services/update.service.ts — Official GitHub Update Manager for ULTRON V1.0.8
import * as https from 'https'
import { UpdateCheckResult } from '../../shared/types'
import { workspaceBackupService } from './workspace-backup.service'

const OFFICIAL_REPO = 'upai-technologies/ultron'
const CURRENT_VERSION = '1.0.8'

export class UpdateService {
  private cachedCheck: UpdateCheckResult | null = null

  /**
   * Read installed application version
   */
  getCurrentVersion(): string {
    return CURRENT_VERSION
  }

  /**
   * Check official GitHub release endpoint for available updates
   * Strictly restricts queries to the configured official repository
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    const url = `https://api.github.com/repos/${OFFICIAL_REPO}/releases/latest`

    return new Promise((resolve) => {
      const req = https.get(
        url,
        {
          headers: {
            'User-Agent': `ULTRON-Desktop-Agent/${CURRENT_VERSION}`,
            Accept: 'application/vnd.github.v3+json'
          },
          timeout: 8000
        },
        (res) => {
          let data = ''
          res.on('data', chunk => (data += chunk))
          res.on('end', () => {
            try {
              if (res.statusCode === 200) {
                const release = JSON.parse(data)
                const tag = release.tag_name ? release.tag_name.replace(/^v/i, '') : CURRENT_VERSION
                const hasUpdate = this.compareSemver(tag, CURRENT_VERSION) > 0

                let downloadUrl: string | undefined
                let updateSizeBytes: number | undefined

                if (release.assets && Array.isArray(release.assets)) {
                  const exeAsset = release.assets.find((a: any) => a.name.endsWith('.exe'))
                  if (exeAsset) {
                    downloadUrl = exeAsset.browser_download_url
                    updateSizeBytes = exeAsset.size
                  }
                }

                const result: UpdateCheckResult = {
                  currentVersion: CURRENT_VERSION,
                  latestVersion: tag,
                  hasUpdate,
                  releaseDate: release.published_at,
                  releaseNotes: release.body || 'No release notes provided for this version.',
                  downloadUrl,
                  updateSizeBytes,
                  checkedAt: Date.now(),
                  officialRepo: OFFICIAL_REPO
                }

                this.cachedCheck = result
                resolve(result)
              } else {
                // If repository release endpoint is not published yet or private, return clean up-to-date result
                const fallback: UpdateCheckResult = {
                  currentVersion: CURRENT_VERSION,
                  latestVersion: CURRENT_VERSION,
                  hasUpdate: false,
                  releaseNotes: `Currently running official ULTRON v${CURRENT_VERSION} (Up to date).`,
                  checkedAt: Date.now(),
                  officialRepo: OFFICIAL_REPO
                }
                resolve(fallback)
              }
            } catch (err) {
              resolve({
                currentVersion: CURRENT_VERSION,
                latestVersion: CURRENT_VERSION,
                hasUpdate: false,
                releaseNotes: `Update check error: ${err}`,
                checkedAt: Date.now(),
                officialRepo: OFFICIAL_REPO
              })
            }
          })
        }
      )

      req.on('error', (err) => {
        // Network unavailable or offline mode
        resolve({
          currentVersion: CURRENT_VERSION,
          latestVersion: CURRENT_VERSION,
          hasUpdate: false,
          releaseNotes: `Operating offline or unable to reach GitHub release authority (${err.message}). Current version v${CURRENT_VERSION} is operational.`,
          checkedAt: Date.now(),
          officialRepo: OFFICIAL_REPO
        })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({
          currentVersion: CURRENT_VERSION,
          latestVersion: CURRENT_VERSION,
          hasUpdate: false,
          releaseNotes: 'Update check timed out. Maintaining current v1.0.8 runtime.',
          checkedAt: Date.now(),
          officialRepo: OFFICIAL_REPO
        })
      })
    })
  }

  /**
   * Compare two semver strings: a > b => 1, a < b => -1, a === b => 0
   */
  private compareSemver(a: string, b: string): number {
    const pa = a.split('.').map(n => parseInt(n, 10) || 0)
    const pb = b.split('.').map(n => parseInt(n, 10) || 0)
    for (let i = 0; i < 3; i++) {
      const na = pa[i] || 0
      const nb = pb[i] || 0
      if (na > nb) return 1
      if (na < nb) return -1
    }
    return 0
  }

  /**
   * Prepares application backup before an update process begins
   */
  async prepareUpdateBackup(): Promise<{ success: boolean; backupId: string; message: string }> {
    const backup = workspaceBackupService.createBackup(`Pre-Update Configuration Snapshot (v${CURRENT_VERSION})`)
    return {
      success: true,
      backupId: backup.id,
      message: `Safely preserved local configuration and memories under backup ID: ${backup.id}.`
    }
  }
}

export const updateService = new UpdateService()
