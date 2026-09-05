# Changelog

All notable changes to the **ULTRON** Personal AI Command Center are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
