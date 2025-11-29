#!/bin/bash

echo "🧪 Testing Many-to-Many Classroom Migration"
echo "==========================================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "❌ Backend is not running on port 8000"
    echo "   Start it with: ./start-dev.sh"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Test 1: Create a student without classroom_id
echo "📝 Test 1: Creating a student without classroom_id..."
STUDENT_RESPONSE=$(curl -s -X POST "http://localhost:8000/students/create?name=Test%20Student&interests=testing%2C%20debugging")

if echo "$STUDENT_RESPONSE" | grep -q "success"; then
    STUDENT_ID=$(echo "$STUDENT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['student']['id'])" 2>/dev/null)
    if [ -n "$STUDENT_ID" ]; then
        echo "✅ Student created successfully: $STUDENT_ID"
    else
        echo "⚠️  Student created but couldn't extract ID"
    fi
else
    echo "❌ Failed to create student"
    echo "$STUDENT_RESPONSE"
    exit 1
fi

echo ""

# Test 2: Get all classrooms
echo "📚 Test 2: Fetching classrooms..."
CLASSROOMS_RESPONSE=$(curl -s "http://localhost:8000/classrooms")

if echo "$CLASSROOMS_RESPONSE" | grep -q "success"; then
    CLASSROOM_ID=$(echo "$CLASSROOMS_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['classrooms'][0]['id'] if data['classrooms'] else '')" 2>/dev/null)
    if [ -n "$CLASSROOM_ID" ]; then
        echo "✅ Found classroom: $CLASSROOM_ID"
    else
        echo "⚠️  No classrooms found in database"
        echo "   Create a classroom first to test joining"
        CLASSROOM_ID=""
    fi
else
    echo "❌ Failed to fetch classrooms"
    exit 1
fi

echo ""

# Test 3: Join classroom (if we have both student and classroom)
if [ -n "$STUDENT_ID" ] && [ -n "$CLASSROOM_ID" ]; then
    echo "🔗 Test 3: Joining student to classroom..."
    JOIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/students/$STUDENT_ID/join-classroom/$CLASSROOM_ID")
    
    if echo "$JOIN_RESPONSE" | grep -q "success"; then
        echo "✅ Student joined classroom successfully"
    else
        echo "❌ Failed to join classroom"
        echo "$JOIN_RESPONSE"
    fi
    
    echo ""
    
    # Test 4: Verify student is in classroom
    echo "🔍 Test 4: Verifying student is in classroom..."
    STUDENT_DATA=$(curl -s "http://localhost:8000/students/$STUDENT_ID")
    
    if echo "$STUDENT_DATA" | grep -q "$CLASSROOM_ID"; then
        echo "✅ Student is correctly enrolled in classroom"
    else
        echo "⚠️  Student data doesn't show classroom enrollment"
    fi
    
    echo ""
    
    # Cleanup
    echo "🧹 Cleaning up test data..."
    # Note: Add cleanup endpoints if needed
    echo "   (Manual cleanup may be required in Supabase)"
fi

echo ""
echo "==========================================="
echo "✅ Many-to-Many Migration Tests Complete"
echo ""
echo "Next steps:"
echo "1. Test in browser: http://localhost:5173/student/login"
echo "2. Verify students load from database"
echo "3. Test joining a classroom via link"
