# Fix Supabase Initialization Crash

## 🔍 The Problem

The app was crashing on startup because `database.py` was raising an error if Supabase credentials weren't found:

```python
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")
```

This caused Railway to show "502 Application failed to respond" even though the app was trying to start.

## ✅ The Fix

I've changed the code to:
1. Print a warning instead of crashing
2. Allow the app to start even if Supabase isn't configured
3. Show helpful debug info about which variables are missing

## 🚀 Deploy the Fix:

```bash
git add backend/src/database/database.py FIX_SUPABASE_CRASH.md
git commit -m "Fix Supabase initialization - don't crash on startup"
git push origin main
```

Railway will automatically redeploy!

## 📊 What to Check in Railway Logs:

After redeployment, you should see:

### ✅ If Supabase credentials are correct:
```
✓ Supabase client initialized successfully
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8080
```

### ⚠️ If Supabase credentials are missing:
```
WARNING: SUPABASE_URL and/or SUPABASE_KEY not set
SUPABASE_URL present: False
SUPABASE_KEY present: False
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8080
```

The app will start, but database operations will fail.

## 🔐 Check Railway Environment Variables

Go to Railway → Your service → **Variables** tab

Make sure these are set **exactly** like this:

### SUPABASE_URL
```
https://xxxxx.supabase.co
```
- NO trailing slash
- NO `/rest/v1` at the end
- NO quotes around it
- Just the base URL

### SUPABASE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- Should be the **anon** key (not service_role)
- NO quotes around it
- Starts with `eyJ`

### Get Correct Values:

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use for `SUPABASE_URL`
   - **anon public** key → Use for `SUPABASE_KEY`

## 🧪 Test After Deploy:

### Test 1: Health Check
```bash
curl https://rtshackathon-production.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "supabase_configured": true
}
```

If `supabase_configured` is `false`, check your environment variables!

### Test 2: Get Students
```bash
curl https://rtshackathon-production.up.railway.app/students
```

Should return:
```json
{
  "success": true,
  "students": []
}
```

Empty array is OK - means database works but no data yet!

## 📋 Checklist:

- [ ] Pushed the fix to GitHub
- [ ] Railway is redeploying
- [ ] Checked Railway logs for "✓ Supabase client initialized"
- [ ] `/health` returns `supabase_configured: true`
- [ ] `/students` returns success (even if empty)
- [ ] No more 502 errors!

## 🆘 If Still Getting 502:

1. **Check Railway logs** - Look for the Supabase initialization message
2. **Verify environment variables** - Make sure they're set correctly
3. **Share the logs** - Copy the last 20 lines and share them

---

**This fix will allow the app to start and show you exactly what's wrong with the Supabase connection!** 🚀
