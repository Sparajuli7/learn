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

from database import get_db, User, Video, AnalysisResult, Skill, create_tables, init_default_skills
from video_analysis import VideoAnalyzer
from speech_analysis import SpeechAnalyzer
from websocket_manager import ConnectionManager

# Initialize FastAPI app
app = FastAPI(title="SkillMirror API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize analyzers and connection manager
video_analyzer = VideoAnalyzer()
speech_analyzer = SpeechAnalyzer()
manager = ConnectionManager()

# Create upload directory
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.on_event("startup")
async def startup_event():
    create_tables()
    init_default_skills()

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# User endpoints
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
    return user

# Skills endpoints
@app.get("/skills/")
async def get_skills(db: Session = Depends(get_db)):
    skills = db.query(Skill).all()
    return skills

# Video upload endpoint
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

# Video analysis endpoint
@app.post("/analyze-video/{video_id}")
async def analyze_video(video_id: int, db: Session = Depends(get_db)):
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
        
        # Generate feedback
        feedback = await generate_feedback(combined_analysis, video.skill_type)
        
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
        
        # Send real-time feedback
        await manager.broadcast_to_user(video.user_id, {
            "type": "analysis_complete",
            "video_id": video_id,
            "analysis": combined_analysis,
            "feedback": feedback
        })
        
        return {
            "analysis_id": analysis_result.id,
            "analysis": combined_analysis,
            "feedback": feedback,
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

# Get analysis results
@app.get("/analysis/{video_id}")
async def get_analysis(video_id: int, db: Session = Depends(get_db)):
    analysis = db.query(AnalysisResult).filter(AnalysisResult.video_id == video_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return {
        "analysis_id": analysis.id,
        "analysis_data": json.loads(analysis.analysis_data),
        "feedback": json.loads(analysis.feedback),
        "created_at": analysis.created_at
    }

# WebSocket endpoint
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

# Helper function to generate feedback
async def generate_feedback(analysis: Dict[str, Any], skill_type: str) -> Dict[str, Any]:
    """Generate comprehensive feedback based on analysis results"""
    
    video_analysis = analysis.get("video_analysis", {})
    speech_analysis = analysis.get("speech_analysis", {})
    
    feedback = {
        "overall_score": 0.0,
        "strengths": [],
        "improvements": [],
        "specific_tips": [],
        "next_steps": []
    }
    
    # Skill-specific feedback generation
    if skill_type == "Public Speaking":
        # Analyze confidence markers
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
        # Analyze movement quality
        joint_tracking = video_analysis.get("joint_tracking", {})
        movement_score = video_analysis.get("movement_score", 0.5)
        
        if movement_score > 0.8:
            feedback["strengths"].append("Excellent movement coordination and flow")
        else:
            feedback["improvements"].append("Focus on smoother movement transitions")
        
        feedback["overall_score"] = movement_score
    
    # Add general tips
    feedback["specific_tips"] = [
        "Practice regularly for muscle memory development",
        "Record yourself frequently to track progress",
        "Focus on one improvement area at a time"
    ]
    
    feedback["next_steps"] = [
        "Review the detailed analysis for specific metrics",
        "Practice the highlighted improvement areas",
        "Upload another video in 1-2 weeks to track progress"
    ]
    
    return feedback

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)