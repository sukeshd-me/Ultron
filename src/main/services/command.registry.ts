// src/main/services/command.registry.ts — Centralized Windows 11 PowerShell Command & Action Registry
import { powershellService, PowerShellResult } from './powershell.service'
import { appsService } from './apps.service'
import { filesystemService } from './filesystem.service'
import { researchService } from './research.service'

export type SafetyLevel = 'LEVEL_1_SAFE' | 'LEVEL_2_MODIFYING' | 'LEVEL_3_DESTRUCTIVE'

export interface CommandDefinition {
  id: string
  name: string
  description: string
  safetyLevel: SafetyLevel
  category: 'SYSTEM' | 'NETWORK' | 'BLUETOOTH' | 'APPS' | 'FILESYSTEM' | 'SECURITY' | 'AUDIO' | 'SETTINGS'
  timeoutMs?: number
  disabled?: boolean
  handler: (params?: any) => Promise<any>
}

class CommandRegistry {
  private commands: Map<string, CommandDefinition> = new Map()

  constructor() {
    this.registerAllCommands()
  }

  private register(cmd: CommandDefinition) {
    this.commands.set(cmd.id, cmd)
  }

  get(id: string): CommandDefinition | undefined {
    return this.commands.get(id)
  }

  getAll(): CommandDefinition[] {
    return Array.from(this.commands.values())
  }

  private registerAllCommands() {
    // ══════════════════════════════════════════════════════════════════
    // A. SYSTEM INFORMATION & REAL-TIME CLOCK
    // ══════════════════════════════════════════════════════════════════

    this.register({
      id: 'system.time',
      name: 'Current System Time',
      description: 'Query Windows real-time high-precision system clock',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SYSTEM',
      handler: async () => {
        const res = await powershellService.execute<string>(
          'Get-Date -Format "hh:mm:ss tt (dddd)"',
          { commandType: 'system.time' }
        )
        return {
          time: res.stdout,
          timestamp: Date.now(),
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'system.date',
      name: 'Current System Date',
      description: 'Query Windows system calendar date',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SYSTEM',
      handler: async () => {
        const res = await powershellService.execute<string>(
          'Get-Date -Format "dddd, MMMM dd, yyyy"',
          { commandType: 'system.date' }
        )
        return {
          date: res.stdout,
          timestamp: Date.now(),
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'system.cpu',
      name: 'CPU Performance & Cores',
      description: 'Query real-time processor name, cores, and current load percentage',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SYSTEM',
      handler: async () => {
        const script = `
          Get-CimInstance Win32_Processor | Select-Object -Property Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed, LoadPercentage | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'system.cpu' })
        const data = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : {})
        return {
          name: data.Name?.trim() || 'Windows Processor',
          cores: data.NumberOfCores || 0,
          logicalProcessors: data.NumberOfLogicalProcessors || 0,
          loadPercentage: data.LoadPercentage ?? 0,
          maxClockSpeedMhz: data.MaxClockSpeed || 0,
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'system.memory',
      name: 'RAM & Memory Utilization',
      description: 'Query physical RAM capacity, free space, and percentage in use',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SYSTEM',
      handler: async () => {
        const script = `
          Get-CimInstance Win32_OperatingSystem | Select-Object @{Name='TotalGB';Expression={[math]::Round($_.TotalVisibleMemorySize/1MB,2)}}, @{Name='FreeGB';Expression={[math]::Round($_.FreePhysicalMemory/1MB,2)}}, @{Name='UsedGB';Expression={[math]::Round(($_.TotalVisibleMemorySize-$_.FreePhysicalMemory)/1MB,2)}}, @{Name='PercentUsed';Expression={[math]::Round((($_.TotalVisibleMemorySize-$_.FreePhysicalMemory)/$_.TotalVisibleMemorySize)*100,1)}} | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'system.memory' })
        const data = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : {})
        return {
          totalGB: data.TotalGB || 0,
          usedGB: data.UsedGB || 0,
          freeGB: data.FreeGB || 0,
          percentUsed: data.PercentUsed || 0,
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'system.disk',
      name: 'Disk Storage Breakdown',
      description: 'Query mounted fixed drives, capacity, and available free space',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SYSTEM',
      handler: async () => {
        const script = `
          Get-CimInstance Win32_LogicalDisk -Filter "DriveType=3" | Select-Object DeviceId, VolumeName, @{Name='SizeGB';Expression={[math]::Round($_.Size/1GB,2)}}, @{Name='FreeGB';Expression={[math]::Round($_.FreeSpace/1GB,2)}}, @{Name='PercentFree';Expression={[math]::Round(($_.FreeSpace/$_.Size)*100,1)}} | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'system.disk' })
        let disks = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : [])
        if (!Array.isArray(disks)) disks = [disks]
        return {
          disks: disks.map((d: any) => ({
            drive: d.DeviceId,
            label: d.VolumeName || 'Local Disk',
            sizeGB: d.SizeGB,
            freeGB: d.FreeGB,
            percentFree: d.PercentFree
          })),
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'system.processes',
      name: 'Active Processes',
      description: 'Query top running Windows processes sorted by CPU and working memory',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SYSTEM',
      handler: async (params?: { limit?: number }) => {
        const limit = params?.limit || 10
        const script = `
          Get-Process | Sort-Object CPU -Descending | Select-Object -First ${limit} -Property Id, ProcessName, @{Name='CPU_s';Expression={[math]::Round($_.CPU,2)}}, @{Name='MemoryMB';Expression={[math]::Round($_.WorkingSet64/1MB,1)}} | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'system.processes' })
        let procs = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : [])
        if (!Array.isArray(procs)) procs = [procs]
        return {
          processes: procs,
          count: procs.length,
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'system.info',
      name: 'Windows OS & Computer Info',
      description: 'Query Windows 11 build, edition, computer name, and architecture',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SYSTEM',
      handler: async () => {
        const script = `
          Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, BuildNumber, OSArchitecture, CSName, LastBootUpTime | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'system.info' })
        const data = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : {})
        return {
          edition: data.Caption || 'Microsoft Windows',
          version: data.Version || '',
          build: data.BuildNumber || '',
          architecture: data.OSArchitecture || '64-bit',
          computerName: data.CSName || '',
          lastBootTime: data.LastBootUpTime || '',
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'system.gpu',
      name: 'GPU Graphics Controller',
      description: 'Query primary GPU video controller and driver details',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SYSTEM',
      handler: async () => {
        const script = `
          Get-CimInstance Win32_VideoController | Select-Object Name, DriverVersion, Status | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'system.gpu' })
        let gpus = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : [])
        if (!Array.isArray(gpus)) gpus = [gpus]
        return {
          gpus,
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'system.battery',
      name: 'Battery Power Status',
      description: 'Query battery charge status and power connection where available',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SYSTEM',
      handler: async () => {
        const script = `
          Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object EstimatedChargeRemaining, BatteryStatus, EstimatedRunTime | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'system.battery' })
        const data = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : null)
        return {
          hasBattery: Boolean(data),
          chargeRemaining: data?.EstimatedChargeRemaining ?? null,
          batteryStatus: data?.BatteryStatus ?? null,
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'system.brightness.get',
      name: 'Query Screen Brightness',
      description: 'Query current Windows display brightness percentage',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SYSTEM',
      handler: async () => {
        const script = `
          $b = Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightness -ErrorAction SilentlyContinue
          if ($b) {
            @{ supported = $true; brightness = $b.CurrentBrightness } | ConvertTo-Json -Compress
          } else {
            @{ supported = $false; error = "Brightness control is unavailable on this display." } | ConvertTo-Json -Compress
          }
        `
        const res = await powershellService.execute(script, { commandType: 'system.brightness.get' })
        const data = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : {})
        if (data.supported === false || data.brightness === undefined) {
          return {
            supported: false,
            error: data.error || 'Brightness control is unavailable on this display.',
            telemetry: res.telemetry
          }
        }
        return {
          supported: true,
          brightness: data.brightness,
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'system.brightness.set',
      name: 'Set Screen Brightness',
      description: 'Set Windows display brightness percentage (0-100)',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'SYSTEM',
      handler: async (params?: { value: number }) => {
        let val = Number(params?.value)
        if (isNaN(val)) {
          throw new Error('Brightness value must be a valid number between 0 and 100.')
        }
        val = Math.max(0, Math.min(100, Math.round(val)))

        const script = `
          $target = ${val}
          $mon = Get-WmiObject -Namespace root/wmi -Class WmiMonitorBrightnessMethods -ErrorAction SilentlyContinue
          if ($mon) {
            $mon.WmiSetBrightness(1, $target)
            $curr = (Get-CimInstance -Namespace root/wmi -ClassName WmiMonitorBrightness -ErrorAction SilentlyContinue).CurrentBrightness
            @{ supported = $true; success = $true; targetBrightness = $target; currentBrightness = $curr } | ConvertTo-Json -Compress
          } else {
            @{ supported = $false; success = $false; error = "Brightness control is unavailable on this display." } | ConvertTo-Json -Compress
          }
        `
        const res = await powershellService.execute(script, { commandType: 'system.brightness.set' })
        const data = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : {})
        if (data.supported === false || data.success !== true) {
          return {
            supported: false,
            success: false,
            error: data.error || 'Brightness control is unavailable on this display.',
            telemetry: res.telemetry
          }
        }
        return {
          supported: true,
          success: true,
          targetBrightness: data.targetBrightness ?? val,
          currentBrightness: data.currentBrightness ?? val,
          telemetry: res.telemetry
        }
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // B. NETWORK & WI-FI CONTROL
    // ══════════════════════════════════════════════════════════════════

    this.register({
      id: 'network.wifi.status',
      name: 'Wi-Fi Interface Status',
      description: 'Query current Wi-Fi adapter connection, connected SSID, signal, and rate',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'NETWORK',
      handler: async () => {
        const res = await powershellService.execute('netsh wlan show interfaces', { commandType: 'network.wifi.status' })
        const text = res.stdout
        const ssidMatch = text.match(/SSID\s*:\s*(.+)/i)
        const stateMatch = text.match(/State\s*:\s*(.+)/i)
        const signalMatch = text.match(/Signal\s*:\s*(.+)/i)
        const radioMatch = text.match(/Radio type\s*:\s*(.+)/i)
        const adapterMatch = text.match(/Description\s*:\s*(.+)/i)

        return {
          connected: (stateMatch?.[1]?.trim().toLowerCase() === 'connected'),
          state: stateMatch?.[1]?.trim() || 'Unknown',
          ssid: ssidMatch?.[1]?.trim() || 'Not connected',
          signal: signalMatch?.[1]?.trim() || '0%',
          radioType: radioMatch?.[1]?.trim() || 'Unknown',
          adapter: adapterMatch?.[1]?.trim() || 'Wi-Fi Adapter',
          rawOutput: text,
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'network.wifi.networks',
      name: 'Scan Wi-Fi Networks',
      description: 'Scan and list available wireless networks (SSIDs)',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'NETWORK',
      handler: async () => {
        const res = await powershellService.execute('netsh wlan show networks', { commandType: 'network.wifi.networks' })
        const text = res.stdout
        const networks: { ssid: string; auth: string }[] = []
        const matches = text.matchAll(/SSID\s+\d+\s*:\s*(.+)\r?\n\s+Network type\s*:\s*(.+)\r?\n\s+Authentication\s*:\s*(.+)/gi)
        for (const m of matches) {
          networks.push({
            ssid: m[1].trim(),
            auth: m[3].trim()
          })
        }
        return {
          count: networks.length,
          networks,
          rawOutput: text,
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'network.wifi.enable',
      name: 'Enable Wi-Fi Adapter',
      description: 'Turn on Wi-Fi wireless networking adapter',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'NETWORK',
      handler: async () => {
        const res = await powershellService.execute('netsh interface set interface name="Wi-Fi" admin=ENABLED', {
          commandType: 'network.wifi.enable'
        })
        return {
          success: res.success,
          message: 'Wi-Fi adapter set to ENABLED',
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'network.wifi.disable',
      name: 'Disable Wi-Fi Adapter',
      description: 'Turn off Wi-Fi wireless networking adapter',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'NETWORK',
      handler: async () => {
        const res = await powershellService.execute('netsh interface set interface name="Wi-Fi" admin=DISABLED', {
          commandType: 'network.wifi.disable'
        })
        return {
          success: res.success,
          message: 'Wi-Fi adapter set to DISABLED',
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'network.wifi.disconnect',
      name: 'Disconnect Wi-Fi',
      description: 'Disconnect from the currently connected Wi-Fi network',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'NETWORK',
      handler: async () => {
        const res = await powershellService.execute('netsh wlan disconnect', {
          commandType: 'network.wifi.disconnect'
        })
        return {
          success: res.success,
          message: 'Disconnected from active Wi-Fi network',
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'network.wifi.connect',
      name: 'Connect to Wi-Fi Network',
      description: 'Connect to an authorized configured Wi-Fi profile',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'NETWORK',
      handler: async (params?: { ssid?: string }) => {
        const ssid = params?.ssid?.trim()
        if (!ssid) {
          throw new Error('SSID parameter is required to connect to Wi-Fi.')
        }
        const res = await powershellService.execute(`netsh wlan connect name="${ssid}"`, {
          commandType: 'network.wifi.connect'
        })
        return {
          success: res.success,
          message: `Dispatched connection request to '${ssid}'`,
          output: res.stdout,
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'network.ip',
      name: 'IP Configuration',
      description: 'Query active IPv4 addresses, subnet prefixes, and interface aliases',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'NETWORK',
      handler: async () => {
        const script = `
          Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch 'Loopback' -and $_.IPAddress -notlike '169.254*' } | Select-Object InterfaceAlias, IPAddress, PrefixLength | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'network.ip' })
        let ips = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : [])
        if (!Array.isArray(ips)) ips = [ips]
        return {
          interfaces: ips.map((i: any) => ({
            alias: i.InterfaceAlias,
            ip: i.IPAddress,
            prefix: i.PrefixLength
          })),
          primaryIP: ips[0]?.IPAddress || 'Unavailable',
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'network.adapters',
      name: 'Network Adapters List',
      description: 'List physical and virtual network adapters, link speeds, and MAC addresses',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'NETWORK',
      handler: async () => {
        const script = `
          Get-NetAdapter | Select-Object Name, InterfaceDescription, Status, LinkSpeed, MacAddress | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'network.adapters' })
        let adapters = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : [])
        if (!Array.isArray(adapters)) adapters = [adapters]
        return {
          count: adapters.length,
          adapters,
          telemetry: res.telemetry
        }
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // C. BLUETOOTH & DEVICE OPERATIONS
    // ══════════════════════════════════════════════════════════════════

    this.register({
      id: 'bluetooth.devices',
      name: 'Connected Bluetooth Devices',
      description: 'Query local Bluetooth radio and paired/connected device endpoints',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'BLUETOOTH',
      handler: async () => {
        const script = `
          Get-PnpDevice -Class Bluetooth | Select-Object -First 15 -Property FriendlyName, Status, InstanceId | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'bluetooth.devices' })
        let devices = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : [])
        if (!Array.isArray(devices)) devices = [devices]
        return {
          count: devices.length,
          devices: devices.map((d: any) => ({
            name: d.FriendlyName,
            status: d.Status,
            id: d.InstanceId
          })),
          telemetry: res.telemetry
        }
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // D. CYBERSECURITY (FIREWALL, DEFENDER, PORTS)
    // ══════════════════════════════════════════════════════════════════

    this.register({
      id: 'security.firewall',
      name: 'Windows Firewall Status',
      description: 'Query active state for Domain, Private, and Public firewall profiles',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SECURITY',
      handler: async () => {
        const script = `
          Get-NetFirewallProfile | Select-Object Name, Enabled | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'security.firewall' })
        let profiles = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : [])
        if (!Array.isArray(profiles)) profiles = [profiles]
        const allActive = profiles.every((p: any) => p.Enabled === 1 || p.Enabled === true)
        return {
          status: allActive ? 'ACTIVE (Domain, Private, Public)' : 'PARTIAL / DISABLED',
          profiles: profiles.map((p: any) => ({
            profile: p.Name,
            enabled: Boolean(p.Enabled)
          })),
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'security.defender',
      name: 'Windows Defender Status',
      description: 'Query antivirus, real-time protection, and antispyware security status',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SECURITY',
      handler: async () => {
        const script = `
          Get-MpComputerStatus | Select-Object AntivirusEnabled, RealTimeProtectionEnabled, AntivirusSignatureLastUpdated, AntispywareEnabled | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'security.defender' })
        const data = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : {})
        return {
          antivirusEnabled: Boolean(data.AntivirusEnabled),
          realTimeProtection: Boolean(data.RealTimeProtectionEnabled),
          antispywareEnabled: Boolean(data.AntispywareEnabled),
          lastUpdated: data.AntivirusSignatureLastUpdated || 'Current',
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'security.ports',
      name: 'Listening TCP Ports',
      description: 'Query open listening network sockets and owning process IDs',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SECURITY',
      handler: async () => {
        const script = `
          Get-NetTCPConnection -State Listen | Select-Object -Property LocalAddress, LocalPort, OwningProcess -Unique | Select-Object -First 20 | ConvertTo-Json -Compress
        `
        const res = await powershellService.execute(script, { commandType: 'security.ports' })
        let ports = res.parsedData || (res.stdout ? JSON.parse(res.stdout) : [])
        if (!Array.isArray(ports)) ports = [ports]
        return {
          count: ports.length,
          ports: ports.map((p: any) => ({
            address: p.LocalAddress,
            port: p.LocalPort,
            pid: p.OwningProcess
          })),
          telemetry: res.telemetry
        }
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // E. AUDIO & VOLUME CONTROL
    // ══════════════════════════════════════════════════════════════════

    this.register({
      id: 'audio.volume.mute',
      name: 'Toggle Audio Mute',
      description: 'Toggle system audio mute via Windows media keys',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'AUDIO',
      handler: async () => {
        const script = `
          $w = New-Object -ComObject WScript.Shell
          $w.SendKeys([char]173)
          Write-Output "Audio mute toggled"
        `
        const res = await powershellService.execute(script, { commandType: 'audio.volume.mute' })
        return {
          success: res.success,
          message: 'Audio mute key dispatched',
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'audio.volume.up',
      name: 'Increase Volume',
      description: 'Increase master audio volume',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'AUDIO',
      handler: async (params?: { steps?: number }) => {
        const count = Math.min(params?.steps || 5, 20)
        const script = `
          $w = New-Object -ComObject WScript.Shell
          1..${count} | ForEach-Object { $w.SendKeys([char]175) }
          Write-Output "Volume increased (+${count * 2}%)"
        `
        const res = await powershellService.execute(script, { commandType: 'audio.volume.up' })
        return {
          success: res.success,
          steps: count,
          message: `Volume increased by ~${count * 2}%`,
          telemetry: res.telemetry
        }
      }
    })

    this.register({
      id: 'audio.volume.down',
      name: 'Decrease Volume',
      description: 'Decrease master audio volume',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'AUDIO',
      handler: async (params?: { steps?: number }) => {
        const count = Math.min(params?.steps || 5, 20)
        const script = `
          $w = New-Object -ComObject WScript.Shell
          1..${count} | ForEach-Object { $w.SendKeys([char]174) }
          Write-Output "Volume decreased (-${count * 2}%)"
        `
        const res = await powershellService.execute(script, { commandType: 'audio.volume.down' })
        return {
          success: res.success,
          steps: count,
          message: `Volume decreased by ~${count * 2}%`,
          telemetry: res.telemetry
        }
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // F. WINDOWS 11 SETTINGS LAUNCHERS
    // ══════════════════════════════════════════════════════════════════

    const settingsPages: Record<string, { uri: string; label: string }> = {
      'settings.main': { uri: 'ms-settings:', label: 'Windows Settings' },
      'settings.network': { uri: 'ms-settings:network', label: 'Network & Internet' },
      'settings.bluetooth': { uri: 'ms-settings:bluetooth', label: 'Bluetooth & Devices' },
      'settings.display': { uri: 'ms-settings:display', label: 'Display Settings' },
      'settings.sound': { uri: 'ms-settings:sound', label: 'Sound Settings' },
      'settings.apps': { uri: 'ms-settings:appsfeatures', label: 'Apps & Features' },
      'settings.privacy': { uri: 'ms-settings:privacy', label: 'Privacy & Security' },
      'settings.update': { uri: 'ms-settings:windowsupdate', label: 'Windows Update' },
      'settings.security': { uri: 'ms-settings:windowsdefender', label: 'Windows Security' },
      'settings.storage': { uri: 'ms-settings:storagesense', label: 'Storage Sense' },
      'settings.personalization': { uri: 'ms-settings:personalization', label: 'Personalization' },
      'settings.devmgmt': { uri: 'devmgmt.msc', label: 'Device Manager' },
      'settings.taskmgr': { uri: 'taskmgr.exe', label: 'Task Manager' }
    }

    for (const [id, cfg] of Object.entries(settingsPages)) {
      this.register({
        id,
        name: `Open ${cfg.label}`,
        description: `Open Windows 11 ${cfg.label} control page`,
        safetyLevel: 'LEVEL_1_SAFE',
        category: 'SETTINGS',
        handler: async () => {
          const res = await appsService.launch(cfg.uri)
          return {
            success: res.success,
            target: cfg.label,
            uri: cfg.uri,
            duration_ms: res.duration_ms
          }
        }
      })
    }

    // ══════════════════════════════════════════════════════════════════
    // G. APPLICATIONS LAUNCHER
    // ══════════════════════════════════════════════════════════════════

    this.register({
      id: 'apps.open',
      name: 'Launch Application',
      description: 'Launch desktop application via PowerShell / Windows process runner',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'APPS',
      handler: async (params?: { app: string; args?: string[] }) => {
        if (!params?.app) throw new Error('Application name is required.')
        return appsService.launch(params.app, params.args)
      }
    })

    this.register({
      id: 'web.search',
      name: 'Search Web / Engine',
      description: 'Search Web, YouTube, Bing, or Google directly',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'SETTINGS',
      handler: async (params?: { provider?: string; query: string }) => {
        if (!params?.query) throw new Error('Search query is required.')
        return researchService.searchEngine((params?.provider || 'google') as any, params.query)
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // H. FILESYSTEM OPERATIONS
    // ══════════════════════════════════════════════════════════════════

    this.register({
      id: 'filesystem.list',
      name: 'List Directory Contents',
      description: 'List items in target directory with metadata',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'FILESYSTEM',
      handler: async (params?: { path: string }) => {
        return filesystemService.listFolder(params?.path || 'Desktop')
      }
    })

    this.register({
      id: 'filesystem.search',
      name: 'Search Files',
      description: 'Fast recursive search for files by name/extension',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'FILESYSTEM',
      handler: async (params?: { query: string; root?: string }) => {
        if (!params?.query) throw new Error('Search query is required.')
        return filesystemService.searchFiles(params.query, params.root)
      }
    })

    this.register({
      id: 'filesystem.create',
      name: 'Create File',
      description: 'Create a new file with specified content',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'FILESYSTEM',
      handler: async (params?: { path: string; content?: string }) => {
        if (!params?.path) throw new Error('Target file path is required.')
        return filesystemService.createFile(params.path, params.content || '')
      }
    })

    this.register({
      id: 'filesystem.read',
      name: 'Read File',
      description: 'Read contents of a file',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'FILESYSTEM',
      handler: async (params?: { path: string }) => {
        if (!params?.path) throw new Error('Target file path is required.')
        return filesystemService.readFile(params.path)
      }
    })

    this.register({
      id: 'filesystem.copy',
      name: 'Copy File/Folder',
      description: 'Copy item to destination location',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'FILESYSTEM',
      handler: async (params?: { source: string; destination: string }) => {
        if (!params?.source || !params?.destination) throw new Error('Source and destination paths required.')
        return filesystemService.copyItem(params.source, params.destination)
      }
    })

    this.register({
      id: 'filesystem.move',
      name: 'Move File/Folder',
      description: 'Move item to destination location',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'FILESYSTEM',
      handler: async (params?: { source: string; destination: string }) => {
        if (!params?.source || !params?.destination) throw new Error('Source and destination paths required.')
        return filesystemService.moveItem(params.source, params.destination)
      }
    })

    this.register({
      id: 'filesystem.delete',
      name: 'Delete File/Folder',
      description: 'Delete target file or folder with strict system directory protection',
      safetyLevel: 'LEVEL_3_DESTRUCTIVE',
      category: 'FILESYSTEM',
      handler: async (params?: { path: string }) => {
        if (!params?.path) throw new Error('Target path is required for deletion.')
        const resolved = filesystemService.resolveLocation(params.path).toLowerCase()
        // Prevent deletion of root or critical Windows folders
        if (
          resolved === 'c:\\' ||
          resolved === 'c:/' ||
          resolved.startsWith('c:\\windows') ||
          resolved.startsWith('c:/windows') ||
          resolved.startsWith('c:\\program files') ||
          resolved === 'c:\\users'
        ) {
          throw new Error(`CRITICAL BLOCKED: Deletion of protected system path '${params.path}' is forbidden by ULTRON safety policy.`)
        }
        return filesystemService.deleteItem(params.path)
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // ══════════════════════════════════════════════════════════════════
    // H. FILESYSTEM OPERATIONS
    // ══════════════════════════════════════════════════════════════════

    this.register({
      id: 'filesystem.create',
      name: 'Create File',
      description: 'Create a file at target location',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'FILESYSTEM',
      handler: async (params?: { path: string; content?: string }) => {
        if (!params?.path) throw new Error('Target path required')
        return filesystemService.createFile(params.path, params.content || '')
      }
    })

    this.register({
      id: 'filesystem.createFolder',
      name: 'Create Directory',
      description: 'Create directory folder structure',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'FILESYSTEM',
      handler: async (params?: { path: string }) => {
        if (!params?.path) throw new Error('Target folder path required')
        return filesystemService.createFolder(params.path)
      }
    })

    this.register({
      id: 'filesystem.read',
      name: 'Read File',
      description: 'Read file text content',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'FILESYSTEM',
      handler: async (params?: { path: string }) => {
        if (!params?.path) throw new Error('Target file path required')
        return filesystemService.readFile(params.path)
      }
    })

    this.register({
      id: 'filesystem.copy',
      name: 'Copy File or Directory',
      description: 'Copy item to destination location',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'FILESYSTEM',
      handler: async (params?: { source: string; destination: string }) => {
        if (!params?.source || !params?.destination) throw new Error('Source and destination required')
        return filesystemService.copyItem(params.source, params.destination)
      }
    })

    this.register({
      id: 'filesystem.move',
      name: 'Move File or Directory',
      description: 'Move item to destination location',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'FILESYSTEM',
      handler: async (params?: { source: string; destination: string }) => {
        if (!params?.source || !params?.destination) throw new Error('Source and destination required')
        return filesystemService.moveItem(params.source, params.destination)
      }
    })

    this.register({
      id: 'filesystem.search',
      name: 'Search Files',
      description: 'Search for files by query',
      safetyLevel: 'LEVEL_1_SAFE',
      category: 'FILESYSTEM',
      handler: async (params?: { query: string; root?: string }) => {
        if (!params?.query) throw new Error('Search query required')
        return filesystemService.searchFiles(params.query, params.root)
      }
    })

    this.register({
      id: 'filesystem.delete',
      name: 'Delete File or Folder',
      description: 'Safely delete file or directory',
      safetyLevel: 'LEVEL_2_MODIFYING',
      category: 'FILESYSTEM',
      handler: async (params?: { path: string }) => {
        if (!params?.path) throw new Error('Target path required')
        return filesystemService.deleteItem(params.path)
      }
    })

    // ══════════════════════════════════════════════════════════════════
    // I. STRICTLY DISABLED COMMANDS (REQUIREMENT 4)
    // ══════════════════════════════════════════════════════════════════

    const disabledCommands = [
      { id: 'system.shutdown', name: 'Shutdown Computer' },
      { id: 'system.restart', name: 'Restart Computer' },
      { id: 'system.sleep', name: 'Sleep Computer' },
      { id: 'system.wipe', name: 'Full Disk Wipe' }
    ]

    for (const d of disabledCommands) {
      this.register({
        id: d.id,
        name: d.name,
        description: 'Disabled by ULTRON Safety Policy',
        safetyLevel: 'LEVEL_3_DESTRUCTIVE',
        category: 'SYSTEM',
        disabled: true,
        handler: async () => {
          throw new Error(`SECURITY POLICY: Operation '${d.name}' (${d.id}) is permanently disabled on ULTRON.`)
        }
      })
    }
  }

  /**
   * Execute registered action with safety validation and telemetry
   */
  async execute(id: string, params?: any): Promise<{
    success: boolean
    commandId: string
    safetyLevel: SafetyLevel
    data?: any
    duration_ms: number
    error?: string
  }> {
    const start = performance.now()
    const cmd = this.commands.get(id)
    if (!cmd) {
      return {
        success: false,
        commandId: id,
        safetyLevel: 'LEVEL_1_SAFE',
        duration_ms: parseFloat((performance.now() - start).toFixed(2)),
        error: `Unknown command '${id}' in registry.`
      }
    }

    if (cmd.disabled) {
      return {
        success: false,
        commandId: id,
        safetyLevel: cmd.safetyLevel,
        duration_ms: parseFloat((performance.now() - start).toFixed(2)),
        error: `Operation '${cmd.name}' is disabled by ULTRON safety policy.`
      }
    }

    try {
      const data = await cmd.handler(params)
      const duration_ms = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: true,
        commandId: id,
        safetyLevel: cmd.safetyLevel,
        data,
        duration_ms
      }
    } catch (err: any) {
      const duration_ms = parseFloat((performance.now() - start).toFixed(2))
      return {
        success: false,
        commandId: id,
        safetyLevel: cmd.safetyLevel,
        duration_ms,
        error: err.message || 'Execution failure'
      }
    }
  }
}

export const commandRegistry = new CommandRegistry()
