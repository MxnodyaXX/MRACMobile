@echo off
REM One-click firewall fix so your phone can reach the Expo dev server (port 8081).
REM Double-click this file. Click "Yes" on the blue Windows prompt.

REM --- Self-elevate to Administrator ---
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting administrator permission...
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo.
echo ============================================
echo   Opening firewall for Expo (port 8081)
echo ============================================
echo.

powershell -NoProfile -Command "try { Set-NetConnectionProfile -InterfaceAlias 'Wi-Fi' -NetworkCategory Private; Write-Host '[OK] Wi-Fi set to Private' } catch { Write-Host '[skip] Could not change Wi-Fi profile' }"

powershell -NoProfile -Command "if (-not (Get-NetFirewallRule -DisplayName 'Expo Metro 8081' -ErrorAction SilentlyContinue)) { New-NetFirewallRule -DisplayName 'Expo Metro 8081' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 8081 -Profile Any | Out-Null; Write-Host '[OK] Firewall rule added for port 8081' } else { Write-Host '[OK] Firewall rule already exists' }"

echo.
echo Done! You can close this window and re-scan the QR code.
echo.
pause
