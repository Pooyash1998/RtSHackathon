#!/bin/bash

# Test Backend Connection Script
# Run this to diagnose backend issues

BACKEND_URL="https://rtshackathon-production.up.railway.app"

echo "🔍 Testing Backend Connection..."
echo ""

# Test 1: Health Check
echo "1️⃣ Testing /health endpoint..."
curl -s "$BACKEND_URL/health" | python3 -m json.tool
echo ""

# Test 2: Get Students
echo "2️⃣ Testing /students endpoint..."
curl -s "$BACKEND_URL/students" | python3 -m json.tool
echo ""

# Test 3: Get Classrooms
echo "3️⃣ Testing /classrooms endpoint..."
curl -s "$BACKEND_URL/classrooms" | python3 -m json.tool
echo ""

# Test 4: Create Test Student
echo "4️⃣ Creating test student..."
curl -s -X POST "$BACKEND_URL/students/create?name=Test%20Student&interests=Math" | python3 -m json.tool
echo ""

echo "✅ Tests complete!"
echo ""
echo "📋 What to look for:"
echo "  - Health check should show 'supabase_configured: true'"
echo "  - Students/Classrooms should return arrays (even if empty)"
echo "  - If you see errors, check Railway environment variables"
