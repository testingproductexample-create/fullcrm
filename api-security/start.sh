#!/bin/bash

# API Security System Startup Script
# This script starts the API security system with proper configuration

set -e

echo "🚀 Starting API Security System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo "✅ Node.js version $NODE_VERSION is compatible"
else
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 16+ and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration and run the script again."
    echo "🔧 Key settings to configure:"
    echo "   - SESSION_SECRET (change the default)"
    echo "   - API_KEY_ENCRYPTION_KEY (change the default)"
    echo "   - Webhook secrets (if using webhooks)"
    echo "   - CORS allowed origins"
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs/security
mkdir -p logs/alerts
mkdir -p logs/rate-limiting
mkdir -p logs/webhooks

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if port 3001 is available
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3001 is already in use. Please stop the existing service or use a different port."
    echo "🔧 You can change the port in .env file: PORT=3002"
    exit 1
fi

# Check if port 3002 is available
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  Port 3002 is already in use. Dashboard might already be running."
fi

# Set up signal handlers for graceful shutdown
trap 'echo "🛑 Shutting down API Security System..."; kill -TERM $SERVER_PID $DASHBOARD_PID 2>/dev/null; exit 0' INT TERM

echo "🌟 Starting API Security Server on port 3001..."
echo "📊 Starting Security Dashboard on port 3002..."

# Start the main server
node server.js &
SERVER_PID=$!

# Start the dashboard (with small delay to ensure server starts first)
sleep 2
node dashboard/app.js &
DASHBOARD_PID=$!

echo "✅ API Security System is now running!"
echo ""
echo "🔗 Access Points:"
echo "   • API Server: http://localhost:3001"
echo "   • Security Dashboard: http://localhost:3002"
echo "   • API Health: http://localhost:3001/api/health"
echo ""
echo "📋 Quick Test Commands:"
echo "   • Generate API Key: curl -X POST http://localhost:3001/api/auth/generate-key -H 'Content-Type: application/json' -d '{\"userId\":\"test123\"}'"
echo "   • Test Rate Limit: curl http://localhost:3001/api/test/public"
echo "   • Get Security Metrics: curl http://localhost:3001/api/security/metrics"
echo ""
echo "🛑 To stop the system, press Ctrl+C"
echo ""

# Wait for processes
wait