# Vercel Deployment Guide for EduComic

## ✅ What You've Done So Far
- [x] Imported GitHub repo to Vercel
- [x] Added environment variables to Vercel

## 🔧 Vercel Project Settings

### 1. Configure Build Settings

Go to your Vercel project → **Settings** → **General**

Set these values:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 2. Environment Variables

Go to **Settings** → **Environment Variables**

Make sure you have:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | Your backend URL | Production, Preview, Development |

**Important:** 
- For now, use your local backend: `http://localhost:8000`
- Later, replace with your production backend URL (Railway, Render, etc.)

### 3. Deploy Settings

Go to **Settings** → **Git**

Ensure:
- ✅ **Production Branch:** `main`
- ✅ **Automatic Deployments:** Enabled
- ✅ **Deploy Hooks:** Optional (for manual triggers)

## 🚀 Deploy Now

### Option A: Automatic Deploy (Recommended)
Just push to your main branch:
```bash
git add .
git commit -m "Configure Vercel deployment"
git push origin main
```

Vercel will automatically:
1. Detect the push
2. Build your frontend
3. Deploy to production
4. Give you a URL like `https://your-project.vercel.app`

### Option B: Manual Deploy via Vercel Dashboard
1. Go to your Vercel project
2. Click **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Or click **Deploy** → **Deploy from branch**

### Option C: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod
```

## 🔍 Troubleshooting

### Build Fails with "Cannot find module"
**Problem:** Vercel can't find your frontend files

**Solution:** Make sure Root Directory is set to `frontend` in project settings

### Build Fails with "Command not found"
**Problem:** Build command is incorrect

**Solution:** 
1. Go to Settings → General
2. Set Build Command to: `npm run build`
3. Set Output Directory to: `dist`

### Site Loads but API Calls Fail
**Problem:** `VITE_API_URL` is not set or incorrect

**Solution:**
1. Go to Settings → Environment Variables
2. Add `VITE_API_URL` with your backend URL
3. Redeploy

### 404 on Page Refresh
**Problem:** React Router routes not working

**Solution:** The `vercel.json` file I created handles this with rewrites. Make sure it's committed:
```bash
git add vercel.json
git commit -m "Add Vercel config for SPA routing"
git push
```

### Environment Variables Not Working
**Problem:** Variables not available during build

**Solution:**
1. Make sure variable names start with `VITE_` (Vite requirement)
2. Redeploy after adding variables
3. Check they're enabled for Production environment

## 📊 Monitor Your Deployment

### View Build Logs
1. Go to **Deployments** tab
2. Click on the deployment
3. Click **Building** or **View Function Logs**
4. Check for errors

### Check Deployment Status
- ✅ **Ready** - Deployment successful
- 🔄 **Building** - Currently building
- ❌ **Error** - Build failed (check logs)
- ⏸️ **Canceled** - Deployment canceled

## 🎯 Next Steps: Deploy Backend

Your frontend is on Vercel, but you need a backend! Here are your options:

### Option 1: Railway (Recommended)
**Time:** 10 minutes | **Cost:** $5 free credit

1. Go to https://railway.app
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repo
4. Railway will detect the Python backend
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENAI_API_KEY`
   - `BLACK_FOREST_API_KEY`
   - `ENVIRONMENT=production`
6. Click **Deploy**
7. Copy your Railway URL (e.g., `https://your-app.railway.app`)
8. Update `VITE_API_URL` in Vercel to your Railway URL
9. Redeploy frontend

### Option 2: Render
**Time:** 15 minutes | **Cost:** Free (with cold starts) or $7/month

1. Go to https://render.com
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name:** educomic-backend
   - **Root Directory:** `backend`
   - **Build Command:** `pip install uv && uv sync`
   - **Start Command:** `uv run uvicorn src.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Railway)
6. Click **Create Web Service**
7. Copy your Render URL
8. Update `VITE_API_URL` in Vercel
9. Redeploy frontend

### Option 3: Keep Backend Local (Development Only)
For testing, you can:
1. Keep backend running locally: `cd backend/src && uv run uvicorn main:app --reload`
2. Use ngrok to expose it: `ngrok http 8000`
3. Set `VITE_API_URL` to your ngrok URL
4. **Note:** This is only for testing, not production!

## 🔐 Security Checklist

- [ ] All API keys are in Vercel environment variables (not in code)
- [ ] `.env` files are in `.gitignore`
- [ ] `VITE_API_URL` points to HTTPS backend (not HTTP in production)
- [ ] CORS is configured in backend to allow your Vercel domain
- [ ] Supabase RLS policies are enabled

## 📱 Custom Domain (Optional)

### Add Your Domain
1. Go to **Settings** → **Domains**
2. Click **Add**
3. Enter your domain (e.g., `educomic.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-60 minutes)

### Configure DNS
Add these records to your domain provider:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

## 🎉 You're Live!

Once deployed, your app will be available at:
- **Vercel URL:** `https://your-project.vercel.app`
- **Custom Domain:** `https://yourdomain.com` (if configured)

### Test Your Deployment
1. Visit your Vercel URL
2. Try logging in
3. Check browser console for errors
4. Test API calls (they'll fail until backend is deployed)

## 📚 Useful Vercel Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]
```

## 💡 Pro Tips

1. **Preview Deployments:** Every PR gets a preview URL automatically
2. **Environment Variables:** Use different values for Preview vs Production
3. **Analytics:** Enable Vercel Analytics in project settings
4. **Speed Insights:** Enable to monitor performance
5. **Deployment Protection:** Add password protection for staging

## 🆘 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Vite on Vercel:** https://vercel.com/docs/frameworks/vite
- **Support:** https://vercel.com/support

---

**Current Status:** Frontend deploying to Vercel ✅  
**Next Step:** Deploy backend to Railway or Render 🚀
