# Changelog

All notable changes to the **ULTRON** Personal AI Command Center are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.0.0] — Production Release — 2026-09-05

### Summary

The initial production release of **ULTRON**, an open-source Windows Personal AI Command Center that unites large language model reasoning, local computer automation, persistent memory, PowerShell execution, and Android device integration into a unified desktop interface.

### Highlights & Verified Capabilities

- **Production Windows NSIS Installer**:
  - Binary: `dist/ultron-setup-1.0.0.exe` (104,816,937 bytes, ~99.96 MB)
  - Target: Windows 11 / Windows 10 x64
  - SHA-256 Checksum: `1AE8D2CD9DF37355E9B2145898C97492998E5BD0630D90D0990DFF752A3BEE55`
  - Automated Desktop and Start Menu shortcut generation
  - Clean uninstaller registered in Windows Settings
- **28 Typed Windows Automation Tools**:
  - **`system.*`**: `system.getTime`, `system.getDate`, `system.getCpu`, `system.getMemory`, `system.getDisk`, `system.getProcesses`
  - **`apps.*`**: `apps.open` (Calculator, Notepad, Chrome, Windows Terminal, Settings, Explorer, VS Code)
  - **`filesystem.*`**: `filesystem.list`, `filesystem.search`, `filesystem.createFile`, `filesystem.createDirectory`, `filesystem.read`, `filesystem.copy`, `filesystem.move`, `filesystem.rename`, `filesystem.delete`
  - **`network.*`**: `network.getStatus`, `network.getWifiStatus`, `network.enableWifi`, `network.disableWifi`, `network.getAdapters`, `network.getIp`, `network.getDns`, `network.getAvailableNetworks`
  - **`security.*`**: `security.getFirewallStatus`, `security.getDefenderStatus`, `security.getListeningPorts`
  - **`settings.*`**: Native Windows 11 deep links (`ms-settings:*`)
  - **`memory.*`**: `memory.store`, `memory.search`, `memory.delete`
  - **`adb.*`**: `adb.connect`, `adb.getDevices`, `adb.makeCall`, `adb.sendMessage`
  - **`research.*`**: `research.search`, `research.youtube`
- **Multi-Tier AI Provider Engine**:
  - **`AUTO` Mode**: Dynamically selects cloud reasoning when available, falling back smoothly to local deterministic tools if disconnected.
  - **`ONLINE` Mode**: Cloud reasoning via NVIDIA AI Foundation models (`nvidia/nemotron-3.5-lightning-30b-a3b`).
  - **`OFFLINE` Mode**: 100% functional local PC automation without cloud API keys, network egress, or external dependencies.
  - **Fast-Track Router**: Executes common local system queries in <50ms without cloud network roundtrips.
- **Embedded SQLite Memory Engine**:
  - High-performance, zero-latency local memory powered by `node:sqlite` (`data/ultron_memory.sqlite`).
  - Persistent conversation history, explicit user facts, and task audit logs.
  - Interactive UI Memory Inspector tab for viewing, searching, and deleting memories.
- **Android ADB Integration**:
  - Direct smartphone hardware control strictly via Android Debug Bridge (ADB), bypassing Bluetooth and Windows Phone Link.
  - Live inspection of device manufacturer, model (e.g., `vivo V2355`), Android OS version (`Android 16`), and battery percentage / charging state.
  - Legitimate intent dispatch for calls and messages.
- **Security & Safety Defenses**:
  - Strict typed tool schemas; zero arbitrary shell concatenation from LLM output.
  - Non-administrator default child process execution.
  - Path boundary validation and traversal defense.
- **Reactive 3D Desktop HUD**:
  - Real-time Three.js / React-Three-Fiber procedural particle core reacting dynamically to agent states, audio, and tool execution.
  - Millisecond-resolution telemetry panel tracking understanding, planning, execution, verification, and end-to-end response times.
- **Production Verification**:
  - 32/32 Automated Architecture Tests Passed (100.0%).
  - Zero TypeScript compilation errors (`npx tsc --noEmit`).
  - Clean production Vite bundle compilation.
