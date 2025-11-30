# Debug Database Connection Issue

## 🔍 Symptoms

- ✅ Backend is running (no 502 error)
- ✅ Frontend loads (takes time = trying to connect)
- ❌ Can't fetch students
- ❌ Can't fetch classrooms

**This means:** Backend is running but can't connect to Supabase OR no data exists.

## 🧪 Quick Tests

### Test 1: Check Backend Health

Open in browser:
```
https://rtshackathon-production.up.railway.app/health
```

**What do you see?**

#### ✅ Good Response:
```json
{
  "message": "EduComic API is running",
  "status": "healthy",
  "supabase_configured": true
}
```

#### ❌ Bad Response:
```json
{
  "message": "EduComic API is running",
  "status": "healthy",
  "supabase_configured": false
}
```

If `supabase_configured` is `false`, the environment variables are wrong!

### Test 2: Try to Get Students

Open in browser:
```
https://rtshackathon-production.up.railway.app/students
```

**What do you see?**

#### ✅ Empty but working:
```json
{
  "success": true,
  "students": []
}
```
This means database works but no students exist yet!

#### ❌ Error:
```json
{
  "detail": "Could not connect to database"
}
```
This means Supabase credentials are wrong!

### Test 3: Try to Get Classrooms

Open in browser:
```
https://rtshackathon-production.up.railway.app/classrooms
```

Same as above - should return empty array if working.

## 🔧 Fix: Check Railway Environment Variables

### Step 1: Verify Supabase Credentials

1. Go to **Railway Dashboard** → Your service → **Variables** tab

2. Check `SUPABASE_URL`:
   - Should look like: `https://xxxxx.supabase.co`
   - Should NOT have `/rest/v1` at the end
   - Should NOT have quotes around it

3. Check `SUPABASE_KEY`:
   - Should start with: `eyJhbGc...`
   - Should be the **anon** key (not service_role)
   - Should NOT have quotes around it

### Step 2: Get Correct Values from Supabase

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy these values:

**Project URL:**
```
https://xxxxx.supabase.co
```

**anon/public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Update Railway Variables

1. Go to Railway → Variables tab
2. Click **Edit** on `SUPABASE_URL`
3. Paste the correct URL (no trailing slash)
4. Click **Edit** on `SUPABASE_KEY`
5. Paste the correct anon key
6. Railway will automatically redeploy

## 🔍 Check Railway Logs

Go to **Deployments** → **View Logs**

**Look for these errors:**

### Error 1: "Could not connect to Supabase"
```
Error: Invalid API key
```
**Fix:** Wrong SUPABASE_KEY - use anon key, not service_role

### Error 2: "404 Not Found"
```
404: Not Found
```
**Fix:** Wrong SUPABASE_URL - should be just the base URL

### Error 3: "No data returned"
```
[]
```
**This is OK!** It means database works but no data exists yet.

## 📊 Check Browser Console

1. Open your Vercel site
2. Press **F12** → **Console** tab
3. Try to view students or classrooms
4. Look for errors

**Common errors:**

### Error: "Failed to fetch"
```
Failed to fetch https://rtshackathon-production.up.railway.app/students
```
**Cause:** Backend endpoint doesn't exist or crashed  
**Fix:** Check Railway logs

### Error: "500 Internal Server Error"
```
GET /students 500
```
**Cause:** Backend crashed when querying database  
**Fix:** Check Railway logs for Python errors

### Error: "Network request failed"
```
TypeError: Failed to fetch
```
**Cause:** CORS or network issue  
**Fix:** Check if backend URL is correct in Vercel

## 🎯 Most Likely Issues

### Issue 1: No Data in Database (Most Common)

If backend returns empty arrays `[]`, the database is working but empty!

**Solution:** Create test data:

1. Go to your Vercel site
2. Try to create a classroom as a teacher
3. Try to create a student account
4. Then try to fetch again

### Issue 2: Wrong Supabase Credentials

If backend returns errors, credentials are wrong.

**Solution:**
1. Get correct values from Supabase dashboard
2. Update Railway variables
3. Wait for redeploy

### Issue 3: Supabase RLS Blocking Queries

If Supabase has Row Level Security (RLS) enabled, it might block queries.

**Check in Supabase:**
1. Go to **Database** → **Tables**
2. Click on `students` table
3. Check if RLS is enabled
4. If yes, you need policies or disable RLS for testing

## 🧪 Create Test Data

Let's create a test student via API:

```bash
curl -X POST "https://rtshackathon-production.up.railway.app/students/create?name=Test%20Student&interests=Math%20and%20Science"
```

**What happens?**

#### ✅ Success:
```json
{
  "success": true,
  "student": {
    "id": "xxx",
    "name": "Test Student",
    "interests": "Math and Science"
  }
}
```

#### ❌ Error:
```json
{
  "detail": "Could not create student"
}
```

If you get an error, check Railway logs!

## 📋 Debugging Checklist

- [ ] Backend `/health` returns `supabase_configured: true`
- [ ] `SUPABASE_URL` is correct (from Supabase dashboard)
- [ ] `SUPABASE_KEY` is correct (anon key)
- [ ] No quotes around environment variables
- [ ] Railway redeployed after changing variables
- [ ] Backend `/students` returns something (even if empty)
- [ ] Browser console shows the correct backend URL
- [ ] Vercel `VITE_API_URL` is set to Railway URL
- [ ] Frontend was redeployed after setting variable

## 🆘 Next Steps

**Tell me:**

1. What does `/health` endpoint return?
2. What does `/students` endpoint return?
3. What errors are in Railway logs?
4. What errors are in browser console?

**Most likely:** Either Supabase credentials are wrong OR database is empty (which is normal for first deploy).

---

**Test the endpoints above and share what you see!** 🔍
