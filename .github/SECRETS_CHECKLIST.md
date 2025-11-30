# GitHub Secrets Checklist

## ✅ Required Secrets (Already Added!)

You've already added these to **Settings → Secrets and variables → Actions**:

- [x] `SUPABASE_URL`
- [x] `SUPABASE_KEY`
- [x] `OPENAI_API_KEY`
- [x] `BLACK_FOREST_API_KEY`

## 📋 Next: Add Platform-Specific Secrets

Choose your deployment platform and add the corresponding secrets:

### If using Vercel (Frontend):
- [ ] `VERCEL_TOKEN` - From https://vercel.com/account/tokens
- [ ] `VERCEL_ORG_ID` - From `.vercel/project.json`
- [ ] `VERCEL_PROJECT_ID` - From `.vercel/project.json`
- [ ] `VITE_API_URL` - Your production backend URL

### If using Railway (Backend):
- [ ] `RAILWAY_TOKEN` - From Railway project settings

### If using VPS/Cloud Server:
- [ ] `SERVER_HOST` - Server IP or domain
- [ ] `SERVER_USER` - SSH username
- [ ] `SSH_PRIVATE_KEY` - Private SSH key for deployment

### If using Docker Registry:
- [ ] `DOCKER_USERNAME` - Docker Hub username
- [ ] `DOCKER_PASSWORD` - Docker Hub access token

## 🚀 Quick Start

1. **Choose your platform** from the list above
2. **Add the required secrets** to GitHub
3. **Uncomment the deployment section** in `.github/workflows/deploy.yml`
4. **Push to main** branch to trigger deployment

## 🔍 Verify Secrets

Run this in your terminal to see which secrets are configured:

```bash
gh secret list
```

Or check in GitHub UI:
**Your Repo → Settings → Secrets and variables → Actions**

## 📖 Full Documentation

See [DEPLOYMENT.md](.github/DEPLOYMENT.md) for detailed setup instructions.
