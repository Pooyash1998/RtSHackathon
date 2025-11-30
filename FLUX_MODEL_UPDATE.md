# FLUX Model Update - Changed from Pro to 2.0 Flex

## Overview
Updated all FLUX API calls across the backend services to use FLUX 2.0 Flex instead of FLUX Pro models.

## Changes Made

### 1. Avatar Service (`backend/src/services/avatar.py`)
**Changed API endpoint:**
```python
# BEFORE
url = "https://api.bfl.ai/v1/flux-2-pro"

# AFTER
url = "https://api.bfl.ai/v1/flux-2-flex"
```

**Impact**: Avatar generation for students now uses FLUX 2.0 Flex

### 2. Comic Creation Service (`backend/src/services/comic_creation.py`)
**Changed default model endpoint:**
```python
# BEFORE
BFL_MODEL_ENDPOINT = os.getenv("BFL_MODEL_ENDPOINT", "flux-2-pro")

# AFTER
BFL_MODEL_ENDPOINT = os.getenv("BFL_MODEL_ENDPOINT", "flux-2-flex")
```

**Impact**: Comic panel generation now uses FLUX 2.0 Flex

### 3. Thumbnail Service (`backend/src/services/thumbnail.py`)
**Changed API endpoint:**
```python
# BEFORE
response = await client.post(
    f"{FLUX_API_URL}/flux-pro-1.1",
    ...
)

# AFTER
response = await client.post(
    f"{FLUX_API_URL}/flux-2-flex",
    ...
)
```

**Impact**: Story thumbnail generation now uses FLUX 2.0 Flex

## FLUX Model Comparison

### FLUX Pro (Previous)
- Higher quality outputs
- More expensive per generation
- Slower generation times
- Better for professional/production use

### FLUX 2.0 Flex (Current)
- Good quality outputs
- Most cost-effective option
- Fast generation times
- Flexible and efficient
- Perfect for educational content
- Best balance of quality and cost

## Benefits of This Change

1. **Maximum Cost Savings**: FLUX 2.0 Flex is the most economical option
2. **Fast Generation**: Quick turnaround for avatars, panels, and thumbnails
3. **Good Quality**: FLUX 2.0 Flex provides excellent quality for educational comics
4. **Consistency**: All services now use the same model version
5. **Flexibility**: Flex model adapts well to various prompts and styles

## API Endpoints Updated

| Service | Old Endpoint | New Endpoint |
|---------|-------------|--------------|
| Avatar | `flux-2-pro` | `flux-2-flex` |
| Comic Creation | `flux-2-pro` | `flux-2-flex` |
| Thumbnail | `flux-pro-1.1` | `flux-2-flex` |

## Environment Variable Override

The comic creation service allows overriding the model via environment variable:

```bash
# In .env file
BFL_MODEL_ENDPOINT=flux-2.0  # Default is now flux-2.0

# To use a different model (if needed)
BFL_MODEL_ENDPOINT=flux-pro-1.1
```

## Testing Checklist

- [ ] Generate a student avatar - verify it uses FLUX 2.0
- [ ] Generate a story with comic panels - verify panels use FLUX 2.0
- [ ] Generate a story thumbnail - verify it uses FLUX 2.0
- [ ] Check API logs to confirm correct endpoint is being called
- [ ] Verify image quality is acceptable for educational use
- [ ] Monitor generation times (should be faster)
- [ ] Monitor API costs (should be lower)

## Files Modified

1. `backend/src/services/avatar.py` - Avatar generation
2. `backend/src/services/comic_creation.py` - Comic panel generation
3. `backend/src/services/thumbnail.py` - Thumbnail generation

## Rollback Instructions

If you need to revert to FLUX Pro models:

### Option 1: Environment Variable (Recommended)
```bash
# In backend/.env
BFL_MODEL_ENDPOINT=flux-2-pro
```

### Option 2: Code Changes
Revert the changes in the three files:
- `avatar.py`: Change `flux-2.0` back to `flux-2-pro`
- `comic_creation.py`: Change default to `flux-2-pro`
- `thumbnail.py`: Change `flux-2.0` back to `flux-pro-1.1`

## API Documentation

Black Forest Labs API endpoints:
- FLUX 2.0: `https://api.bfl.ai/v1/flux-2.0`
- FLUX Pro: `https://api.bfl.ai/v1/flux-2-pro`
- FLUX Pro 1.1: `https://api.bfl.ai/v1/flux-pro-1.1`

## Notes

- All three services use the same polling mechanism for async generation
- The API key (`BLACK_FOREST_API_KEY`) remains the same
- Request/response format is compatible across FLUX models
- Generation parameters (width, height, etc.) remain unchanged

## Expected Behavior

After this change:
1. Avatar generation should complete faster
2. Comic panel generation should be more cost-effective
3. Thumbnail generation should use the standard FLUX 2.0 model
4. Image quality should still be suitable for educational comics
5. API costs should decrease

## Monitoring

Keep an eye on:
- Generation success rates
- Average generation times
- Image quality feedback from users
- API costs and usage
- Any error messages from Black Forest Labs API

If quality issues arise, consider:
- Adjusting prompts for better results with FLUX 2.0
- Using environment variable to switch specific services back to Pro
- Upgrading to Pro for production while keeping 2.0 for development
