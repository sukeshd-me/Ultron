# Changelog

All notable changes to the **ULTRON** Personal AI Command Center are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.0.7] — Personal AI Operating Layer — 2026-09-06

### Summary

**ULTRON v1.0.7** transforms the command center into a **Personal AI Operating Layer** — a system that proactively manages your daily workflow, communications, focus sessions, and automations. ULTRON now understands your day, manages your inbox, switches context between workspaces, and can simulate missions before executing them.

### Highlights & New Capabilities

- **Daily Briefing System**: Auto-generated morning briefing with goals, tasks, system health, and recommended actions.
- **Focus Mode**: Dedicated sessions (CODING, RESEARCH, STUDY, CREATIVE, PLANNING) with timers and notification suppression.
- **Multiple Workspaces**: Named profiles (Development, Research, Study) with per-workspace context, apps, and directories.
- **Universal Inbox**: Aggregated notifications from system alerts, Android messages, task completions, and agent updates.
- **Automation Builder & Scheduled Missions**: Visual trigger → condition → action chains with cron-style recurrence.
- **Memory Control Center**: Scoped memory browser with safe forget, backup before deletion, and usage analytics.
- **Mission Simulation (Dry-Run)**: Preview execution without side effects — risk assessment and step-by-step plan preview.
- **Update Manager**: Check for updates from the official GitHub repository with version comparison and changelog preview.

### Services Added (16 new)

`communication.service.ts`, `inbox.service.ts`, `briefing.service.ts`, `focus.service.ts`, `workspace-manager.service.ts`, `continuity.service.ts`, `android-agent.service.ts`, `memory-control.service.ts`, `personality.service.ts`, `automation.service.ts`, `scheduler.service.ts`, `event-trigger.service.ts`, `explainability.service.ts`, `simulation.service.ts`, `workspace-backup.service.ts`, `update.service.ts`

### UI Components Added (7 new modals)

`DailyBriefingModal`, `FocusModeModal`, `WorkspacesModal`, `UniversalInboxModal`, `AutomationsModal`, `MissionSimulationModal`, `UpdateManagerModal`

### Integration

- All features accessible via Command Palette (Ctrl+K) and Slide-Out Menu.
- Agent loop updated with natural language fast-path for all new commands.
- 16 new IPC handler modules and Tools Registry expansions.

---

## [v1.0.6] — Intelligent Agent Core — 2026-09-06

### Summary

**ULTRON v1.0.6** introduces the **Intelligent Agent Core**, transforming ULTRON from a task assistant into a resilient, autonomous personal AI operating layer for Windows. It implements a complete deterministic agent lifecycle: `User Goal -> Understand -> Context -> Memory -> Plan -> Risk Analysis -> Permission -> Execute -> Verify -> Recover/Retry -> Remember -> Report`. With first-class physical verification, long-running Goal Memory, interactive Visual Mission Maps, Windows DPAPI Credential Vault, Action Risk Engine, and observable Agent Debugger, ULTRON never claims success without verifying reality.

### Highlights & New Capabilities

- **Goal Memory System**:
  - Persistent goals stored in SQLite with WAL mode: `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`, `ARCHIVED`.
  - Automatic context recovery for ongoing objectives (*"Continue the V1.0.6 work"*).
  - Links goals to missions, tasks, decisions, files, and Git activity without storing sensitive data.

- **Visual Mission Map**:
  - Interactive SVG DAG flow graph embedded directly into Agent Mission Mode.
  - Displays real-time step dependencies, node status badges, durations, and error details.
  - Seamless toggle between visual graph view and detailed step list.

- **First-Class Verification Engine**:
  - Centralized `VerificationService` executing concrete verification strategies:
    - `process_window`: Verifies application launch via process and window detection.
    - `filesystem`: Verifies file existence, sizes, and contents.
    - `build_artifact`: Verifies exit codes and generated output binaries/artifacts.
    - `web_navigation`: Verifies HTTP response codes and DOM titles.
    - `adb_device`: Verifies connected Android device states.
    - `research_source`: Verifies live retrieval of real external citations.
    - `mission_steps`: Verifies all mandatory mission steps have completed.
  - ULTRON rejects fake completion and never declares "Done" if verification fails.

- **Intelligent Retry & Recovery Engine**:
  - Automatic exponential backoff retry for transient network and process failures.
  - Safe error diagnosis distinguishing retryable errors from permanent failures.
  - Integrated rollback mechanism for safe pre-mutation file snapshots.

- **Agent Plugin Architecture & Skill Store Foundation**:
  - Standardized `plugin.json` schema specifying metadata, permissions, tools, and UI components.
  - Trust level classifications: `BUILT_IN`, `VERIFIED`, `USER_CREATED`, `UNVERIFIED`, `BLOCKED`.
  - Curated Skill Store categories: Productivity, Developer, Research, Windows, Android, Utilities.
  - All plugins execute strictly through the central Tool Registry and Permission Engine.

- **Secure Credential Vault (Windows DPAPI)**:
  - Hardware-backed encryption using Windows DPAPI (`credentials_v2.vault`).
  - Zero secret leakage: API keys and service tokens are scrubbed from SQLite, logs, telemetry, and prompts.
  - UI management under `Settings -> Security -> Credential Vault` with in-app connection testing.

- **Long-Term Project Intelligence**:
  - Scoped workspace intelligence inspecting Git commit logs, architecture decisions, and build outcomes over time.
  - Grounded historical inquiry (*"What changed this week?"*, *"Why did we choose this architecture?"*).

- **Coding Agent 2.0**:
  - Structured multi-file workflow: `Understand -> Inspect -> Plan -> Edit -> Test -> Diagnose -> Fix -> Verify -> Report`.
  - Project and dependency awareness, syntax verification, build/test execution, and Git diff inspection.
  - Action preview modal enforced for high-risk modifications.

- **Research Agent 2.0**:
  - Multi-source web search and fact extraction with authoritative citation preservation.
  - Explicit status classifications: `CONFIRMED`, `CONFLICTING`, or `UNCERTAIN`.

- **Action Risk Engine**:
  - Central risk evaluation categorizing actions as `LOW`, `MEDIUM`, `HIGH`, or `IRREVERSIBLE`.
  - Determines auto-execution eligibility, preview requirements, and mandatory audit trails.

- **Agent Debugger (Developer Mode)**:
  - Real-time observable pipeline event stream: Request, Intent, Model, Skill, Tools, Risk, Permission, Verification, Recovery, Result.
  - **Zero Chain-of-Thought exposure**: Displays structured observable decisions only.

- **Adaptive Context Manager**:
  - Intelligent context scoring and ranking across user goals, missions, project files, and conversation turns.
  - Prevents token blowout while ensuring local-only privacy.

- **Windows & Workspace Manager**:
  - Safe focus, minimize, maximize, and arrangement of development windows and applications.
  - State verification following window manipulation.

- **Local Productivity Analytics**:
  - Local aggregation of completed missions, task durations, tool usage, and success rates.
  - Optional and privacy-preserving with clear data wipe controls.

- **Smart Proactive Suggestions**:
  - Contextual suggestions (e.g., inspecting failed builds, waiting permissions) without silent action execution.

- **Configuration Portability (Import / Export)**:
  - Backup and restore settings, skills, workspaces, and mission templates.
  - Strictly excludes vault credentials by design.

- **ULTRON Command Center 2.0**:
  - Universal Command Palette (`Ctrl+K`) for instant navigation across all modals and tools.
  - High-DPI optimized obsidian interface with procedural Three.js neural core.

---

## [v1.0.5] — Agent Mission, Workflows, Documents, Recovery & Intelligence — 2026-09-06

### Summary

**ULTRON v1.0.5** evolves ULTRON from a reactive command assistant into an autonomous personal AI agent. ULTRON coordinates multi-step user goals through an integrated lifecycle: `Understand -> Context -> Memory -> Mission -> Plan -> Approval -> Execute -> Verify -> Recover -> Remember -> Respond`. It introduces first-class Mission Mode, multi-app Windows workflows, task-scoped screen memory, grounded document intelligence, action preview sandboxing, reversible file mutation recovery, user-created custom skills, a dedicated preference engine, defensive Security Center, detailed task history auditing, context compression, and verified safe repairs.

### Highlights & New Capabilities

- **Agent Mission System**:
  - Full multi-step goal management with dynamic step generation and dependency tracking.
  - Lifecycle states: `PLANNED`, `READY`, `RUNNING`, `WAITING_PERMISSION`, `COMPLETED`, `FAILED`, `SKIPPED`, `CANCELLED`.
  - First-class mission controls: Start, Pause, Resume, Cancel, and Retry Failed Step.
  - Interactive Mission Panel with real-time progress bar, step execution durations, and output logs.

- **Multi-App Windows Workflows**:
  - Structured orchestration of multiple Windows applications via `WorkflowPlanner`, `WorkflowExecutor`, and `WorkflowVerifier`.
  - Verified application sequencing with pre/post-launch verification checks.

- **Task-Scoped Screen Memory**:
  - Retains temporary visual context during screen inspection for contextual follow-up requests (*"Look at this error"* -> *"Fix the problem you just found"*).
  - Privacy-first metadata storage (application, window title, detected elements, OCR text, confidence).
  - Instant discard and explicit erasure via *"Forget the screen context"*. Zero continuous screen recording.

- **Document Intelligence Pipeline**:
  - Grounded extraction and parsing for PDF, Markdown, source code, and plain text.
  - Chunk indexing in SQLite memory database with semantic retrieval and grounded answers referencing specific document sections and pages.

- **Action Sandbox / Preview Gate**:
  - Pre-flight preview modal for complex missions, multi-file modifications, and consequential actions.
  - Interactive Approve, Cancel, and parameter review before execution.

- **Undo / Recovery System**:
  - Safe pre-mutation versioning and file snapshotting backed up to `data/backups/`.
  - Instant voice and text rollbacks (*"Undo what you just did"*, *"Redo"*) for reversible file edits, moves, and creations.
  - Clear reporting for irreversible actions with zero blind data overwrites.

- **Custom Skills Engine**:
  - User-defined skills configured via `Settings -> Skills` with name, triggers, capabilities, and strict permission manifests.
  - Declarative review requirement before activation; skills cannot silently self-elevate permissions.

- **Personal Preference Engine**:
  - Dedicated long-term preference store separated from general conversational memory (`Settings -> Preferences`).
  - Customizable defaults for preferred AI model, workspace path, response conciseness, and automated verification.

- **Personalized Home View**:
  - Clean, minimal HUD dashboard displaying real-time greeting, active missions count, pending approvals, current workspace, and live subsystem health.

- **Smart Notifications**:
  - Dismissible, non-intrusive notification toast stack for background mission completions, failures, and permission requests.

- **Defensive Security Center**:
  - Real-time defensive telemetry: Windows Defender status, Windows Firewall profile state, active listening ports, and defensive process monitors.
  - Discrete security posture states: `SECURE`, `WARNING`, `UNAVAILABLE`, `CHECK FAILED` (zero fake security scores).

- **Detailed Task History & Audit Log**:
  - Comprehensive, searchable execution log with millisecond latency timings, model latency, tool duration, status filters, and detailed inspect modals.
  - Zero-secret guarantee: API keys, tokens, and raw credentials are fully scrubbed from audit history.

- **Dynamic Context Compression**:
  - Automatic summarization of older conversational turns beyond 6 turns into structured contextual summaries, preventing token blowout while preserving critical task details.

- **Multi-Model Verification**:
  - Optional dual-model consensus verification for complex code generation, mission planning, and high-ambiguity technical diagnosis.

- **Local Network Awareness**:
  - Real-time network telemetry displaying active adapter, local IP, gateway, DNS servers, and safe non-intrusive latency diagnostics.

- **One-Click Safe Repair**:
  - Diagnostic automated remediation for common environment issues (database maintenance, ADB reconnection) with verified before-and-after checks (`FAIL -> REPAIR -> PASS`).

- **15-State Neural Core Procedural Kinematics**:
  - 3D Three.js GPU procedural particle shader dynamically reflecting all 15 agent states (`IDLE`, `LISTENING`, `THINKING`, `SEARCHING`, `ANALYZING`, `PLANNING`, `WAITING_PERMISSION`, `EXECUTING`, `VERIFYING`, `SUCCESS`, `ERROR`, `OFFLINE`, `PHONE_CONNECTED`, `SCREEN_ANALYZING`, `MISSION_RUNNING`).

---

## [v1.0.3] — Intelligent Personal AI Agent Release — 2026-09-05

### Summary

**ULTRON v1.0.3** elevates ULTRON from a command parser into a true Intelligent Personal AI Agent. ULTRON now naturally understands conversational English, plans and executes multi-step compound workflows (with parallel safe reads), maintains multi-turn context across queries, resolves target ambiguities, remembers user preferences, suppresses private chain-of-thought, and completely eliminates the repetitive command-fallback bug.

### Highlights & New Capabilities

- **Natural Conversational Intelligence**:
  - Full conversational question answering for general knowledge, technical concepts (*"What is RAM?"*, *"Explain cybersecurity"*), identity, and programming assistance (*"Help me write Python"*).
  - Permanent removal of repetitive *"I didn't understand that command. Try asking me to open an app..."* fallback response.
  - Zero private chain-of-thought exposed in the user interface; status transitions clearly display concise step progress (*"Checking phone..."*, *"Opening YouTube..."*, *"Verifying..."*, *"Done"*).
- **Compound & Multi-Step Agent Execution**:
  - Decomposes compound commands (*"Check my phone battery and open YouTube"*, *"Open VS Code and tell me my CPU usage"*).
  - Parallel execution for independent telemetry and safe read operations (`Promise.all`), sequential for dependent actions.
  - Unified natural conversational response synthesis for multi-tool outcomes.
- **Multi-Turn Conversation Context**:
  - Resolves pronouns and references (*"it"*, *"that"*, *"is that low?"*, *"on my phone"*, *"now"*) against conversational history.
  - Interactive target disambiguation (*"Open Chrome"* prompts *"Should I open Chrome on your PC or phone?"* when both are active).
- **Secure Memory & Preference Management**:
  - Natural commands to store (*"Remember that I prefer dark mode"*), query, and forget (*"Forget that"*) preferences in local SQLite memory.
  - Absolute privacy guarantee: Zero storage of API keys, PINs, or device credentials.

---

## [v1.0.2] — Voice Engine + Android Phone Control — 2026-09-05

### Summary

**ULTRON v1.0.2** introduces privacy-first local Speech-to-Text powered by OpenAI Whisper (`faster-whisper`), low-latency voice command pipelining directly into the autonomous agent loop, and comprehensive typed Android smartphone control via ADB—including launching 30+ apps, device contact resolution, call management, and a 12-state phone state machine.

### Highlights & New Capabilities

- **Local Speech-to-Text via OpenAI Whisper**:
  - Integrated persistent Python worker (`resources/scripts/whisper_worker.py`) using `faster-whisper` (CTranslate2).
  - 100% local audio processing: Microphone audio stays entirely on the local machine with zero external cloud egress.
  - Multi-model support: Hot-swap between `tiny.en`, `base.en`, `small.en`, and `turbo`.
  - Sub-500ms voice command recognition on standard CPU hardware.
- **Voice-Driven Agent Command Pipeline**:
  - Voice transcripts feed directly into the central autonomous agent loop and deterministic offline capability router.
  - End-to-end telemetry reporting: `audio_capture_ms`, `vad_ms`, `stt_ms`, `intent_ms`, `planning_ms`, `tool_ms`, `verification_ms`, and `total_ms`.
  - Sensitive data filtering: Secrets, PINs, and auth tokens are automatically redacted before voice action memories are committed to SQLite.
- **Reactive Voice HUD & Microphone UI**:
  - Visual microphone pulse animation with dynamic state indicators (`Idle`, `Recording`, `Transcribing`, `Executing`, `Completed`, `Error`).
  - Voice notice banner in the chat console displaying real-time speech transcripts and round-trip execution telemetry.
  - Dedicated Voice Engine section in Settings with pre-warming and live engine diagnostics.
- **Android App Control Subsystem**:
  - Curated registry of 30+ popular Android applications with aliases (WhatsApp, YouTube, Spotify, Camera, Maps, Settings, Chrome, etc.).
  - Fast-launching via ADB monkey intent resolution with cached package inspection.
  - Typed tools: `android.openApp`, `android.listApps`.
- **Android Phone & Call Management**:
  - Automated device contact search via Android content provider queries (`content query --uri content://com.android.contacts/data/phones`).
  - Contact resolution with ambiguity detection and local address book fallback.
  - Direct call initiation via `android.callContact` and `adb.makeCall`.
  - Active call termination via `android.endCall` (`KEYCODE_ENDCALL`).
  - Microphone mute toggling via `android.muteCall` (`KEYCODE_MUTE`).
  - 12-state phone lifecycle state machine via `android.getPhoneState`.
- **Production Windows NSIS Installer**:
  - Binary: `dist/ULTRON-Setup-1.0.2.exe` (104,848,615 bytes, ~100 MB)
  - Target: Windows 11 / Windows 10 x64
  - SHA-256 Checksum: `18F37E74573B0BDF74FA780DCE7630E6BE720A367C37B331D83CF0EB080EA945`
  - Automated Desktop and Start Menu shortcut generation
  - Clean uninstaller registered in Windows Settings
- **Production Verification**:
  - 27/27 Dedicated Voice & Android Control Tests Passed (100.0%).
  - 31/32 Architecture Audit Tests Passed (96.9%).
  - Zero TypeScript compilation errors (`npx tsc --noEmit`).
  - Clean production Electron + Vite SSR + NSIS packaging.
- **Comprehensive Documentation**:
  - Added [VOICE_GUIDE.md](VOICE_GUIDE.md) covering setup, command syntax, telemetry metrics, and Android architecture.

---

## [v1.0.1] — Major UI/UX + Onboarding + Hardware Security Vault — 2026-09-05

### Summary

**ULTRON v1.0.1** introduces a redesigned futuristic command-center experience by **UPAI Technologies** (Founder: Sukesh D.), featuring a streamlined first-run AI neural setup onboarding modal, dedicated phone security and zero-memory hardware PIN vaulting via Windows DPAPI, expanded ADB telephony controls, and real-time credential protection against AI context leakage.

### Highlights & New Capabilities

- **Zero-Storage Phone PIN & Hardware Credential Vault**:
  - Implemented `CredentialService` using Electron's `safeStorage` (Windows DPAPI hardware encryption) for secure PIN storage.
  - Absolute privacy guarantee: PINs are **never stored in SQLite database memory**, never written to audit logs, and never included in LLM context prompts.
  - Zero-storage execution: `adb.service.ts` passes the ephemeral PIN directly to the Android input pipeline without memory residency.
- **Enhanced Android ADB Automation**:
  - New tools `adb.wakeScreen` and `adb.unlockPhone` registered in the typed tools registry and context bridge.
  - Dedicated `PhoneSecurityModal` for instantaneous phone wake, screen unlock, and vaulted PIN management directly from the command center HUD.
- **Futuristic First-Run Onboarding Modal**:
  - `OnboardingModal.tsx` provides an interactive, sci-fi setup modal on first launch.
  - Immediate NVIDIA NIM neural core key verification with live latency testing and free key acquisition guidance.
  - One-click offline tool exploration fallback for completely disconnected operation.
- **Titlebar & Status HUD Evolution**:
  - Titlebar upgraded with `v1.0.1` status badge, UPAI Technologies branding, and quick-access triggers for AI Core setup and Phone Security.
  - Telemetry right-panel updated with active Hardware Vault status (DPAPI) and security enforcement indicator.
  - Settings panel redesigned with dedicated Phone Unlock PIN management, connection status, and test unlock diagnostic.
- **Production Windows NSIS Installer**:
  - Binary: `dist/ULTRON-Setup-1.0.1.exe` (~100 MB)
  - Target: Windows 11 / Windows 10 x64
  - SHA-256 Checksum: `3FF31C4CE95370586F9EF7425C057AAA6627B0CD7EBA1BB63DE2FE3409DC5711`
  - Automated Desktop and Start Menu shortcut generation
  - Clean uninstaller registered in Windows Settings
- **Unified Branding & Versioning**:
  - Consistent version update across `package.json`, Electron main process, preload bridge, web bridge, About UI, and documentation.
  - Formal attribution to **UPAI Technologies** and Founder **Sukesh D.**.
- **Production Verification**:
  - 32/32 Automated Architecture Tests Passed (100.0%).
  - Zero TypeScript compilation errors (`npx tsc --noEmit`).
  - Clean production Electron + Vite bundle compilation.

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
