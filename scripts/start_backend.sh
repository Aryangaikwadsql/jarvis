#!/bin/bash
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Starting Jarvis Backend Server..."
python backend_server.py
