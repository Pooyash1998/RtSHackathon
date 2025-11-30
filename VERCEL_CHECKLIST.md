# Vercel Deployment Checklist

## ✅ Completed
- [x] Imported GitHub repo to Vercel
- [x] Added environment variables to Vercel
- [x] Created `vercel.json` configuration

## 🔧 Configure Vercel Project Settings

Go to your Vercel project → **Settings** → **General**

### Build & Development Settings
- [ ] **Framework Preset:** Set to `Vite`
- [ ] **Root Directory:** Set to `frontend`
- [ ] **Build Command:** Set to `npm run build`
- [ ] **Output Directory:** Set to `dist`
- [ ] **Install Command:** Set to `npm install`

### Environment Variables
Go to **Settings** → **Environment Variables**

- [ ] `VITE_API_URL` is set (use `http://localhost:8000` for now)
- [ ] Variable is enabled for: Production ✓, Preview ✓, Development ✓

## 🚀 Deploy

### Quick Deploy
```bash
git add .
git commit -m "Configure Vercel deployment"
git push origin main
```

Or click **Redeploy** in Vercel dashboard

## ✅ Verify Deployment

- [ ] Build completed successfully (check Deployments tab)
- [ ] Site loads at your Vercel URL
- [ ] No console errors (open browser DevTools)
- [ ] Routing works (try navigating between pages)

## ⚠️ Known Issues (Expected)

These will work once you deploy the backend:
- ❌ API calls will fail (backend not deployed yet)
- ❌ Login won't work (needs backend)
- ❌ Data won't load (needs backend)

## 🎯 Next: Deploy Backend

Choose one:

### Option A: Railway (Recommended)
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Add environment variables
4. Copy Railway URL
5. Update `VITE_API_URL` in Vercel
6. Redeploy frontend

### Option B: Render
1. Go to https://render.com
2. New Web Service
3. Connect GitHub repo
4. Configure build/start commands
5. Add environment variables
6. Copy Render URL
7. Update `VITE_API_URL` in Vercel
8. Redeploy frontend

## 📋 Final Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed (Railway/Render)
- [ ] `VITE_API_URL` updated with backend URL
- [ ] Frontend redeployed with new API URL
- [ ] Test login functionality
- [ ] Test creating a classroom
- [ ] Test generating a story
- [ ] All features working

## 🎉 Success Criteria

✅ Frontend loads without errors  
✅ Can log in  
✅ Can create classrooms  
✅ Can generate stories  
✅ Images load properly  

---

**Need help?** See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for detailed instructions.
