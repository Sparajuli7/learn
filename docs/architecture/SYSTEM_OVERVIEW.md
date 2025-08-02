# SkillMirror System Architecture Overview

This document provides a high-level overview of the SkillMirror system architecture across all development phases.

## 🏗️ Architecture Evolution

### Phase 1: Foundation ✅
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│   (SQLite)      │
│                 │    │                 │    │                 │
│ • Video Upload  │    │ • MediaPipe     │    │ • Users         │
│ • Live Record   │    │ • OpenAI API    │    │ • Videos        │
│ • Results UI    │    │ • WebSocket     │    │ • Analysis      │
│ • Real-time     │    │ • Analysis      │    │ • Skills        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Phase 2: Expert Patterns 🚧
```
                         ┌─────────────────┐
                         │ Expert Database │
                         │                 │
                         │ • 20+ Experts   │
                         │ • Patterns      │
                         │ • Comparisons   │
                         └─────────────────┘
                                  ▲
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│                 │    │                 │    │                 │
│ + Expert Views  │◄──►│ + Pattern Match │◄──►│ + Experts       │
│ + Comparisons   │    │ + Recommendations│    │ + Patterns      │
│ + Progress      │    │ + Visualizations│    │ + Comparisons   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Phase 3-8: Full System 📋
```
                    ┌─────────────────┐    ┌─────────────────┐
                    │  Mobile Apps    │    │   Analytics     │
                    │ (React Native)  │    │  & Monitoring   │
                    └─────────────────┘    └─────────────────┘
                             ▲                       ▲
                             │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (FastAPI)     │◄──►│ (PostgreSQL)    │
│                 │    │                 │    │                 │
│ • All Features  │    │ • All APIs      │    │ • Full Schema   │
│ • Payments      │    │ • Security      │    │ • Optimized     │
│ • Dashboard     │    │ • Scaling       │    │ • Backed Up     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                             ▲
                             │
                    ┌─────────────────┐
                    │ Cloud Services  │
                    │ (AWS/Stripe)    │
                    └─────────────────┘
```

## 🛠️ Technology Stack

### Frontend Technologies
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context + useState/useEffect
- **Real-time**: Socket.IO client for WebSocket connections
- **Video**: HTML5 Video API + react-webcam
- **File Upload**: react-dropzone for drag & drop

### Backend Technologies
- **Framework**: FastAPI with async/await
- **Language**: Python 3.8+ with type hints
- **Database**: SQLAlchemy ORM with SQLite → PostgreSQL
- **AI/ML**: MediaPipe (video) + OpenAI API (speech)
- **Real-time**: WebSocket manager for live updates
- **Video Processing**: OpenCV for video manipulation
- **Audio Processing**: librosa for speech analysis

### Infrastructure & DevOps
- **Development**: Local SQLite with file storage
- **Production**: PostgreSQL + AWS S3 + CloudFront
- **Monitoring**: Custom analytics + error tracking
- **Security**: JWT tokens + encryption + GDPR compliance
- **Deployment**: Docker containers + CI/CD pipelines

## 📊 Data Flow Architecture

### Video Analysis Pipeline
```
1. Video Upload/Record
   ↓
2. File Validation & Storage
   ↓
3. MediaPipe Processing (Joints)
   ↓
4. OpenAI Processing (Speech)
   ↓
5. Expert Pattern Comparison
   ↓
6. Feedback Generation
   ↓
7. Real-time WebSocket Updates
   ↓
8. Database Storage
   ↓
9. UI Results Display
```

### Real-time Communication
```
Browser ←→ WebSocket ←→ FastAPI ←→ Analysis Engine
   ↑                                      ↓
   └─── Real-time Updates ←───────────────┘
```

## 🗄️ Database Schema Evolution

### Phase 1 (Foundation)
- **Users**: Basic user management
- **Videos**: Video metadata and storage
- **AnalysisResults**: Analysis data and feedback
- **Skills**: Supported skill types

### Phase 2 (Expert Patterns)
- **Experts**: Expert profiles and achievements
- **ExpertPatterns**: Detailed pattern data
- **UserComparisons**: Comparison results
- **LearningPaths**: Recommended progressions

### Phase 3-8 (Full System)
- **Subscriptions**: Payment and billing
- **APITokens**: Third-party access
- **Analytics**: Usage and performance metrics
- **SecurityLogs**: Audit trails
- **+ Many more specialized tables**

## 🔧 API Architecture

### RESTful Endpoints
```
GET    /health                 # System health check
POST   /users/                 # User registration
GET    /skills/                # Available skills
POST   /upload-video/          # Video upload
POST   /analyze-video/{id}     # Start analysis
GET    /analysis/{id}          # Get results
GET    /experts/               # Expert database
POST   /compare/{user}/{expert} # Expert comparison
```

### WebSocket Endpoints
```
/ws/{user_id}                  # Real-time connection
├── analysis_started           # Analysis began
├── analysis_progress          # Progress updates
├── real_time_feedback         # Live feedback
├── analysis_complete          # Results ready
└── analysis_error             # Error occurred
```

## 🛡️ Security Architecture

### Data Protection
- **Video Encryption**: End-to-end encryption for video data
- **Database Security**: Encrypted storage + access controls
- **API Security**: Rate limiting + authentication + validation
- **Privacy Compliance**: GDPR/CCPA data handling

### Access Control
- **User Authentication**: JWT tokens with refresh
- **Role-Based Access**: User/Admin/Expert permissions
- **API Rate Limiting**: Prevent abuse and overuse
- **Audit Logging**: Security event tracking

## 📈 Performance Architecture

### Optimization Strategies
- **Database Indexing**: Optimized queries for fast retrieval
- **Caching Layer**: Redis for session and analysis caching
- **CDN Integration**: CloudFront for video delivery
- **Load Balancing**: Multiple backend instances
- **Auto-scaling**: Dynamic resource allocation

### Performance Targets
- **Analysis Speed**: <30 seconds (target by Phase 8)
- **API Response**: <500ms for standard queries
- **Real-time Latency**: <100ms for WebSocket updates
- **UI Responsiveness**: <2 seconds for page loads

## 🔮 Future Architecture Considerations

### Scalability
- **Microservices**: Break backend into specialized services
- **Message Queues**: Async processing with Redis/RabbitMQ
- **Container Orchestration**: Kubernetes for deployment
- **Global Distribution**: Multi-region deployment

### Advanced Features
- **Machine Learning Pipeline**: Custom model training
- **Edge Computing**: Local processing for privacy
- **Blockchain Integration**: Skill verification and credentials
- **AR/VR Support**: Immersive skill training

---

**This architecture evolves with each phase, maintaining backwards compatibility while adding powerful new capabilities.** 🚀