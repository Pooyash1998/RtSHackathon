# Production Security Checklist

## 🔐 Important Security Updates for Production

### 1. Update CORS Settings in Backend

**Current (Development):**
```python
# backend/src/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Allows all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Production (Secure):**
```python
# backend/src/main.py
import os

# Get allowed origins from environment or use defaults
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://your-project.vercel.app,https://educomic.com"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # ✅ Only your domains
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)
```

**Add to your backend environment variables:**
```
ALLOWED_ORIGINS=https://your-project.vercel.app,https://educomic.com
```

### 2. Environment Variables Security

#### ✅ DO:
- Store all secrets in platform environment variables (Vercel, Railway, etc.)
- Use different API keys for development vs production
- Rotate API keys regularly
- Use `.env.example` files with placeholder values
- Keep `.env` files in `.gitignore`

#### ❌ DON'T:
- Commit `.env` files to git
- Share API keys in chat/email
- Use production keys in development
- Hardcode secrets in code
- Log sensitive information

### 3. Supabase Security

#### Row Level Security (RLS)
Make sure RLS is enabled on all tables:

```sql
-- Enable RLS on all tables
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see their own classrooms
CREATE POLICY "Users can view own classrooms"
ON classrooms FOR SELECT
USING (auth.uid() = teacher_id);

-- Example policy: Users can only create their own classrooms
CREATE POLICY "Users can create own classrooms"
ON classrooms FOR INSERT
WITH CHECK (auth.uid() = teacher_id);
```

#### Storage Bucket Security
```sql
-- Avatars bucket: Public read, authenticated write
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Materials bucket: Authenticated users only
CREATE POLICY "Authenticated users can view materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'materials' AND auth.role() = 'authenticated');
```

### 4. API Rate Limiting

Add rate limiting to prevent abuse:

```python
# backend/src/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to expensive endpoints
@app.post("/story/generate-options")
@limiter.limit("10/minute")  # Max 10 requests per minute
async def generate_story_options(...):
    ...

@app.post("/avatar/generate")
@limiter.limit("5/minute")  # Max 5 avatar generations per minute
async def generate_avatar_endpoint(...):
    ...
```

Install slowapi:
```bash
cd backend
uv add slowapi
```

### 5. Input Validation

Ensure all inputs are validated:

```python
from pydantic import BaseModel, Field, validator

class StoryRequest(BaseModel):
    classroom_id: str = Field(..., min_length=1, max_length=100)
    lesson_prompt: str = Field(..., min_length=10, max_length=1000)
    
    @validator('lesson_prompt')
    def validate_prompt(cls, v):
        # Prevent injection attacks
        if any(char in v for char in ['<', '>', '{', '}']):
            raise ValueError('Invalid characters in prompt')
        return v
```

### 6. HTTPS Only

#### Vercel (Frontend)
- ✅ Automatic HTTPS
- ✅ Automatic redirects from HTTP to HTTPS

#### Railway/Render (Backend)
- ✅ Automatic HTTPS
- ✅ Free SSL certificates

#### Custom Domain
- Ensure SSL certificate is valid
- Enable HSTS (HTTP Strict Transport Security)

### 7. Error Handling

Don't expose sensitive information in errors:

```python
# ❌ BAD: Exposes internal details
@app.post("/story/generate")
async def generate_story(...):
    try:
        result = await openai.create(...)
    except Exception as e:
        raise HTTPException(500, detail=str(e))  # Exposes API errors!

# ✅ GOOD: Generic error message
@app.post("/story/generate")
async def generate_story(...):
    try:
        result = await openai.create(...)
    except Exception as e:
        logger.error(f"Story generation failed: {e}")
        raise HTTPException(500, detail="Story generation failed")
```

### 8. Logging

Log important events but not sensitive data:

```python
import logging

logger = logging.getLogger(__name__)

# ✅ GOOD: Log actions
logger.info(f"User {user_id} created classroom {classroom_id}")

# ❌ BAD: Log sensitive data
logger.info(f"API Key: {api_key}")  # Never log secrets!
logger.info(f"Password: {password}")  # Never log passwords!
```

### 9. API Key Management

#### OpenAI
- Set spending limits in OpenAI dashboard
- Monitor usage regularly
- Use separate keys for dev/prod

#### Black Forest Labs (FLUX)
- Monitor API usage
- Set up billing alerts
- Use separate keys for dev/prod

#### Supabase
- Use service role key only in backend (never in frontend)
- Use anon key in frontend (with RLS enabled)
- Rotate keys if compromised

### 10. Monitoring & Alerts

#### Set Up Alerts
- API usage exceeds threshold
- Error rate increases
- Unusual traffic patterns
- Failed authentication attempts

#### Monitor These Metrics
- API response times
- Error rates
- API costs (OpenAI, FLUX)
- Database query performance
- Storage usage

## 🚀 Production Deployment Checklist

Before going live:

- [ ] CORS restricted to your domains
- [ ] All secrets in environment variables
- [ ] Different API keys for production
- [ ] Supabase RLS enabled on all tables
- [ ] Storage bucket policies configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced
- [ ] Error messages don't expose internals
- [ ] Logging configured (no sensitive data)
- [ ] API spending limits set
- [ ] Monitoring and alerts configured
- [ ] Backup strategy in place
- [ ] Tested all critical flows

## 📊 Cost Monitoring

### OpenAI
- Dashboard: https://platform.openai.com/usage
- Set monthly limit: Settings → Billing → Usage limits

### Black Forest Labs
- Monitor usage in dashboard
- Set up billing alerts

### Vercel
- Free tier: 100GB bandwidth/month
- Monitor: Project → Analytics

### Railway/Render
- Check usage in dashboard
- Set spending limits

### Supabase
- Free tier: 500MB database, 1GB storage
- Monitor: Project → Settings → Usage

## 🆘 Security Incident Response

If you suspect a security breach:

1. **Immediately rotate all API keys**
   - OpenAI
   - Black Forest Labs
   - Supabase
   - Any other services

2. **Check logs for suspicious activity**
   - Unusual API calls
   - Failed authentication attempts
   - Unexpected data access

3. **Review recent deployments**
   - Check for unauthorized code changes
   - Review environment variable changes

4. **Notify users if data was compromised**
   - Be transparent
   - Explain what happened
   - What you're doing to fix it

5. **Update security measures**
   - Add additional validation
   - Implement stricter rate limits
   - Enable additional monitoring

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Supabase Security](https://supabase.com/docs/guides/auth)
- [Vercel Security](https://vercel.com/docs/security)

---

**Remember:** Security is an ongoing process, not a one-time setup!
