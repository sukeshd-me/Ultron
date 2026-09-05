# ULTRON v1.0.2 — Voice & Android Phone Control Guide
**Product:** ULTRON — Personal AI Command Center  
**Company:** UPAI Technologies  
**Founder:** Sukesh D.  
**Version:** 1.0.2  

---

## 1. Overview & Architecture

ULTRON v1.0.2 introduces a privacy-first, low-latency voice command pipeline and typed Android phone control subsystem. Everything is processed locally on your machine:
- **Local Speech-to-Text:** Powered by OpenAI Whisper via the high-performance `faster-whisper` (CTranslate2) Python runtime.
- **Zero Cloud Leakage:** Audio frames never leave your local hardware. Microphone audio is processed in-memory and transcribed directly on CPU or GPU.
- **Direct Agent Loop Integration:** Transcripts feed directly into ULTRON's deterministic offline capability router and autonomous agent loop.
- **Typed Android ADB Control:** Open 30+ Android apps, search device contacts, initiate calls, mute/end calls, and query a 12-state phone state machine.

```
[ Microphone ]
      │
      ▼ MediaRecorder (WebM/Opus or PCM WAV)
[ Bridge / Preload ]
      │ IPC: voice:processCommand
      ▼
[ Whisper Service ] ── Stdin/Stdout JSON-RPC ──► [ whisper_worker.py (faster-whisper) ]
      │ (stt_ms, vad_ms)
      ▼
[ Agent Loop / Router ] ── Intent Parsing ──► [ Tools Registry ]
      │                                              │
      │                                              ├── android.openApp
      │                                              ├── android.callContact
      │                                              ├── android.endCall
      │                                              ├── android.muteCall
      │                                              └── android.getPhoneState
      ▼
[ Memory Subsystem ] ── Secret Redaction ──► SQLite (ul_memories)
      │
      ▼
[ UI Telemetry Banner & Audio Pulse Feedback ]
```

---

## 2. Prerequisites & Installation

### Local Python & Whisper Engine
ULTRON communicates with a background worker script located at `resources/scripts/whisper_worker.py`.

1. Ensure Python 3.10+ is installed on your system.
2. Install `faster-whisper`:
   ```bash
   pip install faster-whisper
   ```
3. *(Optional for GPU acceleration)*:
   If you have an NVIDIA GPU with CUDA:
   ```bash
   pip install torch --index-url https://download.pytorch.org/whl/cu121
   ```
   CTranslate2 will automatically utilize GPU acceleration when configured.

### Android Debug Bridge (ADB) Setup
To control your Android smartphone:
1. Enable **Developer Options** on your Android device:
   - Go to **Settings > About Phone** and tap **Build Number** 7 times.
2. Enable **USB Debugging** (and **USB Debugging (Security settings)** if on Xiaomi/MIUI/HyperOS or Oppo/Realme/ColorOS).
3. Connect your phone via USB cable and authorize your PC when prompted on screen.
4. Verify connection in a terminal:
   ```bash
   adb devices
   ```
   Your device should appear as `device`.
5. *(Optional)* ADB path can be configured in ULTRON settings or placed in standard locations (e.g. `E:\ULTRON\Tools\ADB\adb.exe` or on system `PATH`).

---

## 3. Supported Whisper Models

ULTRON allows switching between Whisper model profiles in real-time via the Settings panel:

| Model | Weights Size | Recommended Hardware | Primary Use Case |
|---|---|---|---|
| `tiny.en` | ~75 MB | Any CPU | Ultra-fast command recognition (~150-300ms) |
| `base.en` | ~145 MB | Standard CPU | High accuracy English voice control |
| `small.en`| ~480 MB | Multi-core CPU / GPU | Enhanced conversational speech |
| `turbo`   | ~1.6 GB | Modern CPU / Dedicated GPU | State-of-the-art multilingual speed & precision |

To pre-warm or test the engine, open **Settings > Voice Engine Settings** and click **Warm Up Engine**.

---

## 4. Voice Commands Reference

### Android App Launching
ULTRON includes a fuzzy-matching registry covering over 30 popular Android applications and system utilities:
- *"Open YouTube on my phone"*
- *"Launch WhatsApp"*
- *"Open Camera"*
- *"Open Spotify"*
- *"Launch Google Maps"*
- *"Open Settings"*
- *"Open Calculator"*
- *"Open Chrome"*
- *"Open Gallery / Photos"*
- *"Open Telegram"*

### Phone & Call Controls
- *"Call Sukesh"* — Searches device contacts and configured contacts, resolves phone number, and initiates dialing.
- *"Call Mom"*
- *"Dial 9876543210"*
- *"Hang up"* / *"End call"* — Terminates active call immediately via `KEYCODE_ENDCALL`.
- *"Mute call"* / *"Unmute phone"* — Toggles microphone mute via `KEYCODE_MUTE`.
- *"What is my phone status?"* — Checks connection, lock screen state, and telecom call status.

### System & Productivity Commands
- *"What is the time?"*
- *"Check system status"*
- *"Remember that my favorite framework is React"*
- *"Show my stored memories"*
- *"Take a screenshot"*

---

## 5. Phone State Machine

ULTRON monitors and reports 12 distinct phone lifecycle states via `android.getPhoneState`:

1. `DISCONNECTED`: No Android device detected over ADB.
2. `CONNECTING`: Device detected in unauthorized, bootloader, or recovery state.
3. `CONNECTED`: Device connected and authorized.
4. `LOCKED`: Screen is off or keyguard is active.
5. `UNLOCKED`: Device is active with screen unlocked.
6. `IDLE`: Device connected with no active calls.
7. `RINGING`: Inbound call detected (`mCallState=1`).
8. `IN_CALL`: Call active or off-hook (`mCallState=2`).
9. `CALL_HELD`: Call placed on hold.
10. `SECOND_CALL`: Second incoming/active call present.
11. `CALL_MERGED`: Calls merged into conference.
12. `CALL_ERROR`: Telephony service could not be queried or returned an error.

### Technical Note on Call Hold & Merge
> [!NOTE]
> Standard Android ADB debug permissions grant telephony dialing (`CALL` intents) and key events (`KEYCODE_ENDCALL`, `KEYCODE_MUTE`). However, placing a carrier call on hold or merging two active calls into a 3-way conference typically requires carrier-level InCallService privileges, device root, or dedicated Android accessibility automation.
> 
> ULTRON adheres strictly to honesty and safety standards: rather than simulating unverified operations, ULTRON safely queries call states and informs the user when carrier constraints require manual screen interaction.

---

## 6. Performance Telemetry

Every voice command measures exact timings with high-resolution timers (`performance.now()`). ULTRON never fakes execution time.

| Metric | Description | Typical Target |
|---|---|---|
| `audio_capture_ms` | Time elapsed during user audio recording | Variable (user speech length) |
| `vad_ms` | Voice activity detection & speech window alignment | ~15–30 ms |
| `stt_ms` | Local Whisper transcription latency | ~200–500 ms (tiny.en) |
| `intent_ms` | Offline capability matching & semantic routing | ~1–5 ms |
| `planning_ms` | Agent tool plan formulation | ~2–10 ms |
| `tool_ms` | Execution of ADB command or system utility | ~50–180 ms |
| `verification_ms` | Post-action state verification | ~10–30 ms |
| `total_ms` | End-to-end command round-trip latency | **< 600 ms** (local tools) |

Telemetry data is emitted with each command execution and displayed in the voice notice banner and chat report.

---

## 7. Privacy & Security Assurance

1. **Local Transcription:** Audio recordings are processed on the host machine and immediately discarded from memory once transcribed. No audio buffers are written to persistent disk.
2. **Credential Redaction:** Voice transcripts that enter the memory subsystem pass through strict regex filters to redact API keys, PINs, passwords, and tokens before SQLite persistence.
3. **No Lock Screen Bypass:** ULTRON will never attempt to exploit, brute-force, or bypass your device's lock screen security credentials.

---
*ULTRON v1.0.2 is designed and developed by UPAI Technologies. Founder: Sukesh D.*
