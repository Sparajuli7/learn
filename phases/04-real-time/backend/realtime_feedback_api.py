"""
Real-Time Feedback API
Provides endpoints for live analysis, instant suggestions, and performance tracking
"""

from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, File, UploadFile
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import json
import asyncio
from datetime import datetime
from sqlalchemy.orm import Session

from realtime_database import (
    get_database_session, FeedbackSession, ImprovementSuggestion, 
    PerformanceMetric, RealTimeProgress
)
from realtime_analysis_engine import RealTimeAnalysisEngine, analyze_live_video

# API Router
router = APIRouter(prefix="/realtime", tags=["Real-Time Feedback"])

# Pydantic models for request/response
class StartSessionRequest(BaseModel):
    user_id: int
    skill_type: str

class EndSessionRequest(BaseModel):
    session_id: int
    user_feedback: Optional[str] = None

class LiveAnalysisRequest(BaseModel):
    session_id: int
    video_chunk: str  # Base64 encoded video data
    timestamp: Optional[float] = None

class FeedbackSessionResponse(BaseModel):
    session_id: int
    user_id: int
    skill_type: str
    overall_score: float
    session_duration: float
    improvement_suggestions: List[Dict[str, Any]]
    performance_metrics: List[Dict[str, Any]]
    is_active: bool

class AnalyticsRequest(BaseModel):
    user_id: int
    skill_type: Optional[str] = None
    days_back: Optional[int] = 30

class SuggestionFeedbackRequest(BaseModel):
    suggestion_id: int
    user_id: int
    implemented: bool
    effectiveness: Optional[float] = None

# Initialize analysis engine
analysis_engine = RealTimeAnalysisEngine()

@router.post("/session/start")
async def start_feedback_session(
    request: StartSessionRequest,
    db: Session = Depends(get_database_session)
) -> Dict[str, Any]:
    """
    Start a new real-time feedback session
    
    Args:
        request: Session start parameters
        db: Database session
    
    Returns:
        Session details with session ID
    """
    try:
        # Create new feedback session
        session = FeedbackSession(
            user_id=request.user_id,
            skill_type=request.skill_type,
            feedback_data={},
            improvement_score=0.0,
            is_active=True
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return {
            "session_id": session.id,
            "user_id": session.user_id,
            "skill_type": session.skill_type,
            "status": "active",
            "started_at": session.session_start.isoformat(),
            "message": "Real-time feedback session started successfully"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")

@router.post("/session/{session_id}/end")
async def end_feedback_session(
    session_id: int,
    request: EndSessionRequest,
    db: Session = Depends(get_database_session)
) -> Dict[str, Any]:
    """
    End a real-time feedback session and finalize results
    
    Args:
        session_id: Session ID to end
        request: End session parameters
        db: Database session
    
    Returns:
        Final session results and analytics
    """
    try:
        # Get session
        session = db.query(FeedbackSession).filter(FeedbackSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if not session.is_active:
            raise HTTPException(status_code=400, detail="Session is already ended")
        
        # Calculate session duration
        session_end = datetime.utcnow()
        duration = (session_end - session.session_start).total_seconds()
        
        # Update session
        session.session_end = session_end
        session.session_duration = duration
        session.is_active = False
        
        # Update or create progress tracking
        progress = db.query(RealTimeProgress).filter(
            RealTimeProgress.user_id == session.user_id,
            RealTimeProgress.skill_type == session.skill_type
        ).first()
        
        if not progress:
            progress = RealTimeProgress(
                user_id=session.user_id,
                skill_type=session.skill_type,
                total_sessions=1,
                total_practice_time=duration,
                average_improvement_score=session.improvement_score,
                best_session_score=session.improvement_score,
                last_session_date=session_end
            )
            db.add(progress)
        else:
            # Update existing progress
            progress.total_sessions += 1
            progress.total_practice_time += duration
            progress.average_improvement_score = (
                (progress.average_improvement_score * (progress.total_sessions - 1) + session.improvement_score) 
                / progress.total_sessions
            )
            if session.improvement_score > progress.best_session_score:
                progress.best_session_score = session.improvement_score
            progress.last_session_date = session_end
        
        db.commit()
        
        # Get session analytics
        suggestions = db.query(ImprovementSuggestion).filter(
            ImprovementSuggestion.session_id == session_id
        ).all()
        
        metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.session_id == session_id
        ).all()
        
        return {
            "session_id": session_id,
            "duration": duration,
            "final_score": session.improvement_score,
            "total_suggestions": len(suggestions),
            "total_metrics": len(metrics),
            "progress_update": {
                "total_sessions": progress.total_sessions,
                "average_score": round(progress.average_improvement_score, 1),
                "best_score": progress.best_session_score,
                "total_practice_time": round(progress.total_practice_time / 60, 1)  # Convert to minutes
            },
            "message": "Session ended successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")

@router.post("/analyze/live")
async def analyze_live_video_chunk(
    session_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_database_session)
) -> Dict[str, Any]:
    """
    Analyze live video chunk and provide instant feedback
    
    Args:
        session_id: Active session ID
        file: Video chunk file
        db: Database session
    
    Returns:
        Real-time analysis results and suggestions
    """
    try:
        # Verify session exists and is active
        session = db.query(FeedbackSession).filter(FeedbackSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if not session.is_active:
            raise HTTPException(status_code=400, detail="Session is not active")
        
        # Read video data
        video_data = await file.read()
        
        # Perform real-time analysis
        feedback = await analysis_engine.analyze_realtime_video(
            video_data, session.skill_type, session.user_id
        )
        
        # Update session with latest feedback
        session.feedback_data = {
            "overall_score": feedback.overall_score,
            "movement_analysis": feedback.movement_analysis,
            "speech_analysis": feedback.speech_analysis,
            "timing_analysis": feedback.timing_analysis,
            "last_analysis": feedback.analysis_timestamp.isoformat()
        }
        session.improvement_score = feedback.overall_score
        
        # Store improvement suggestions
        for suggestion_data in feedback.improvement_suggestions:
            suggestion = ImprovementSuggestion(
                session_id=session_id,
                user_id=session.user_id,
                suggestion_type=suggestion_data["suggestion_type"],
                content=suggestion_data["content"],
                priority=suggestion_data["priority"],
                category=suggestion_data["category"],
                confidence_score=suggestion_data["confidence_score"]
            )
            db.add(suggestion)
        
        # Store performance metrics
        for metric_data in feedback.performance_metrics:
            metric = PerformanceMetric(
                session_id=session_id,
                user_id=session.user_id,
                skill_type=session.skill_type,
                metric_name=metric_data["metric_name"],
                value=metric_data["value"],
                unit=metric_data.get("unit", ""),
                target_value=metric_data.get("target_value"),
                improvement_delta=metric_data.get("improvement_delta")
            )
            db.add(metric)
        
        db.commit()
        
        return {
            "session_id": session_id,
            "analysis_timestamp": feedback.analysis_timestamp.isoformat(),
            "processing_time": feedback.processing_time,
            "overall_score": feedback.overall_score,
            "movement_analysis": feedback.movement_analysis,
            "speech_analysis": feedback.speech_analysis,
            "timing_analysis": feedback.timing_analysis,
            "improvement_suggestions": feedback.improvement_suggestions,
            "performance_metrics": feedback.performance_metrics,
            "status": "analysis_complete"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/session/{session_id}")
async def get_session_details(
    session_id: int,
    db: Session = Depends(get_database_session)
) -> FeedbackSessionResponse:
    """
    Get detailed information about a feedback session
    
    Args:
        session_id: Session ID
        db: Database session
    
    Returns:
        Complete session details with suggestions and metrics
    """
    try:
        # Get session
        session = db.query(FeedbackSession).filter(FeedbackSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get suggestions and metrics
        suggestions = db.query(ImprovementSuggestion).filter(
            ImprovementSuggestion.session_id == session_id
        ).all()
        
        metrics = db.query(PerformanceMetric).filter(
            PerformanceMetric.session_id == session_id
        ).all()
        
        # Format response
        suggestion_list = []
        for s in suggestions:
            suggestion_list.append({
                "id": s.id,
                "type": s.suggestion_type,
                "content": s.content,
                "priority": s.priority,
                "category": s.category,
                "confidence_score": s.confidence_score,
                "timestamp": s.timestamp.isoformat(),
                "implemented": s.is_implemented
            })
        
        metric_list = []
        for m in metrics:
            metric_list.append({
                "id": m.id,
                "name": m.metric_name,
                "value": m.value,
                "unit": m.unit,
                "target_value": m.target_value,
                "improvement_delta": m.improvement_delta,
                "timestamp": m.timestamp.isoformat()
            })
        
        return FeedbackSessionResponse(
            session_id=session.id,
            user_id=session.user_id,
            skill_type=session.skill_type,
            overall_score=session.improvement_score,
            session_duration=session.session_duration or 0.0,
            improvement_suggestions=suggestion_list,
            performance_metrics=metric_list,
            is_active=session.is_active
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get session: {str(e)}")

@router.get("/analytics/dashboard")
async def get_analytics_dashboard(
    user_id: int,
    skill_type: Optional[str] = None,
    days_back: Optional[int] = 30,
    db: Session = Depends(get_database_session)
) -> Dict[str, Any]:
    """
    Get comprehensive analytics dashboard for user's real-time sessions
    
    Args:
        user_id: User ID
        skill_type: Optional skill type filter
        days_back: Number of days to include in analytics
        db: Database session
    
    Returns:
        Analytics dashboard with progress, trends, and insights
    """
    try:
        # Calculate date range
        from datetime import datetime, timedelta
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days_back)
        
        # Base query for sessions
        session_query = db.query(FeedbackSession).filter(
            FeedbackSession.user_id == user_id,
            FeedbackSession.session_start >= start_date
        )
        
        if skill_type:
            session_query = session_query.filter(FeedbackSession.skill_type == skill_type)
        
        sessions = session_query.all()
        
        # Get progress records
        progress_query = db.query(RealTimeProgress).filter(RealTimeProgress.user_id == user_id)
        if skill_type:
            progress_query = progress_query.filter(RealTimeProgress.skill_type == skill_type)
        
        progress_records = progress_query.all()
        
        # Calculate analytics
        total_sessions = len(sessions)
        total_practice_time = sum(s.session_duration or 0 for s in sessions)
        
        if total_sessions > 0:
            average_score = sum(s.improvement_score for s in sessions) / total_sessions
            best_score = max(s.improvement_score for s in sessions)
            latest_score = sessions[-1].improvement_score if sessions else 0
            
            # Calculate improvement trend
            if total_sessions >= 5:
                recent_scores = [s.improvement_score for s in sessions[-5:]]
                earlier_scores = [s.improvement_score for s in sessions[:5]]
                trend = "improving" if sum(recent_scores) > sum(earlier_scores) else "stable"
            else:
                trend = "insufficient_data"
        else:
            average_score = 0
            best_score = 0
            latest_score = 0
            trend = "no_data"
        
        # Get top improvement areas
        suggestions = db.query(ImprovementSuggestion).join(FeedbackSession).filter(
            FeedbackSession.user_id == user_id,
            FeedbackSession.session_start >= start_date
        ).all()
        
        if skill_type:
            suggestions = [s for s in suggestions if s.feedback_session.skill_type == skill_type]
        
        # Count suggestion types
        suggestion_counts = {}
        for suggestion in suggestions:
            suggestion_type = suggestion.suggestion_type
            suggestion_counts[suggestion_type] = suggestion_counts.get(suggestion_type, 0) + 1
        
        top_improvement_areas = sorted(
            suggestion_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5]
        
        # Build skill summaries
        skill_summaries = []
        for progress in progress_records:
            skill_summaries.append({
                "skill_type": progress.skill_type,
                "total_sessions": progress.total_sessions,
                "practice_time_hours": round(progress.total_practice_time / 3600, 1),
                "average_score": round(progress.average_improvement_score, 1),
                "best_score": progress.best_session_score,
                "progress_trend": progress.progress_trend,
                "last_session": progress.last_session_date.isoformat() if progress.last_session_date else None
            })
        
        return {
            "user_id": user_id,
            "analysis_period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days_included": days_back
            },
            "overall_stats": {
                "total_sessions": total_sessions,
                "total_practice_time_minutes": round(total_practice_time / 60, 1),
                "average_score": round(average_score, 1),
                "best_score": round(best_score, 1),
                "latest_score": round(latest_score, 1),
                "improvement_trend": trend
            },
            "skill_summaries": skill_summaries,
            "top_improvement_areas": [
                {"area": area, "frequency": count} 
                for area, count in top_improvement_areas
            ],
            "recent_sessions": [
                {
                    "session_id": s.id,
                    "skill_type": s.skill_type,
                    "score": s.improvement_score,
                    "duration_minutes": round((s.session_duration or 0) / 60, 1),
                    "date": s.session_start.isoformat()
                }
                for s in sessions[-10:]  # Last 10 sessions
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

@router.post("/suggestion/{suggestion_id}/feedback")
async def provide_suggestion_feedback(
    suggestion_id: int,
    request: SuggestionFeedbackRequest,
    db: Session = Depends(get_database_session)
) -> Dict[str, Any]:
    """
    Provide feedback on improvement suggestion effectiveness
    
    Args:
        suggestion_id: Suggestion ID
        request: Feedback details
        db: Database session
    
    Returns:
        Updated suggestion with feedback
    """
    try:
        suggestion = db.query(ImprovementSuggestion).filter(
            ImprovementSuggestion.id == suggestion_id
        ).first()
        
        if not suggestion:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        
        # Update suggestion feedback
        suggestion.is_implemented = request.implemented
        if request.effectiveness is not None:
            suggestion.effectiveness = request.effectiveness
        
        db.commit()
        
        return {
            "suggestion_id": suggestion_id,
            "implemented": suggestion.is_implemented,
            "effectiveness": suggestion.effectiveness,
            "message": "Feedback recorded successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to record feedback: {str(e)}")

@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint for real-time feedback system"""
    return {
        "status": "healthy",
        "service": "real-time-feedback",
        "timestamp": datetime.utcnow().isoformat(),
        "features": [
            "live_video_analysis",
            "instant_feedback_generation", 
            "improvement_suggestions",
            "performance_analytics",
            "progress_tracking"
        ]
    }

# WebSocket endpoint for real-time streaming (optional enhancement)
@router.websocket("/stream/{session_id}")
async def websocket_realtime_feedback(websocket: WebSocket, session_id: int):
    """
    WebSocket endpoint for streaming real-time feedback
    Allows for continuous video streaming and instant feedback
    """
    await websocket.accept()
    
    try:
        while True:
            # Receive video chunk from client
            data = await websocket.receive_bytes()
            
            # Process video chunk (simplified for demo)
            # In real implementation, this would process video frames continuously
            response = {
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": session_id,
                "status": "processing",
                "message": "Video chunk received and being analyzed"
            }
            
            await websocket.send_json(response)
            
            # Simulate processing delay
            await asyncio.sleep(0.1)
            
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        print(f"WebSocket error for session {session_id}: {e}")
        await websocket.close()