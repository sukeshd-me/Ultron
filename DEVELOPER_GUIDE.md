# ULTRON v1.0.5 — Developer & Contributor Architecture Guide
*Personal AI Command Center by UPAI Technologies • Founder: Sukesh D.*

This guide is designed for software engineers, security researchers, and contributors who want to understand the v1.0.5 architecture, build custom skills, extend the agent state machine, or compile from source.

---

## 1. High-Level Architecture

ULTRON is an Electron application constructed with a strict three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. RENDERER PROCESS (React 19 + TypeScript + Three.js)      │
│ - UI components, Chat Feed, Missions, Security, History     │
│ - 3D Particle Core (React-Three-Fiber, 15 Agent States)     │
│ - State management via Zustand stores & Bridge IPC          │
└──────────────────────────────┬──────────────────────────────┘
                               │  window.electronBridge
                               ▼  (contextBridge / safe IPC)
┌─────────────────────────────────────────────────────────────┐
│ 2. PRELOAD PROCESS (Context Isolation)                      │
│ - Scoped IPC wrappers: missions, workflows, recovery,       │
│   preferences, documents, security, repair, history         │
│ - Zero raw Node.js API leakage into DOM                      │
└──────────────────────────────┬──────────────────────────────┘
                               │  ipcMain.handle / invoke / emit
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MAIN PROCESS (Node.js 22 + TypeScript Services)          │
│ - AgentStateMachine (Central 15-state lifecycle)            │
│ - AgentService (Autonomous loop: Understand -> Plan -> ...)  │
│ - MissionService & WorkflowService (Multi-step goals)       │
│ - DocumentService (Grounded PDF/MD/Code chunking & QA)      │
│ - RecoveryService (Pre-mutation snapshots & undo/redo)      │
│ - PreferenceService & CustomSkillsService                   │
│ - SecurityService & Defensive Security Center               │
│ - TaskHistoryService (Audit logging & sub-ms telemetry)     │
│ - MemoryService (Embedded SQLite with WAL mode)             │
│ - PowerShellService & AdbService                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Central Agent State Machine

Located in `src/main/services/state-machine.service.ts`, the agent state machine orchestrates:

```
IDLE -> UNDERSTANDING -> CONTEXT_LOADING -> PLANNING -> WAITING_PERMISSION -> EXECUTING -> VERIFYING -> SUCCESS / COMPLETED
                                                                                   |
                                                                                   v
                                                                                FAILED -> RECOVERY_AVAILABLE -> RECOVERING
```

All UI elements (including the 3D Neural Core shader kinematics) are driven by real-time transitions emitted over the `agent:stateChanged` IPC channel.

---

## 3. Directory Structure

```
Ultron/
├── data/                     # Embedded SQLite database & file backups
│   ├── ultron_memory.sqlite  # SQLite database with v1.0.5 tables
│   └── backups/              # Safe pre-mutation versioning files
├── release/                  # NSIS production installers
│   └── ULTRON-Setup-1.0.5.exe
├── src/
│   ├── main/                 # Electron Main process code
│   │   ├── database/         # SQLite memory schema, migrations, tables
│   │   ├── ipc/              # Scoped IPC handlers (missions, history, etc.)
│   │   └── services/         # Core business logic services
│   ├── preload/              # Secure Electron preload bridge
│   └── renderer/             # React 19 Frontend
│       ├── components/       # Modals, HUD, Chat, Settings, 3D Core
│       └── bridge.ts         # Type-safe window.electronBridge interface
└── package.json
```

---

## 4. Compiling & Packaging

```powershell
# 1. Install dependencies
npm install

# 2. Typecheck with TypeScript
npx tsc --noEmit

# 3. Compile Electron Vite bundle
npm run build

# 4. Package Windows NSIS Installer
npx electron-builder --win --x64
```
