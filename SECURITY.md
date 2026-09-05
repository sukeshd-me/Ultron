# Security Policy — ULTRON v1.0.5
*Personal AI Command Center by UPAI Technologies • Founder: Sukesh D.*

Security and system safety are foundational principles in the engineering of **ULTRON**. Because ULTRON interfaces directly with your Windows operating system and authorized Android mobile hardware, it enforces strict boundaries to protect user data, prevent credential leakage, eliminate command injection risks, and isolate sensitive authentication credentials.

---

## 1. Intended Use & Authorization

ULTRON is designed **strictly for authorized personal use on the operator's own workstation and configured personal devices**.
- It is engineered as a defensive personal AI command center and developer automation assistant.
- It does not contain capabilities designed to bypass Windows security controls, disable User Account Control (UAC), circumvent antivirus protections, or perform unauthorized exploitation.
- Zero offensive security operations: ULTRON will never scan external networks, launch cyber attacks, or exploit software vulnerabilities.

---

## 2. Core Architectural Security Defenses

### A. The Typed Tool Registry (No Arbitrary Shell Script Execution)
Every operating system interaction is constrained to a typed, validated schema in `src/main/services/tools.registry.ts`. The agent cannot execute arbitrary untyped shell scripts.

### B. Defensive Security Center
Located in **Settings → Security Center**, ULTRON displays authentic defensive telemetry:
- **Windows Defender**: Evaluates real-time antivirus status via WMI/PowerShell.
- **Windows Firewall**: Verifies Domain, Private, and Public profile operational states.
- **Listening Ports**: Enumerates active local listening TCP ports.
- **Process Defense**: Identifies non-standard background process executions.
- **Discrete Posture States**: `SECURE`, `WARNING`, `UNAVAILABLE`, `CHECK FAILED` (zero fake security scores).

### C. Action Sandbox & Preview Gate
Before executing consequential multi-step missions or modifying files, ULTRON renders an interactive action preview modal requiring explicit user confirmation.

### D. Safe Pre-Mutation Backups (Undo/Recovery)
Before any file edit, move, or rename is committed, ULTRON creates a safe snapshot in `data/backups/`. Users can rollback operations immediately via *"Undo what you just did"*.

### E. Task-Scoped Screen Memory Privacy
Screen analysis stores only temporary metadata (application name, window title, OCR text, confidence). Screen context is automatically cleared after task completion and can be discarded instantly with *"Forget the screen context"*. Zero continuous recording is performed.

### F. Windows DPAPI Hardware Credential Isolation
Sensitive credentials (such as the Android Phone PIN) are encrypted using **Windows DPAPI (`safeStorage`)** and stored in `%APPDATA%/ultron/credentials.vault`. PINs and secrets are **never** stored in SQLite memory tables, chat logs, or audit records.

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability, please submit a private security advisory through the official GitHub repository. We acknowledge receipt within 48 hours and work to deploy remediation prior to any public release.
