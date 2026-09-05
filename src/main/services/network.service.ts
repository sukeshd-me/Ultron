// src/main/services/network.service.ts — Local Network Awareness for ULTRON V1.0.5
import * as os from 'os'
import { powershellService } from './powershell.service'
import { NetworkStatus } from '../../shared/types'

export class NetworkService {
  async getStatus(): Promise<NetworkStatus> {
    const interfaces = os.networkInterfaces()
    let activeInterface = 'Unknown'
    let localIp = '127.0.0.1'

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (!addrs) continue
      for (const a of addrs) {
        if (!a.internal && a.family === 'IPv4') {
          activeInterface = name
          localIp = a.address
          break
        }
      }
      if (activeInterface !== 'Unknown') break
    }

    // Default Gateway & DNS via PowerShell
    let gateway = '192.168.1.1'
    let dns: string[] = ['8.8.8.8', '1.1.1.1']

    try {
      const psRes = await powershellService.execute(`(Get-NetIPConfiguration | Where-Object {$_.IPv4DefaultGateway -ne $null} | Select-Object -First 1).IPv4DefaultGateway.NextHop`)
      if (psRes.success && psRes.stdout.trim()) {
        gateway = psRes.stdout.trim()
      }
    } catch {}

    const pingRes = await this.ping('8.8.8.8')

    return {
      status: pingRes.reachable ? 'ONLINE' : (localIp !== '127.0.0.1' ? 'LIMITED' : 'OFFLINE'),
      activeInterface,
      localIp,
      gateway,
      dns,
      internetReachable: pingRes.reachable,
      latencyMs: pingRes.latencyMs
    }
  }

  async ping(host = '8.8.8.8'): Promise<{ reachable: boolean; latencyMs?: number }> {
    const start = performance.now()
    try {
      const res = await powershellService.execute(`Test-Connection -TargetName ${host} -Count 1 -Quiet`)
      const latencyMs = parseFloat((performance.now() - start).toFixed(1))
      const reachable = res.stdout.toLowerCase().includes('true')
      return { reachable, latencyMs: reachable ? latencyMs : undefined }
    } catch {
      return { reachable: false }
    }
  }
}

export const networkService = new NetworkService()
