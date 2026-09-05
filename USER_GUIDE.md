# ULTRON v1.0.5 — User Guide & Operations Manual
*Personal AI Command Center by UPAI Technologies • Founder: Sukesh D.*

Welcome to the **ULTRON v1.0.5 User Guide**. This manual details how to operate the command center as an autonomous personal AI agent, create and coordinate missions, execute multi-app Windows workflows, leverage task-scoped screen memory, interact with documents, execute safe undo/recovery, create custom skills, manage preferences, and review defensive security.

---

## Table of Contents
1. [User Interface Overview](#1-user-interface-overview)
2. [Operating Modes (AUTO / ONLINE / OFFLINE)](#2-operating-modes)
3. [Agent Mission Mode & Action Sandbox](#3-agent-mission-mode--action-sandbox)
4. [Multi-App Windows Workflows](#4-multi-app-windows-workflows)
5. [Task-Scoped Screen Memory & Privacy](#5-task-scoped-screen-memory--privacy)
6. [Document Intelligence Pipeline](#6-document-intelligence-pipeline)
7. [Undo & Reversible Recovery System](#7-undo--reversible-recovery-system)
8. [Custom Skills & Permission Manifests](#8-custom-skills--permission-manifests)
9. [Personal Preference Engine](#9-personal-preference-engine)
10. [Defensive Security Center](#10-defensive-security-center)
11. [Detailed Task History & Audit Log](#11-detailed-task-history--audit-log)
12. [One-Click Safe Repair & Diagnostics](#12-one-click-safe-repair--diagnostics)
13. [Troubleshooting & FAQ](#13-troubleshooting--faq)

---

## 1. User Interface Overview

ULTRON v1.0.5 features a pure obsidian dark interface designed for clarity, zero clutter, and instantaneous response:

1. **Title Bar HUD**:
   - Identity: **ULTRON v1.0.5**, **UPAI Technologies** (Founder: **Sukesh D.**).
   - Mode Indicator Badge: `AUTO`, `ONLINE`, or `OFFLINE`.
   - Action Buttons: **Missions**, **History**, **Documents**, **Security**, **Skills**, and **Settings**.
2. **The 3D Reactive Neural Core**:
   - GPU-accelerated Three.js procedural particle sphere dynamically reflecting 15 agent states (`IDLE`, `LISTENING`, `THINKING`, `PLANNING`, `WAITING_PERMISSION`, `EXECUTING`, `VERIFYING`, `SUCCESS`, `ERROR`, `MISSION_RUNNING`, `SCREEN_ANALYZING`, etc.).
3. **Chat & Agent Console**:
   - Multi-turn conversation feed displaying real-time agent thoughts, step progression, tool invocation metrics, and verifiable conclusions.
4. **Bottom Command Bar**:
   - Prompt input with keyboard submit (`Enter`).
   - Push-to-Talk microphone button for instant local voice transcription via Whisper.
   - Quick action suggestions.
5. **Right Telemetry HUD & Status**:
   - Real-time CPU, RAM, Disk, active network adapter, and phone connectivity metrics.

---

## 2. Operating Modes

Switch modes from the title bar indicator or in **Settings → AI**:

- **`AUTO` Mode**: Prioritizes cloud LLM reasoning when connected, and gracefully falls back to deterministic local tools when disconnected.
- **`ONLINE` Mode**: Utilizes cloud AI planning with full conversational reasoning.
- **`OFFLINE` Mode**: 100% operational local execution with zero internet egress, local tool execution, and local database memory.

---

## 3. Agent Mission Mode & Action Sandbox

Missions represent complex, multi-step goals coordinated by ULTRON.

### Creating and Running a Mission
- Natural language goal: *"Prepare my ULTRON project for release."*
- ULTRON plans structured steps:
  1. Inspect project structure
  2. Check Git working tree
  3. Run automated tests
  4. Fix approved lint issues
  5. Build production application
  6. Verify installer binary
  7. Generate release report

### Mission Lifecycle Controls
- **Start**: Begin planned steps sequentially.
- **Pause**: Temporarily suspend execution before the next step.
- **Resume**: Continue execution from the paused step.
- **Retry Failed Step**: Re-execute a failed step after resolving external issues.
- **Cancel**: Abort the mission cleanly at any time.

### Action Sandbox / Preview Gate
For high-impact workflows, significant file edits, or system operations, ULTRON automatically presents an **Action Preview Modal**:
- Review affected targets, planned commands, and reversible status.
- Click **Approve** to execute or **Cancel** to abort.

---

## 4. Multi-App Windows Workflows

ULTRON safely coordinates multiple Windows applications through structured workflows:
- Example: *"Open VS Code, open my ULTRON project, start the development server, then open the website in the browser."*
- Executed via `WorkflowPlanner`, `WorkflowExecutor`, and `WorkflowVerifier`.
- Pre-launch verification checks if applications are already running.
- Post-launch verification validates window appearance and process health.

---

## 5. Task-Scoped Screen Memory & Privacy

ULTRON provides visual understanding with strict privacy boundaries:
- Screen analysis retains temporary context for the current task:
  - User: *"Look at this error."* → ULTRON captures screen, extracts error metadata.
  - User: *"Fix the problem you just found."* → ULTRON references the stored error without re-capturing.
- **Privacy Guarantees**:
  - Zero continuous background recording.
  - Stored data is metadata-only (application, window title, OCR text, confidence).
  - Explicit erasure on command: *"Forget the screen context."*

---

## 6. Document Intelligence Pipeline

Index, query, and compare local files with grounded references:
- **Supported Formats**: PDF, Markdown (`.md`), Source code (`.ts`, `.js`, `.py`, `.json`), and plain text (`.txt`).
- **Pipeline**: Document → Type Detection → Text Extraction → Semantic Chunking → SQLite Storage → Retrieval → Grounded Answer.
- **Example Queries**:
  - *"What does this PDF say about authentication?"*
  - *"Summarize the release requirements in this document."*
  - *"Compare these two specification files."*
- Answers provide precise document citations with page and section references.

---

## 7. Undo & Reversible Recovery System

ULTRON safeguards your files with an automated pre-mutation recovery system:
- **Snapshot Backups**: Prior to modifying, moving, or deleting files, ULTRON snapshots the original version to `data/backups/`.
- **Natural Voice & Text Rollback**:
  - *"Undo what you just did."* → Restores previous file content or state.
  - *"Redo the change."* → Re-applies the change if safe.
- Non-reversible actions are explicitly flagged: *"That action cannot be automatically undone."*

---

## 8. Custom Skills & Permission Manifests

Create and manage custom agent skills in **Settings → Skills**:
- Define skill name, description, trigger phrases, and target workflows.
- Assign granular permissions (e.g. `filesystem:read`, `terminal:restricted`, `network:ask`).
- Skills require explicit user review before activation and cannot silently self-elevate permissions.

---

## 9. Personal Preference Engine

Configure persistent preferences in **Settings → Preferences**:
- **Preferred AI Model**: Select fast models for casual queries, deep models for complex reasoning.
- **Default Workspace**: Set the root directory for automated project commands.
- **Response Style**: Toggle between `concise`, `balanced`, or `detailed`.
- **Multi-Model Verification**: Enable automated secondary model review for critical coding tasks.

---

## 10. Defensive Security Center

Inspect real defensive security telemetry in **Settings → Security Center**:
- **Windows Defender**: Active status, real-time protection, and definition state.
- **Windows Firewall**: Profile state (Domain, Private, Public).
- **Listening Ports**: Active TCP listening ports on the local workstation.
- **Process Defense**: Monitoring for suspicious or unauthorized process spawns.
- **Discrete Posture States**: `SECURE`, `WARNING`, `UNAVAILABLE`, `CHECK FAILED` (zero fake security scores).

---

## 11. Detailed Task History & Audit Log

Access the comprehensive execution history via the **History** button:
- Detailed breakdown of every tool execution, mission, and background task.
- Sub-millisecond latency telemetry: model planning latency, tool duration, and verification time.
- Filter by category: `ALL`, `MISSIONS`, `WINDOWS`, `FILES`, `SECURITY`, `SYSTEM`, `AI`.
- Zero secret storage: API keys, passwords, and tokens are permanently scrubbed.

---

## 12. One-Click Safe Repair & Diagnostics

When local issues occur (e.g. database maintenance required, ADB service disconnected):
- Open **Safe Repair** from the HUD menu.
- View exact explanation of the issue and proposed remediation.
- Click **Repair**: ULTRON applies the safe remediation and immediately re-runs diagnostics to verify resolution (`FAIL → REPAIR → PASS`).

---

## 13. Troubleshooting & FAQ

**Q: Where are my backups and SQLite memory stored?**  
A: File recovery snapshots are stored in `data/backups/`, while persistent memory is stored in `data/ultron_memory.sqlite`.

**Q: How do I clear screen memory?**  
A: Simply say or type *"Forget the screen context"* or click Clear in the status HUD.

**Q: Does ULTRON support continuous voice listening?**  
A: No. Continuous listening and wake-words are intentionally excluded in v1.0.5 for privacy and performance. Audio is captured only while holding or clicking the microphone button.
