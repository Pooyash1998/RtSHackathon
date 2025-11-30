# Railway Deployment Guide - Fixed!

## 🔧 What I Fixed

The error you saw was because Railway was trying to run shell scripts. I've created proper configuration files:

- ✅ `railway.json` - Railway configuration
- ✅ `nixpacks.toml` - Build configuration
- ✅ `Procfile` - Start command

## 🚀 Deploy to Railway (Step by Step)

### Step 1: Push the Configuration Files

```bash
git add railway.json nixpacks.toml Procfile
git commit -m "Add Railway configuration"
git push origin main
```

### Step 2: Create New Railway Project

1. Go to https://railway.app
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Choose your `EduComic` repository
5. Click **Deploy Now**

### Step 3: Configure Environment Variables

Railway will start building. While it builds, add your environment variables:

1. Click on your service
2. Go to **Variables** tab
3. Click **+ New Variable**

Add these variables:

```
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
OPENAI_API_KEY=your_openai_key_here
BLACK_FOREST_API_KEY=your_black_forest_key_here
ENVIRONMENT=production
PORT=8000
```

**Important:** Railway automatically provides `$PORT`, but we set it to 8000 for consistency.

### Step 4: Wait for Deployment

Railway will:
1. ✅ Detect Python project
2. ✅ Install UV package manager
3. ✅ Install dependencies from `pyproject.toml`
4. ✅ Start the FastAPI server
5. ✅ Give you a public URL

This takes about 2-3 minutes.

### Step 5: Get Your Railway URL

Once deployed:
1. Click on your service
2. Go to **Settings** tab
3. Scroll to **Domains**
4. You'll see something like: `https://educomic-production.up.railway.app`
5. Copy this URL

### Step 6: Test Your Backend

Open your Railway URL in browser:
```
https://your-app.railway.app/health
```

You should see:
```json
{
  "message": "EduComic API is running",
  "status": "healthy"
}
```

### Step 7: Update Vercel Frontend

Now connect your frontend to the backend:

1. Go to Vercel dashboard
2. Open your project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_URL`
5. Click **Edit**
6. Change value to your Railway URL: `https://your-app.railway.app`
7. Click **Save**
8. Go to **Deployments** tab
9. Click **Redeploy** on the latest deployment

### Step 8: Test Everything!

Once Vercel redeploys:
1. Open your Vercel URL
2. Try logging in
3. Create a classroom
4. Generate a story
5. Everything should work! 🎉

## 🐛 Troubleshooting Railway Errors

### Error: "Build failed"

**Check the logs:**
1. Click on your service
2. Go to **Deployments** tab
3. Click on the failed deployment
4. Read the build logs

**Common fixes:**

#### "uv: command not found"
The `railway.json` should fix this. If not, try:
1. Delete the service
2. Create new service
3. Make sure `railway.json` is committed

#### "No module named 'main'"
The start command is wrong. Should be:
```
cd backend && uv run uvicorn src.main:app --host 0.0.0.0 --port $PORT
```

Check `railway.json` has the correct path.

#### "Port already in use"
Railway provides `$PORT` automatically. Make sure your start command uses `$PORT`:
```
--port $PORT
```

### Error: "Application failed to respond"

**Check:**
1. Environment variables are set correctly
2. `PORT` variable exists (Railway should auto-provide it)
3. Start command includes `--host 0.0.0.0`

**Fix:**
1. Go to **Variables** tab
2. Make sure all 5 variables are set
3. Click **Redeploy**

### Error: "Supabase connection failed"

**Check:**
1. `SUPABASE_URL` is correct (should end with `.supabase.co`)
2. `SUPABASE_KEY` is the anon key (starts with `eyJ`)
3. No extra spaces in the values

**Fix:**
1. Go to Supabase dashboard
2. Copy the correct values
3. Update in Railway
4. Redeploy

### Error: "OpenAI API error"

**Check:**
1. `OPENAI_API_KEY` is correct (starts with `sk-proj-`)
2. You have credits in your OpenAI account
3. API key is not expired

**Fix:**
1. Go to https://platform.openai.com/api-keys
2. Create new key if needed
3. Update in Railway
4. Redeploy

## 📊 Monitor Your Deployment

### View Logs
1. Click on your service
2. Go to **Deployments** tab
3. Click **View Logs**

You'll see:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Check Metrics
1. Go to **Metrics** tab
2. Monitor:
   - CPU usage
   - Memory usage
   - Network traffic
   - Response times

### Set Up Alerts
1. Go to **Settings** tab
2. Scroll to **Notifications**
3. Add your email
4. Enable alerts for:
   - Deployment failures
   - High resource usage
   - Service crashes

## 💰 Railway Pricing

### Free Tier
- $5 free credit (no credit card required)
- Enough for ~500 hours of runtime
- Perfect for testing

### Paid Plans
- **Hobby:** $5/month (500 hours included)
- **Pro:** $20/month (unlimited)

**Tip:** $5 credit lasts about 3 weeks for a hobby project!

## 🔐 Security Settings

### 1. Restrict CORS (Important!)

Once deployed, update your backend CORS:

```python
# backend/src/main.py
ALLOWED_ORIGINS = [
    "https://your-project.vercel.app",
    "https://educomic.com",  # If you have custom domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Changed from ["*"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then:
```bash
git add backend/src/main.py
git commit -m "Restrict CORS to production domains"
git push
```

Railway will auto-redeploy.

### 2. Add Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Click **+ Custom Domain**
3. Enter your domain: `api.educomic.com`
4. Add CNAME record to your DNS:
   ```
   Type: CNAME
   Name: api
   Value: your-app.railway.app
   ```
5. Wait for DNS propagation (5-60 minutes)

## 🎯 Alternative: If Railway Still Fails

If Railway continues to give errors, try **Render.com** instead:

### Quick Render Setup

1. Go to https://render.com
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   ```
   Name: educomic-backend
   Root Directory: backend
   Environment: Python 3
   Build Command: pip install uv && uv sync
   Start Command: uv run uvicorn src.main:app --host 0.0.0.0 --port $PORT
   ```
5. Add environment variables (same as Railway)
6. Click **Create Web Service**

Render is more beginner-friendly and has better error messages!

## ✅ Success Checklist

- [ ] Railway configuration files committed and pushed
- [ ] Railway service created from GitHub repo
- [ ] All 5 environment variables added
- [ ] Deployment successful (green checkmark)
- [ ] Backend URL accessible: `https://your-app.railway.app/health`
- [ ] Vercel `VITE_API_URL` updated with Railway URL
- [ ] Frontend redeployed
- [ ] Can log in to the app
- [ ] Can create classrooms
- [ ] Can generate stories
- [ ] All features working

## 🆘 Still Having Issues?

Share the error message from Railway logs and I'll help you fix it!

Common error locations:
1. **Build logs:** Deployments tab → Click deployment → View logs
2. **Runtime logs:** Deployments tab → View Logs button
3. **Environment:** Variables tab

---

**Next:** Once backend is deployed, test your full app at your Vercel URL! 🚀
