#!/bin/bash
# Launcher for Urban Air Quality Assistant
set -e

echo "=========================================================="
echo "🌿 Starting Urban Air Quality Assistant (Challenge 06)   "
echo "=========================================================="

PORT=${PORT:-5000}
echo "Server running on http://127.0.0.1:${PORT}"
exec python3 app.py
