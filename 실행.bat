@echo off
setlocal enabledelayedexpansion

REM ---- Force Windows system PATH (user's PATH is missing System32) ----
set "PATH=%SystemRoot%\System32;%SystemRoot%;%SystemRoot%\System32\Wbem;%SystemRoot%\System32\WindowsPowerShell\v1.0;%PATH%"

set "APPDIR=%~dp0"
if "%APPDIR:~-1%"=="\" set "APPDIR=%APPDIR:~0,-1%"
cd /d "%APPDIR%" 2>nul

echo.
echo  =======================================
echo    Proposal MD Converter
echo  =======================================
echo    Folder: %APPDIR%
echo.

set "NODE=%APPDIR%\runtime\node.exe"
if not exist "%NODE%" (
    echo  [ERROR] node.exe not found at:
    echo          %NODE%
    goto :end_fail
)

REM ---- Write a tiny probe script (avoid heavy quoting on one line) ----
set "PROBE_PS1=%APPDIR%\runtime\_probe.ps1"
echo $ErrorActionPreference='SilentlyContinue'> "%PROBE_PS1%"
echo try {>> "%PROBE_PS1%"
echo   $c = New-Object Net.Sockets.TcpClient>> "%PROBE_PS1%"
echo   $iar = $c.BeginConnect('127.0.0.1',3000,$null,$null)>> "%PROBE_PS1%"
echo   if ($iar.AsyncWaitHandle.WaitOne(800,$false) -and $c.Connected) { $c.Close(); exit 0 } else { $c.Close(); exit 1 }>> "%PROBE_PS1%"
echo } catch { exit 1 }>> "%PROBE_PS1%"

REM ---- Step 1: server already responding? ----
call :probe
if "!READY!"=="1" (
    echo  [Info] Server already running. Opening browser...
    start "" "http://localhost:3000"
    goto :end_ok
)

REM ---- Step 2: kill any zombie on port 3000 ----
set "ZOMBIE_PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
    set "ZOMBIE_PID=%%P"
)
if not "!ZOMBIE_PID!"=="" (
    echo  [Info] Killing stale PID !ZOMBIE_PID! on port 3000...
    taskkill /F /PID !ZOMBIE_PID! >nul 2>&1
    timeout /t 2 /nobreak >nul
)

REM ---- Step 3: start the server (minimized window) ----
echo  [Info] Starting server...
start "Proposal MD Converter - Server" /min /d "%APPDIR%" "%NODE%" "app.js"

REM ---- Step 4: poll up to 30 seconds ----
echo  [Info] Waiting for server to be ready...
set "READY=0"
for /l %%i in (1,1,30) do (
    timeout /t 1 /nobreak >nul
    call :probe
    if "!READY!"=="1" goto :ready
)
:ready

if "!READY!"=="0" (
    echo.
    echo  [ERROR] Server did not respond within 30 seconds.
    echo          Open the minimized "Proposal MD Converter - Server" window
    echo          from the taskbar to see the actual Node.js error message.
    goto :end_fail
)

echo  [Info] Server is ready. Opening browser...
start "" "http://localhost:3000"

echo.
echo  Running. The server is in a separate (minimized) window on the taskbar.
echo  Close that server window to stop the tool.
goto :end_ok

REM ============================================================
:probe
set "READY=0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%PROBE_PS1%" >nul 2>&1
if !errorlevel! equ 0 set "READY=1"
exit /b 0

REM ============================================================
:end_ok
echo.
echo  Press any key to close...
pause >nul
endlocal
exit /b 0

:end_fail
echo.
echo  Press any key to close...
pause >nul
endlocal
exit /b 1
