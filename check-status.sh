#!/bin/bash

# Check status of EduComic development servers

echo "🔍 Checking EduComic Server Status..."
echo ""

# Check backend
echo "Backend (Port 8000):"
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PID=$(lsof -ti:8000)
    echo "   ✅ Running (PID: $PID)"
    
    # Test health endpoint
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        HEALTH=$(curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || echo "OK")
        echo "   ✅ Health check passed"
    else
        echo "   ⚠️  Process running but health check failed"
    fi
else
    echo "   ❌ Not running"
fi

echo ""

# Check frontend
echo "Frontend (Port 8080):"
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PID=$(lsof -ti:8080)
    echo "   ✅ Running (PID: $PID)"
    
    # Test if accessible
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "   ✅ Accessible"
    else
        echo "   ⚠️  Process running but not accessible"
    fi
else
    echo "   ❌ Not running"
fi

echo ""

# Check logs
if [ -d ".logs" ]; then
    echo "📝 Recent Logs:"
    
    if [ -f ".logs/backend.log" ]; then
        echo ""
        echo "   Backend (last 5 lines):"
        tail -n 5 .logs/backend.log | sed 's/^/      /'
    fi
    
    if [ -f ".logs/frontend.log" ]; then
        echo ""
        echo "   Frontend (last 5 lines):"
        tail -n 5 .logs/frontend.log | sed 's/^/      /'
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
BACKEND_RUNNING=$(lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "yes" || echo "no")
FRONTEND_RUNNING=$(lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1 && echo "yes" || echo "no")

if [ "$BACKEND_RUNNING" = "yes" ] && [ "$FRONTEND_RUNNING" = "yes" ]; then
    echo "✅ All servers are running!"
    echo ""
    echo "   🌐 Frontend:  http://localhost:8080"
    echo "   🔧 Backend:   http://localhost:8000"
    echo "   📚 API Docs:  http://localhost:8000/docs"
elif [ "$BACKEND_RUNNING" = "yes" ] || [ "$FRONTEND_RUNNING" = "yes" ]; then
    echo "⚠️  Some servers are running"
    echo ""
    echo "   Run './start-dev.sh' to start all servers"
else
    echo "❌ No servers are running"
    echo ""
    echo "   Run './start-dev.sh' to start servers"
fi

echo ""
