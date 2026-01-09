#!/bin/bash

# OrcaOS Setup Script for macOS/Linux
# This script will install dependencies and start the development server

echo "====================================="
echo "Developed by Professor SAKAMOTO, M. (Ph.D)"
echo "Graduate School of Education and Human Development"
echo "Nagoya University, 2026"
echo "====================================="
echo ""
echo "====================================="
echo "   OrcaOS Setup - macOS/Linux"
echo "====================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    echo "Recommended version: 18.x or higher"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "ERROR: npm is not installed!"
    echo "Please install npm (usually comes with Node.js)"
    exit 1
fi

# Display versions
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found!"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to install dependencies"
    echo "Please check your internet connection and try again"
    exit 1
fi

echo ""
echo "====================================="
echo "   Installation Complete!"
echo "====================================="
echo ""
echo "To start OrcaOS, run:"
echo "  ./start.sh"
echo ""
echo "Or manually with:"
echo "  npm run dev"
echo ""

# Ask if user wants to start now
read -p "Start OrcaOS now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Starting OrcaOS..."
    npm run dev
fi
