@echo off
echo ====================================
echo Developed by Professor SAKAMOTO, M. (Ph.D)
echo Graduate School of Education and Human Development
echo Nagoya University, 2026
echo ====================================
echo.
echo ====================================
echo OrcaOS Setup
echo ====================================
echo.

REM Check Node.js
echo [1/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed
    echo.
    echo Please install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo OK: Node.js found
node --version
echo.

REM Install dependencies
echo [2/4] Installing dependencies...
echo This may take a few minutes...
echo.
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: Installation failed
    echo.
    echo Try these solutions:
    echo 1. Delete node_modules folder and retry
    echo 2. Run: npm cache clean --force
    echo 3. Check your internet connection
    echo.
    pause
    exit /b 1
)
echo.
echo OK: Installation complete
echo.

REM Check project files
echo [3/4] Checking project files...
if not exist "app" (
    echo ERROR: app folder not found
    echo Please make sure all project files are extracted correctly
    pause
    exit /b 1
)
echo OK: Project files verified
echo.

REM Start server
echo [4/4] Starting OrcaOS...
echo.
echo ====================================
echo Server is starting!
echo ====================================
echo.
echo Open this URL in your browser:
echo http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
timeout /t 3 /nobreak > nul
start http://localhost:3000
npm run dev
