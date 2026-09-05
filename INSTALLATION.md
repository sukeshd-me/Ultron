# ULTRON v1.0.1 — Complete Installation & Setup Guide
*Personal AI Command Center by UPAI Technologies • Founder: Sukesh D.*

This guide walks you through setting up **ULTRON v1.0.1** on Windows 11, from initial download and first-run AI onboarding to commanding your PC with conversational AI.

---

## 📋 System Prerequisites

Before installing, ensure your PC meets the basic specifications:

- **Operating System**: Windows 11 64-bit (or Windows 10 64-bit Build 19041+)
- **Processor**: 2.0 GHz dual-core x64 CPU (Intel Core i3/i5/i7/i9 or AMD Ryzen)
- **RAM**: 8 GB minimum (16 GB recommended for smooth multi-tasking)
- **Disk Space**: At least 2 GB available free space
- **Shell**: Windows PowerShell 5.1+ (pre-installed on Windows 11)
- **Display**: 1280 × 720 resolution or higher (responsive up to 4K 3840 × 2160)

> **Note on Graphics Cards**: A dedicated NVIDIA GPU is **not required** to use cloud AI reasoning in ULTRON. Cloud inference is processed via NVIDIA's distributed inference infrastructure. A dedicated GPU will, however, provide enhanced 60 FPS rendering for the 3D particle core.

---

## 🚀 Step-by-Step Installation (10 Steps)

Follow these 10 steps to install and configure ULTRON v1.0.1 for the first time:

### Step 1: Download ULTRON v1.0.1
Download the official production installer from the [Releases Page](https://github.com/sukeshd-me/Ultron/releases/tag/v1.0.1):
- **Installer Filename**: `ULTRON-Setup-1.0.1.exe`
- **Package Type**: Windows NSIS x64 Production Installer
- **File Size**: ~100 MB

### Step 2: Run the Installer
Locate the downloaded `ULTRON-Setup-1.0.1.exe` in your Downloads folder and double-click to run it.
- If prompted by Windows SmartScreen ("Windows protected your PC"), click **More info** and select **Run anyway**. This appears because the installer is an independent open-source binary.

### Step 3: Complete the Installation Wizard
Follow the standard NSIS Setup steps:
- Choose your preferred installation directory (default: `%LOCALAPPDATA%\Programs\ULTRON`).
- Ensure the options to create a **Desktop Shortcut** and **Start Menu Shortcut** are checked.
- Click **Install** and wait for the files to extract.

### Step 4: Launch ULTRON
Once the installation finishes:
- Check **Run ULTRON** and click **Finish**, or double-click the **ULTRON** shortcut on your Desktop.
- The futuristic command center interface and reactive 3D particle core will initialize.

### Step 5: First-Run AI Onboarding Modal
On your very first run, ULTRON automatically presents the **Connect ULTRON AI** onboarding dialog:
- **Title**: *Connect ULTRON AI*
- **Description**: *ULTRON can use NVIDIA-hosted AI models for advanced reasoning and responses.*
- If you have an NVIDIA API key: Enter it into the masked input field and click **Save & Continue**.
- If you don't have a key: Click **Get NVIDIA API Key** to open the official NVIDIA API Catalog in your browser, or click **Use Offline Mode** to start immediately with 100% functional local Windows tools.

### Step 6: Test the AI Connection (Optional)
- In the Onboarding dialog or in the **Settings** panel under the **AI** section, click **Test API Server**.
- ULTRON measures live round-trip latency to the NVIDIA inference gateway in milliseconds.
- A green badge confirms active cloud AI connectivity.

### Step 7: Android ADB Phone Pairing (Optional)
If you wish to control your Android smartphone:
- Connect your phone to your PC via USB cable and enable **USB Debugging** in Android Developer Options.
- ULTRON auto-detects connected devices over ADB.
- View real-time device identity, battery percentage, and Android version in the **System HUD** and **Phone Security** panel.

### Step 8: Configure Phone PIN Vault (Hardware Isolated)
For operations requiring phone unlocking:
- Click the phone icon or open **Phone Security** in Settings.
- Enter your 4-digit or 6-digit device PIN.
- ULTRON encrypts this credential using **Windows DPAPI (Data Protection API)** in a hardware-isolated vault file (`credentials.vault`).
- The PIN is **never** written to SQLite memory, chat logs, or sent over the network.

### Step 9: Select Your Desired AI Mode
In Settings or the top title bar status pill, toggle between:
- **`AUTO` (Recommended)**: Uses NVIDIA cloud AI when online and falls back smoothly to local deterministic tools if offline.
- **`ONLINE`**: Prioritizes cloud LLM reasoning with full natural-language synthesis.
- **`OFFLINE`**: Disables external cloud network calls; all local PC commands run immediately on your machine.

### Step 10: Start Commanding ULTRON!
Type any request into the chat bar or press the microphone button:
- *"Show my CPU and RAM"*
- *"Open Chrome"*
- *"What time is it?"*
- *"Check Wi-Fi status"*
- *"Unlock my phone"*
- Watch the 3D core pulse and witness verified real-time Windows automation!

---

## 🛠️ Developer Setup (Building from Source)

If you prefer building and running directly from source code:

```powershell
# 1. Ensure Node.js (v20+) and npm are installed
node --version
npm --version

# 2. Clone the repository
git clone https://github.com/sukeshd-me/Ultron.git
cd Ultron

# 3. Install npm packages
npm install

# 4. Copy environment template
Copy-Item .env.example .env

# 5. Verify TypeScript compiler
npx tsc --noEmit

# 6. Run the application in development mode
npm run dev

# 7. Package the production Windows installer
npm run build:win
```

The output installer will be placed in `dist/ULTRON-Setup-1.0.1.exe`.

---

## 🗑️ How to Uninstall ULTRON

If you ever need to remove ULTRON:
1. Open Windows **Settings** (`Win + I`).
2. Go to **Apps** → **Installed apps**.
3. Scroll to **ULTRON** (version 1.0.1).
4. Click the three dots (`...`) and choose **Uninstall**.
5. Alternatively, run the uninstaller directly from:
   ```
   %LOCALAPPDATA%\Programs\ULTRON\Uninstall ULTRON.exe
   ```
All application binaries and shortcuts will be cleanly removed.
*(Your local memory database in `data/` remains untouched unless manually deleted).*
