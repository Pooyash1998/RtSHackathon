#!/bin/bash

# GitHub Actions Deployment Setup Verification Script
# Run this to verify your deployment setup is ready

echo "🔍 Verifying GitHub Actions Deployment Setup..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if command -v gh &> /dev/null; then
    echo "✅ GitHub CLI installed"
    
    # Check secrets
    echo ""
    echo "📋 Checking GitHub Secrets..."
    
    REQUIRED_SECRETS=("SUPABASE_URL" "SUPABASE_KEY" "OPENAI_API_KEY" "BLACK_FOREST_API_KEY")
    
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if gh secret list | grep -q "$secret"; then
            echo -e "${GREEN}✅${NC} $secret configured"
        else
            echo -e "${RED}❌${NC} $secret missing"
        fi
    done
else
    echo -e "${YELLOW}⚠️${NC}  GitHub CLI not installed (optional)"
    echo "   Install with: brew install gh"
    echo "   Then run: gh auth login"
fi

echo ""
echo "📁 Checking Files..."

# Check workflow file
if [ -f ".github/workflows/deploy.yml" ]; then
    echo -e "${GREEN}✅${NC} Workflow file exists"
else
    echo -e "${RED}❌${NC} Workflow file missing"
fi

# Check documentation
if [ -f ".github/DEPLOYMENT.md" ]; then
    echo -e "${GREEN}✅${NC} Deployment guide exists"
else
    echo -e "${RED}❌${NC} Deployment guide missing"
fi

# Check if deployment section is commented
if grep -q "# - name: Deploy Frontend to Vercel" .github/workflows/deploy.yml; then
    echo -e "${YELLOW}⚠️${NC}  Deployment section is commented (expected)"
    echo "   Uncomment your chosen platform in .github/workflows/deploy.yml"
else
    echo -e "${GREEN}✅${NC} Deployment section uncommented"
fi

echo ""
echo "🔨 Checking Build Requirements..."

# Check backend
if [ -f "backend/pyproject.toml" ]; then
    echo -e "${GREEN}✅${NC} Backend configuration found"
else
    echo -e "${RED}❌${NC} Backend configuration missing"
fi

# Check frontend
if [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✅${NC} Frontend configuration found"
else
    echo -e "${RED}❌${NC} Frontend configuration missing"
fi

# Check .env.example files
if [ -f "backend/.env.example" ]; then
    echo -e "${GREEN}✅${NC} Backend .env.example exists"
else
    echo -e "${YELLOW}⚠️${NC}  Backend .env.example missing"
fi

if [ -f "frontend/.env.example" ]; then
    echo -e "${GREEN}✅${NC} Frontend .env.example exists"
else
    echo -e "${YELLOW}⚠️${NC}  Frontend .env.example missing"
fi

# Check .gitignore
if grep -q "\.env" .gitignore; then
    echo -e "${GREEN}✅${NC} .env files are gitignored"
else
    echo -e "${RED}❌${NC} .env files not in .gitignore (security risk!)"
fi

echo ""
echo "🧪 Testing Local Build..."

# Test frontend build
if [ -d "frontend" ]; then
    echo "Testing frontend build..."
    cd frontend
    if npm run build &> /dev/null; then
        echo -e "${GREEN}✅${NC} Frontend builds successfully"
    else
        echo -e "${RED}❌${NC} Frontend build failed"
        echo "   Run 'cd frontend && npm run build' to see errors"
    fi
    cd ..
fi

echo ""
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".github/workflows/deploy.yml" ] && [ -f "backend/pyproject.toml" ] && [ -f "frontend/package.json" ]; then
    echo -e "${GREEN}✅ Setup is complete!${NC}"
    echo ""
    echo "📝 Next Steps:"
    echo "1. Choose deployment platform: .github/PLATFORM_COMPARISON.md"
    echo "2. Add platform secrets: .github/SECRETS_CHECKLIST.md"
    echo "3. Uncomment deployment section in .github/workflows/deploy.yml"
    echo "4. Push to main branch to deploy!"
    echo ""
    echo "📚 Full guide: .github/DEPLOYMENT.md"
else
    echo -e "${RED}❌ Setup incomplete${NC}"
    echo "Please check the errors above"
fi

echo ""
