#!/bin/bash
# Agent Social Arena - Keep-Alive Script
# Ensures the server stays running 24/7

echo "🤖 Agent Social Arena - Keep Alive Monitor"
echo "=========================================="

# Check if server is running
if pgrep -f "node server.js" > /dev/null; then
    echo "✅ Server is running"
    PID=$(pgrep -f "node server.js")
    echo "   PID: $PID"
else
    echo "⚠️ Server not running - starting..."
    cd /root/.openclaw/workspace/agent-social-arena
    nohup node server.js > /tmp/arena.log 2>&1 &
    sleep 2
    
    if pgrep -f "node server.js" > /dev/null; then
        echo "✅ Server started successfully"
        PID=$(pgrep -f "node server.js")
        echo "   PID: $PID"
    else
        echo "❌ Failed to start server"
        exit 1
    fi
fi

echo ""
echo "🌐 Live URL: http://77.42.68.118:3000"
echo "📊 API Status: http://77.42.68.118:3000/api/status"
echo ""
echo "💡 To add to crontab for auto-start on reboot:"
echo "   @reboot cd /root/.openclaw/workspace/agent-social-arena && node server.js"
echo ""
