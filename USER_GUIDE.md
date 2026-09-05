# ULTRON v1.0.1 — User Guide & Operations Manual
*Personal AI Command Center by UPAI Technologies • Founder: Sukesh D.*

Welcome to the **ULTRON v1.0.1 User Guide**. This manual details how to operate the command center, interact with the agent, configure settings, leverage Windows and Android automation, and manage hardware-isolated credentials.

---

## Table of Contents
1. [User Interface Overview](#1-user-interface-overview)
2. [First-Run NVIDIA AI Onboarding](#2-first-run-nvidia-ai-onboarding)
3. [Operating Modes (AUTO / ONLINE / OFFLINE)](#3-operating-modes)
4. [Simplified Main Navigation & Commands](#4-simplified-main-navigation--commands)
5. [Windows 11 Automation Commands](#5-windows-11-automation-commands)
6. [Android Phone Control & Secure PIN Vault](#6-android-phone-control--secure-pin-vault)
7. [Memory Engine & Action History](#7-memory-engine--action-history)
8. [Settings & Configuration](#8-settings--configuration)
9. [Troubleshooting & FAQ](#9-troubleshooting--faq)

---

## 1. User Interface Overview

ULTRON v1.0.1 introduces a simplified, chat-first futuristic AI command center designed to eliminate clutter while providing instant access to all capabilities:

1. **Title Bar & System HUD**:  
   - Displays product identity: **ULTRON v1.0.1**, developed by **UPAI Technologies** (Founder: **Sukesh D.**).
   - Mode Indicator Badge: `AUTO`, `ONLINE`, or `OFFLINE`.
   - Quick action buttons: **AI Onboard** (opens connection wizard), **Phone** (opens security modal), and **Settings**.
2. **The 3D Reactive Core (Center/Background)**:  
   - Procedural particle sphere rendered with Three.js.
   - Pulses amber during planning, cyan during idle readiness, emerald green upon verified tool completion, and crimson upon security blocks.
3. **Chat & Action Feed (Main Panel)**:  
   - Clean, centered message feed displaying conversation turns, tool invocation badges, and sub-millisecond execution telemetry.
4. **Bottom Command Bar**:  
   - Large chat input with keyboard submit (`Enter`).
   - Microphone button for hands-free voice commands.
   - Quick suggestion chips for common diagnostic tasks.
5. **Right Status & Telemetry HUD**:  
   - Live hardware status: CPU load, RAM utilization, Disk space, Wi-Fi SSID.
   - Phone connectivity status: Device name (e.g. `vivo V2355`), Android OS version, battery percentage.
   - Hardware-isolated DPAPI credential vault telemetry.

---

## 2. First-Run NVIDIA AI Onboarding

When launching ULTRON for the first time without an API key configured, the dedicated **Connect ULTRON AI** modal appears:

- **Input Field**: Masked entry for your NVIDIA API key.
- **Get NVIDIA API Key**: Opens the official [NVIDIA API Catalog](https://build.nvidia.com) directly in your default browser to generate a free token.
- **Save & Continue**: Stores the key in encrypted local configuration and validates connectivity.
- **Use Offline Mode**: Immediately launches ULTRON in deterministic local execution mode without requiring any cloud key or internet connection.
- **Zero-Storage Policy**: The key is never logged, never stored in SQLite memory tables, and never exposed in telemetry.

---

## 3. Operating Modes

Select your operating mode from the title bar indicator or in **Settings**:

### `AUTO` Mode (Recommended)
- Checks cloud AI connectivity.
- When online with an NVIDIA API key, utilizes cloud LLMs (`nvidia/nemotron-3.5-lightning-30b-a3b`) for open-ended queries and complex multi-step planning.
- Automatically fast-tracks common local requests (e.g. "What time is it?", "Show CPU", "Open Notepad") directly to native tools with **<50ms latency**.
- Falls back seamlessly to deterministic offline execution if internet connectivity drops.

### `ONLINE` Mode
- Directs all queries through cloud LLM planning.
- Requires an NVIDIA API key and internet access.
- Ideal for deep research, complex reasoning, and code synthesis.

### `OFFLINE` Mode
- **Zero cloud API calls, zero internet egress, zero telemetry.**
- Dispatches all requests directly to the deterministic tool registry and local regex/keyword intent matcher.
- All 28 local tools (files, apps, system stats, Wi-Fi, settings, ADB) continue to work seamlessly.

---

## 4. Simplified Main Navigation & Commands

ULTRON v1.0.1 simplifies presentation to focus on conversational interaction: *"Talk to ULTRON and it handles the rest."*

| Action | How to Trigger |
|---|---|
| **Chat** | Type directly in the bottom input bar |
| **Voice Input** | Click the microphone button |
| **Settings** | Click the gear icon in the top right |
| **AI Onboarding** | Click the AI pill in the title bar |
| **Phone Security** | Click the phone icon in the title bar |
| **System Diagnostics** | Ask: *"What is my system status?"* |
| **Memory Inspection** | Ask: *"What do you remember about me?"* or click **Memory** in Settings |

---

## 5. Windows 11 Automation Commands

Every command is validated through a typed tool schema before execution:

### System & Hardware
- *"What time is it?"* → Resolves local system time via `system.getTime`.
- *"Show CPU and RAM usage"* → Queries real-time hardware loads via `system.getCpu` and `system.getMemory`.
- *"Show disk space"* → Checks free and total storage across local drives via `system.getDisk`.

### Applications & Settings
- *"Open Calculator"* → Launches Windows Calculator via `apps.open`.
- *"Open Notepad"* → Launches Windows Notepad via `apps.open`.
- *"Open Chrome"* → Resolves and launches Google Chrome via `apps.open`.
- *"Open Display Settings"* → Deep-links to `ms-settings:display` via `settings.open`.

### Filesystem
- *"List files in Desktop"* → Reads folder contents via `filesystem.list`.
- *"Search for report.pdf"* → Scans filesystem via `filesystem.search`.
- *"Create a folder called Workspace"* → Creates directory via `filesystem.createDirectory`.

### Network & Security
- *"Check Wi-Fi status"* → Returns connected SSID, signal strength, and adapter power via `network.getWifiStatus`.
- *"What is my IP address?"* → Displays local network IPv4 address via `network.getIp`.
- *"Check firewall status"* → Audits Windows Defender Firewall profiles via `security.getFirewallStatus`.

---

## 6. Android Phone Control & Secure PIN Vault

ULTRON integrates directly with Android devices using authorized ADB (Android Debug Bridge) commands:

### Connected Device Telemetry
- Automatic detection of USB or Wi-Fi paired devices.
- Reports model name (e.g., `vivo V2355`), Android OS version (`Android 16`), battery charge percentage, and charging state.

### Hardware-Isolated Phone PIN Vault
For operations that require unlocking your phone:
- Click the phone icon in the title bar or open **Phone Security**.
- Enter your 4-digit or 6-digit device PIN.
- The PIN is encrypted using **Windows DPAPI (Data Protection API)** in `%APPDATA%/ultron/credentials.vault`.
- **Absolute Zero Leakage Guarantee**: The PIN is **never** written to SQLite memory, chat logs, stdout, or sent over network packets.

### Supported Phone Commands
- *"Connect my phone"* → Detects and connects ADB device.
- *"Wake my phone"* → Sends keyevent 224 to turn on screen.
- *"Unlock my phone"* → Wakes screen, dismisses keyguard, inputs vault PIN, and presses Enter.
- *"What's my phone battery?"* → Queries ADB power state.

---

## 7. Memory Engine & Action History

ULTRON features a persistent SQLite memory database located at `data/ultron_memory.sqlite`:

- **Automatic Action Recording**: Every completed action logs tool name, execution status, timestamp, and duration in milliseconds (`duration_ms`).
- **Secret Redaction**: Built-in regex sanitizers strip out API keys, phone PINs, and authentication tokens before persisting records.
- **User Fact Storage**:
  - Store: *"Remember that my backup drive is E:"*
  - Recall: *"Where is my backup drive?"*
  - Forget: *"Forget my backup drive"*
- **Management**: View and clear action history directly from the **Memory** section in Settings.

---

## 8. Settings & Configuration

Settings is organized into 6 clean, futuristic tabs:

1. **General**: Appearance, theme, and startup preferences.
2. **AI**: Mode switcher (`AUTO` / `ONLINE` / `OFFLINE`), NVIDIA API key management, and real-time latency ping test.
3. **Phone**: Android ADB device details, connection status, DPAPI PIN configuration, and diagnostic unlock test.
4. **Memory**: SQLite database status, stored fact count, and action log clearing.
5. **System**: Windows version, CPU architecture, RAM, and hardware telemetry.
6. **About**: Version **1.0.1**, **UPAI Technologies**, Founder: **Sukesh D.**, documentation and repository links.

---

## 9. Troubleshooting & FAQ

**Q: Why does Windows SmartScreen warn about the installer?**  
A: ULTRON is an independent, open-source application. Click **More info** → **Run anyway** to proceed with installation.

**Q: Can I use ULTRON completely offline?**  
A: Yes! Select `OFFLINE` mode in Settings. All local Windows automation, filesystem tools, system diagnostics, and ADB commands run with zero internet connection.

**Q: Where is my phone PIN stored?**  
A: It is encrypted using Windows DPAPI (hardware-backed user credentials) and stored in `%APPDATA%/ultron/credentials.vault`. It is never stored in SQLite or logs.
