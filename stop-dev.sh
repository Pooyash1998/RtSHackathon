#!/bin/bash

# Stop development servers for EduComic

echo "🛑 Stopping EduComic Development Servers..."
echo ""

# Kill processes on port 8000 (Backend)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   Stopping backend on port 8000..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    echo "   ✅ Backend stopped"
else
    echo "   ℹ️  No backend running on port 8000"
fi

# Kill processes on port 8080 (Frontend)
if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "   Stopping frontend on port 8080..."
    lsof -ti:8080 | xargs kill -9 2>/dev/null
    echo "   ✅ Frontend stopped"
else
    echo "   ℹ️  No frontend running on port 8080"
fi

echo ""
echo "✅ All servers stopped"
