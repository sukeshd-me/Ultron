# ULTRON v1.0.0 — User Guide & Operations Manual

Welcome to the **ULTRON User Guide**. This manual details how to operate the command center, interact with the agent, configure settings, and leverage Windows and Android automation.

---

## Table of Contents
1. [User Interface Overview](#1-user-interface-overview)
2. [Operating Modes (AUTO / ONLINE / OFFLINE)](#2-operating-modes)
3. [Interacting with ULTRON](#3-interacting-with-ultron)
4. [Windows 11 Automation Commands](#4-windows-11-automation-commands)
5. [Memory Management & Inspector](#5-memory-management--inspector)
6. [Android Phone Control via ADB](#6-android-phone-control-via-adb)
7. [Web Research & Media Tools](#7-web-research--media-tools)
8. [Headless CLI Mode](#8-headless-cli-mode)
9. [Settings & Configuration](#9-settings--configuration)
10. [Troubleshooting & Common Issues](#10-troubleshooting--common-issues)

---

## 1. User Interface Overview

When you launch ULTRON, the window is organized into four main operational quadrants:

1. **The 3D Reactive Core (Center/Background)**:  
   A dynamic particle sphere representing ULTRON's state. It reacts visually to processing, tool execution, voice activity, and system alerts.
2. **Chat & Action Feed (Main Panel)**:  
   Displays conversation turns, streaming model responses, typed tool invocation cards, execution results, and confirmation dialogs.
3. **Left Navigation Sidebar**:  
   Quick access icons for:
   - **Command Center** (Chat + Core)
   - **Memory Inspector** (SQLite database viewer)
   - **Settings** (API keys, ADB config, preferences)
4. **Right Telemetry Panel**:  
   Displays real-time hardware statistics (CPU %, Memory %, Storage free space, active Wi-Fi network) and sub-millisecond agent execution latencies.

---

## 2. Operating Modes

ULTRON provides three operating modes selectable in **Settings** or from the top quick-bar:

### `AUTO` Mode (Recommended)
- Checks cloud AI connectivity.
- When online with a valid NVIDIA API key, uses cloud LLMs for open-ended queries and complex planning.
- Automatically routes deterministic queries (e.g. "What time is it?", "Show CPU", "Open Calculator") directly through local tools with **<50ms latency**.
- If your internet connection drops, falls back gracefully to offline local execution.

### `ONLINE` Mode
- Prioritizes cloud LLM reasoning for every conversational turn.
- Requires an NVIDIA API key and an active internet connection.
- Best for detailed coding assistance, long-form creative writing, and multi-step complex synthesis.

### `OFFLINE` Mode
- **Zero cloud calls, zero data egress, zero internet requirement.**
- Dispatches all requests directly to the deterministic tool registry and local regex/keyword intent matcher.
- All 28 local tools (files, apps, system stats, Wi-Fi, settings, ADB) continue to work seamlessly.

---

## 3. Interacting with ULTRON

You can interact with ULTRON naturally through natural English prompts.

### Command Format Examples:
- **Direct requests**: *"Open Chrome"*, *"Show my CPU and RAM"*
- **Questions**: *"What is today's date?"*, *"Is my Wi-Fi enabled?"*
- **Action sequences**: *"Find all PDF files in my Downloads folder"*
- **Memory instructions**: *"Remember that my backup drive is at D:\"*

### Understanding Action Cards:
When ULTRON executes an action, it renders an **Action Card** in the chat:
- **Tool Name**: e.g., `system.getCpu` or `apps.open`
- **Parameters**: Structured JSON showing arguments passed to the tool
- **Status Indicator**: Running (yellow), Success (green), Error (red)
- **Output Snippet**: Formatted result returned by the Windows operating system

---

## 4. Windows 11 Automation Commands

Here are everyday commands you can use immediately:

### System Diagnostics
- *"Show system status"* → Reports CPU load, RAM usage, and primary disk free space.
- *"What time is it?"* → Displays local time down to the second.
- *"List running processes"* → Shows top processes sorted by CPU and memory usage.

### Application Launching
- *"Open Notepad"* → Launches Windows Notepad.
- *"Open Calculator"* → Launches Windows Calculator.
- *"Open Chrome"* → Launches Google Chrome.
- *"Open Terminal"* → Launches Windows Terminal (or PowerShell).
- *"Open Settings"* → Launches Windows 11 Settings.

### Filesystem Operations
- *"List files on my Desktop"* → Returns directory contents.
- *"Search for report.docx in Documents"* → Traverses folders to find the matching file.
- *"Create a folder called Projects on my Desktop"* → Creates the directory.
- *"Read file C:\notes.txt"* → Displays text contents safely in the chat feed.

### Network Management
- *"Check Wi-Fi status"* → Shows current connection, SSID, and signal quality.
- *"What is my IP address?"* → Displays IPv4/IPv6 addresses of active adapters.
- *"List available Wi-Fi networks"* → Scans and displays nearby wireless access points.

### Security Posture
- *"Check firewall status"* → Verifies if Domain, Private, and Public firewalls are enabled.
- *"Is Windows Defender running?"* → Confirms antivirus and real-time protection state.
- *"Show listening ports"* → Audits active TCP/UDP ports listening for connections.

---

## 5. Memory Management & Inspector

ULTRON stores information permanently in `data/ultron_memory.sqlite`.

### Storing Information
Simply tell ULTRON to remember something:
- *"Remember that my work email is sukesh@example.com"*
- *"Remember that project deadline is October 15"*

### Recalling Information
Ask ULTRON directly:
- *"What is my work email?"*
- *"When is the project deadline?"*

### Using the Memory Inspector
1. Click the **Memory** icon (🧠) in the left sidebar.
2. Browse through all stored memory keys and values.
3. Use the search bar to filter entries.
4. Click the trash icon next to any entry to permanently delete it.

---

## 6. Android Phone Control via ADB

ULTRON connects to your Android phone strictly via the Android Debug Bridge (ADB).

### Setup Instructions
1. Enable **Developer Options** on your Android device (tap Build Number 7 times in Settings → About Phone).
2. Enable **USB Debugging** in Developer Options.
3. Connect your phone to your PC via a USB cable.
4. When prompted on your phone screen, check **Always allow from this computer** and tap **Allow**.

### Supported Phone Commands:
- *"Connect to my phone"* → Detects the device, reports device model, Android version, and battery percentage.
- *"Call 555-0199"* → Triggers the legitimate Android phone dialer intent.
- *"Send message to 555-0199 saying I am on my way"* → Previews and drafts the SMS intent on the device.

---

## 7. Web Research & Media Tools

ULTRON respects your privacy and **never scrapes the web in the background** without explicit user instruction.

### Web Search
- *"Research latest news on TypeScript 5.8"* → Opens your default browser with a targeted query and presents synthesized highlights.

### YouTube Search
- *"Search YouTube for Electron desktop tutorial"* → Launches YouTube with the query pre-loaded.

---

## 8. Headless CLI Mode

If you prefer operating without the graphical interface, ULTRON includes a high-speed command-line interface:

```powershell
# Run the CLI
node cli.js
```

### CLI Features:
- Natural language command prompt (`ULTRON »`).
- Colorized terminal output for tool invocations.
- Millisecond-resolution telemetry output:
  ```
  ⚡ [Telemetry] Understanding: 1.2ms | Planning: 0.8ms | Memory: 2.1ms | Tool Exec: 24.3ms | Total: 28.4ms
  ```

---

## 9. Settings & Configuration

Access the Settings panel via the gear icon (⚙️):

| Setting | Description | Default |
|---|---|---|
| **NVIDIA API Key** | Cloud inference authentication key | *(Empty)* |
| **Model Selection** | Active LLM model | `nvidia/nemotron-3.5-lightning-30b-a3b` |
| **Operational Mode** | AUTO, ONLINE, or OFFLINE | `AUTO` |
| **Custom Tools Path** | Path to additional custom automation tools | `E:\ULTRON\Tools` |
| **ADB Executable Path** | Full path to `adb.exe` | `adb` (from PATH) |
| **3D Core Quality** | Particle density and animation fidelity | High |

---

## 10. Troubleshooting & Common Issues

### Issue 1: "Windows protected your PC" on first install
- **Cause**: The NSIS installer is an independent open-source binary and has not yet built Microsoft SmartScreen reputation.
- **Fix**: Click **More info** and then click **Run anyway**.

### Issue 2: "Model connection failed"
- **Cause**: Invalid NVIDIA API key or internet connectivity issue.
- **Fix**: Open **Settings**, verify your key format (starts with `nvapi-`), and click **Test API Server**. Switch to **OFFLINE** mode to continue using local tools without a key.

### Issue 3: "ADB device not found"
- **Cause**: USB Debugging is not enabled, or the phone was not authorized.
- **Fix**: Reconnect the USB cable, look at your phone screen, and accept the "Allow USB Debugging" authorization prompt. Verify with `adb devices` in PowerShell.

### Issue 4: "Permission Denied on File Action"
- **Cause**: The targeted file is in a protected system directory (e.g. `C:\Windows\System32`).
- **Fix**: ULTRON operates under standard user permissions to protect system integrity. Avoid modifying protected Windows system folders.
