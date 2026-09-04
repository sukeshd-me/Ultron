# ULTRON v1.0.0 — Developer & Contributor Architecture Guide

This guide is designed for software engineers, security researchers, and contributors who want to understand the codebase, add new tools, modify the agent loop, or build ULTRON from source.

---

## 1. High-Level Architecture

ULTRON is an Electron application constructed with a strict three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. RENDERER PROCESS (React 19 + TypeScript + Three.js)      │
│ - UI components, Chat Feed, Memory Inspector, Settings      │
│ - 3D Particle Core (React-Three-Fiber)                      │
│ - State management via Zustand stores                       │
└──────────────────────────────┬──────────────────────────────┘
                               │  window.electronBridge
                               ▼  (contextBridge / safe IPC)
┌─────────────────────────────────────────────────────────────┐
│ 2. PRELOAD PROCESS (Context Isolation)                      │
│ - Typed IPC wrappers exposing strictly scoped channels      │
│ - Zero raw Node.js API leakage into DOM                      │
└──────────────────────────────┬──────────────────────────────┘
                               │  ipcMain.handle / invoke
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MAIN PROCESS (Node.js 22 + TypeScript Services)          │
│ - AgentService (Central agent loop & planning)              │
│ - ToolsRegistry (28 typed deterministic tools)              │
│ - ModelService & ModelProvider (NVIDIA / Offline router)    │
│ - PowerShellService (Safe non-admin process execution)      │
│ - MemoryService (Embedded SQLite via node:sqlite)           │
│ - AdbService (Android phone communication)                  │
│ - SecurityService (Validation & path traversal checks)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
Ultron/
├── .github/                  # GitHub Actions CI workflows
├── data/                     # Embedded SQLite database (ignored by git)
├── dist/                     # NSIS production installers (ignored by git)
├── docs/                     # Technical documentation & guides
│   ├── WHAT_IS_ULTRON.md
│   ├── USER_GUIDE.md
│   ├── DEVELOPER_GUIDE.md
│   ├── SOCIAL_LAUNCH.md
│   └── screenshots/
├── out/                      # Vite build artifacts (main, preload, renderer)
├── src/
│   ├── main/                 # Electron Main process code
│   │   ├── database/         # SQLite memory schema and connections
│   │   ├── ipc/              # IPC channel registration (chat, memory, settings, etc.)
│   │   ├── services/         # Core business logic services
│   │   │   ├── providers/    # Model provider abstraction (NVIDIA, Local)
│   │   │   ├── adb.service.ts
│   │   │   ├── agent.service.ts
│   │   │   ├── apps.service.ts
│   │   │   ├── filesystem.service.ts
│   │   │   ├── memory.service.ts
│   │   │   ├── model.service.ts
│   │   │   ├── powershell.service.ts
│   │   │   ├── research.service.ts
│   │   │   ├── security.service.ts
│   │   │   └── tools.registry.ts
│   │   └── index.ts          # Main application entry point
│   ├── preload/              # Context isolation bridge
│   │   └── index.ts
│   ├── renderer/             # React application & Three.js canvas
│   │   ├── components/       # Chat, HUD, Memory, QuickBar, Settings, Sidebar
│   │   ├── stores/           # Zustand stores (chatStore, settingsStore, uiStore)
│   │   ├── styles/           # Cyberpunk aesthetic CSS design tokens
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── shared/               # Shared TypeScript schemas and constants
│       ├── prompts/          # Master ULTRON system prompt
│       ├── tools/            # Tool definitions and argument interfaces
│       └── types.ts          # Universal IPC message and state types
├── test/                     # Automated test suites and audit runners
├── cli.js                    # Headless CLI entry point
├── electron.vite.config.ts   # Unified Vite configuration for Electron
├── package.json              # Dependencies and build scripts
└── tsconfig.json             # Root TypeScript configuration
```

---

## 3. The Central Agent Loop (`AgentService.ts`)

Located in `src/main/services/agent.service.ts`, `AgentService` orchestrates user queries:

```typescript
export class AgentService {
  async executeAgentLoop(
    userPrompt: string, 
    conversationHistory: ChatMessage[]
  ): Promise<AgentExecutionResult> {
    const telemetry: AgentTelemetry = {
      understandingMs: 0,
      planningMs: 0,
      memoryMs: 0,
      toolExecutionMs: 0,
      verificationMs: 0,
      totalMs: 0
    };
    
    // 1. Check for deterministic fast-track commands (<50ms execution)
    const fastTrackResult = await this.tryFastTrack(userPrompt);
    if (fastTrackResult) return fastTrackResult;

    // 2. Query SQLite memory for relevant user context
    const memories = await memoryService.search(userPrompt);

    // 3. Obtain LLM plan (or local fallback plan)
    const plan = await this.planExecution(userPrompt, memories);

    // 4. Validate safety policy
    securityService.validateToolPlan(plan);

    // 5. Execute typed tool in ToolsRegistry
    const toolResult = await toolsRegistry.execute(plan.tool, plan.args);

    // 6. Verify result against operating system state
    await this.verifyExecution(plan.tool, toolResult);

    // 7. Save audit record to SQLite & return natural language response
    await memoryService.storeAuditLog(...);
    
    return { ... };
  }
}
```

---

## 4. How to Add a New Typed Tool

Adding a new tool is deterministic and type-safe. Never write arbitrary shell text! Follow these 3 steps:

### Step 1: Define the Tool Schema in `src/shared/tools/tool.types.ts`
```typescript
export interface SystemRebootArgs {
  delaySeconds?: number;
  reason?: string;
}
```

### Step 2: Implement the Handler in `src/main/services/tools.registry.ts`
```typescript
this.registerTool({
  name: 'system.reboot',
  domain: 'system',
  description: 'Schedules a safe computer restart.',
  parameters: {
    type: 'object',
    properties: {
      delaySeconds: { type: 'number', description: 'Delay in seconds before rebooting' }
    }
  },
  execute: async (args: SystemRebootArgs) => {
    const delay = Math.max(args.delaySeconds ?? 60, 10);
    const cmd = `shutdown.exe /r /t ${delay}`;
    const result = await powershellService.execute(cmd);
    return {
      scheduled: true,
      delaySeconds: delay,
      output: result.stdout
    };
  }
});
```

### Step 3: Register in Agent System Prompt & Intent Matcher
Add example intents in `src/shared/prompts/ultron.system.ts` so both the cloud LLM and local offline intent matcher recognize phrases such as *"Restart my PC"* or *"Reboot Windows in 2 minutes"*.

---

## 5. Preload Context Bridge (`src/preload/index.ts`)

The renderer never imports Node.js modules or native bindings directly. All communication is funneled through `electronBridge`:

```typescript
// Exposed to window.electronBridge in renderer:
contextBridge.exposeInMainWorld('electronBridge', {
  sendChatMessage: (content: string) => ipcRenderer.invoke('chat:send', content),
  getSystemMetrics: () => ipcRenderer.invoke('system:metrics'),
  getMemories: () => ipcRenderer.invoke('memory:list'),
  storeMemory: (key: string, val: string) => ipcRenderer.invoke('memory:store', { key, val }),
  saveSettings: (settings: AppSettings) => ipcRenderer.invoke('settings:save', settings),
  onChatStream: (callback: (chunk: string) => void) => {
    ipcRenderer.on('chat:chunk', (_, chunk) => callback(chunk));
  }
});
```

---

## 6. Testing & Quality Assurance

ULTRON includes comprehensive verification scripts in `test/`:

### 1. Static Type Checking
```powershell
npx tsc --noEmit
```
Must pass with 0 errors across main, preload, and renderer targets.

### 2. Agent Architecture Verification Suite
```powershell
node test/run_agent_architecture_tests.js
```
Runs 32 automated tests verifying:
- System prompt definition
- 28 typed tools registration
- Filesystem mutation & path boundaries
- Process execution & exit codes
- Wi-Fi adapter parsing
- SQLite memory CRUD operations
- Offline deterministic execution speed

### 3. Production Build Validation
```powershell
npm run build
```
Compiles Vite bundles for `main`, `preload`, and `renderer` into `out/`.

---

## 7. Packaging the Windows Installer

ULTRON uses `electron-builder` with an NSIS target:

```powershell
npm run build:win
```

Configuration in `package.json`:
- **Target**: `nsis` (x64)
- **Artifact Name**: `ultron-setup-${version}.${ext}`
- **Output Directory**: `dist/`
- **Shortcuts**: Automatically creates Desktop and Start Menu entries.
- **Uninstaller**: Registered in Windows Settings → Installed Apps.
