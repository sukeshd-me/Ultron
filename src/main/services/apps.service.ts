// src/main/services/apps.service.ts — Universal Application Adapter & Secure Process Launcher
import { spawn, execFile } from 'child_process'

import path from 'path'
import fs from 'fs'

const APP_MAPPINGS: Record<string, { cmd: string; args?: string[] }> = {
  vscode: { cmd: 'code' },
  'vs code': { cmd: 'code' },
  'visual studio code': { cmd: 'code' },
  notepad: { cmd: 'notepad.exe' },
  explorer: { cmd: 'explorer.exe' },
  'file explorer': { cmd: 'explorer.exe' },
  chrome: { cmd: 'chrome.exe' },
  'google chrome': { cmd: 'chrome.exe' },
  edge: { cmd: 'msedge.exe' },
  'microsoft edge': { cmd: 'msedge.exe' },
  powershell: { cmd: 'powershell.exe' },
  terminal: { cmd: 'wt.exe' },
  'windows terminal': { cmd: 'wt.exe' },
  cmd: { cmd: 'cmd.exe' },
  calculator: { cmd: 'calc.exe' },
  calc: { cmd: 'calc.exe' },
  'task manager': { cmd: 'taskmgr.exe' },
  taskmgr: { cmd: 'taskmgr.exe' },
  paint: { cmd: 'mspaint.exe' },
  mspaint: { cmd: 'mspaint.exe' },
  spotify: { cmd: 'spotify.exe' },
  discord: { cmd: 'discord.exe' },
  word: { cmd: 'winword.exe' },
  excel: { cmd: 'excel.exe' },
  powerpoint: { cmd: 'powerpnt.exe' },
  vlc: { cmd: 'vlc.exe' },
  steam: { cmd: 'steam.exe' },
  'control panel': { cmd: 'control.exe' },
  settings: { cmd: 'ms-settings:' },
  'windows settings': { cmd: 'ms-settings:' },
  'device manager': { cmd: 'devmgmt.msc' },
  devmgmt: { cmd: 'devmgmt.msc' },
  youtube: { cmd: 'https://www.youtube.com' },
  google: { cmd: 'https://www.google.com' },
  github: { cmd: 'https://www.github.com' },
  twitter: { cmd: 'https://twitter.com' },
  x: { cmd: 'https://x.com' },
  reddit: { cmd: 'https://www.reddit.com' }
}

function resolveExecutable(cmd: string): string {
  if (path.isAbsolute(cmd) && fs.existsSync(cmd)) return cmd
  const appMap: Record<string, string[]> = {
    'chrome.exe': [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
    ],
    'chrome': [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
    ],
    'msedge.exe': [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ],
    'msedge': [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ],
    'spotify.exe': [
      path.join(process.env.APPDATA || '', 'Spotify\\Spotify.exe')
    ],
    'spotify': [
      path.join(process.env.APPDATA || '', 'Spotify\\Spotify.exe')
    ]
  }
  const candidates = appMap[cmd.toLowerCase()]
  if (candidates) {
    for (const p of candidates) {
      if (fs.existsSync(p)) return p
    }
  }
  return cmd
}

export class AppsService {
  async launch(
    appName: string,
    args: string[] = []
  ): Promise<{ success: boolean; app: string; pid?: number; duration_ms: number }> {
    const startMs = performance.now()
    const cleanName = appName.replace(/["']/g, '').trim()
    const key = cleanName.toLowerCase()
    const appConfig = APP_MAPPINGS[key] || { cmd: cleanName }

    // 1. If it's a URI scheme like ms-settings:, a web URL, or a .msc management console, launch via execFile cmd /c start without shell
    if (
      appConfig.cmd.startsWith('ms-settings:') ||
      cleanName.startsWith('ms-settings:') ||
      appConfig.cmd.startsWith('http://') ||
      appConfig.cmd.startsWith('https://') ||
      appConfig.cmd.endsWith('.msc')
    ) {
      const targetUri = (appConfig.cmd.startsWith('ms-settings:') || appConfig.cmd.startsWith('http')) ? appConfig.cmd : cleanName
      return new Promise((resolve, reject) => {
        execFile('cmd.exe', ['/c', 'start', '', targetUri], { windowsHide: true }, (err) => {
          const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
          if (err) {
            reject(new Error(`Failed to launch target '${targetUri}': ${err.message}`))
          } else {
            resolve({ success: true, app: cleanName, duration_ms })
          }
        })
      })
    }

    // 2. Primary: Direct detached process spawn with argument array (NO shell: true to prevent command injection & Node warnings)
    return new Promise((resolve, reject) => {
      let settled = false
      const targetCmd = resolveExecutable(appConfig.cmd)
      try {
        const proc = spawn(targetCmd, [...(appConfig.args || []), ...args], {
          detached: true,
          stdio: 'ignore'
        })
        proc.on('error', (err) => {
          if (settled) return
          settled = true
          execFile('cmd.exe', ['/c', 'start', '', appConfig.cmd, ...args], { windowsHide: true }, (cmdErr) => {
            const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
            if (!cmdErr) {
              resolve({ success: true, app: cleanName, duration_ms })
            } else {
              reject(new Error(`Failed to launch app '${cleanName}' (${duration_ms}ms): ${cmdErr.message || err.message}`))
            }
          })
        })
        proc.unref()
        setTimeout(() => {
          if (!settled) {
            settled = true
            const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
            resolve({ success: true, app: cleanName, pid: proc.pid, duration_ms })
          }
        }, 30)
      } catch (spawnErr: any) {
        if (!settled) {
          settled = true
          execFile('cmd.exe', ['/c', 'start', '', appConfig.cmd, ...args], { windowsHide: true }, (cmdErr) => {
            const duration_ms = parseFloat((performance.now() - startMs).toFixed(2))
            if (!cmdErr) {
              resolve({ success: true, app: cleanName, duration_ms })
            } else {
              reject(new Error(`Failed to launch app '${cleanName}' (${duration_ms}ms): ${cmdErr.message || spawnErr.message}`))
            }
          })
        }
      }
    })
  }
}

export const appsService = new AppsService()