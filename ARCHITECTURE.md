# ULTRON v1.0.1 — Technical Architecture Specification
*Personal AI Command Center by UPAI Technologies • Founder: Sukesh D.*

---

## 1. Architectural Overview

**ULTRON** is an enterprise-grade Personal AI Command Center engineered natively for Windows 11. It unifies high-throughput large language model reasoning, deterministic local operating system automation, persistent SQLite memory, Android ADB mobile control, and a reactive Three.js 3D interface into a unified, secure desktop application.

```
+-----------------------------------------------------------------------------------+
|                                 USER INTERFACE                                    |
|   [ React 19 + Three.js 3D Core ]  <-->  [ Context Bridge (src/preload) ]         |
+------------------------------------------+----------------------------------------+
                                           |
                                      IPC Channels
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                           ELECTRON MAIN PROCESS                                   |
|                                                                                   |
|  +---------------------+   +---------------------+   +-------------------------+  |
|  |    AgentService     |   |  CredentialService  |   |       AdbService        |  |
|  |  (Planning & LLM)   |   |   (Windows DPAPI)   |   | (Android Hardware Ctrl) |  |
|  +----------+----------+   +----------+----------+   +------------+------------+  |
|             |                         |                           |               |
|             v                         v                           v               |
|  +---------------------+   +---------------------+   +-------------------------+  |
|  | Typed Tool Registry |   |  credentials.vault  |   |       Memory Engine     |  |
|  |   (39 Safe Tools)   |   | (Hardware Isolated) |   | (SQLite + Redaction DB) |  |
|  +----------+----------+   +---------------------+   +------------+------------+  |
|             |                                                     |               |
|             v                                                     v               |
|  +---------------------+                             +-------------------------+  |
|  |  PowerShellService  |                             | data/ultron_memory.db   |  |
|  | (Non-Admin Process) |                             |  (Audit Trails & Facts) |  |
|  +---------------------+                             +-------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Subsystems

### A. Centralized Agent Loop & Fast-Track Routing
The central agent pipeline in `src/main/services/agent.service.ts` processes all user requests through an 8-stage verification pipeline:

1. **Prompt Ingestion**: Receives user natural language text or voice transcript.
2. **Context & Memory Assembly**: Queries active conversation state and pulls relevant SQLite memories.
3. **Intent Classification & Fast-Track Routing**:
   - Deterministic local commands (e.g., *"What time is it?"*, *"Show CPU"*, *"Open Calculator"*) bypass the cloud LLM network round-trip and execute locally in **<50ms**.
   - Open-ended, coding, or complex research queries are dispatched to cloud models (e.g. `nvidia/nemotron-3.5-lightning-30b-a3b`).
4. **Tool Schema Validation**: Translates intent into typed tool arguments adhering to `src/shared/tools/tool.types.ts`.
5. **Security & Boundary Check**: `SecurityService` verifies path boundaries, blocks traversal attacks, and ensures non-elevated process isolation.
6. **Execution**: Dispatches execution to standard user-level processes via `PowerShellService` or `AdbService`.
7. **Verification & Audit**: Verifies OS mutation (exit code, process status, file existence) and records execution duration in milliseconds (`duration_ms`).
8. **Memory & Telemetry Log**: Sanitizes metadata (stripping keys and PINs) and updates SQLite memory tables.

### B. Hardware-Isolated Credential Vault (Windows DPAPI)
ULTRON v1.0.1 implements zero-leakage credential protection in `src/main/services/credential.service.ts`:
- Employs Electron's native `safeStorage` API backed by **Windows DPAPI (Data Protection API)**.
- Encrypted credentials (such as the **Android Phone PIN**) are stored exclusively in `%APPDATA%/ultron/credentials.vault`.
- **Absolute Zero Leakage**:
  - The PIN is **never** written to SQLite memory, chat logs, stdout/stderr, or transmitted over network sockets.
  - SQLite only records non-secret states: `phone_credential_configured: true`.
  - Memory databases feature automatic regex sanitization via `redactSecrets()`.

### C. Android Hardware Control (ADB Service)
`src/main/services/adb.service.ts` provides native Android integration:
- Interacts with local Android devices over USB Debugging or Wi-Fi via `adb.exe`.
- **Telemetry**: Queries real-time device identity (e.g. `vivo V2355`), Android OS version, battery percentage, and charging state.
- **Screen Wake**: Dispatches Android keyevent `224` (`KEYCODE_WAKEUP`).
- **Secure Unlock**: Automatically wakes screen, executes menu dismiss (`KEYCODE_MENU` / keyevent `82`), enters the DPAPI-retrieved PIN, and submits (`KEYCODE_ENTER` / keyevent `66`).

### D. Typed Windows Tool Registry (39 Tools)
ULTRON strictly prohibits arbitrary LLM shell generation. All actions are handled by 39 typed, audited tools:
- **System**: `system.getTime`, `system.getDate`, `system.getCpu`, `system.getMemory`, `system.getDisk`, `system.getProcesses`, `system.getBattery`.
- **Applications**: `apps.open`, `apps.close`, `apps.list`.
- **Filesystem**: `filesystem.list`, `filesystem.search`, `filesystem.createFile`, `filesystem.createDirectory`, `filesystem.read`, `filesystem.copy`, `filesystem.move`, `filesystem.rename`, `filesystem.delete`.
- **Network**: `network.getStatus`, `network.getWifiStatus`, `network.enableWifi`, `network.disableWifi`, `network.getAdapters`, `network.getIp`, `network.getDns`, `network.getAvailableNetworks`.
- **Security**: `security.getFirewallStatus`, `security.getDefenderStatus`, `security.getListeningPorts`.
- **Settings**: `settings.open` (Windows 11 Settings URI deep links).
- **Memory**: `memory.store`, `memory.search`, `memory.delete`, `memory.clear`.
- **Research**: `research.search`, `research.youtube`.
- **ADB Phone**: `adb.getDevices`, `adb.wakeScreen`, `adb.unlockPhone`, `adb.makeCall`, `adb.sendMessage`.

### E. Reactive 3D Core & UI HUD
- Built with **Three.js** and **React-Three-Fiber** (`src/renderer/components/core/CoreVisualization.tsx`).
- Renders a procedural particle field with dynamic state reactions:
  - Cyan / Blue: Idle & ready
  - Pulsing Gold: Planning and reasoning
  - Emerald Green: Successful tool execution and verified OS mutation
  - Crimson Red: Security block or error
- Responsive glassmorphism interface supporting resolutions from 1280x720 up to 4K.

---

## 3. Operating Mode Matrix

| Capability | AUTO Mode | ONLINE Mode | OFFLINE Mode |
|---|:---:|:---:|:---:|
| Windows local OS tools | **Active** | **Active** | **Active** |
| Local filesystem tools | **Active** | **Active** | **Active** |
| Persistent SQLite memory | **Active** | **Active** | **Active** |
| Android ADB hardware control | **Active** | **Active** | **Active** |
| Sub-50ms Fast-Track local router | **Active** | **Active** | **Active** |
| NVIDIA Cloud AI (Nemotron 30B) | **Active (when online)** | **Enforced** | **Disabled** |
| Live web research | **Active (when online)** | **Enforced** | **Disabled** |
| Cloud data egress | **Selective** | **Full** | **Zero** |
