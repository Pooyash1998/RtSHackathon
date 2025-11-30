#!/bin/bash

# Railway Deployment Check Script
# Run this before deploying to Railway to catch common issues

echo "🔍 Checking Railway Deployment Requirements..."
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if configuration files exist
echo "📋 Configuration Files:"
if [ -f "railway.json" ]; then
    echo -e "${GREEN}✅${NC} railway.json exists"
else
    echo -e "${RED}❌${NC} railway.json missing"
fi

if [ -f "nixpacks.toml" ]; then
    echo -e "${GREEN}✅${NC} nixpacks.toml exists"
else
    echo -e "${RED}❌${NC} nixpacks.toml missing"
fi

if [ -f "Procfile" ]; then
    echo -e "${GREEN}✅${NC} Procfile exists"
else
    echo -e "${RED}❌${NC} Procfile missing"
fi

echo ""
echo "📦 Backend Structure:"

if [ -f "backend/pyproject.toml" ]; then
    echo -e "${GREEN}✅${NC} backend/pyproject.toml exists"
else
    echo -e "${RED}❌${NC} backend/pyproject.toml missing"
fi

if [ -f "backend/src/main.py" ]; then
    echo -e "${GREEN}✅${NC} backend/src/main.py exists"
else
    echo -e "${RED}❌${NC} backend/src/main.py missing"
fi

echo ""
echo "🔐 Environment Variables Needed:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_KEY"
echo "   - OPENAI_API_KEY"
echo "   - BLACK_FOREST_API_KEY"
echo "   - ENVIRONMENT=production"
echo "   - PORT (Railway provides this automatically)"

echo ""
echo "🚀 Ready to Deploy?"
echo ""
echo "1. Commit and push configuration files:"
echo "   git add railway.json nixpacks.toml Procfile"
echo "   git commit -m 'Add Railway configuration'"
echo "   git push origin main"
echo ""
echo "2. Go to https://railway.app"
echo "3. New Project → Deploy from GitHub repo"
echo "4. Add environment variables"
echo "5. Wait for deployment"
echo ""
echo "📚 Full guide: RAILWAY_DEPLOYMENT.md"
