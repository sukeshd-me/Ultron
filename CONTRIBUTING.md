# Contributing to ULTRON

Thank you for your interest in contributing to **ULTRON**! As an open-source project, we welcome bug fixes, documentation enhancements, new typed tools, and architectural improvements.

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please treat all maintainers and contributors with respect and professionalism.

---

## Getting Started

### 1. Prerequisites
- **Operating System**: Windows 11 (or Windows 10 64-bit Build 19041+)
- **Node.js**: v20.0.0 or higher
- **Package Manager**: `npm` v10+
- **Git**: Installed and configured

### 2. Fork and Clone
```powershell
# Fork the repository on GitHub, then clone your fork:
git clone https://github.com/<your-username>/Ultron.git
cd Ultron
```

### 3. Install Dependencies
```powershell
npm install
```

### 4. Configure Environment
Copy the sample environment file:
```powershell
Copy-Item .env.example .env
```
Add an optional `NVIDIA_API_KEY` if you want to test cloud AI features.

---

## Development Workflow

### Run in Development Mode
Launch Electron with Hot Module Replacement (HMR):
```powershell
npm run dev
```

### Verify TypeScript Types
All code must pass static type checking with zero errors before submitting a pull request:
```powershell
npx tsc --noEmit
```

### Build Production Assets
Validate that the Vite bundler compiles both main and renderer processes cleanly:
```powershell
npm run build
```

### Run Test Verification
Execute the automated architecture verification test suite:
```powershell
node test/run_agent_architecture_tests.js
```

---

## Adding New Windows Tools

When proposing or implementing new automation tools:
1. **Safety First**: Tools must execute deterministic actions. Never accept or pass raw unvalidated shell strings from the LLM.
2. **Type Safety**: Create parameter and return interfaces in `src/shared/tools/tool.types.ts`.
3. **Register in ToolsRegistry**: Implement the tool within `src/main/services/tools.registry.ts`.
4. **Add Verification**: Include tests verifying that the tool succeeds on Windows and safely reports errors when invalid parameters are supplied.

---

## Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names:
   - `feat/add-audio-tool`
   - `fix/wifi-adapter-parsing`
   - `docs/update-installation-guide`
2. **Commit Messages**: Write concise, conventional commit messages:
   - `feat: add system.getUptime tool`
   - `fix: handle null return in adb.getDevices`
   - `docs: update developer guide`
3. **Quality Gates**: Ensure:
   - `npx tsc --noEmit` passes with 0 errors.
   - `npm run build` succeeds.
   - No private files (`.env`, `*.sqlite`, `*.log`) are staged.

---

## Reporting Bugs & Suggesting Features

- **Bug Reports**: Open an issue on GitHub with a clear description, reproduction steps, Windows version, and logs.
- **Feature Requests**: Open a discussion on GitHub explaining the proposed feature, the use case, and proposed tool schema.
- **Security Vulnerabilities**: See [SECURITY.md](SECURITY.md) for private reporting instructions.

---

## License Information

> [!IMPORTANT]
> **License Status**: The ULTRON project is currently in transition to an official open-source license. An official licensing decision (e.g., MIT, Apache-2.0, or Proprietary) is pending determination by the project creator ([Sukesh D](https://github.com/sukeshd-me)). 
>
> In accordance with open-source governance best practices, until an explicit `LICENSE` file is committed to the repository root by the project owner, all source code remains Copyright © 2026 ULTRON. Contributors submitting pull requests agree to license their contributions under whichever open-source license the project author ultimately selects.
