# Script to create desktop shortcuts for ULTRON
$desktop = [Environment]::GetFolderPath('Desktop')
$wsh = New-Object -ComObject WScript.Shell

# 1. Create ULTRON PowerShell Shortcut (.lnk)
$shortcutPath = Join-Path $desktop "ULTRON PowerShell.lnk"
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-NoExit -ExecutionPolicy Bypass -Command `"cd '$HOME\Desktop\ULTRON'; node cli.js`""
$shortcut.WorkingDirectory = "$HOME\Desktop\ULTRON"
$shortcut.Description = "ULTRON High-Speed AI Command Center"
$shortcut.Save()

# 2. Create ULTRON-CLI.bat
$cliBatPath = Join-Path $desktop "ULTRON-CLI.bat"
$cliBat = @"
@echo off
title ULTRON AI Command Center
cd /d "%USERPROFILE%\Desktop\ULTRON"
powershell -NoExit -ExecutionPolicy Bypass -Command "node cli.js"
"@
Set-Content -Path $cliBatPath -Value $cliBat

# 3. Create ULTRON-APP.bat
$appBatPath = Join-Path $desktop "ULTRON-APP.bat"
$appBat = @"
@echo off
title ULTRON GUI Launcher
cd /d "%USERPROFILE%\Desktop\ULTRON"
npm run dev
"@
Set-Content -Path $appBatPath -Value $appBat

Write-Host "✅ Created ULTRON PowerShell.lnk, ULTRON-CLI.bat, and ULTRON-APP.bat on Desktop!" -ForegroundColor Green
