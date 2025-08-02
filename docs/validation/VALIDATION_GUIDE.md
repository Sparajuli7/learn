# SkillMirror Validation Guide

This guide helps you validate that all SkillMirror features are working correctly according to the original specifications.

## 🎯 Performance Target: <2 minutes for full analysis ✅

## 📋 Validation Checkpoints

### ✅ Video Upload Works with 10MB+ Files
**Test Steps:**
1. Navigate to http://localhost:3000
2. Select "Upload Video" tab
3. Try uploading a video file >10MB
4. Verify error message appears for files >10MB
5. Upload a video file <10MB
6. Verify upload succeeds and preview displays

**Expected Results:**
- ❌ Files >10MB are rejected with clear error message
- ✅ Files <10MB upload successfully
- ✅ Video preview displays correctly
- ✅ File information shows (name, size, duration)

### ✅ Analysis Completes in <2 Minutes
**Test Steps:**
1. Upload or record a 30-60 second video
2. Click "Start Analysis" or "Analyze Recording"
3. Time the analysis process
4. Verify results appear within 2 minutes

**Expected Results:**
- ✅ Analysis completes in <120 seconds
- ✅ Progress indicators show during analysis
- ✅ Real-time updates appear via WebSocket
- ✅ Analysis results display correctly

### ✅ Joint Tracking Detects 15+ Body Points Accurately
**Test Steps:**
1. Record or upload a video showing full body
2. Start analysis
3. Check detailed analysis tab
4. Verify joint tracking metrics

**Expected Results:**
- ✅ "Joint Tracking" shows 15+ points detected
- ✅ Tracking quality >70%
- ✅ Movement smoothness calculated
- ✅ Pose consistency reported

**Technical Verification:**
```bash
# Check MediaPipe installation
cd backend
source venv/bin/activate
python -c "import mediapipe as mp; print('MediaPipe version:', mp.__version__)"
```

### ✅ Speech Analysis Covers Pace, Tone, Content, and Word Choice
**Test Steps:**
1. Upload/record video with clear speech
2. Start analysis
3. Check detailed analysis results
4. Verify all speech metrics appear

**Expected Results:**
- ✅ **Pace Analysis**: Words per minute, pace consistency
- ✅ **Tone Analysis**: Confidence, clarity, pitch variance
- ✅ **Content Analysis**: Coherence, structure, filler words
- ✅ **Word Choice**: Vocabulary diversity, sophistication

**Technical Verification:**
```bash
# Check OpenAI API access
cd backend
source venv/bin/activate
python -c "import openai; print('OpenAI library installed')"
```

### ✅ Feedback Appears in Real-Time
**Test Steps:**
1. Open browser developer tools (Network tab)
2. Start video analysis
3. Monitor WebSocket connections
4. Verify real-time messages appear

**Expected Results:**
- ✅ WebSocket connection establishes to `/ws/{user_id}`
- ✅ Analysis progress messages received
- ✅ Real-time feedback messages during analysis
- ✅ Completion notification received

**Technical Verification:**
```bash
# Test WebSocket endpoint
curl -I http://localhost:8000/ws/1
# Should return 426 Upgrade Required
```

### ✅ Database Stores All Data Correctly
**Test Steps:**
1. Complete a full video analysis
2. Check database records
3. Verify data integrity

**Expected Results:**
- ✅ User record created in `users` table
- ✅ Video record stored in `videos` table
- ✅ Analysis results saved in `analysis_results` table
- ✅ Skills populated in `skills` table

**Technical Verification:**
```bash
cd backend
source venv/bin/activate
python -c "
from database import SessionLocal, User, Video, AnalysisResult, Skill
db = SessionLocal()
print('Users:', db.query(User).count())
print('Videos:', db.query(Video).count())
print('Analyses:', db.query(AnalysisResult).count())
print('Skills:', db.query(Skill).count())
db.close()
"
```

### ✅ UI is Responsive on Mobile/Desktop
**Test Steps:**
1. Open http://localhost:3000 on desktop
2. Test all features (upload, record, analysis display)
3. Use browser dev tools to simulate mobile
4. Test responsive behavior

**Expected Results:**
- ✅ Layout adapts to different screen sizes
- ✅ Touch interactions work on mobile
- ✅ Video components scale properly
- ✅ Navigation remains accessible

## 🔧 API Endpoints Return 200 Status

### Health Check
```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy", "timestamp": "..."}
```

### Skills Endpoint
```bash
curl http://localhost:8000/skills/
# Expected: Array of 5 skill objects
```

### User Creation
```bash
curl -X POST "http://localhost:8000/users/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=Test User&email=test@example.com"
# Expected: {"id": 1, "name": "Test User", "email": "test@example.com"}
```

### Video Upload
```bash
curl -X POST "http://localhost:8000/upload-video/" \
  -F "file=@test_video.mp4" \
  -F "skill_type=Public Speaking" \
  -F "user_id=1"
# Expected: {"video_id": X, "file_path": "...", "status": "uploaded"}
```

## 🗄️ Database Schema is Stable

### Verify Tables Exist
```sql
-- Connect to SQLite database
sqlite3 backend/skillmirror.db

-- Check tables
.tables
-- Expected: users, videos, analysis_results, skills

-- Check schema
.schema users
.schema videos
.schema analysis_results
.schema skills
```

### Expected Schema:
- **users**: id, email, name, created_at
- **videos**: id, user_id, file_path, skill_type, duration, created_at
- **analysis_results**: id, video_id, analysis_data, feedback, created_at
- **skills**: id, name, category, expert_patterns, created_at

## 📊 Performance Benchmarks Met

### Analysis Time Benchmark
```bash
# Time a complete analysis
time curl -X POST "http://localhost:8000/analyze-video/1"
# Expected: real time < 2m0.000s
```

### Memory Usage
```bash
# Monitor memory during analysis
top -p $(pgrep -f "python run.py")
# Expected: Reasonable memory usage (<1GB for typical videos)
```

### File Size Handling
```bash
# Test with various file sizes
ls -lh uploads/
# Verify 10MB limit enforced
```

## 🚨 Troubleshooting Common Issues

### MediaPipe Installation Issues
```bash
# On Apple Silicon Macs
pip uninstall mediapipe
pip install mediapipe --no-deps
pip install opencv-python numpy protobuf

# On Linux with missing libraries
sudo apt-get install libgl1-mesa-glx libglib2.0-0
```

### OpenAI API Issues
```bash
# Test API key
export OPENAI_API_KEY="your_key_here"
python -c "
import openai
try:
    openai.Audio.transcribe('whisper-1', open('test.wav', 'rb'))
    print('API key works')
except:
    print('API key invalid or no test file')
"
```

### WebSocket Connection Issues
```bash
# Check if backend WebSocket is running
netstat -an | grep 8000
# Should show LISTEN on port 8000
```

### Frontend Build Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## ✅ Final Validation Checklist

- [ ] All 5 skills appear in dropdown
- [ ] Video upload accepts MP4, MOV, AVI, MKV, WebM
- [ ] File size validation works (10MB limit)
- [ ] Camera recording requests permissions
- [ ] Live video feed displays correctly
- [ ] Analysis progress shows real-time updates
- [ ] Joint tracking reports 15+ points
- [ ] Speech analysis shows all 4 categories
- [ ] Results display in Overview, Detailed, Feedback tabs
- [ ] WebSocket connection maintains during analysis
- [ ] Database stores complete analysis data
- [ ] UI responds on mobile and desktop
- [ ] All API endpoints return proper status codes
- [ ] Analysis completes within 2-minute target

## 🎉 Success Criteria

**The SkillMirror foundation is complete when:**
1. ✅ All validation checkpoints pass
2. ✅ Performance benchmarks are met
3. ✅ Database schema is stable and functional
4. ✅ Frontend displays analysis results correctly
5. ✅ Real-time feedback system works via WebSocket
6. ✅ All 5 MVP skills are supported and functional

**Ready for next phase:** Advanced features, expert pattern comparison, and monetization components.

---

**🚀 Quick Validation Command:**
```bash
./run_skillmirror.sh
# Wait for "SkillMirror is now running!" message
# Open http://localhost:3000
# Upload a test video and verify complete analysis cycle
```