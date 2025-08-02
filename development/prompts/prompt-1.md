# PROMPT 1: Foundation and Video Analysis

I need to build the foundation for "SkillMirror" - a real-time learning feedback system that analyzes videos and provides instant improvement suggestions.

**Tech Stack:**
- Frontend: React/Next.js with Tailwind CSS
- Backend: Python FastAPI
- Database: SQLite (migrate to PostgreSQL later)
- AI: OpenAI API + MediaPipe
- Real-time: WebSocket connections

**MVP Skills (Top 5):**
1. Public Speaking (confidence, presentations)
2. Dance/Fitness (movement, coordination)
3. Cooking (technique, timing)
4. Music/Instrument (rhythm, technique)
5. Sports/Athletics (form, performance)

**What I need Cursor to build:**
1. Create project structure with frontend/backend separation
2. Build video upload component with real-time recording
3. Implement detailed video analysis using MediaPipe for joint tracking
4. Create comprehensive speech analysis (pace, tone, content, word choice)
5. Create real-time feedback display interface
6. Set up SQLite database with user and analysis tables

**Database schema:**
- Users (id, email, name, created_at)
- Videos (id, user_id, file_path, skill_type, duration, created_at)
- AnalysisResults (id, video_id, analysis_data, feedback, created_at)
- Skills (id, name, category, expert_patterns)

**Performance Target:** <2 minutes for full analysis

**Goal:** Get a working video upload and comprehensive analysis system with real-time feedback display.

**VALIDATION CHECKPOINTS:**
- [ ] Video upload works with 10MB+ files
- [ ] Analysis completes in <2 minutes
- [ ] Joint tracking detects 15+ body points accurately
- [ ] Speech analysis covers pace, tone, content, and word choice
- [ ] Feedback appears in real-time
- [ ] Database stores all data correctly
- [ ] UI is responsive on mobile/desktop

**NEXT PROMPT PREREQUISITES:**
- [ ] All API endpoints return 200 status
- [ ] Database schema is stable
- [ ] Frontend can display analysis results
- [ ] Performance benchmarks met

Please build this foundation step by step, ensuring the UI is modern and responsive.