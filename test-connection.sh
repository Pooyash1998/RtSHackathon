#!/bin/bash

echo "🧪 Testing EduComic Frontend-Backend Connection"
echo ""

# Test backend health
echo "1️⃣  Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Backend is running!"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "❌ Backend is not running on port 8000"
    echo "   Please start it with: cd backend/src && uvicorn main:app --reload --port 8000"
    exit 1
fi

echo ""

# Test frontend
echo "2️⃣  Testing Frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>&1)

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✅ Frontend is running!"
else
    echo "❌ Frontend is not running on port 8080"
    echo "   Please start it with: cd frontend && npm run dev"
    exit 1
fi

echo ""

# Test story generation API
echo "3️⃣  Testing Story Generation API..."
echo "   Using classroom: 942f3ae3-1dbd-4b7c-afd3-135b3e386de1"

STORY_RESPONSE=$(curl -s -X POST "http://localhost:8000/story/generate-options?classroom_id=942f3ae3-1dbd-4b7c-afd3-135b3e386de1&lesson_prompt=Test%20lesson" 2>&1)

if echo "$STORY_RESPONSE" | grep -q "success"; then
    echo "✅ Story generation API is working!"
    echo "   Generated story options successfully"
else
    echo "⚠️  Story generation API returned an error:"
    echo "   $STORY_RESPONSE"
fi

echo ""
echo "🎉 Connection test complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Open http://localhost:8080 in your browser"
echo "   2. Navigate to a classroom"
echo "   3. Try generating a story"
