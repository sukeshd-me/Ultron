# ULTRON

### Personal AI Command Center for Windows

> **AI reasoning. Windows automation. Persistent memory. Research. PowerShell. Android integration. One desktop command center.**

**ULTRON v1.0.0 — Production Release**

[![Version](https://img.shields.io/badge/version-1.0.0-00f0ff?style=for-the-badge&logo=windows11&logoColor=white)](https://github.com/sukeshd-me/Ultron/releases/tag/v1.0.0)
[![Platform](https://img.shields.io/badge/platform-Windows%2011%20x64-0078d4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/sukeshd-me/Ultron)
[![License](https://img.shields.io/badge/license-Pending%20Owner%20Decision-yellow?style=for-the-badge)](CONTRIBUTING.md#license-information)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-35.1-47848f?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.175-black?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-node:sqlite-003b57?style=for-the-badge&logo=sqlite&logoColor=white)](https://nodejs.org/api/sqlite.html)

<p align="center">
  <img src="assets/ultron_social_preview.jpg" alt="ULTRON Personal AI Command Center" width="100%" />
</p>

---

## What is ULTRON?

**ULTRON** is an open-source Windows Personal AI Command Center designed to unify large language model reasoning, local computer automation, persistent memory, PowerShell execution, web research, Android device integration, and a reactive desktop interface into a single, cohesive desktop system.

Unlike browser-based AI chatbots that are isolated from your workstation, ULTRON runs natively on Windows 11. It understands natural language requests, plans safe tool executions, interacts with the Windows operating system via a typed tool registry, remembers your context across sessions in an embedded SQLite database, and presents operating system feedback through a futuristic 3D HUD interface.

```
+-----------------------------------------------------------------------------------+
|                                 USER REQUEST                                      |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        CENTRALIZED MASTER AGENT LOOP                              |
|                                                                                   |
|  [ System Prompt ]  -->  [ Context & SQLite Memory ]  -->  [ Intent Normalizer ]  |
|                                                                    |              |
|                                                                    v              |
|  [ OS Verification ] <-- [ Typed Tool Execution ] <-- [ Security Validation ]     |
|           |                                                                       |
|           v                                                                       |
|  [ Memory Log & Telemetry ]  ------------------------>  [ Natural Response + HUD ]|
+-----------------------------------------------------------------------------------+
```

---

## Key Features

### 1. Multi-Tier AI Reasoning Architecture
- **NVIDIA Cloud AI Integration**: Native support for high-throughput cloud inference models including `nvidia/nemotron-3.5-lightning-30b-a3b` via the NVIDIA API Foundation.
- **Three Operational Modes**:
  - **`AUTO` Mode**: Seamlessly leverages cloud reasoning when online and falls back to deterministic local execution when disconnected.
  - **`ONLINE` Mode**: Prioritizes cloud LLM planning with full contextual reasoning.
  - **`OFFLINE` Mode**: 100% operational local execution with zero cloud API keys, zero internet egress, and zero external dependencies.
- **Sub-50ms Fast-Track Routing**: Common OS diagnostics (CPU, RAM, Disks, Wi-Fi status, time, application launching) bypass LLM network round-trips for instant local execution.

### 2. Typed Windows Tool Registry (28 Verified Tools)
ULTRON does **not** allow arbitrary LLM-generated shell script execution. Every operating system interaction is constrained to a typed, validated schema:
- **System Diagnostics**: `system.getTime`, `system.getDate`, `system.getCpu`, `system.getMemory`, `system.getDisk`, `system.getProcesses`.
- **Application Control**: `apps.open` (Calculator, Notepad, Google Chrome, Windows Terminal, Settings, Explorer, VS Code, and custom applications).
- **Filesystem Automation**: `filesystem.list`, `filesystem.search`, `filesystem.createFile`, `filesystem.createDirectory`, `filesystem.read`, `filesystem.copy`, `filesystem.move`, `filesystem.rename`, `filesystem.delete`.
- **Network & Wi-Fi**: `network.getStatus`, `network.getWifiStatus`, `network.enableWifi`, `network.disableWifi`, `network.getAdapters`, `network.getIp`, `network.getDns`, `network.getAvailableNetworks`.
- **Cybersecurity Posture**: `security.getFirewallStatus`, `security.getDefenderStatus`, `security.getListeningPorts`.
- **Windows 11 Settings**: `settings.open` (Deep-links to native Windows Settings pages such as Display, Sound, Apps, Windows Update, Bluetooth).

### 3. Persistent SQLite Memory Engine
- Embedded, zero-latency database powered by `node:sqlite` located in `data/ultron_memory.sqlite`.
- Stores conversation history, explicit user facts (`memory.store`, `memory.search`, `memory.delete`), task execution logs, and configuration state.
- Interactive **Memory Inspector** UI tab allows viewing, searching, and deleting saved memories in real time.

### 4. Android Hardware Control via ADB
- Connects directly to Android devices over authorized USB debugging or Wi-Fi using the Android Debug Bridge (ADB).
- Operates independently of Windows Phone Link or Bluetooth pairings.
- Queries real-time hardware status: Device model (e.g. `vivo V2355`), Android OS version (`Android 16`), battery charge percentage, and charging state.
- Supports phone operations (`adb.makeCall`, `adb.sendMessage`) via legitimate Android intents.

### 5. Explicit Web Research & Media Launcher
- **Web Search**: Launches targeted queries in your default browser and extracts verified information without background scraping.
- **YouTube Research**: Deep-links research topics and queries directly into video platforms.

### 6. Reactive 3D Core & Cyberpunk HUD
- Built with **Three.js** and **React-Three-Fiber**.
- Dynamic procedural particle core that reacts visually to agent states:
  - Cyan / Blue: Idle & ready
  - Pulsing Gold / Amber: Processing & planning
  - Emerald Green: Successful tool execution & verified OS mutation
  - Crimson Red: Security block or error state
- Real-time telemetry displaying understanding, planning, execution, verification, and total end-to-end latencies down to the millisecond.

---

## What Can ULTRON Do?

Every capability listed below is backed by a verified, implemented tool in the codebase:

| What you say to ULTRON | What ULTRON actually does on Windows 11 |
|---|---|
| *"Open Chrome"* | Resolves browser executable and launches Google Chrome via `apps.open`. |
| *"Find files related to my project"* | Executes scoped filesystem traversal via `filesystem.search` and returns matching paths. |
| *"Show my system status"* | Queries real CPU load, RAM utilization, and free disk space via `system.getCpu`, `system.getMemory`, `system.getDisk`. |
| *"Check Wi-Fi status"* | Reads native Wi-Fi adapter state, connected SSID, signal quality, and radio power via `network.getWifiStatus`. |
| *"Research this topic"* | Opens verified web research queries in your browser via `research.search`. |
| *"Connect to my Android device"* | Detects ADB-connected phone, queries battery level, Android version, and hardware identity via `adb.getDevices`. |
| *"Remember that my server IP is 192.168.1.100"* | Persists structured key-value memory entry into SQLite via `memory.store`. |
| *"What is my server IP?"* | Recalls stored memory records via `memory.search` and reports the answer. |
| *"Check firewall status"* | Verifies Windows Defender Firewall profiles (Domain, Private, Public) via `security.getFirewallStatus`. |
| *"Open display settings"* | Triggers `ms-settings:display` URI to immediately open the Windows 11 Display settings page. |
| *"Continue working offline"* | Fully routes queries through the local deterministic engine when internet or cloud APIs are unavailable. |

---

## Online vs. Offline Capabilities

ULTRON was engineered from day one with an **offline-first hybrid architecture**. You are never locked out of your computer if your internet goes down:

| Capability | ONLINE Mode | OFFLINE Mode |
|---|:---:|:---:|
| Windows local OS control | **YES** | **YES** |
| Local filesystem tools | **YES** | **YES** |
| Persistent SQLite memory | **YES** | **YES** |
| Safe PowerShell tools | **YES** | **YES** |
| Local system diagnostics (CPU/RAM/Disk) | **YES** | **YES** |
| Application launching | **YES** | **YES** |
| Windows Settings deep links | **YES** | **YES** |
| Deterministic local fast-track routing | **YES** | **YES** |
| Android ADB hardware control | **YES** | **YES\*** |
| NVIDIA Cloud AI (Nemotron 30B reasoning) | **YES** | **NO** |
| Live web research & search | **YES** | **NO** |

*\* Android ADB operations require a physical USB connection or local network pairing to your device.*

---

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 11 64-bit (Build 22000+) or Windows 10 64-bit (Build 19041+)
- **Processor**: Dual-core x64 CPU @ 2.0 GHz or higher
- **Memory**: 8 GB RAM
- **Storage**: 2 GB available disk space (for application and runtime dependencies)
- **Display**: 1280 x 720 resolution
- **Shell**: Windows PowerShell 5.1 (standard in Windows 11)

### Recommended Specifications
- **Operating System**: Windows 11 64-bit (Latest updates)
- **Processor**: Quad-core x64 CPU (Intel Core i5 / AMD Ryzen 5 or better)
- **Memory**: 16 GB RAM
- **Storage**: 5 GB+ available SSD storage
- **Display**: 1920 x 1080 (Full HD) or higher
- **Network**: Stable broadband internet connection (for NVIDIA Cloud AI & web research)
- **Mobile (Optional)**: Android device with USB Debugging enabled and ADB on PATH

> **Note on GPUs**: A dedicated NVIDIA GPU is **not required** to use ULTRON. Cloud AI reasoning is computed via NVIDIA's cloud inference infrastructure. A dedicated GPU will, however, provide enhanced 60 FPS rendering for the 3D particle HUD.

---

## Quick Start Installation

1. **Download the Installer**:  
   Download the official production installer from the [Releases Page](https://github.com/sukeshd-me/Ultron/releases/tag/v1.0.0):
   ```
   dist/ultron-setup-1.0.0.exe
   ```
2. **Run the Setup Wizard**:  
   Double-click `ultron-setup-1.0.0.exe` and follow the standard Windows installation steps.
3. **Launch ULTRON**:  
   Open ULTRON from your Desktop or Start Menu.
4. **Configure Settings (Optional)**:  
   - Click the gear icon in the sidebar to open **Settings**.
   - If you wish to enable cloud reasoning, enter your free [NVIDIA AI Foundation Key](https://build.nvidia.com) and click **Test API Server**.
   - If you wish to use Android tools, confirm your ADB executable path.
5. **Start Commanding**:  
   Type any request into the chat bar or explore the quick-action buttons.

For a detailed step-by-step guide with screenshots and troubleshooting, read the [Installation Guide](INSTALLATION.md).

---

## Agent Execution Lifecycle

ULTRON operates under a strict, verifiable agent lifecycle ensuring every action is accounted for:

```
[1. User Prompt]
       │
       ▼
[2. Context Assembly] ──► Query active conversation history & SQLite memories
       │
       ▼
[3. Intent Normalization] ──► Classify intent: SYSTEM, APPS, FILESYSTEM, NETWORK, SECURITY, RESEARCH, ADB
       │
       ▼
[4. Safety Policy Validation] ──► Check path boundaries, forbidden syntax, admin privileges
       │
       ▼
[5. Typed Tool Invocation] ──► Dispatch to deterministic TypeScript tool handler
       │
       ▼
[6. OS Verification] ──► Check exit code, process existence, or filesystem mutation
       │
       ▼
[7. Memory Update & Telemetry] ──► Persist audit record to SQLite & measure latency (ms)
       │
       ▼
[8. Natural Response + HUD Update] ──► Stream explanation to user & animate 3D core
```

---

## Documentation Directory

Explore the detailed technical documentation:

| Document | Description |
|---|---|
| [**What is ULTRON?**](docs/WHAT_IS_ULTRON.md) | The philosophy, problem statement, architecture, and future vision. |
| [**User Guide**](docs/USER_GUIDE.md) | Complete manual covering all 28 tools, UI panels, modes, and commands. |
| [**Developer Guide**](docs/DEVELOPER_GUIDE.md) | Electron architecture, IPC channels, building tools, and testing. |
| [**Installation Guide**](INSTALLATION.md) | First-time setup, portable mode, configuration, and uninstallation. |
| [**Security Architecture**](SECURITY.md) | Threat modeling, safe process execution, and vulnerability reporting. |
| [**Contributing Guide**](CONTRIBUTING.md) | How to build from source, write tests, and submit pull requests. |
| [**Changelog**](CHANGELOG.md) | Release history, verified capabilities, and binary checksums. |
| [**Social Launch Kit**](docs/SOCIAL_LAUNCH.md) | Templates for sharing ULTRON across developer communities. |

---

## Running from Source (Developers)

```powershell
# 1. Clone the repository
git clone https://github.com/sukeshd-me/Ultron.git
cd Ultron

# 2. Install dependencies
npm install

# 3. Verify TypeScript types
npx tsc --noEmit

# 4. Launch in development mode with Hot Reload
npm run dev

# 5. Build production bundle and Windows installer
npm run build
npm run build:win
```

Headless CLI mode:
```powershell
node cli.js
```

---

## ⭐ Support ULTRON

If ULTRON is useful to you, helps automate your workflow, or inspires your personal AI projects:

- ⭐ **Star the repository** to boost discoverability.
- 🍴 **Fork it** and build custom Windows tools.
- 🐛 **Report bugs** and edge cases in the Issues tab.
- 💡 **Suggest new capabilities** in Discussions.
- 🔧 **Submit Pull Requests** to expand the typed tool registry.
- 📢 **Share ULTRON** with developers and automation enthusiasts.

*The road to 100K stars starts with one star.*

---

## License & Ownership

ULTRON is created by [Sukesh D](https://github.com/sukeshd-me). Please refer to [CONTRIBUTING.md](CONTRIBUTING.md#license-information) regarding open-source licensing status and project terms.
