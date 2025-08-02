"""
Enhanced main.py that integrates expert patterns with the foundation system
This extends the original main.py with expert pattern functionality
"""

from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import aiofiles
import os
import json
from datetime import datetime
from typing import List, Dict, Any
import uuid
import sys

# Import foundation modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '01-foundation', 'backend'))
from database import get_db, User, Video, AnalysisResult, Skill, create_tables, init_default_skills
from video_analysis import VideoAnalyzer
from speech_analysis import SpeechAnalyzer
from websocket_manager import ConnectionManager

# Import expert pattern modules
from expert_database import Expert, ExpertPattern, UserComparison, init_expert_database
from pattern_comparison import pattern_comparator
from expert_recommendations import recommendation_engine
from expert_api import router as expert_router

# Initialize FastAPI app
app = FastAPI(title="SkillMirror API with Expert Patterns", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include expert patterns router
app.include_router(expert_router)

# Initialize analyzers and connection manager
video_analyzer = VideoAnalyzer()
speech_analyzer = SpeechAnalyzer()
manager = ConnectionManager()

# Create upload directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
async def startup_event():
    """Initialize database tables and default data"""
    create_tables()
    init_default_skills()
    init_expert_database()
    print("SkillMirror with Expert Patterns initialized successfully!")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.utcnow(),
        "version": "2.0.0",
        "features": ["foundation", "expert_patterns"]
    }

# Enhanced user endpoints
@app.post("/users/")
async def create_user(name: str, email: str, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(name=name, email=email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "name": user.name, "email": user.email}

@app.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add user statistics including expert comparisons
    user_stats = {
        "total_videos": db.query(Video).filter(Video.user_id == user_id).count(),
        "total_analyses": db.query(AnalysisResult).join(Video).filter(Video.user_id == user_id).count(),
        "total_expert_comparisons": db.query(UserComparison).filter(UserComparison.user_id == user_id).count()
    }
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at.isoformat(),
        "stats": user_stats
    }

# Skills endpoints
@app.get("/skills/")
async def get_skills(db: Session = Depends(get_db)):
    skills = db.query(Skill).all()
    return skills

# Enhanced video upload endpoint
@app.post("/upload-video/")
async def upload_video(
    file: UploadFile = File(...),
    user_id: int = 1,  # Default user for MVP
    skill_type: str = "Public Speaking",
    db: Session = Depends(get_db)
):
    try:
        # Validate file size (10MB limit)
        if file.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Create video record
        video = Video(
            user_id=user_id,
            file_path=file_path,
            skill_type=skill_type,
            duration=0.0  # Will be updated after analysis
        )
        db.add(video)
        db.commit()
        db.refresh(video)
        
        return {
            "video_id": video.id,
            "file_path": file_path,
            "skill_type": skill_type,
            "status": "uploaded"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# Enhanced video analysis endpoint with expert comparison
@app.post("/analyze-video/{video_id}")
async def analyze_video(
    video_id: int, 
    include_expert_comparison: bool = True,
    num_expert_matches: int = 3,
    db: Session = Depends(get_db)
):
    try:
        # Get video record
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        # Start analysis
        await manager.broadcast_to_user(video.user_id, {
            "type": "analysis_started",
            "video_id": video_id,
            "status": "processing"
        })
        
        # Perform video analysis
        video_results = await video_analyzer.analyze_video(video.file_path, video.skill_type)
        
        # Perform speech analysis
        speech_results = await speech_analyzer.analyze_speech(video.file_path)
        
        # Combine results
        combined_analysis = {
            "video_analysis": video_results,
            "speech_analysis": speech_results,
            "skill_type": video.skill_type,
            "analysis_timestamp": datetime.utcnow().isoformat()
        }
        
        # Generate enhanced feedback with expert patterns
        feedback = await generate_enhanced_feedback(combined_analysis, video.skill_type, include_expert_comparison)
        
        # Update video duration
        video.duration = video_results.get("duration", 0.0)
        db.commit()
        
        # Save analysis results
        analysis_result = AnalysisResult(
            video_id=video_id,
            analysis_data=json.dumps(combined_analysis),
            feedback=json.dumps(feedback)
        )
        db.add(analysis_result)
        db.commit()
        db.refresh(analysis_result)
        
        # Perform expert comparison if requested
        expert_comparison_results = None
        if include_expert_comparison:
            try:
                # Extract user metrics
                user_metrics = pattern_comparator.extract_user_metrics(combined_analysis, video.skill_type)
                
                # Find best expert matches
                expert_matches = pattern_comparator.find_best_expert_matches(
                    user_metrics, video.skill_type, num_expert_matches
                )
                
                # Generate expert comparisons
                expert_comparisons = []
                for match in expert_matches:
                    expert_feedback = pattern_comparator.generate_expert_feedback(
                        match["comparison_data"], match
                    )
                    
                    # Save comparison result
                    comparison_id = pattern_comparator.save_comparison_result(
                        video.user_id,
                        video_id,
                        match["expert_id"],
                        match["similarity_score"],
                        match["comparison_data"],
                        expert_feedback
                    )
                    
                    expert_comparisons.append({
                        "comparison_id": comparison_id,
                        "expert": {
                            "id": match["expert_id"],
                            "name": match["expert_name"],
                            "domain": match["expert_domain"]
                        },
                        "similarity_score": match["similarity_score"],
                        "feedback": expert_feedback
                    })
                
                expert_comparison_results = {
                    "user_metrics": user_metrics,
                    "expert_comparisons": expert_comparisons,
                    "best_match": expert_comparisons[0] if expert_comparisons else None
                }
                
                # Update feedback with expert insights
                feedback["expert_comparison"] = expert_comparison_results
                
                # Update analysis result with expert comparison
                analysis_result.feedback = json.dumps(feedback)
                db.commit()
                
            except Exception as e:
                print(f"Expert comparison failed: {e}")
                # Continue without expert comparison if it fails
        
        # Send real-time feedback
        response_data = {
            "type": "analysis_complete",
            "video_id": video_id,
            "analysis": combined_analysis,
            "feedback": feedback
        }
        
        if expert_comparison_results:
            response_data["expert_comparison"] = expert_comparison_results
        
        await manager.broadcast_to_user(video.user_id, response_data)
        
        return {
            "analysis_id": analysis_result.id,
            "analysis": combined_analysis,
            "feedback": feedback,
            "expert_comparison": expert_comparison_results,
            "status": "complete"
        }
    
    except Exception as e:
        # Send error to client
        await manager.broadcast_to_user(video.user_id, {
            "type": "analysis_error",
            "video_id": video_id,
            "error": str(e)
        })
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Enhanced get analysis results
@app.get("/analysis/{video_id}")
async def get_analysis(video_id: int, db: Session = Depends(get_db)):
    analysis = db.query(AnalysisResult).filter(AnalysisResult.video_id == video_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Get expert comparisons for this video
    expert_comparisons = db.query(UserComparison).filter(
        UserComparison.video_id == video_id
    ).all()
    
    expert_comparison_data = []
    for comp in expert_comparisons:
        expert = db.query(Expert).filter(Expert.id == comp.expert_id).first()
        if expert:
            expert_comparison_data.append({
                "comparison_id": comp.id,
                "expert": {
                    "id": expert.id,
                    "name": expert.name,
                    "domain": expert.domain
                },
                "similarity_score": comp.similarity_score,
                "comparison_data": json.loads(comp.comparison_data),
                "feedback": json.loads(comp.feedback),
                "created_at": comp.created_at.isoformat()
            })
    
    return {
        "analysis_id": analysis.id,
        "analysis_data": json.loads(analysis.analysis_data),
        "feedback": json.loads(analysis.feedback),
        "expert_comparisons": expert_comparison_data,
        "created_at": analysis.created_at
    }

# WebSocket endpoint (unchanged from foundation)
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# Enhanced feedback generation with expert patterns
async def generate_enhanced_feedback(analysis: Dict[str, Any], skill_type: str, include_expert_comparison: bool = True) -> Dict[str, Any]:
    """Generate enhanced feedback incorporating expert pattern insights"""
    
    video_analysis = analysis.get("video_analysis", {})
    speech_analysis = analysis.get("speech_analysis", {})
    
    feedback = {
        "overall_score": 0.0,
        "strengths": [],
        "improvements": [],
        "specific_tips": [],
        "next_steps": [],
        "expert_insights": []
    }
    
    # Generate base feedback (same as foundation)
    if skill_type == "Public Speaking":
        confidence_score = video_analysis.get("confidence_score", 0.5)
        speech_pace = speech_analysis.get("pace", {}).get("words_per_minute", 150)
        
        if confidence_score > 0.7:
            feedback["strengths"].append("Strong confident posture and presence")
        else:
            feedback["improvements"].append("Work on maintaining confident body language")
        
        if 120 <= speech_pace <= 180:
            feedback["strengths"].append("Excellent speaking pace")
        else:
            feedback["improvements"].append(f"Adjust speaking pace (current: {speech_pace} WPM, optimal: 120-180 WPM)")
        
        feedback["overall_score"] = (confidence_score + min(speech_pace/150, 1.0)) / 2
    
    elif skill_type == "Dance/Fitness":
        joint_tracking = video_analysis.get("joint_tracking", {})
        movement_score = video_analysis.get("movement_score", 0.5)
        
        if movement_score > 0.8:
            feedback["strengths"].append("Excellent movement coordination and flow")
        else:
            feedback["improvements"].append("Focus on smoother movement transitions")
        
        feedback["overall_score"] = movement_score
    
    # Add enhanced tips with expert pattern insights
    feedback["specific_tips"] = [
        "Practice regularly for muscle memory development",
        "Record yourself frequently to track progress",
        "Focus on one improvement area at a time",
        "Study expert performances to understand optimal technique",
        "Compare your progress to expert benchmarks regularly"
    ]
    
    feedback["next_steps"] = [
        "Review the detailed analysis for specific metrics",
        "Compare your performance to expert patterns",
        "Practice the highlighted improvement areas",
        "Get personalized expert recommendations",
        "Upload another video in 1-2 weeks to track progress"
    ]
    
    # Add expert insights if enabled
    if include_expert_comparison:
        feedback["expert_insights"] = [
            "Expert pattern comparison will provide personalized benchmarks",
            "Focus on metrics where experts consistently excel",
            "Use expert techniques as learning templates",
            "Track your progress toward expert-level performance"
        ]
    
    return feedback

# Additional endpoints for enhanced features
@app.get("/dashboard/{user_id}")
async def get_user_dashboard(user_id: int, db: Session = Depends(get_db)):
    """Get comprehensive user dashboard with expert comparison insights"""
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's videos and analyses
        videos = db.query(Video).filter(Video.user_id == user_id).order_by(Video.created_at.desc()).limit(10).all()
        
        dashboard_data = {
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            },
            "recent_videos": [],
            "progress_summary": {},
            "expert_comparison_summary": {},
            "recommendations": {}
        }
        
        for video in videos:
            analysis = db.query(AnalysisResult).filter(AnalysisResult.video_id == video.id).first()
            expert_comparisons = db.query(UserComparison).filter(UserComparison.video_id == video.id).all()
            
            video_data = {
                "id": video.id,
                "skill_type": video.skill_type,
                "created_at": video.created_at.isoformat(),
                "duration": video.duration,
                "has_analysis": analysis is not None,
                "expert_comparisons_count": len(expert_comparisons)
            }
            
            if analysis:
                feedback = json.loads(analysis.feedback)
                video_data["overall_score"] = feedback.get("overall_score", 0.0)
                
                if expert_comparisons:
                    best_match = max(expert_comparisons, key=lambda x: x.similarity_score)
                    expert = db.query(Expert).filter(Expert.id == best_match.expert_id).first()
                    video_data["best_expert_match"] = {
                        "expert_name": expert.name if expert else "Unknown",
                        "similarity_score": best_match.similarity_score
                    }
            
            dashboard_data["recent_videos"].append(video_data)
        
        return dashboard_data
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)