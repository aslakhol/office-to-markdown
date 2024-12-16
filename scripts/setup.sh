#!/bin/bash

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r src/server/python/requirements.txt

# Install markitdown from GitHub
echo "Installing markitdown from GitHub..."
pip install git+https://github.com/microsoft/Markitdown.git

echo "Setup complete! 🎉"
echo "To activate the virtual environment, run: source .venv/bin/activate" 