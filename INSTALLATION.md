# ULTRON v1.0.0 — Complete Installation & Setup Guide

This guide walks you through setting up **ULTRON** on Windows 11, from initial download to commanding your PC with AI.

---

## 📋 System Prerequisites

Before installing, ensure your PC meets the basic specifications:

- **Operating System**: Windows 11 64-bit (or Windows 10 64-bit Build 19041+)
- **Processor**: 2.0 GHz dual-core x64 CPU (Intel or AMD)
- **RAM**: 8 GB minimum (16 GB recommended)
- **Disk Space**: At least 2 GB available free space
- **Shell**: Windows PowerShell 5.1+ (pre-installed on Windows 11)
- **Display**: 1280 × 720 resolution or higher

> **Note on Graphics Cards**: A dedicated NVIDIA GPU is **not required** to use cloud AI reasoning in ULTRON.

---

## 🚀 Step-by-Step Installation (10 Steps)

Follow these 10 steps to install and configure ULTRON for the first time:

### Step 1: Download ULTRON v1.0.0
Download the official production installer from the [Releases Page](https://github.com/sukeshd-me/Ultron/releases/tag/v1.0.0):
- **Installer Filename**: `ultron-setup-1.0.0.exe` (or `ULTRON-Setup-1.0.0.exe`)
- **Package Type**: Windows NSIS x64 Installer
- **File Size**: ~99.9 MB

### Step 2: Run the Installer
Locate the downloaded `.exe` file in your Downloads folder and double-click to run it.
- If prompted by Windows SmartScreen ("Windows protected your PC"), click **More info** and select **Run anyway**. This appears because the installer is an independent open-source binary.

### Step 3: Complete the Installation Wizard
Follow the standard NSIS Setup steps:
- Choose your preferred installation directory (default: `%LOCALAPPDATA%\Programs\ULTRON`).
- Ensure the options to create a **Desktop Shortcut** and **Start Menu Shortcut** are checked.
- Click **Install** and wait for the files to extract.

### Step 4: Launch ULTRON
Once the installation finishes:
- Check **Run ULTRON** and click **Finish**, or double-click the **ULTRON** shortcut on your Desktop.
- The cyberpunk HUD and 3D particle core will initialize.

### Step 5: Open the Settings Panel
- Move your cursor to the left sidebar and click on the **Settings** gear icon (⚙️) to open the configuration dashboard.

### Step 6: Configure NVIDIA API Key (For Cloud Reasoning)
If you wish to use cloud-accelerated intelligence:
- Obtain a free API key from [NVIDIA AI Foundation / Build](https://build.nvidia.com).
- Paste your key into the **API Key** input field in the Settings panel.
- Click **Save Key**.
*(If you do not have an API key, don't worry! ULTRON runs in 100% functional OFFLINE mode without it).*

### Step 7: Test the AI Connection
- Click the **Test API Server** button right next to the API key field.
- ULTRON will send a lightweight probe to NVIDIA's inference gateway and display connection latency in milliseconds.
- A green confirmation indicates you are connected to the cloud AI models.

### Step 8: Configure Android ADB Path (Optional)
If you plan to inspect or control your Android phone:
- Connect your phone to your PC with a USB cable and enable **USB Debugging** on the phone.
- If `adb.exe` is already in your Windows PATH, ULTRON detects it automatically.
- If installed in a custom location (e.g. `C:\platform-tools\adb.exe`), specify the path in Settings and click **Save**.

### Step 9: Select Your Desired AI Mode
In Settings or from the top quick switcher, select your operating mode:
- **`AUTO` (Recommended)**: Automatically uses cloud AI when available and falls back smoothly to local deterministic tools if offline.
- **`ONLINE`**: Prioritizes cloud LLM reasoning with full natural-language synthesis.
- **`OFFLINE`**: Disables external cloud network calls; all local PC commands run immediately on your machine.

### Step 10: Start Using ULTRON!
Navigate back to the **Command Center** tab:
- Try asking: *"Show my CPU and RAM"*
- Try asking: *"Open Chrome"*
- Try asking: *"What time is it?"*
- Watch the 3D core respond and the command execute live on your Windows machine!

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

The output installer will be placed in `dist/ultron-setup-1.0.0.exe`.

---

## 🗑️ How to Uninstall ULTRON

If you ever need to remove ULTRON:
1. Open Windows **Settings** (`Win + I`).
2. Go to **Apps** → **Installed apps**.
3. Scroll to **ULTRON** (version 1.0.0).
4. Click the three dots (`...`) and choose **Uninstall**.
5. Alternatively, run the uninstaller directly from:
   ```
   %LOCALAPPDATA%\Programs\ULTRON\Uninstall ULTRON.exe
   ```
All application binaries and shortcuts will be cleanly removed.
*(Your local memory database in `data/` remains untouched unless manually deleted).*
