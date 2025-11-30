"""
AWS Elastic Beanstalk entry point.
EB looks for an 'application' variable.
"""
from src.main import app

# Elastic Beanstalk expects 'application'
application = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(application, host="0.0.0.0", port=8000)
