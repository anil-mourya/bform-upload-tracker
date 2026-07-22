#!/bin/bash

# B-Form Tracker API - Development Initialization Script
# This script sets up the development environment

set -e

echo "=========================================="
echo "B-Form Upload Tracker - Dev Setup"
echo "=========================================="
echo ""

# Check Node.js
echo "[1/5] Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js v14 or higher."
    exit 1
fi
NODE_VERSION=$(node --version)
echo "✓ Node.js $NODE_VERSION found"

# Check npm
echo ""
echo "[2/5] Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed."
    exit 1
fi
NPM_VERSION=$(npm --version)
echo "✓ npm $NPM_VERSION found"

# Install dependencies
echo ""
echo "[3/5] Installing dependencies..."
npm install
echo "✓ Dependencies installed"

# Create .env if it doesn't exist
echo ""
echo "[4/5] Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env file from template"
    echo "  Please edit .env with your database credentials"
else
    echo "✓ .env file already exists"
fi

# Create uploads directory
echo ""
echo "[5/5] Creating uploads directory..."
mkdir -p uploads
echo "✓ Uploads directory ready"

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env with your database settings"
echo "2. Create MySQL database:"
echo "   mysql -u root -p"
echo "   > CREATE DATABASE bform_tracker;"
echo "   > EXIT;"
echo "3. Start development server:"
echo "   npm run dev"
echo "4. Test the API:"
echo "   curl http://localhost:5000/health"
echo ""
