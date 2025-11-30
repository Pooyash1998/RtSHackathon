# Fix Railway 502 Error

## 🔍 What's Causing 502

A 502 error means Railway can't connect to your app. Common causes:

1. **App not binding to $PORT** (most common)
2. **Missing environment variables**
3. **App crashing on startup**
4. **Dependencies not installed**

## 🚀 Quick Fix (Push This Now)

I've fixed the Dockerfile and added railway.toml. Push these changes:

```bash
git add Dockerfile railway.toml FIX_502_ERROR.md
git commit -m "Fix Railway 502 - correct port binding"
git push origin main
```

Railway will automatically redeploy!

## 🔍 Check Railway Logs

While it redeploys, check the logs:

1. Go to Railway Dashboard
2. Click on your service
3. Go to **Deployments** tab
4. Click **View Logs**

### ✅ Good Logs (What You Want to See):

```
Building Dockerfile...
✓ Successfully built
✓ Successfully tagged
Deploying...
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:XXXX
```

### ❌ Bad Logs (Common Errors):

#### Error 1: "Address already in use"
```
ERROR: [Errno 98] Address already in use
```
**Cause:** Not using Railway's $PORT variable  
**Fix:** The new Dockerfile should fix this

#### Error 2: "ModuleNotFoundError"
```
ModuleNotFoundError: No module named 'fastapi'
```
**Cause:** Dependencies not installed  
**Fix:** Check if `backend/pyproject.toml` exists and is committed

#### Error 3: "SUPABASE_URL not set"
```
Error: Could not load environment variables
```
**Cause:** Missing environment variables  
**Fix:** Add them in Railway Variables tab (see below)

#### Error 4: "No such file or directory: 'backend'"
```
COPY failed: file not found
```
**Cause:** Backend folder not in git  
**Fix:** Make sure backend folder is committed

## 🔐 Verify Environment Variables

Go to Railway → Your service → **Variables** tab

Make sure these are set:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-proj-...
BLACK_FOREST_API_KEY=...
ENVIRONMENT=production
```

**Don't add PORT** - Railway provides it automatically!

## 🧪 Test After Deployment

Once logs show "Application startup complete":

### Test 1: Health Check
```bash
curl https://rtshackathon-production-f90b.up.railway.app/health
```

Should return:
```json
{
  "message": "EduComic API is running",
  "status": "healthy"
}
```

### Test 2: In Browser
Open: `https://rtshackathon-production-f90b.up.railway.app/health`

Should see the JSON response.

## 🔧 Alternative: Use Nixpacks Instead of Docker

If Docker still fails, try Nixpacks:

1. Go to Railway → Settings
2. Change **Builder** to `NIXPACKS`
3. Remove **Dockerfile Path**
4. Add **Start Command**: `cd backend && uv run uvicorn src.main:app --host 0.0.0.0 --port $PORT`
5. Redeploy

## 🎯 Most Common Fix

**90% of 502 errors are fixed by:**

1. Making sure environment variables are set
2. Using the correct PORT variable
3. Redeploying after changes

The Dockerfile I just fixed should handle the PORT correctly now!

## 📋 Checklist

- [ ] Pushed new Dockerfile and railway.toml
- [ ] Railway is redeploying
- [ ] Checked logs for errors
- [ ] All 5 environment variables are set
- [ ] Deployment shows "Application startup complete"
- [ ] `/health` endpoint returns 200 OK
- [ ] No 502 error anymore

## 🆘 Still Getting 502?

Share these details:

1. **Last 20 lines of Railway logs** (from View Logs)
2. **Environment variables** (just the names, not values)
3. **What the logs say when it starts**

Most likely the new Dockerfile will fix it! Just push and wait for redeploy.

---

**Push the changes now and Railway will automatically redeploy!** 🚀
