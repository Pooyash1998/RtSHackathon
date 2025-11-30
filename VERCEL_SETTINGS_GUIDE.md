# Vercel Settings Configuration Guide

## 🎯 Quick Setup (Copy These Exact Values)

### Step 1: Go to Project Settings
1. Open your project in Vercel dashboard
2. Click **Settings** tab at the top
3. Click **General** in the left sidebar

### Step 2: Configure Build Settings

Scroll down to **Build & Development Settings** and enter:

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**Screenshot reference:**
```
┌─────────────────────────────────────────┐
│ Build & Development Settings            │
├─────────────────────────────────────────┤
│ Framework Preset                         │
│ [Vite                              ▼]   │
│                                          │
│ Root Directory                           │
│ [frontend                          ]    │
│                                          │
│ Build Command                            │
│ [npm run build                     ]    │
│                                          │
│ Output Directory                         │
│ [dist                              ]    │
│                                          │
│ Install Command                          │
│ [npm install                       ]    │
└─────────────────────────────────────────┘
```

Click **Save** at the bottom

### Step 3: Configure Environment Variables

1. Click **Environment Variables** in the left sidebar
2. Click **Add New** button

Add this variable:

```
Key: VITE_API_URL
Value: http://localhost:8000
Environments: ✓ Production  ✓ Preview  ✓ Development
```

**For production backend (after deploying backend):**
```
Key: VITE_API_URL
Value: https://your-backend.railway.app
Environments: ✓ Production  ✓ Preview  ✓ Development
```

**Screenshot reference:**
```
┌─────────────────────────────────────────────────────┐
│ Environment Variables                                │
├─────────────────────────────────────────────────────┤
│ Key                                                  │
│ [VITE_API_URL                                   ]   │
│                                                      │
│ Value                                                │
│ [http://localhost:8000                          ]   │
│                                                      │
│ Environments                                         │
│ ☑ Production  ☑ Preview  ☑ Development             │
│                                                      │
│ [Cancel]                            [Save]          │
└─────────────────────────────────────────────────────┘
```

Click **Save**

### Step 4: Configure Git Settings

1. Click **Git** in the left sidebar
2. Verify these settings:

```
Production Branch: main
Automatic Deployments: ✓ Enabled
```

**Screenshot reference:**
```
┌─────────────────────────────────────────┐
│ Git Configuration                        │
├─────────────────────────────────────────┤
│ Production Branch                        │
│ [main                              ▼]   │
│                                          │
│ Automatic Deployments                    │
│ ☑ Enabled                               │
│                                          │
│ Deploy Hooks                             │
│ [Create Hook]                           │
└─────────────────────────────────────────┘
```

## 🚀 Deploy

### Method 1: Push to GitHub (Automatic)
```bash
git add .
git commit -m "Configure Vercel"
git push origin main
```

Vercel will automatically detect and deploy!

### Method 2: Manual Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **⋯** menu
4. Click **Redeploy**
5. Confirm

### Method 3: Vercel CLI
```bash
npm i -g vercel
vercel login
cd frontend
vercel --prod
```

## 📊 Monitor Deployment

### View Build Progress
1. Go to **Deployments** tab
2. Click on the deployment (top one)
3. You'll see:
   - ⏳ **Queued** → 🔨 **Building** → ✅ **Ready**

### Check Build Logs
Click **View Function Logs** or **Building** to see:
```
Running "npm install"
✓ Installed dependencies
Running "npm run build"
✓ Built successfully
Uploading build outputs
✓ Deployment ready
```

### Common Build Errors

**Error: "Cannot find module 'vite'"**
```
Solution: Make sure Root Directory is set to "frontend"
```

**Error: "Build command failed"**
```
Solution: Check Build Command is "npm run build"
```

**Error: "Output directory not found"**
```
Solution: Set Output Directory to "dist"
```

## ✅ Verify Deployment

### 1. Check Deployment URL
After successful build, you'll see:
```
✅ Production: your-project.vercel.app
```

Click the URL to open your site

### 2. Test the Site
- [ ] Site loads without errors
- [ ] Can navigate between pages
- [ ] No 404 errors on refresh
- [ ] Console has no critical errors (F12 → Console)

### 3. Check API Connection
Open browser console (F12) and look for:
```
❌ Failed to fetch: http://localhost:8000/...
```

This is expected! Your backend isn't deployed yet.

## 🔧 Troubleshooting

### Site Shows 404
**Problem:** Vercel can't find your files

**Fix:**
1. Settings → General
2. Set Root Directory to `frontend`
3. Redeploy

### Blank Page
**Problem:** Build output is wrong

**Fix:**
1. Settings → General
2. Set Output Directory to `dist`
3. Redeploy

### 404 on Page Refresh
**Problem:** SPA routing not configured

**Fix:** Make sure `vercel.json` is committed:
```bash
git add vercel.json
git commit -m "Add Vercel config"
git push
```

### Environment Variables Not Working
**Problem:** Variables not loaded

**Fix:**
1. Make sure variable name starts with `VITE_`
2. Check it's enabled for Production
3. Redeploy after adding variables

### Build Takes Too Long
**Problem:** Installing dependencies is slow

**Fix:** This is normal for first deploy. Subsequent deploys use cache and are faster.

## 🎯 Next Steps

### 1. Deploy Backend
Your frontend is live, but needs a backend!

**Recommended: Railway**
- Go to https://railway.app
- Deploy from GitHub
- Add environment variables
- Copy Railway URL

### 2. Update API URL
1. Go to Vercel → Settings → Environment Variables
2. Edit `VITE_API_URL`
3. Change to: `https://your-backend.railway.app`
4. Save

### 3. Redeploy Frontend
1. Go to Deployments tab
2. Click Redeploy on latest deployment
3. Wait for build to complete
4. Test your site!

## 📱 Optional: Custom Domain

### Add Domain
1. Settings → Domains
2. Click **Add**
3. Enter your domain: `educomic.com`
4. Follow DNS instructions

### Configure DNS
Add these records at your domain provider:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Wait 5-60 minutes for DNS propagation.

## 🎉 Success!

Your frontend is now deployed on Vercel! 

**Current Status:**
- ✅ Frontend deployed
- ⏳ Backend needed
- ⏳ API connection pending

**Next:** Deploy backend to Railway or Render

---

**Need help?** See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for more details.
