# ULTRON

### Personal AI Command Center for Windows

> **AI reasoning. Windows automation. Persistent memory. Verification engine. Goal memory. Credential vault. One desktop command center.**

**ULTRON v1.0.6 — Intelligent Agent Core**
*Developed by UPAI Technologies • Founder: Sukesh D.*

[![Version](https://img.shields.io/badge/version-1.0.6-00f0ff?style=for-the-badge&logo=windows11&logoColor=white)](https://github.com/sukeshd-me/Ultron/releases/tag/v1.0.6)
[![Platform](https://img.shields.io/badge/platform-Windows%2011%20x64-0078d4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/sukeshd-me/Ultron)
[![License: MIT](https://img.shields.io/badge/License-MIT-00f0ff.svg?style=for-the-badge)](LICENSE)
[![Trademark](https://img.shields.io/badge/Trademark-Reserved%20Branding-ffb700?style=for-the-badge)](TRADEMARK.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Electron](https://img.shields.io/badge/Electron-35.1-47848f?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.175-black?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![SQLite](https://img.shields.io/badge/SQLite-node:sqlite-003b57?style=for-the-badge&logo=sqlite&logoColor=white)](https://nodejs.org/api/sqlite.html)

<p align="center">
  <img src="assets/ultron_social_preview.jpg" alt="ULTRON Personal AI Command Center" width="100%" />
</p>

---

## What is ULTRON?

**ULTRON** is an open-source Windows Personal AI Command Center designed to unify large language model reasoning, local computer automation, persistent memory, PowerShell execution, web research, Android device integration, and a reactive desktop interface into a single, cohesive desktop operating layer.

Unlike browser-based AI chatbots that are isolated from your workstation, ULTRON runs natively on Windows 11. It operates through a deterministic, observable agent loop:

```
USER GOAL
   ↓
UNDERSTAND
   ↓
CONTEXT (Adaptive Context Manager)
   ↓
MEMORY (Persistent Goal Memory & SQLite)
   ↓
PLAN (Visual Mission Map)
   ↓
RISK ANALYSIS (Action Risk Engine: LOW / MEDIUM / HIGH / IRREVERSIBLE)
   ↓
PERMISSION (Zero-Trust Permission Gate)
   ↓
EXECUTE (Typed Tool Registry)
   ↓
VERIFY (First-Class Verification Engine)
   ↓
RECOVER / RETRY IF NEEDED (Intelligent Exponential Backoff)
   ↓
REMEMBER (Project Intelligence & Milestones)
   ↓
REPORT (Concise Observable Stream)
```

ULTRON **never claims success merely because a command was executed**. Every consequential tool declares a verification strategy and verifies physical system reality before declaring completion.

---

## What's New in v1.0.6 (Intelligent Agent Core)

ULTRON v1.0.6 transforms ULTRON into a reliable, enterprise-grade personal AI operating layer:

1. **Persistent Goal Memory**:
   - Long-running goals that persist across restarts rather than vanishing between chats.
   - States: `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`.
   - Automatic context recall (*"Continue the V1.0.6 work"* retrieves relevant milestones, files, Git activity, and decisions).

2. **Visual Mission Map**:
   - Interactive SVG DAG flow graph for complex multi-step missions.
   - Live visual statuses: `PLANNED`, `READY`, `RUNNING`, `WAITING_PERMISSION`, `COMPLETED`, `FAILED`, `CANCELLED`, `SKIPPED`.
   - Toggle seamlessly between the visual flow graph and the detailed step list.

3. **First-Class Verification Engine**:
   - Verification is a first-class citizen: `process_window`, `filesystem`, `build_artifact`, `web_navigation`, `adb_device`, `research_source`, and `mission_steps`.
   - ULTRON **never says "Done" if verification failed**.

4. **Automatic Retry & Safe Recovery**:
   - Structured retry engine with exponential backoff for retryable network and process failures.
   - Distinguishes between safe transient failures and unsafe non-retryable errors.

5. **Agent Plugin Architecture & Skill Store Foundation**:
   - Extensible plugin manifests (`plugin.json`) declaring metadata, permissions, tools, and UI contributions.
   - Trust classifications: `BUILT_IN`, `VERIFIED`, `USER_CREATED`, `UNVERIFIED`, `BLOCKED`.
   - Categorized store foundation: Productivity, Developer, Research, Windows, Utilities, etc.

6. **Windows Native Credential Vault**:
   - Hardware-encrypted secrets using **Windows DPAPI** (`credentials_v2.vault`).
   - Zero secret leakage: secrets are never stored as plaintext in SQLite, logs, telemetry, prompts, or history.
   - In-app connection testing with masked displays.

7. **Long-Term Project Intelligence**:
   - Workspace-scoped intelligence tracking Git commit history, architecture decisions, and build outcomes over time.
   - Answers *"What changed in my project this week?"* and *"Why did we choose this architecture?"* with verified facts.

8. **Coding Agent 2.0 & Research Agent 2.0**:
   - Coding Agent 2.0: `UNDERSTAND -> INSPECT -> PLAN -> EDIT -> TEST -> DIAGNOSE -> FIX -> TEST AGAIN -> VERIFY -> REPORT` with Git diff reviews and pre-action safety gates.
   - Research Agent 2.0: Multi-source web extraction, synthesis, and conflict resolution with `CONFIRMED`, `CONFLICTING`, or `UNCERTAIN` status indicators.

9. **Adaptive Context Manager**:
   - Dynamically selects and ranks relevant context (goals, active missions, workspace code, recent conversation, memory) rather than overloading model prompts.
   - Prioritizes local-only processing.

10. **Windows & Workspace Manager**:
    - Safe window focus, layout tiling, minimize, maximize, and restoration for approved developer tools and workspaces.

11. **Action Risk Engine**:
    - Automatic classification of every action: `LOW`, `MEDIUM`, `HIGH`, and `IRREVERSIBLE`.
    - Enforces permission gating, action preview modals, and mandatory audit logging based on risk.

12. **Agent Debugger (Developer Mode)**:
    - Structured observable pipeline events: Request, Intent, Model, Skill, Tools, Risk, Permission, Execution, Verification, Recovery, Result.
    - **Zero Chain-of-Thought exposure**: No hidden thoughts or private reasoning exposed.

13. **Local Productivity Analytics & Proactive Suggestions**:
    - Aggregated local task telemetry (task counts, success rates, average durations, active tools).
    - Optional smart contextual suggestions with toggle controls in Settings.

14. **Configuration Portability (Import / Export)**:
    - Backup and restore preferences, skills, workspaces, and mission templates while strictly excluding DPAPI credentials.

15. **ULTRON Command Center 2.0 & Command Palette**:
    - Global `Ctrl+K` Command Palette for instantaneous navigation across all tools, modals, and workspaces.
    - Responsive obsidian HUD with procedural 3D neural core.

---

## Core Principles

- **Zero-Trust Safety**: No unrestricted shell. No arbitrary PowerShell scripts. No silent elevation.
- **Zero Hallucination / Fake Data**: Diagnostics, security audits, and verifications report authentic system states only.
- **Observable Pipeline**: Concise observable states (`Understanding...`, `Planning...`, `Executing...`, `Verifying...`, `Retrying...`, `Recovered...`, `Completed.`).
- **Privacy by Default**: Hardware DPAPI credential vault, task-scoped screen memory, and offline-capable architecture.

---

## Installation & Setup

### Prerequisites
- Windows 10 / 11 (64-bit)
- Node.js 22 LTS or higher
- PowerShell 5.1+ or PowerShell 7+

### Run from Source
```bash
# Clone the repository
git clone https://github.com/sukeshd-me/Ultron.git
cd Ultron

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Production Build & Packaging
```bash
# Compile and build the installer
npm run build:win
```
The installer will be generated in `release/ULTRON-Setup-1.0.6.exe`.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ 1. RENDERER PROCESS (React 19 + TypeScript + Three.js)      │
│ - Command Center 2.0, Command Palette (Ctrl+K)              │
│ - Visual Mission Map (SVG DAG), Goal Memory, Credential Vault│
│ - 3D Reactive Neural Core (GPU/procedural particles)        │
└──────────────────────────────┬──────────────────────────────┘
                               │  window.electronBridge
                               ▼  (safe IPC bridge)
┌─────────────────────────────────────────────────────────────┐
│ 2. PRELOAD PROCESS (Context Isolation)                      │
│ - Typed IPC APIs for Goals, Missions, Plugins, Vault, etc.  │
│ - Zero raw Node.js API exposure in renderer                 │
└──────────────────────────────┬──────────────────────────────┘
                               │  ipcMain.handle / emit
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MAIN PROCESS (Node.js 22 + TypeScript Core)              │
│ - AgentService (Central Agent Loop & State Machine)         │
│ - GoalMemoryService (Persistent goal tracking & recall)     │
│ - VerificationService (process, fs, build, web, adb, etc.)  │
│ - ActionRiskEngine (LOW / MEDIUM / HIGH / IRREVERSIBLE)     │
│ - RetryService & RecoveryService (Backoff & file snapshots) │
│ - PluginService & SkillStore (Manifest validation)          │
│ - CredentialVaultService (Windows DPAPI hardware encryption) │
│ - WindowManagerService & ProjectIntelligenceService          │
│ - ProductivityService & AdaptiveContextService              │
│ - AgentDebuggerService (Observable decision stream)          │
│ - SQLite Database (WAL mode with persistent indexing)       │
└─────────────────────────────────────────────────────────────┘
```

---

## License & Trademark

- **Code License**: MIT License. See [LICENSE](LICENSE) for details.
- **Trademark Notice**: "ULTRON" and the ULTRON logo are trademarks of **UPAI Technologies** (Founder: **Sukesh D.**). See [TRADEMARK.md](TRADEMARK.md).
