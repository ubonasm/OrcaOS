#!/bin/bash

# OrcaOS Start Script for macOS/Linux

echo "====================================="
echo "   Starting OrcaOS..."
echo "====================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "ERROR: Node.js is not installed!"
    echo "Please run ./setup.sh first"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Dependencies not installed. Running setup..."
    ./setup.sh
    exit 0
fi

# Start the development server
echo "Opening OrcaOS in your default browser..."
echo "Server will start at http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start server and open browser
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Open browser based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v gnome-open &> /dev/null; then
        gnome-open http://localhost:3000
    fi
fi

# Keep script running
wait $SERVER_PID
