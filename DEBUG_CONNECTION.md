# Debug Frontend-Backend Connection

## 🔍 Quick Diagnosis

### Step 1: Check Browser Console

1. Open your Vercel site
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try to log in or fetch data
5. Look for errors

**What to look for:**

#### ❌ Error: "Failed to fetch" or "Network Error"
```
Failed to fetch http://localhost:8000/...
```
**Problem:** Frontend is still using localhost instead of Railway URL

**Fix:** Update `VITE_API_URL` in Vercel (see Step 2 below)

#### ❌ Error: "CORS policy"
```
Access to fetch at 'https://rtshackathon-production.up.railway.app' 
has been blocked by CORS policy
```
**Problem:** Backend CORS not allowing your Vercel domain

**Fix:** Update backend CORS (see Step 3 below)

#### ❌ Error: "404 Not Found"
```
GET https://rtshackathon-production.up.railway.app/students/xxx 404
```
**Problem:** Backend endpoint doesn't exist or wrong URL

**Fix:** Check Railway logs (see Step 4 below)

### Step 2: Verify Vercel Environment Variable

1. Go to **Vercel Dashboard**
2. Open your project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_URL`

**Should be:**
```
VITE_API_URL = https://rtshackathon-production.up.railway.app
```

**NOT:**
```
VITE_API_URL = http://localhost:8000  ❌
```

**If it's wrong:**
1. Click **Edit**
2. Change to: `https://rtshackathon-production.up.railway.app`
3. Make sure it's enabled for: **Production**, **Preview**, **Development**
4. Click **Save**
5. Go to **Deployments** → **Redeploy**

**Important:** After changing environment variables, you MUST redeploy!

### Step 3: Check Backend CORS

Your backend needs to allow requests from your Vercel domain.

**Test if backend is accessible:**
```bash
curl https://rtshackathon-production.up.railway.app/health
```

Should return:
```json
{
  "message": "EduComic API is running",
  "status": "healthy"
}
```

**If that works, check CORS:**

Open browser console on your Vercel site and run:
```javascript
fetch('https://rtshackathon-production.up.railway.app/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**If you get CORS error, fix it:**

The backend currently allows all origins (`allow_origins=["*"]`), which should work. But if you're getting CORS errors, we need to check Railway environment variables.

### Step 4: Check Railway Logs

1. Go to **Railway Dashboard**
2. Click on your service
3. Go to **Deployments** tab
4. Click **View Logs**

**Look for:**

#### ✅ Good logs:
```
INFO:     Started server process
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### ❌ Bad logs:
```
Error: Could not connect to Supabase
Error: SUPABASE_URL not set
```

**If you see errors about environment variables:**
1. Go to **Variables** tab
2. Make sure all 5 variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENAI_API_KEY`
   - `BLACK_FOREST_API_KEY`
   - `ENVIRONMENT=production`
3. Click **Redeploy**

### Step 5: Test Backend Directly

Open these URLs in your browser:

**Health check:**
```
https://rtshackathon-production.up.railway.app/health
```

**Get all students:**
```
https://rtshackathon-production.up.railway.app/students
```

**Get all classrooms:**
```
https://rtshackathon-production.up.railway.app/classrooms
```

**If any return errors, check Railway logs for details.**

## 🔧 Common Fixes

### Fix 1: Redeploy Frontend with Correct API URL

```bash
# Make sure you have the latest code
git pull

# Verify Vercel environment variable is correct
# Then redeploy in Vercel dashboard
```

### Fix 2: Update Backend CORS (if needed)

If you're getting CORS errors, we need to update the backend to explicitly allow your Vercel domain.

Let me know your Vercel URL and I'll create the fix!

### Fix 3: Check Supabase Connection

Test if backend can connect to Supabase:

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

If `supabase_configured` is `false`, check Railway environment variables.

## 🧪 Test Student Login Flow

### Manual Test:

1. **Create a student** (if you don't have one):
   ```bash
   curl -X POST "https://rtshackathon-production.up.railway.app/students/create?name=Test%20Student&interests=Math"
   ```
   
   Copy the `student_id` from the response.

2. **Get student data:**
   ```bash
   curl "https://rtshackathon-production.up.railway.app/students/STUDENT_ID"
   ```

3. **If both work**, the backend is fine. The issue is frontend connection.

### Frontend Test:

1. Open your Vercel site
2. Open browser console (F12)
3. Run:
   ```javascript
   // Check what API URL the frontend is using
   console.log(import.meta.env.VITE_API_URL)
   ```

4. If it shows `undefined` or `http://localhost:8000`, the environment variable isn't loaded.

## 📋 Checklist

- [ ] Backend is running on Railway
- [ ] Backend `/health` endpoint works
- [ ] Railway environment variables are set
- [ ] Vercel `VITE_API_URL` is set to Railway URL
- [ ] Vercel has been redeployed after setting variable
- [ ] Browser console shows no CORS errors
- [ ] Backend logs show no errors
- [ ] Can fetch data from backend directly (curl)

## 🆘 Still Not Working?

### Share These Details:

1. **Vercel URL:** (your frontend URL)
2. **Railway URL:** `https://rtshackathon-production.up.railway.app`
3. **Browser console errors:** (screenshot or copy/paste)
4. **Railway logs:** (last 20 lines)
5. **What happens when you try to login?**

### Quick Debug Commands:

```bash
# Test backend health
curl https://rtshackathon-production.up.railway.app/health

# Test getting students
curl https://rtshackathon-production.up.railway.app/students

# Test from browser console (on your Vercel site)
fetch('https://rtshackathon-production.up.railway.app/health')
  .then(r => r.json())
  .then(console.log)
```

---

**Most likely issue:** Vercel environment variable not set correctly or frontend not redeployed after setting it.
