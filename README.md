# EduComic 📚✨

Transform classroom lessons into engaging, personalized graphic novels using AI. EduComic helps teachers create interactive educational comics that bring students into the story as characters.

## 🌟 Features

- **AI-Powered Story Generation** - Create educational comics from lesson prompts using OpenAI
- **Student Avatars** - Generate custom avatars for students using FLUX AI
- **Classroom Management** - Organize students, materials, and stories by classroom
- **Interactive Story Viewer** - Read comics in webtoon or grid layout
- **PDF Export** - Export stories as PDFs for offline reading
- **Material Upload** - Share lesson materials with students
- **Student Portal** - Students can view their stories and classrooms

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 20+
- [UV](https://docs.astral.sh/uv/) (Python package manager)
- Supabase account
- OpenAI API key
- Black Forest Labs API key (for FLUX)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/educomic.git
cd educomic
```

### 2. Set Up Backend

```bash
# Install UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# Navigate to backend
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_KEY=your_supabase_anon_key
# OPENAI_API_KEY=sk-proj-...
# BLACK_FOREST_API_KEY=...
# ENVIRONMENT=development

# Install dependencies
uv sync

# Start backend server
cd src
uv run uvicorn main:app --reload --port 8000
```

Backend will be running at `http://localhost:8000`

### 3. Set Up Frontend

```bash
# Navigate to frontend (from project root)
cd frontend

# Copy environment template
cp .env.example .env

# Edit .env
# VITE_API_URL=http://localhost:8000

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be running at `http://localhost:5173`

### 4. Set Up Supabase Database

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed database setup instructions.

## 📁 Project Structure

```
EduComic/
├── backend/                 # FastAPI backend
│   ├── src/
│   │   ├── main.py         # API entry point
│   │   ├── database/       # Supabase integration
│   │   └── services/       # Business logic
│   ├── pyproject.toml      # Python dependencies
│   └── .env.example        # Environment template
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   └── lib/           # API client & utilities
│   ├── package.json       # Node dependencies
│   └── .env.example       # Environment template
├── Dockerfile             # Docker configuration
├── railway.toml           # Railway deployment config
└── README.md             # This file
```

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **Supabase** - PostgreSQL database with real-time features
- **OpenAI** - GPT-4 for story generation
- **Black Forest Labs** - FLUX for image generation
- **UV** - Fast Python package manager

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **React Router** - Client-side routing
- **Tanstack Query** - Data fetching and caching

## 🚢 Deployment

### Deploy to Vercel (Frontend)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set root directory to `frontend`
4. Add environment variable:
   - `VITE_API_URL` = Your backend URL
5. Deploy!

### Deploy to Railway (Backend)

1. Push your code to GitHub
2. Create new project in [Railway](https://railway.app)
3. Connect your GitHub repository
4. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENAI_API_KEY`
   - `BLACK_FOREST_API_KEY`
   - `ENVIRONMENT=production`
5. Railway will automatically detect and deploy using the Dockerfile

### Using Docker

```bash
# Build the image
docker build -t educomic-backend .

# Run the container
docker run -p 8000:8000 \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_KEY=your_key \
  -e OPENAI_API_KEY=your_key \
  -e BLACK_FOREST_API_KEY=your_key \
  -e ENVIRONMENT=production \
  educomic-backend
```

## 🔐 Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Your Supabase project URL | ✅ |
| `SUPABASE_KEY` | Supabase anon/public key | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for story generation | ✅ |
| `BLACK_FOREST_API_KEY` | Black Forest Labs API key for FLUX | ✅ |
| `ENVIRONMENT` | `development` or `production` | ✅ |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | ✅ |

## 📖 API Documentation

Once the backend is running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🧪 Testing

### Backend Tests
```bash
cd backend
uv run pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the docs folder for detailed guides
- **Issues**: Open an issue on GitHub
- **Email**: support@educomic.com

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Black Forest Labs for FLUX image generation
- Supabase for the amazing backend platform
- shadcn/ui for beautiful components

---

**Made with ❤️ for educators and students**
