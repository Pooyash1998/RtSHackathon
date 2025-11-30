# Fix Railway PORT Error

## 🔍 The Problem

Railway logs show:
```
Error: Invalid value for '--port': '$PORT' is not a valid integer.
```

This means the `$PORT` variable isn't being expanded - it's being passed as the literal string "$PORT" instead of the actual port number.

## ✅ The Fix

I've created a startup script that properly handles the PORT variable.

### 🚀 Push the Fix:

```bash
git add Dockerfile start.sh railway.toml
git commit -m "Fix Railway PORT variable expansion"
git push origin main
```

Railway will automatically redeploy!

## 📊 What Should Happen

### Build Logs (Success):
```
Building Dockerfile...
Step 1/9 : FROM python:3.10-slim
Step 2/9 : WORKDIR /app
Step 3/9 : RUN pip install uv
✓ Successfully installed uv
Step 4/9 : COPY backend ./backend
Step 5/9 : COPY start.sh /app/start.sh
Step 6/9 : RUN chmod +x /app/start.sh
Step 7/9 : WORKDIR /app/backend
Step 8/9 : RUN uv sync
✓ Dependencies installed
Step 9/9 : CMD ["/app/start.sh"]
✓ Build complete
```

### Runtime Logs (Success):
```
Starting uvicorn on port 8080...
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8080
```

## 🧪 Test After Deploy

Once you see "Application startup complete" in the logs:

### Test 1: Health Check
```bash
curl https://rtshackathon-production.up.railway.app/health
```

Should return:
```json
{
  "message": "EduComic API is running",
  "status": "healthy",
  "supabase_configured": true
}
```

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

Empty array is OK - it means database works but no data yet!

## 🔗 Update Vercel (If Needed)

If Railway URL changed, update Vercel:

1. Go to Vercel → Settings → Environment Variables
2. Update `VITE_API_URL` to: `https://rtshackathon-production.up.railway.app`
3. Redeploy frontend

## 🎯 Why This Fix Works

**Before:**
- Docker CMD was trying to expand `$PORT` but failing
- Railway was passing literal string "$PORT"

**After:**
- Using a bash script (`start.sh`) that properly expands variables
- Script explicitly handles PORT with fallback to 8000
- Much more reliable!

## 📋 Checklist

- [ ] Pushed new Dockerfile and start.sh
- [ ] Railway is redeploying
- [ ] Build logs show success
- [ ] Runtime logs show "Starting uvicorn on port XXXX"
- [ ] No more "$PORT is not a valid integer" errors
- [ ] `/health` endpoint returns 200 OK
- [ ] Backend is accessible

## 🆘 If Still Failing

Check Railway logs for:

1. **Build errors** - Dependencies not installing
2. **Permission errors** - start.sh not executable (should be fixed)
3. **Module errors** - Python imports failing

Share the logs and I'll help!

---

**Push the changes now - this will definitely fix the PORT error!** 🚀
