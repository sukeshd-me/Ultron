# ULTRON Interface Visual Showcase

This directory documents the key visual modules and user interface components of **ULTRON v1.0.0**.

---

## Visual Design System & Interface Layout

ULTRON's interface is built on a dark, technical, cyberpunk command-center aesthetic utilizing custom CSS design tokens (`src/renderer/styles/index.css`), glassmorphism overlays, cyan/amber accent lighting, and a reactive Three.js particle canvas.

### 1. Main ULTRON HUD & 3D Reactive Core
- **Location**: Center stage background and main dashboard.
- **Component**: `src/renderer/components/core3d/UltronCore.tsx`
- **Features**: Procedural particle orb rendered in WebGL that reacts dynamically to agent thinking, audio frequencies, tool executions, and idle states.
- **Status Glows**:
  - `Cyan (#00f0ff)`: System idle, monitoring, and listening.
  - `Gold / Amber (#ffb700)`: Agent planning and querying model provider.
  - `Emerald (#00ff88)`: Tool execution confirmed and verified on Windows OS.
  - `Crimson (#ff3366)`: Error state or security violation blocked.

### 2. Conversational Agent Feed & Action Cards
- **Location**: Central viewport panel.
- **Component**: `src/renderer/components/chat/ChatPanel.tsx` & `ActionCard.tsx`
- **Features**: Streamed markdown responses, real-time code highlighting, collapsible tool parameter displays, execution duration badges, and verification results.

### 3. Persistent Memory Inspector
- **Location**: Sidebar navigation tab (🧠).
- **Component**: `src/renderer/components/memory/MemoryInspector.tsx`
- **Features**: Real-time table view of stored SQLite memory records (`data/ultron_memory.sqlite`), instant keyword search filter, and individual record deletion controls.

### 4. Hardware Telemetry & Status Panel
- **Location**: Right-hand collapsible panel.
- **Component**: `src/renderer/components/status/RightPanel.tsx`
- **Features**: Real-time metrics for CPU utilization, RAM consumption, storage headroom, active Wi-Fi adapter SSID, and agent pipeline latencies.

### 5. System Configuration & AI Provider Settings
- **Location**: Sidebar navigation tab (⚙️).
- **Component**: `src/renderer/components/settings/SettingsPanel.tsx`
- **Features**: Secure local API key input with show/hide toggle, live server latency tester, AI mode selector (`AUTO`, `ONLINE`, `OFFLINE`), and custom ADB executable path resolver.

---

> **Privacy & Security Note**: In accordance with the ULTRON security policy, all live production screenshots must be verified to contain zero sensitive information, zero API keys, zero personal phone numbers, and zero private filesystem paths prior to publication.
