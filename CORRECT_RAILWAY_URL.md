# ✅ Correct Railway URL

Your backend is deployed at:
```
https://rtshackathon-production-f90b.up.railway.app
```

## 🔧 Update Vercel Environment Variable

### Step 1: Update in Vercel

1. Go to **Vercel Dashboard**
2. Open your project
3. Click **Settings** → **Environment Variables**
4. Find `VITE_API_URL`
5. Click **Edit**
6. Change value to: `https://rtshackathon-production-f90b.up.railway.app`
7. Make sure it's enabled for: **Production**, **Preview**, **Development**
8. Click **Save**

### Step 2: Redeploy Frontend

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Wait 1-2 minutes for build to complete

## 🧪 Test Your Backend

### Test 1: Health Check
Open in browser or run:
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

### Test 2: Get Students
```bash
curl https://rtshackathon-production-f90b.up.railway.app/students
```

### Test 3: Get Classrooms
```bash
curl https://rtshackathon-production-f90b.up.railway.app/classrooms
```

## 🔍 Test in Browser Console

1. Open your Vercel site
2. Press **F12** (Developer Tools)
3. Go to **Console** tab
4. Run this:

```javascript
fetch('https://rtshackathon-production-f90b.up.railway.app/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Expected result:**
```javascript
{message: "EduComic API is running", status: "healthy"}
```

## ✅ After Vercel Redeploys

1. Open your Vercel site
2. Try student login
3. Everything should work now! 🎉

## 🐛 If Still Not Working

Check browser console (F12) and tell me:
1. What error message you see
2. What URL it's trying to connect to
3. Your Vercel URL

---

**The correct URL is: `https://rtshackathon-production-f90b.up.railway.app`**
