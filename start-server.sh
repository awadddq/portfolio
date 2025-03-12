#!/bin/bash

# Check if Python 3 is available
if command -v python3 &>/dev/null; then
    echo "Starting server with Python 3..."
    python3 -m http.server 8000
elif command -v python &>/dev/null; then
    echo "Starting server with Python..."
    python -m http.server 8000
elif command -v npx &>/dev/null; then
    echo "Starting server with npx serve..."
    npx serve -l 8000
else
    echo "Error: Neither Python nor npx is available. Please install one of them to run a local server."
    exit 1
fi 