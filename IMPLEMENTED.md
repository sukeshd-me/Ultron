# ULTRON — PRODUCTION RELEASE CAPABILITY INVENTORY

**System Version**: 1.0.1 (Official Production Release)  
**Developer**: UPAI Technologies (Founder: Sukesh D.)  
**Primary Control Layer**: Centralized Typed Tool Registry & Controlled PowerShell Engine  
**Model Layer**: Multi-Tier Provider Abstraction (`CloudModelProvider`, `LocalModelProvider`, `OfflineCapabilityRouter`)  
**Storage Subsystem**: Embedded SQLite Engine (`node:sqlite` DatabaseSync) & Windows DPAPI Hardware Vault  
**Platform**: Windows 11 / Electron 35 / Node.js v24.19.0 / React 19 / TypeScript 5.8  

---

## 1. Unified Agent Loop Architecture

ULTRON operates as an authentic personal AI computer agent governed by a master system prompt and a verifiable execution loop:

```
USER
 ↓
ULTRON MASTER SYSTEM PROMPT (src/shared/prompts/ultron.system.ts)
 ↓
CONTEXT & SELECTIVE MEMORY (SQLite Engine)
 ↓
INTENT UNDERSTANDING & NORMALIZATION
 ↓
PLANNING & DECOMPOSITION (Cloud AI / Local Model / Offline Router)
 ↓
STRUCTURED TOOL CALL ({ tool, arguments })
 ↓
PERMISSION & CODE-LEVEL SAFETY CHECK
 ↓
TRUSTED EXECUTION (ToolsRegistry, parallel execution for independent tasks)
 ↓
VERIFY REAL OS RESULT
 ↓
MEMORY UPDATE
 ↓
NATURAL-LANGUAGE RESPONSE + MILLISECOND TELEMETRY
```

### Key Architectural Pillars:
- **Zero Arbitrary Shell Injections**: The LLM is never allowed to generate raw shell strings for blind execution. All actions map to structured, typed tool calls validated by in-code schemas and executed by trusted handlers.
- **Centralized Typed Tool Registry**: All 24 tools are registered with schemas, risk levels, parameter validation, timeout boundaries, and error handlers.
- **Offline-First Resilience**: Automatic fallback across `AUTO`, `ONLINE`, and `OFFLINE` modes. ULTRON remains fully functional for Windows PC control without an internet connection or cloud API keys.
- **Fast-Track Hybrid Routing**: Pure local Windows queries (time, date, CPU, RAM, disk, apps, Wi-Fi status, IP) execute directly through local tools in under 50ms without unnecessary cloud round trips.
- **100% Electron & CLI Parity**: Both interfaces call the exact same `AgentService`, `ToolsRegistry`, `ModelService`, and `MemoryService`.
- **Dynamic UI Model Status**: Displays real-time state (`● ONLINE — NVIDIA`, `● ONLINE — Local Model`, `● OFFLINE — Local Tools`, etc.) in both the title bar and quick bar.
- **High-Resolution Millisecond Telemetry**: Real-time breakdown (`understandingMs`, `planningMs`, `memoryMs`, `toolExecutionMs`, `verificationMs`, `responseMs`, `totalMs`) measured via `performance.now()`.

---

## 2. Windows Control Modules & Command Registry

### A. Network & Wi-Fi Management
- **Wi-Fi Interface Status** (`network.wifi.status`): Queries real-time connection state, SSID, BSSID, RSSI, and signal quality percentage via `netsh wlan show interfaces`.
- **Wi-Fi Network Scanner** (`network.wifi.networks`): Scans all available 2.4 GHz and 5 GHz wireless networks with authentication standards.
- **Wi-Fi Hardware Toggle** (`network.wifi.enable` / `network.wifi.disable`): Enables or disables the wireless adapter using administrative netsh commands.
- **Wi-Fi Profile Connect/Disconnect** (`network.wifi.connect` / `network.wifi.disconnect`): Connects to configured networks or cleanly drops active associations.
- **IP Configuration** (`network.ip`): Retrieves active IPv4 addresses, subnet masks, and interface bindings via `Get-NetIPAddress`, filtering loopbacks and link-local addresses.
- **Network Adapters List** (`network.adapters`): Enumerates all physical and virtual network adapters with MAC addresses, link speeds, and operational status.
- **Listening TCP Sockets** (`security.ports`): Enumerates active TCP listening endpoints and associates them with host process IDs.

### B. System Information & Real-Time Awareness
- **Real-Time Clock** (`system.time`): Queries exact Windows system time down to milliseconds (`Get-Date -Format "hh:mm:ss tt (dddd)"`).
- **System Calendar** (`system.date`): Returns full local date formatting.
- **Processor & CPU Load** (`system.cpu`): Probes processor model, clock frequency, physical core count, logical thread count, and instantaneous load percentage via `Win32_Processor`.
- **Memory & RAM Utilization** (`system.memory`): Queries physical RAM capacity, active usage, free memory, and usage percentages via `Win32_OperatingSystem`.
- **Disk Storage Analysis** (`system.disk`): Analyzes all fixed logical drives (`Win32_LogicalDisk -Filter "DriveType=3"`), calculating free space and volume labels.
- **Process Supervision** (`system.processes`): Lists top running Windows processes sorted by CPU time and working memory footprint.
- **System Specs & Uptime** (`system.info`): Reports Windows 11 edition, build number, host computer name, and system boot timestamp.
- **Battery & Power Monitor** (`system.battery`): Probes battery charge percentage, charging status, or AC power connection.
- **GPU Display Controller** (`system.gpu`): Probes active graphics controller hardware and installed driver versions.

### C. Bluetooth & Hardware Devices
- **Bluetooth Device Inventory** (`bluetooth.devices`): Enumerates all paired and connected Bluetooth audio, HID, and transport endpoints via `Get-PnpDevice -Class Bluetooth`.
- **Bluetooth Settings Launcher** (`settings.bluetooth`): Launches `ms-settings:bluetooth`.
- **Device Manager Launcher** (`settings.devmgmt`): Launches `devmgmt.msc` for hardware inspection.

### D. Universal Application Launcher
PowerShell and non-blocking detached process spawning serve as the primary execution layer for Windows applications:
- **Supported Aliases**: VS Code, Notepad, File Explorer, Chrome, Edge, Windows Terminal, PowerShell, CMD, Calculator, Task Manager, Paint, Spotify, Discord, Word, Excel, PowerPoint, VLC, Steam, Control Panel, Windows Settings, and Device Manager.
- **Detached Execution**: Applications launch without holding open stdio handles or blocking the agent execution queue.

### E. Filesystem Engine & Safety Boundaries
- **Create**: Creates files and nested directories with UTF-8 content validation.
- **Read**: Reads file contents with size and line-count metrics.
- **Search**: Fast recursive filesystem search across directory trees (`Desktop`, `Documents`, `Downloads`, `C:\`), automatically excluding `.git`, `node_modules`, and system directories.
- **Copy**: Copies files and directories with cross-device link fallback handling.
- **Move**: Atomically moves or renames items across paths.
- **Delete**: Deletes specified files and folders.
- **System Directory Protection**: Deletion of `C:\`, `C:\Windows`, `C:\Program Files`, or user root directories is blocked by safety policy.

### F. Audio & Multimedia Control
- **Mute Toggle** (`audio.volume.mute`): Dispatches Windows media mute key via `WScript.Shell`.
- **Volume Step Up / Down** (`audio.volume.up` / `audio.volume.down`): Adjusts master audio volume in measured increments.
- **Sound Settings** (`settings.sound`): Launches `ms-settings:sound`.

### G. Windows 11 Settings Control Pages
Direct URI handlers configured:
- `settings.main`: `ms-settings:`
- `settings.network`: `ms-settings:network`
- `settings.bluetooth`: `ms-settings:bluetooth`
- `settings.display`: `ms-settings:display`
- `settings.sound`: `ms-settings:sound`
- `settings.apps`: `ms-settings:appsfeatures`
- `settings.privacy`: `ms-settings:privacy`
- `settings.update`: `ms-settings:windowsupdate`
- `settings.security`: `ms-settings:windowsdefender`
- `settings.storage`: `ms-settings:storagesense`
- `settings.personalization`: `ms-settings:personalization`
- `settings.taskmgr`: `taskmgr.exe`

---

## 3. Command Safety Tiers

| Level | Classification | Policy | Example Operations |
| :--- | :--- | :--- | :--- |
| **Level 1** | **Safe** | Automatic execution | Time/date, CPU, RAM, disk queries, file reading, file search, process listing, launching apps, opening settings pages. |
| **Level 2** | **User-Modifying** | Explicit audit & tracking | File creation, writing code, moving/copying files, enabling/disabling Wi-Fi adapter, volume changes. |
| **Level 3** | **Destructive / Elevated** | Elevated confirmation required | File deletion, system configuration modifications. |
| **DISABLED** | **Permanently Blocked** | **STRICTLY FORBIDDEN** | `system.shutdown`, `system.restart`, `system.sleep`, full disk wipe, credential theft, and deletion of protected Windows system directories. |

---

## 4. SQLite Persistent Memory Subsystem

ULTRON stores context, history, and user preferences in an embedded SQLite database (`data/ultron_memory.sqlite`):
- **WAL Mode**: Enabled for concurrent, low-latency reads and writes.
- **Categories**: `conversation`, `fact`, `preference`, `task`, `tool_execution`, `research`, and `context`.
- **Secret Redaction**: Regex-based sanitization automatically redacts API keys, bearer tokens, passwords, and private keys prior to writing.
- **Deduplication**: SHA-256 content hashing prevents duplicate entries within identical categories.
- **Memory Retrieval**: Full-text search with ranking retrieves relevant context for incoming requests.
- **UI Memory Inspector**: Full HUD dashboard for searching, inspecting, filtering by category, deleting individual entries, and clearing all memories with confirmation.

---

## 5. Millisecond Telemetry & HUD State Tracking

High-resolution timing (`performance.now()`) tracks every operation:
- `powershellStartupMs`: Process initialization latency.
- `commandExecutionMs`: Execution duration inside PowerShell.
- `parsingMs`: Data transformation and JSON conversion latency.
- `totalDurationMs`: Total end-to-end latency.

### HUD Visual State Engine
The HUD displays distinct color schemes and animated indicators for all 8 agent states:
- **LISTENING** (`#00d4ff` - Cyan Pulse)
- **THINKING** (`#c084fc` - Purple Spin)
- **PLANNING** (`#f59e0b` - Amber Sliders)
- **EXECUTING** (`#10b981` - Emerald Lightning)
- **SCANNING** (`#38bdf8` - Sky Radar)
- **SUCCESS** (`#00ff88` - Neon Check)
- **ERROR** (`#ef4444` - Crimson Alert)
- **BLOCKED** (`#f97316` - Orange Shield)

---

## 6. Verification & Test Status

- **System Capabilities Audit**: `test/system_audit.ts` — **32 / 32 PASSED (100%)**
- **Deterministic Local Intent Router Audit**: `test/run_23_tests.ts` — **23 / 23 PASSED (100%)**
- **Detailed Audit & Benchmark Report**: [ULTRON_TEST_REPORT.md](file:///c:/Users/Sukesh%20D/Desktop/ULTRON/ULTRON_TEST_REPORT.md)
- **TypeScript Typecheck**: `npx tsc -b` — **0 Errors**
- **Production Build**: `npm run build` (`electron-vite build`) — **0 Errors** (Main, Preload, and Renderer bundles fully compiled)
