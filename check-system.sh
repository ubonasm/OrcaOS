#!/bin/bash

# OrcaOS System Check Script for macOS/Linux

echo "====================================="
echo "   OrcaOS System Diagnostics"
echo "====================================="
echo ""

# OS Detection
echo "Operating System:"
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "  macOS detected"
    sw_vers 2>/dev/null || echo "  Version info not available"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "  Linux detected"
    lsb_release -a 2>/dev/null || cat /etc/os-release 2>/dev/null || echo "  Version info not available"
else
    echo "  $OSTYPE"
fi
echo ""

# Node.js Check
echo "Node.js Status:"
if command -v node &> /dev/null; then
    echo "  ✓ Node.js is installed"
    echo "  Version: $(node --version)"
else
    echo "  ✗ Node.js is NOT installed"
    echo "  Please install from: https://nodejs.org/"
fi
echo ""

# npm Check
echo "npm Status:"
if command -v npm &> /dev/null; then
    echo "  ✓ npm is installed"
    echo "  Version: $(npm --version)"
else
    echo "  ✗ npm is NOT installed"
fi
echo ""

# Project Files Check
echo "Project Files:"
if [ -f "package.json" ]; then
    echo "  ✓ package.json found"
else
    echo "  ✗ package.json NOT found"
fi

if [ -d "app" ]; then
    echo "  ✓ app directory found"
else
    echo "  ✗ app directory NOT found"
fi

if [ -d "components" ]; then
    echo "  ✓ components directory found"
else
    echo "  ✗ components directory NOT found"
fi
echo ""

# Dependencies Check
echo "Dependencies:"
if [ -d "node_modules" ]; then
    echo "  ✓ node_modules found (dependencies installed)"
    
    # Check specific important packages
    if [ -d "node_modules/next" ]; then
        echo "  ✓ Next.js installed"
    else
        echo "  ✗ Next.js NOT found"
    fi
    
    if [ -d "node_modules/react" ]; then
        echo "  ✓ React installed"
    else
        echo "  ✗ React NOT found"
    fi
else
    echo "  ✗ node_modules NOT found"
    echo "  Run ./setup.sh to install dependencies"
fi
echo ""

# Port Check
echo "Port 3000 Status:"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "  ⚠ Port 3000 is in use"
    echo "  Process using port 3000:"
    lsof -Pi :3000 -sTCP:LISTEN 2>/dev/null | grep LISTEN
    echo "  You may need to stop this process or use a different port"
else
    echo "  ✓ Port 3000 is available"
fi
echo ""

# Permissions Check
echo "File Permissions:"
if [ -x "setup.sh" ]; then
    echo "  ✓ setup.sh is executable"
else
    echo "  ⚠ setup.sh is not executable"
    echo "  Run: chmod +x setup.sh"
fi

if [ -x "start.sh" ]; then
    echo "  ✓ start.sh is executable"
else
    echo "  ⚠ start.sh is not executable"
    echo "  Run: chmod +x start.sh"
fi
echo ""

# Summary
echo "====================================="
echo "   Diagnostic Summary"
echo "====================================="

ERRORS=0

if ! command -v node &> /dev/null; then
    echo "✗ Node.js needs to be installed"
    ERRORS=$((ERRORS+1))
fi

if [ ! -d "node_modules" ]; then
    echo "✗ Dependencies need to be installed (run ./setup.sh)"
    ERRORS=$((ERRORS+1))
fi

if [ $ERRORS -eq 0 ]; then
    echo "✓ All checks passed! You're ready to run OrcaOS"
    echo ""
    echo "To start OrcaOS, run:"
    echo "  ./start.sh"
else
    echo ""
    echo "⚠ $ERRORS issue(s) found. Please resolve them before running OrcaOS"
fi
echo ""
