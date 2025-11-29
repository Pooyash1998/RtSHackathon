"""
FastAPI main application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="EduComic API",
    description="API for educational comic generation",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "EduComic API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "supabase_configured": bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"))
    }

# Import and include routers
from routers import classrooms, student, stories, upload

app.include_router(classrooms.router)
app.include_router(student.router)
app.include_router(stories.router)
app.include_router(upload.router)