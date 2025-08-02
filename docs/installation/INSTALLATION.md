# SkillMirror Installation Guide

This guide will help you set up SkillMirror - Real-Time Learning Feedback System on your local machine.

## Prerequisites

### System Requirements
- **Node.js 18+** for the frontend
- **Python 3.8+** for the backend
- **FFmpeg** (optional, for advanced video processing)
- **Git** for cloning the repository

### API Keys Required
- **OpenAI API Key** for speech analysis and transcription

## Quick Start (Automated Setup)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd skillmirror

# Make scripts executable
chmod +x setup_frontend.sh setup_backend.sh run_skillmirror.sh

# Setup backend
./setup_backend.sh

# Setup frontend
./setup_frontend.sh
```

### 2. Configure Environment Variables

#### Backend Configuration
```bash
# Copy and edit the backend environment file
cd backend
cp .env.example .env

# Edit .env and add your OpenAI API key:
# OPENAI_API_KEY=your_openai_api_key_here
```

#### Frontend Configuration
```bash
# Copy and edit the frontend environment file
cd frontend
cp .env.local.example .env.local

# The default values should work for local development
```

### 3. Start the Application
```bash
# From the root directory
./run_skillmirror.sh
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Manual Setup

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install --upgrade pip
pip install -r requirements.txt
pip install soundfile  # Additional dependency for audio processing
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

5. **Initialize database**
```bash
python -c "from database import create_tables, init_default_skills; create_tables(); init_default_skills()"
```

6. **Start backend server**
```bash
python run.py
```

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.local.example .env.local
# Edit .env.local if needed (defaults should work for local development)
```

4. **Start frontend server**
```bash
npm run dev
```

## Validation Checklist

After installation, verify these features work:

### ✅ Basic Functionality
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend API responds at http://localhost:8000/health
- [ ] API documentation loads at http://localhost:8000/docs
- [ ] Skill selector displays 5 skills
- [ ] Upload and record tabs are visible

### ✅ Video Upload
- [ ] Drag & drop video upload works
- [ ] File size validation (10MB limit)
- [ ] Video preview displays correctly
- [ ] Upload progress shows during analysis

### ✅ Video Recording
- [ ] Camera permission request appears
- [ ] Live video feed displays
- [ ] Recording controls work (start/stop)
- [ ] Recorded video playback works

### ✅ Analysis Engine
- [ ] Video analysis completes in <2 minutes
- [ ] Joint tracking detects 15+ body points
- [ ] Speech analysis processes pace, tone, content, word choice
- [ ] Analysis results display correctly
- [ ] Database stores analysis data

### ✅ Real-time Features
- [ ] WebSocket connection establishes
- [ ] Real-time feedback appears during analysis
- [ ] Progress updates show analysis stages
- [ ] Error handling works correctly

### ✅ User Interface
- [ ] Responsive design on mobile/desktop
- [ ] All tabs (Overview, Detailed, Feedback) work
- [ ] Score cards display correctly
- [ ] Feedback sections populate with data

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes on ports 3000 and 8000
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
```

#### Python Dependencies
```bash
# If MediaPipe installation fails on Apple Silicon
pip install mediapipe --no-deps
pip install opencv-python numpy

# If audio processing fails
pip install librosa soundfile

# For FFmpeg issues on macOS
brew install ffmpeg
```

#### Node.js Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### OpenAI API Issues
- Verify your API key is valid
- Check API usage limits
- Ensure you have access to Whisper API

#### Camera/Microphone Access
- Grant permissions in browser settings
- Use HTTPS in production
- Check browser compatibility

### Performance Issues

#### Slow Analysis
- Check OpenAI API response times
- Verify MediaPipe installation
- Monitor CPU usage during analysis

#### Memory Usage
- Large video files consume more memory
- Consider implementing video compression
- Monitor RAM usage with multiple analyses

## Development

### Adding New Skills
1. Update the Skills table in `backend/database.py`
2. Add skill icon in `frontend/app/components/SkillSelector.tsx`
3. Implement skill-specific analysis in `backend/video_analysis.py`

### Customizing Analysis
- Modify thresholds in analysis modules
- Add new metrics to feedback generation
- Customize UI components for specific needs

### Database Migration
```bash
# To switch to PostgreSQL later
pip install psycopg2-binary
# Update DATABASE_URL in .env
```

## Production Deployment

### Environment Variables
- Set `DEBUG=false` in backend
- Use secure SECRET_KEY
- Configure proper CORS_ORIGINS
- Set up SSL certificates

### Database
- Migrate to PostgreSQL
- Set up proper backups
- Configure connection pooling

### File Storage
- Use cloud storage (AWS S3)
- Implement CDN for video delivery
- Set up proper file cleanup

### Monitoring
- Add logging and error tracking
- Monitor API performance
- Set up health checks

## Support

For issues and questions:
1. Check this troubleshooting guide
2. Review the API documentation at http://localhost:8000/docs
3. Check the console logs for error messages
4. Verify all prerequisites are met

---

**Ready to start analyzing skills? Run `./run_skillmirror.sh` and visit http://localhost:3000!**