@echo off
echo ====================================
echo LightOS System Diagnostics
echo ====================================
echo.

echo [1/6] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo.
    echo Solution: Download and install Node.js from https://nodejs.org/
    echo After installation, restart Command Prompt
    pause
    exit /b 1
) else (
    node --version
    echo OK: Node.js is installed
)
echo.

echo [2/6] Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found
    pause
    exit /b 1
) else (
    npm --version
    echo OK: npm is installed
)
echo.

echo [3/6] Checking project files...
if not exist "package.json" (
    echo ERROR: package.json not found
    echo Current directory: %CD%
    echo.
    echo Solution: Run this script from LightOS project root folder
    pause
    exit /b 1
) else (
    echo OK: package.json found
)

if not exist "app" (
    echo ERROR: app folder not found
    pause
    exit /b 1
) else (
    echo OK: app folder found
)
echo.

echo [4/6] Checking node_modules...
if not exist "node_modules" (
    echo WARNING: node_modules not found (dependencies not installed)
    echo This is normal for first-time setup
) else (
    echo OK: node_modules found
)
echo.

echo [5/6] Checking port 3000...
netstat -ano | findstr ":3000" > nul
if %errorlevel% equ 0 (
    echo WARNING: Port 3000 is already in use
    echo Another application may be using it
    netstat -ano | findstr ":3000"
    echo.
    echo Solution: start.bat will use port 3001 instead
) else (
    echo OK: Port 3000 is available
)
echo.

echo [6/6] Checking dependencies installation...
if exist "node_modules\next" (
    echo OK: Next.js is installed
) else (
    echo WARNING: Next.js not installed
    echo You need to run: npm install
)

if exist "node_modules\react" (
    echo OK: React is installed
) else (
    echo WARNING: React not installed
    echo You need to run: npm install
)
echo.

echo ====================================
echo Diagnostics Complete
echo ====================================
echo.
echo Next steps:
echo 1. Run setup.bat to complete setup
echo 2. Run start.bat to launch the server
echo.
pause
