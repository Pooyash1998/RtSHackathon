# Railway Docker Fix - "cd command not found" Error

## ✅ Fixed!

The error happened because Railway couldn't run `cd` commands in the container. I've switched to using Docker, which is much more reliable.

## 🚀 Deploy Now (2 Steps)

### Step 1: Push the Fixed Configuration

```bash
git add railway.json Dockerfile nixpacks.toml Procfile
git commit -m "Fix Railway deployment - use Docker"
git push origin main
```

### Step 2: Configure Railway to Use Docker

#### Option A: In Railway Dashboard (Recommended)

1. Go to your Railway project
2. Click on your service (or create new one if you deleted it)
3. Go to **Settings** tab
4. Scroll to **Build Configuration**
5. Change **Builder** to `DOCKERFILE`
6. Set **Dockerfile Path** to `Dockerfile`
7. Click **Save**
8. Go back to **Deployments** tab
9. Click **Redeploy**

#### Option B: Create New Service

1. Delete the failed service
2. Click **+ New** → **GitHub Repo**
3. Select your repository
4. Railway will automatically detect the Dockerfile
5. Click **Deploy**

### Step 3: Add Environment Variables

While it deploys, add these variables:

1. Click on your service
2. Go to **Variables** tab
3. Add these:

```
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
OPENAI_API_KEY=your_openai_key_here
BLACK_FOREST_API_KEY=your_black_forest_key_here
ENVIRONMENT=production
```

**Note:** You don't need to add `PORT` - Railway provides it automatically!

## 📊 What You Should See

### Build Logs (Success):
```
Building Dockerfile
Step 1/8 : FROM python:3.10-slim
Step 2/8 : WORKDIR /app
Step 3/8 : RUN pip install uv
✓ Successfully installed uv
Step 4/8 : COPY backend ./backend
Step 5/8 : WORKDIR /app/backend
Step 6/8 : RUN uv sync
✓ Dependencies installed
Step 7/8 : EXPOSE 8000
Step 8/8 : CMD uv run uvicorn...
✓ Build complete
```

### Runtime Logs (Success):
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:XXXX
```

### Your URL:
```
https://educomic-production-xxxx.up.railway.app
```

## ✅ Test Your Backend

Once deployed, test it:

```bash
curl https://your-app.railway.app/health
```

Should return:
```json
{
  "message": "EduComic API is running",
  "status": "healthy"
}
```

## 🔗 Connect to Frontend

1. Copy your Railway URL
2. Go to Vercel dashboard
3. Your project → **Settings** → **Environment Variables**
4. Edit `VITE_API_URL`
5. Change to: `https://your-app.railway.app`
6. Save
7. Go to **Deployments** → **Redeploy**

## 🐛 If Docker Build Fails

### Error: "COPY failed"
**Problem:** Files not found

**Fix:** Make sure you pushed all changes:
```bash
git status
git add .
git commit -m "Add all backend files"
git push
```

### Error: "uv sync failed"
**Problem:** Dependencies issue

**Fix:** Check `backend/pyproject.toml` is valid:
```bash
cd backend
uv sync  # Test locally first
```

### Error: "Port already in use"
**Problem:** Port configuration

**Fix:** The Dockerfile uses `${PORT:-8000}` which means:
- Use Railway's `$PORT` if available
- Otherwise use 8000
This should work automatically!

## 🎯 Why Docker is Better

✅ **Consistent:** Works the same everywhere  
✅ **Reliable:** No "cd command not found" errors  
✅ **Portable:** Can deploy to any platform  
✅ **Debuggable:** Easy to test locally  

## 🧪 Test Docker Locally (Optional)

Want to test before deploying?

```bash
# Build the image
docker build -t educomic-backend .

# Run it
docker run -p 8000:8000 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_KEY=your_key \
  -e OPENAI_API_KEY=your_key \
  -e BLACK_FOREST_API_KEY=your_key \
  -e ENVIRONMENT=development \
  educomic-backend

# Test it
curl http://localhost:8000/health
```

## 🎉 Success Checklist

- [ ] Pushed Docker configuration
- [ ] Railway set to use DOCKERFILE builder
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] `/health` endpoint returns success
- [ ] Updated `VITE_API_URL` in Vercel
- [ ] Frontend redeployed
- [ ] Can log in to app
- [ ] Can create classrooms
- [ ] Can generate stories

## 🆘 Still Having Issues?

If Railway still fails, try **Render.com** - it's easier:

### Quick Render Setup

1. Go to https://render.com
2. **New** → **Web Service**
3. Connect GitHub
4. Configure:
   ```
   Name: educomic-backend
   Root Directory: backend
   Environment: Python 3
   Build Command: pip install uv && uv sync
   Start Command: uv run uvicorn src.main:app --host 0.0.0.0 --port $PORT
   ```
5. Add environment variables
6. Deploy!

Render is more beginner-friendly and has better error messages.

---

**The Docker configuration should work perfectly now! Just push and deploy.** 🚀
