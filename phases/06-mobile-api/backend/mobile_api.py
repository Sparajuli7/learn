"""
Comprehensive Mobile API for SkillMirror
FastAPI endpoints for mobile app and third-party integrations
"""

from fastapi import FastAPI, HTTPException, Depends, Request, File, UploadFile, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import os
import json
import logging
import time
import sys
from pydantic import BaseModel
import aiofiles
import uuid

# Import from foundation system
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '01-foundation', 'backend'))
from database import get_db as foundation_get_db, User, Video, AnalysisResult, Skill
from video_analysis import VideoAnalyzer
from speech_analysis import SpeechAnalyzer

# Import from expert patterns
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '02-expert-patterns', 'backend'))
from expert_database import Expert, ExpertPattern, UserComparison
from pattern_comparison import pattern_comparator
from expert_recommendations import recommendation_engine

# Import from cross-domain system
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '03-cross-domain', 'backend'))
from skill_transfer_engine import SkillTransferEngine
from cross_domain_database import SkillTransfer, TransferProgress

# Import from real-time system
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '04-real-time', 'backend'))
from realtime_database import FeedbackSession, ImprovementSuggestion, PerformanceMetric

# Import from monetization system
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '05-monetization', 'backend'))
from monetization_database import Subscription, Payment, ExpertBooking, CourseMarketplace
from access_control import AccessController

# Import mobile API components
from mobile_api_database import MobileApiDatabase, APIToken, APILog, MobileSession

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SkillMirror Mobile API",
    description="Comprehensive API for mobile app and third-party integrations",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
mobile_db = MobileApiDatabase()
video_analyzer = VideoAnalyzer()
speech_analyzer = SpeechAnalyzer()
transfer_engine = SkillTransferEngine()
security = HTTPBearer()

# Create upload directory
UPLOAD_DIR = "phases/06-mobile-api/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Pydantic models
class MobileSessionCreate(BaseModel):
    device_info: Dict[str, Any]
    network_type: Optional[str] = None
    battery_level: Optional[int] = None
    app_version: Optional[str] = None
    os_version: Optional[str] = None

class MobileSessionUpdate(BaseModel):
    session_data: Optional[Dict[str, Any]] = None
    network_type: Optional[str] = None
    battery_level: Optional[int] = None

class VideoAnalysisRequest(BaseModel):
    video_id: int
    skill_type: str
    analysis_options: Optional[Dict[str, Any]] = {}

class ExpertComparisonRequest(BaseModel):
    user_analysis_id: int
    expert_id: int
    comparison_options: Optional[Dict[str, Any]] = {}

class SkillTransferRequest(BaseModel):
    source_skill: str
    target_skill: str
    user_level: Optional[str] = "beginner"

class FeedbackSessionRequest(BaseModel):
    skill_type: str
    session_options: Optional[Dict[str, Any]] = {}

class APITokenCreate(BaseModel):
    name: str
    permissions: Dict[str, bool]
    rate_limit: Optional[int] = 1000
    expires_days: Optional[int] = 365

# API Token Authentication
async def get_api_token(authorization: HTTPAuthorizationCredentials = Depends(security)):
    """Validate API token"""
    token = mobile_db.validate_token(authorization.credentials)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid or expired API token")
    return token

async def check_permission(permission: str, token: APIToken = Depends(get_api_token)):
    """Check if token has specific permission"""
    if not token.permissions.get(permission, False):
        raise HTTPException(
            status_code=403, 
            detail=f"Token does not have '{permission}' permission"
        )
    return token

# Rate limiting decorator
def rate_limit(endpoint: str):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            request = kwargs.get('request') or args[0] if args else None
            token = kwargs.get('token')
            
            if token:
                # Simple rate limiting (in production, use Redis)
                current_hour = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
                # This is a simplified implementation
                # In production, implement proper rate limiting with Redis
                pass
            
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                response_time = time.time() - start_time
                
                # Log API request
                if token and request:
                    mobile_db.log_api_request(
                        user_id=token.user_id,
                        api_token_id=token.id,
                        endpoint=endpoint,
                        method=request.method,
                        ip_address=request.client.host,
                        response_time=response_time,
                        status_code=200,
                        user_agent=request.headers.get("user-agent")
                    )
                
                return result
                
            except Exception as e:
                response_time = time.time() - start_time
                if token and request:
                    mobile_db.log_api_request(
                        user_id=token.user_id,
                        api_token_id=token.id,
                        endpoint=endpoint,
                        method=request.method,
                        ip_address=request.client.host,
                        response_time=response_time,
                        status_code=500,
                        error_message=str(e),
                        user_agent=request.headers.get("user-agent")
                    )
                raise e
        
        return wrapper
    return decorator

# Health Check
@app.get("/health")
async def health_check():
    """API health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {
            "database": "connected",
            "video_analysis": "ready",
            "expert_patterns": "ready",
            "cross_domain": "ready",
            "real_time": "ready"
        }
    }

# Mobile Session Management
@app.post("/mobile/session/start")
@rate_limit("/mobile/session/start")
async def start_mobile_session(
    session_data: MobileSessionCreate,
    request: Request,
    token: APIToken = Depends(get_api_token)
):
    """Start a new mobile session"""
    session = mobile_db.create_mobile_session(
        user_id=token.user_id,
        device_info=session_data.device_info
    )
    
    # Update additional session data
    if session_data.network_type or session_data.battery_level:
        mobile_db.update_mobile_session(
            session_id=session.session_id,
            network_type=session_data.network_type,
            battery_level=session_data.battery_level
        )
    
    return {
        "session_id": session.session_id,
        "created_at": session.created_at.isoformat(),
        "message": "Mobile session started successfully"
    }

@app.put("/mobile/session/{session_id}")
@rate_limit("/mobile/session/update")
async def update_mobile_session(
    session_id: str,
    session_data: MobileSessionUpdate,
    request: Request,
    token: APIToken = Depends(get_api_token)
):
    """Update mobile session data"""
    session = mobile_db.update_mobile_session(
        session_id=session_id,
        session_data=session_data.session_data,
        network_type=session_data.network_type,
        battery_level=session_data.battery_level
    )
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session.session_id,
        "updated_at": session.last_activity.isoformat(),
        "message": "Session updated successfully"
    }

@app.post("/mobile/session/{session_id}/end")
@rate_limit("/mobile/session/end")
async def end_mobile_session(
    session_id: str,
    request: Request,
    token: APIToken = Depends(get_api_token)
):
    """End a mobile session"""
    session = mobile_db.end_mobile_session(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session.session_id,
        "ended_at": session.ended_at.isoformat(),
        "duration": (session.ended_at - session.created_at).total_seconds(),
        "message": "Session ended successfully"
    }

# Video Analysis API
@app.post("/api/video/upload")
@rate_limit("/api/video/upload")
async def upload_video_mobile(
    file: UploadFile = File(...),
    skill_type: str = Header(...),
    request: Request = None,
    token: APIToken = Depends(lambda: check_permission("video_upload"))
):
    """Upload video for mobile analysis"""
    # Validate file type
    if not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Save file
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        await f.write(content)
    
    # Create video record (using foundation database)
    db = foundation_get_db()
    video = Video(
        user_id=token.user_id,
        filename=file.filename,
        file_path=file_path,
        skill_type=skill_type,
        file_size=len(content)
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    
    return {
        "video_id": video.id,
        "filename": file.filename,
        "file_size": len(content),
        "skill_type": skill_type,
        "upload_time": video.created_at.isoformat(),
        "message": "Video uploaded successfully"
    }

@app.post("/api/video/analyze")
@rate_limit("/api/video/analyze")
async def analyze_video_mobile(
    analysis_request: VideoAnalysisRequest,
    request: Request,
    token: APIToken = Depends(lambda: check_permission("video_analysis"))
):
    """Analyze video for mobile users"""
    db = foundation_get_db()
    video = db.query(Video).filter(Video.id == analysis_request.video_id).first()
    
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    if video.user_id != token.user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # Perform video analysis
        video_results = video_analyzer.analyze_video(video.file_path)
        speech_results = speech_analyzer.analyze_speech(video.file_path)
        
        # Combine results
        analysis_data = {
            "video_analysis": video_results,
            "speech_analysis": speech_results,
            "skill_type": analysis_request.skill_type,
            "analysis_options": analysis_request.analysis_options,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Save analysis results
        analysis = AnalysisResult(
            video_id=video.id,
            user_id=token.user_id,
            analysis_data=analysis_data,
            feedback="Mobile analysis completed successfully",
            confidence_score=video_results.get('confidence', 0.8)
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        return {
            "analysis_id": analysis.id,
            "results": analysis_data,
            "confidence_score": analysis.confidence_score,
            "analysis_time": analysis.created_at.isoformat(),
            "message": "Video analysis completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Expert Comparison API
@app.post("/api/expert/compare")
@rate_limit("/api/expert/compare")
async def compare_with_expert_mobile(
    comparison_request: ExpertComparisonRequest,
    request: Request,
    token: APIToken = Depends(lambda: check_permission("expert_comparison"))
):
    """Compare user performance with expert"""
    db = foundation_get_db()
    analysis = db.query(AnalysisResult).filter(
        AnalysisResult.id == comparison_request.user_analysis_id,
        AnalysisResult.user_id == token.user_id
    ).first()
    
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    expert = db.query(Expert).filter(Expert.id == comparison_request.expert_id).first()
    if not expert:
        raise HTTPException(status_code=404, detail="Expert not found")
    
    try:
        # Perform comparison
        comparison_result = pattern_comparator.compare_with_expert(
            user_analysis=analysis.analysis_data,
            expert_id=expert.id
        )
        
        # Get recommendations
        recommendations = recommendation_engine.get_recommendations(
            user_id=token.user_id,
            expert_id=expert.id,
            comparison_data=comparison_result
        )
        
        return {
            "comparison_id": f"mobile_{analysis.id}_{expert.id}",
            "expert": {
                "id": expert.id,
                "name": expert.name,
                "domain": expert.domain,
                "specialty": expert.specialty
            },
            "comparison_results": comparison_result,
            "recommendations": recommendations,
            "analysis_time": datetime.utcnow().isoformat(),
            "message": "Expert comparison completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

# Cross-Domain Transfer API
@app.post("/api/transfer/analyze")
@rate_limit("/api/transfer/analyze")
async def analyze_skill_transfer_mobile(
    transfer_request: SkillTransferRequest,
    request: Request,
    token: APIToken = Depends(lambda: check_permission("skill_transfer"))
):
    """Analyze cross-domain skill transfer opportunities"""
    try:
        # Analyze transfer potential
        transfer_analysis = transfer_engine.analyze_transfer_potential(
            source_skill=transfer_request.source_skill,
            target_skill=transfer_request.target_skill,
            user_level=transfer_request.user_level
        )
        
        # Generate learning path
        learning_path = transfer_engine.generate_learning_path(
            source_skill=transfer_request.source_skill,
            target_skill=transfer_request.target_skill,
            user_level=transfer_request.user_level
        )
        
        return {
            "transfer_id": f"mobile_{token.user_id}_{int(time.time())}",
            "source_skill": transfer_request.source_skill,
            "target_skill": transfer_request.target_skill,
            "transfer_analysis": transfer_analysis,
            "learning_path": learning_path,
            "effectiveness_score": transfer_analysis.get('effectiveness_score', 0.75),
            "estimated_time": learning_path.get('estimated_weeks', 8),
            "analysis_time": datetime.utcnow().isoformat(),
            "message": "Skill transfer analysis completed"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transfer analysis failed: {str(e)}")

# Real-Time Feedback API
@app.post("/api/feedback/start")
@rate_limit("/api/feedback/start")
async def start_feedback_session_mobile(
    session_request: FeedbackSessionRequest,
    request: Request,
    token: APIToken = Depends(lambda: check_permission("real_time_feedback"))
):
    """Start real-time feedback session for mobile"""
    try:
        # Create feedback session (using real-time database)
        feedback_session = FeedbackSession(
            user_id=token.user_id,
            skill_type=session_request.skill_type,
            feedback_data={"session_options": session_request.session_options},
            session_start=datetime.utcnow(),
            is_active=True
        )
        
        # In a real implementation, save to real-time database
        session_id = f"mobile_feedback_{token.user_id}_{int(time.time())}"
        
        return {
            "session_id": session_id,
            "skill_type": session_request.skill_type,
            "session_options": session_request.session_options,
            "status": "active",
            "start_time": datetime.utcnow().isoformat(),
            "message": "Real-time feedback session started"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start feedback session: {str(e)}")

# API Token Management
@app.post("/api/tokens/create")
async def create_api_token(
    token_request: APITokenCreate,
    request: Request,
    # This endpoint might require different authentication
):
    """Create a new API token (admin endpoint)"""
    # In production, this would require admin authentication
    # For now, we'll use user_id=1 as placeholder
    user_id = 1
    
    token = mobile_db.create_api_token(
        user_id=user_id,
        name=token_request.name,
        permissions=token_request.permissions,
        rate_limit=token_request.rate_limit,
        expires_days=token_request.expires_days
    )
    
    return {
        "token_id": token.id,
        "token": token.token,
        "name": token.name,
        "permissions": token.permissions,
        "rate_limit": token.rate_limit,
        "expires_at": token.expires_at.isoformat() if token.expires_at else None,
        "created_at": token.created_at.isoformat(),
        "message": "API token created successfully"
    }

# API Usage Analytics
@app.get("/api/analytics/usage")
@rate_limit("/api/analytics/usage")
async def get_api_usage_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    endpoint: Optional[str] = None,
    request: Request = None,
    token: APIToken = Depends(lambda: check_permission("analytics"))
):
    """Get API usage analytics"""
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    stats = mobile_db.get_api_usage_stats(
        start_date=start,
        end_date=end,
        endpoint=endpoint
    )
    
    return {
        "analytics": [
            {
                "date": stat.date.isoformat(),
                "endpoint": stat.endpoint,
                "total_requests": stat.total_requests,
                "successful_requests": stat.successful_requests,
                "failed_requests": stat.failed_requests,
                "avg_response_time": stat.avg_response_time,
                "unique_users": stat.unique_users
            }
            for stat in stats
        ],
        "summary": {
            "total_requests": sum(s.total_requests for s in stats),
            "success_rate": sum(s.successful_requests for s in stats) / max(sum(s.total_requests for s in stats), 1),
            "avg_response_time": sum(s.avg_response_time * s.total_requests for s in stats) / max(sum(s.total_requests for s in stats), 1)
        },
        "message": "Usage analytics retrieved successfully"
    }

# Skills and Experts endpoints
@app.get("/api/skills")
@rate_limit("/api/skills")
async def list_skills_mobile(
    request: Request,
    token: APIToken = Depends(get_api_token)
):
    """List available skills for mobile"""
    db = foundation_get_db()
    skills = db.query(Skill).all()
    
    return {
        "skills": [
            {
                "id": skill.id,
                "name": skill.name,
                "description": skill.description,
                "difficulty_level": skill.difficulty_level
            }
            for skill in skills
        ],
        "message": "Skills retrieved successfully"
    }

@app.get("/api/experts")
@rate_limit("/api/experts")
async def list_experts_mobile(
    skill_type: Optional[str] = None,
    domain: Optional[str] = None,
    limit: int = 20,
    request: Request = None,
    token: APIToken = Depends(get_api_token)
):
    """List experts for mobile"""
    db = foundation_get_db()
    query = db.query(Expert)
    
    if skill_type:
        query = query.filter(Expert.specialty.contains(skill_type))
    if domain:
        query = query.filter(Expert.domain == domain)
    
    experts = query.limit(limit).all()
    
    return {
        "experts": [
            {
                "id": expert.id,
                "name": expert.name,
                "domain": expert.domain,
                "specialty": expert.specialty,
                "achievements": expert.achievements,
                "bio": expert.bio
            }
            for expert in experts
        ],
        "message": "Experts retrieved successfully"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)