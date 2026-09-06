# ULTRON v1.0.6 — User Guide & Operations Manual
*Personal AI Command Center by UPAI Technologies • Founder: Sukesh D.*

Welcome to the **ULTRON v1.0.6 User Guide**. This manual details how to operate the command center as an intelligent agent core, manage persistent goals, visualize missions, verify results, configure DPAPI credential security, manage desktop workspaces, and use the Command Palette.

---

## Table of Contents
1. [User Interface & Command Center 2.0](#1-user-interface--command-center-20)
2. [Global Command Palette (Ctrl+K)](#2-global-command-palette-ctrlk)
3. [The Agent Lifecycle & Verification Engine](#3-the-agent-lifecycle--verification-engine)
4. [Goal Memory System](#4-goal-memory-system)
5. [Visual Mission Map](#5-visual-mission-map)
6. [Automatic Retry & Safe Recovery](#6-automatic-retry--safe-recovery)
7. [Secure Credential Vault (Windows DPAPI)](#7-secure-credential-vault-windows-dpapi)
8. [Plugin Architecture & Skill Store](#8-plugin-architecture--skill-store)
9. [Long-Term Project Intelligence](#9-long-term-project-intelligence)
10. [Coding Agent 2.0 & Research Agent 2.0](#10-coding-agent-20--research-agent-20)
11. [Window & Workspace Manager](#11-window--workspace-manager)
12. [Action Risk Engine & Safety](#12-action-risk-engine--safety)
13. [Agent Debugger (Developer Mode)](#13-agent-debugger-developer-mode)
14. [Productivity Analytics & Proactive Suggestions](#14-productivity-analytics--proactive-suggestions)
15. [Import / Export Configuration](#15-import--export-configuration)
16. [Troubleshooting & FAQ](#16-troubleshooting--faq)

---

## 1. User Interface & Command Center 2.0

ULTRON v1.0.6 features a streamlined, high-performance obsidian dark interface:

1. **Title Bar HUD**:
   - Branding: **ULTRON v1.0.6**, **UPAI Technologies** (Founder: **Sukesh D.**).
   - Smart Workspace Bar: Active workspace path and quick directory switching.
   - Quick Action Buttons: **Commands (Ctrl+K)**, **Health**, **Missions**, **History**, **Tasks**, and **Settings**.
2. **The 3D Reactive Neural Core**:
   - GPU-accelerated procedural particle sphere dynamically reflecting 15 agent states (`IDLE`, `LISTENING`, `THINKING`, `PLANNING`, `WAITING_PERMISSION`, `EXECUTING`, `VERIFYING`, `RECOVERING`, `SUCCESS`, `ERROR`, etc.).
3. **Chat & Agent Console**:
   - Multi-turn conversation feed displaying concise observable states (`Understanding...`, `Planning...`, `Executing...`, `Verifying...`, `Completed.`).
   - Zero hidden chain-of-thought exposure.
4. **Slide-Out Navigation Drawer**:
   - Accessible via the hamburger menu icon (`☰`) in the top-left.
   - Quick access to Goal Memory, Credential Vault, Skill Store, Project Intelligence, Window Manager, Productivity Analytics, and Agent Debugger.

---

## 2. Global Command Palette (Ctrl+K)

Press **`Ctrl+K`** (or click **Commands** in the title bar) from anywhere in ULTRON to open the **Command Palette**:
- Instantly search and jump to any capability or modal.
- Built-in shortcuts for:
  - `Open Missions` (Visual mission map and multi-step tasks)
  - `Open Goal Memory` (Persistent goals and projects)
  - `Open Credential Vault` (DPAPI hardware-encrypted secrets)
  - `Open Skill Store & Plugins` (Browse verified extensions)
  - `Open Project Intelligence` (Git history and decisions)
  - `Open Window Manager` (Workspace layouts and application focus)
  - `Open Productivity Analytics` (Local stats and telemetry)
  - `Open Agent Debugger` (Observable pipeline decisions)
  - `Forget Screen Context` (Discard temporary visual context)
  - `Undo Recent Action` (Rollback file mutations)

---

## 3. The Agent Lifecycle & Verification Engine

ULTRON v1.0.6 operates through a strict deterministic agent lifecycle:

```
USER GOAL -> UNDERSTAND -> CONTEXT -> MEMORY -> PLAN -> RISK ANALYSIS -> PERMISSION -> EXECUTE -> VERIFY -> RECOVER/RETRY -> REMEMBER -> REPORT
```

### Verification Is First-Class
ULTRON does not claim success simply because a command exited. Every critical action is checked by the **Verification Engine**:
- **File Actions**: Verifies file existence, size, and matching content.
- **Application Launches**: Verifies that the target process is actively running and visible.
- **Build Operations**: Verifies return code 0 and verifies that build artifact binaries actually exist.
- **Web Navigation**: Verifies HTTP status codes and page title resolution.
- **Android Actions**: Verifies physical device state via ADB query.
- **Research Operations**: Verifies that sources and citations were authentically retrieved.

If verification fails, ULTRON reports the failure and enters safe recovery rather than falsely claiming completion.

---

## 4. Goal Memory System

ULTRON remembers your objectives across days, weeks, and system reboots.

### Goal States
- **`ACTIVE`**: Currently ongoing goal.
- **`PAUSED`**: Suspended goal awaiting user resumption.
- **`COMPLETED`**: Successfully accomplished objective.
- **`CANCELLED`**: Cancelled goal.
- **`ARCHIVED`**: Retained for historical context.

### Interacting with Goals
- **Natural Language**:
  - *"I'm building ULTRON V1.0.6"* -> Creates or activates the goal.
  - *"Continue the V1.0.6 work"* -> ULTRON retrieves related files, Git activity, and milestones.
  - *"Pause my current goal"* -> Sets state to `PAUSED`.
  - *"Mark my goal as completed"* -> Sets state to `COMPLETED`.
- **UI Management**:
  - Open via **Slide-Out Menu → Goal Memory** or Command Palette.
  - View all goals, change status, link files, or inspect related missions.

---

## 5. Visual Mission Map

Complex agent goals are organized as missions. In v1.0.6, missions feature an interactive **Visual Mission Map**:
- Displays a topological DAG (Directed Acyclic Graph) showing step dependencies.
- Color-coded node badges indicate live status:
  - ⚪ `PLANNED`
  - 🔵 `READY`
  - 🟡 `RUNNING`
  - 🟠 `WAITING_PERMISSION`
  - 🟢 `COMPLETED`
  - 🔴 `FAILED`
  - 🔘 `SKIPPED`
- Click any node in the graph to inspect its inputs, outputs, execution duration, and verification record.

---

## 6. Automatic Retry & Safe Recovery

When a safe, transient error occurs (such as a temporary network hiccup or busy lock), ULTRON uses its **Retry Engine**:
- Applies exponential backoff (1s, 2s, 4s).
- Inspects the failure reason to ensure the error is retryable.
- Never endlessly loops; halts and alerts the user if retries are exhausted or if an operation is non-retryable.
- Supports instant rollback via the **Undo System** for file modifications.

---

## 7. Secure Credential Vault (Windows DPAPI)

ULTRON v1.0.6 introduces a secure credential vault powered by **Windows Data Protection API (DPAPI)**:
- **Zero Plaintext Secrets**: API keys (NVIDIA, OpenAI, Gemini, Anthropic) and tokens are encrypted at rest using Windows hardware keys in `credentials_v2.vault`.
- Secrets are **never** stored in SQLite, logs, telemetry, prompts, or task history.
- **UI Management**:
  - Access via **Slide-Out Menu → Credential Vault** or **Settings → Security**.
  - Shows masked entries (e.g., `nvidia: ••••••••`).
  - Add, update, delete, or test connections with one click.

---

## 8. Plugin Architecture & Skill Store

ULTRON supports an extensible, secure plugin architecture:
- **Plugin Manifest**: Standardized `plugin.json` declaring id, version, permissions, tools, and publisher.
- **Trust Classifications**: `BUILT_IN`, `VERIFIED`, `USER_CREATED`, `UNVERIFIED`, `BLOCKED`.
- **Zero-Bypass Enforcement**: All plugin tools execute through the central Tool Registry and Permission Engine.
- **Skill Store UI**: Browse extensions by category (Productivity, Developer, Research, Windows, Android).

---

## 9. Long-Term Project Intelligence

ULTRON understands your workspace over time:
- Inspects real Git commits, architecture decisions, and build outcomes.
- Ask questions such as:
  - *"What changed in my project this week?"* -> Summarizes recent commits and file changes.
  - *"Why did we choose this architecture?"* -> Retrieves stored architectural decisions.
  - *"Log architecture decision: Used DPAPI for credential vault"* -> Persists decision to project intelligence.

---

## 10. Coding Agent 2.0 & Research Agent 2.0

### Coding Agent 2.0
- Comprehensive multi-file workflow: `Understand -> Inspect -> Plan -> Edit -> Test -> Diagnose -> Fix -> Verify -> Report`.
- Code search, syntax validation, build execution, test runner, and Git diff inspection.
- High-risk operations (e.g., file deletes, branch purges) trigger the Action Preview Gate.

### Research Agent 2.0
- Searches multiple web sources and synthesizes findings.
- Assigns truth certainty states: `CONFIRMED`, `CONFLICTING`, or `UNCERTAIN`.
- Preserves authoritative citations and URLs.

---

## 11. Window & Workspace Manager

ULTRON can manage your desktop workspace safely:
- *"Bring VS Code to the front"* -> Focuses the target window.
- *"Arrange my development windows"* -> Arranges coding windows side-by-side.
- *"Minimize background windows"* -> Minimizes non-essential windows.
- Automatically verifies window state after execution.

---

## 12. Action Risk Engine & Safety

Every tool call is categorized into one of four risk levels:
- **`LOW`**: Read-only operations, search, focus window, calculator. (Executed smoothly).
- **`MEDIUM`**: Writing code files, updating preferences, running non-destructive tests.
- **`HIGH`**: System configuration changes, process termination, network configuration. (Requires permission confirmation).
- **`IRREVERSIBLE`**: File deletions, repository resets, credential replacement. (Requires explicit preview approval).

---

## 13. Agent Debugger (Developer Mode)

For developers and power users, the **Agent Debugger** displays the observable decisions made during execution:
- Request -> Intent -> Context Sources -> Selected Model -> Selected Skill -> Selected Tools -> Risk Level -> Permission -> Execution -> Verification -> Result.
- Does **not** display private internal chain-of-thought or raw reasoning strings.

---

## 14. Productivity Analytics & Proactive Suggestions

- **Productivity Analytics**: View local statistics on completed missions, tasks, durations, and tool usage under **Slide-Out Menu → Productivity Analytics**.
- **Privacy Guaranteed**: Data remains strictly local and can be cleared at any time.
- **Smart Suggestions**: ULTRON can proactively suggest actions (e.g., *"Build failed. Want me to inspect the error?"*). Can be enabled or disabled in Settings.

---

## 15. Import / Export Configuration

Export or restore your ULTRON configuration:
- Backs up preferences, custom skills, workspace definitions, and mission templates.
- **Credentials are strictly excluded** from exports to maintain security.
- Import supports previewing and safely merging settings without overwriting active data.

---

## 16. Troubleshooting & FAQ

**Q: Why does ULTRON say "Verification failed" even if a command finished?**
A: ULTRON verifies physical reality (e.g., whether the output file exists or the process is running). Check the Task History modal to see the specific verification failure reason.

**Q: Where are my API keys stored?**
A: Keys are encrypted with Windows DPAPI in `%APPDATA%/ultron/credentials_v2.vault`. They are never written to SQLite or plain text files.

**Q: Can I use ULTRON offline?**
A: Yes. Switch mode to `OFFLINE` in the title bar or Settings. Local tools, window management, project intelligence, and memory work 100% locally.
