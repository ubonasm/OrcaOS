@echo off
echo ================================
echo  LightOS Startup
echo ================================
echo.

echo Starting development server...
echo Open http://localhost:3000 in your browser.
echo.
echo Press Ctrl+C to stop the server.
echo.

netstat -ano | findstr ":3000" >nul 2>&1
if not errorlevel 1 (
    echo WARNING: Port 3000 is already in use
    echo.
    echo Starting on alternate port...
    start http://localhost:3001
    call npm run dev -- -p 3001
) else (
    start http://localhost:3000
    call npm run dev
)
