# Security Policy — ULTRON v1.0.6
*Personal AI Command Center by UPAI Technologies • Founder: Sukesh D.*

Security and system safety are foundational principles in the engineering of **ULTRON**. Because ULTRON interfaces directly with your Windows operating system and authorized Android mobile hardware, it enforces strict boundaries to protect user data, eliminate command injection risks, prevent credential leakage, and enforce zero-trust execution.

---

## 1. Intended Use & Authorization

ULTRON is designed **strictly for authorized personal use on the operator's own workstation and configured personal devices**.
- It is engineered as a defensive personal AI command center, agent operating layer, and developer automation assistant.
- It does not contain capabilities designed to bypass Windows security controls, disable User Account Control (UAC), circumvent antivirus protections, or perform unauthorized exploitation.
- Zero offensive security operations: ULTRON will never scan external networks, launch cyber attacks, or exploit software vulnerabilities.

---

## 2. Core Architectural Security Defenses

### A. Windows DPAPI Hardware Credential Vault
All sensitive credentials (API keys for NVIDIA, Gemini, OpenAI, Anthropic, phone PINs, and service tokens) are encrypted at rest using **Windows DPAPI (`safeStorage`)** in `credentials_v2.vault`.
- **Zero Plaintext Storage**: Secrets are **never** stored in SQLite database tables, chat logs, task history, diagnostics, telemetry, or model prompts.
- Displays are always masked in the UI.

### B. The Typed Tool Registry (No Arbitrary Shell Scripts)
Every operating system interaction is constrained to a typed, validated schema in `src/main/services/tools.registry.ts`. The agent cannot execute arbitrary untyped shell scripts or unreviewed model-generated PowerShell commands.

### C. Action Risk Engine
Every tool execution is evaluated by the central `ActionRiskEngine`:
- `LOW` -> Read-only operations.
- `MEDIUM` -> Reversible file changes.
- `HIGH` -> Configuration changes, process controls.
- `IRREVERSIBLE` -> File deletions, repository resets.
High and irreversible actions require explicit user confirmation via the Action Preview Gate.

### D. First-Class Verification Engine
ULTRON never assumes success because a process terminated. It verifies physical files, exit codes, process lists, and network responses before reporting completion.

### E. Safe Pre-Mutation Backups (Undo/Recovery)
Before any file edit, move, or rename is committed, ULTRON creates a safe snapshot in `data/backups/`. Users can rollback operations immediately via *"Undo what you just did"*.

### F. Task-Scoped Screen Memory Privacy
Screen analysis stores only temporary metadata (application name, window title, OCR text, confidence). Screen context is automatically cleared after task completion and can be discarded instantly with *"Forget the screen context"*. Zero continuous recording is performed.

### G. Zero Chain-of-Thought Exposure
Internal chain-of-thought and private model reasoning are never displayed or exposed in logs. Only structured observable pipeline events (`Understanding...`, `Planning...`, `Executing...`, `Verifying...`, `Completed.`) are emitted.

### H. Configuration Portability Without Secrets
The Import/Export system explicitly excludes credentials from exported configurations. Credentials cannot be exported into plaintext backup files.

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability, please submit a private security advisory through the official GitHub repository. We acknowledge receipt within 48 hours and deploy remediation prior to any public release.
