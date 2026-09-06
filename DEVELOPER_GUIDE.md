# ULTRON v1.0.6 — Developer & Contributor Architecture Guide
*Personal AI Command Center by UPAI Technologies • Founder: Sukesh D.*

This guide is designed for software engineers, security researchers, and contributors who want to extend the v1.0.6 Intelligent Agent Core, implement custom verifiers, add plugins, or compile from source.

---

## 1. High-Level Architecture

ULTRON is constructed with a modular, three-tier architecture:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. RENDERER PROCESS (React 19 + TypeScript + Three.js)      │
│ - Command Center 2.0, Command Palette (Ctrl+K)              │
│ - Visual Mission Map (SVG DAG), Goal Memory, Credential Vault│
│ - 3D Reactive Neural Core (GPU/procedural particles)        │
│ - State management via Zustand stores & typed IPC bridges    │
└──────────────────────────────┬──────────────────────────────┘
                               │  window.electronBridge
                               ▼  (safe contextBridge)
┌─────────────────────────────────────────────────────────────┐
│ 2. PRELOAD PROCESS (Context Isolation)                      │
│ - Scoped IPC wrappers: goals, missions, plugins, vault,     │
│   windows, project, productivity, debugger, import/export   │
│ - Zero raw Node.js API leakage into DOM                      │
└──────────────────────────────┬──────────────────────────────┘
                               │  ipcMain.handle / emit
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MAIN PROCESS (Node.js 22 + TypeScript Core)              │
│ - AgentService (Central Agent Loop & State Machine)         │
│ - GoalMemoryService (Persistent goal tracking & recall)     │
│ - VerificationService (First-class physical verifiers)       │
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

## 2. Central Agent Loop

In v1.0.6, all requests pass through `src/main/services/agent.service.ts`:

```
User Request
    │
    ▼
AdaptiveContextService.buildContext()  ──> Ranks goals, active mission, project, conversation
    │
    ▼
ModelRouter.route()                    ──> Selects model based on task complexity & online/offline
    │
    ▼
Tool Planning
    │
    ▼
ActionRiskEngine.classify()            ──> Computes LOW, MEDIUM, HIGH, or IRREVERSIBLE
    │
    ▼
Permission Enforcement Gate            ──> Blocks if unpermitted or requires preview
    │
    ▼
ToolsRegistry.execute()                ──> Executes tool action
    │
    ▼
VerificationService.verifyAction()     ──> Checks physical system state
    │
    ├── Verification Passed ─────────────> AgentDebugger.recordEvent() -> Response
    │
    └── Verification Failed ─────────────> RetryService (if retryable) or Safe Recovery
```

---

## 3. Implementing a Custom Verifier

To add a new verification strategy, edit `src/main/services/verification.service.ts`:

```typescript
export interface VerificationRequest {
  toolName: string
  action: string
  params: any
  result: any
  expectedState?: any
}

// In VerificationService:
public async verifyAction(req: VerificationRequest): Promise<VerificationResult> {
  switch (req.toolName) {
    case 'my_custom_tool':
      return await this.verifyCustomAction(req)
    // ...
  }
}
```

Every verifier must return a `VerificationResult`:
```typescript
{
  verified: boolean
  strategy: 'process_window' | 'filesystem' | 'build_artifact' | 'web_navigation' | 'adb_device' | 'research_source' | 'mission_steps'
  details: string
  durationMs: number
}
```

---

## 4. Plugin Manifest Specification

Plugins are defined via `plugin.json`:

```json
{
  "id": "my-plugin",
  "name": "My Custom Plugin",
  "version": "1.0.0",
  "publisher": "Developer Name",
  "description": "Extends ULTRON with custom capabilities.",
  "minimumUltronVersion": "1.0.6",
  "trustState": "USER_CREATED",
  "permissions": [
    "filesystem:read",
    "network:outbound"
  ],
  "skills": ["developer"],
  "tools": ["my_tool_one", "my_tool_two"]
}
```

All plugin tools execute through the central `ToolsRegistry` and `ActionRiskEngine`.

---

## 5. Secure Credential Vault (Windows DPAPI)

The Credential Vault is implemented in `src/main/services/credential-vault.service.ts`:
- Uses `electron.safeStorage` backed by Windows DPAPI.
- Stores encrypted payload in `%APPDATA%/ultron/credentials_v2.vault`.
- Keys are identified by standard identifiers: `nvidia`, `openai`, `gemini`, `anthropic`, `custom_token`.
- All credentials returned to renderer or logged are strictly masked (`••••••••`).

---

## 6. Action Risk Engine

Located in `src/main/services/risk-engine.service.ts`, the risk engine classifies operations:
- `LOW`: Read files, window focus, system queries, calculator.
- `MEDIUM`: Create/modify project files, test runs, workspace switching.
- `HIGH`: System process killing, network interface changes, shell tasks.
- `IRREVERSIBLE`: Deleting files, formatting, branch purges, credential resets.

---

## 7. Compiling & Packaging

```bash
# Run TypeScript compilation check
npx tsc --noEmit

# Build Vite bundles
npm run build

# Package Windows x64 Installer
npm run build:win
```
The installer is generated in `release/ULTRON-Setup-1.0.6.exe`.
