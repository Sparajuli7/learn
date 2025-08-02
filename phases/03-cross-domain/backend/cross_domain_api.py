"""
Cross-Domain Skill Transfer API
Provides endpoints for skill transfer recommendations, progress tracking, and analytics
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
from datetime import datetime

from skill_transfer_engine import SkillTransferEngine, get_quick_recommendations, start_user_transfer
from cross_domain_database import get_database_session, SkillTransfer, TransferProgress, TransferFeedback

# API Router
router = APIRouter(prefix="/cross-domain", tags=["Cross-Domain Transfers"])

# Pydantic models for request/response
class TransferRecommendationRequest(BaseModel):
    user_skills: List[str]
    target_skill: Optional[str] = None

class StartTransferRequest(BaseModel):
    user_id: int
    transfer_id: int

class ProgressUpdateRequest(BaseModel):
    progress_id: int
    step_completed: int
    feedback: Optional[str] = None

class FeedbackRequest(BaseModel):
    user_id: int
    transfer_id: int
    progress_id: Optional[int] = None
    feedback: str
    improvement_score: Optional[float] = None
    effectiveness_rating: Optional[float] = None
    specific_comments: Optional[Dict] = None

@router.get("/recommendations")
async def get_transfer_recommendations(user_skills: str, target_skill: str = None):
    """
    Get cross-domain skill transfer recommendations
    
    Args:
        user_skills: Comma-separated list of user's current skills
        target_skill: Optional target skill to focus recommendations
    
    Returns:
        List of recommended skill transfers with learning paths
    """
    try:
        skills_list = [skill.strip() for skill in user_skills.split(",")]
        
        engine = SkillTransferEngine()
        recommendations = engine.get_transfer_recommendations(skills_list, target_skill)
        engine.close()
        
        return {
            "status": "success",
            "user_skills": skills_list,
            "target_skill": target_skill,
            "recommendations": recommendations,
            "total_recommendations": len(recommendations)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")

@router.get("/transfers")
async def list_available_transfers():
    """
    List all available cross-domain skill transfers
    
    Returns:
        List of all skill transfer options with basic info
    """
    try:
        db = get_database_session()
        transfers = db.query(SkillTransfer).all()
        db.close()
        
        transfer_list = []
        for transfer in transfers:
            transfer_list.append({
                "id": transfer.id,
                "source_skill": transfer.source_skill,
                "target_skill": transfer.target_skill,
                "effectiveness": transfer.effectiveness,
                "created_at": transfer.created_at
            })
        
        return {
            "status": "success",
            "transfers": transfer_list,
            "total_transfers": len(transfer_list)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing transfers: {str(e)}")

@router.get("/transfers/{transfer_id}")
async def get_transfer_details(transfer_id: int):
    """
    Get detailed information about a specific skill transfer
    
    Args:
        transfer_id: ID of the skill transfer
    
    Returns:
        Detailed transfer information including mappings and learning path
    """
    try:
        engine = SkillTransferEngine()
        
        # Get transfer details
        db = engine.db
        transfer = db.query(SkillTransfer).filter(SkillTransfer.id == transfer_id).first()
        
        if not transfer:
            raise HTTPException(status_code=404, detail="Transfer not found")
        
        # Get analytics
        analytics = engine.get_transfer_analytics(transfer_id)
        
        # Get recommendations for this specific transfer
        recommendations = engine.get_transfer_recommendations([transfer.source_skill], transfer.target_skill)
        learning_path = recommendations[0]["learning_path"] if recommendations else None
        
        engine.close()
        
        return {
            "status": "success",
            "transfer": {
                "id": transfer.id,
                "source_skill": transfer.source_skill,
                "target_skill": transfer.target_skill,
                "effectiveness": transfer.effectiveness,
                "mapping_data": transfer.mapping_data,
                "created_at": transfer.created_at
            },
            "learning_path": learning_path,
            "analytics": analytics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting transfer details: {str(e)}")

@router.post("/start-transfer")
async def start_skill_transfer(request: StartTransferRequest):
    """
    Start a new skill transfer journey for a user
    
    Args:
        request: StartTransferRequest with user_id and transfer_id
    
    Returns:
        Progress information for the started transfer
    """
    try:
        result = start_user_transfer(request.user_id, request.transfer_id)
        
        return {
            "status": "success",
            "user_id": request.user_id,
            "transfer_id": request.transfer_id,
            **result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting transfer: {str(e)}")

@router.post("/update-progress")
async def update_transfer_progress(request: ProgressUpdateRequest):
    """
    Update user progress on a skill transfer journey
    
    Args:
        request: ProgressUpdateRequest with progress updates
    
    Returns:
        Updated progress information
    """
    try:
        engine = SkillTransferEngine()
        result = engine.update_progress(
            request.progress_id, 
            request.step_completed, 
            request.feedback
        )
        engine.close()
        
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return {
            "status": "success",
            "progress_id": request.progress_id,
            **result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating progress: {str(e)}")

@router.get("/user/{user_id}/transfers")
async def get_user_transfers(user_id: int):
    """
    Get all skill transfers for a specific user
    
    Args:
        user_id: ID of the user
    
    Returns:
        List of user's skill transfers with progress
    """
    try:
        engine = SkillTransferEngine()
        transfers = engine.get_user_transfers(user_id)
        engine.close()
        
        return {
            "status": "success",
            "user_id": user_id,
            "transfers": transfers,
            "total_transfers": len(transfers)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting user transfers: {str(e)}")

@router.post("/feedback")
async def submit_transfer_feedback(request: FeedbackRequest):
    """
    Submit feedback for a skill transfer
    
    Args:
        request: FeedbackRequest with user feedback and ratings
    
    Returns:
        Confirmation of feedback submission
    """
    try:
        db = get_database_session()
        
        feedback = TransferFeedback(
            user_id=request.user_id,
            transfer_id=request.transfer_id,
            progress_id=request.progress_id,
            feedback=request.feedback,
            improvement_score=request.improvement_score,
            effectiveness_rating=request.effectiveness_rating,
            specific_comments=request.specific_comments or {}
        )
        
        db.add(feedback)
        db.commit()
        
        feedback_id = feedback.id
        db.close()
        
        return {
            "status": "success",
            "feedback_id": feedback_id,
            "message": "Feedback submitted successfully"
        }
        
    except Exception as e:
        db.rollback()
        db.close()
        raise HTTPException(status_code=500, detail=f"Error submitting feedback: {str(e)}")

@router.get("/analytics/transfer/{transfer_id}")
async def get_transfer_analytics(transfer_id: int):
    """
    Get analytics for a specific skill transfer
    
    Args:
        transfer_id: ID of the skill transfer
    
    Returns:
        Analytics data including usage stats and feedback
    """
    try:
        engine = SkillTransferEngine()
        analytics = engine.get_transfer_analytics(transfer_id)
        engine.close()
        
        if "error" in analytics:
            raise HTTPException(status_code=404, detail=analytics["error"])
        
        return {
            "status": "success",
            "transfer_id": transfer_id,
            **analytics
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting analytics: {str(e)}")

@router.get("/analytics/overview")
async def get_cross_domain_overview():
    """
    Get overview analytics for all cross-domain transfers
    
    Returns:
        Overview statistics and top performing transfers
    """
    try:
        db = get_database_session()
        
        # Get all transfers
        transfers = db.query(SkillTransfer).all()
        
        # Get total progress records
        total_progress = db.query(TransferProgress).count()
        completed_transfers = db.query(TransferProgress).filter(
            TransferProgress.is_completed == True
        ).count()
        
        # Get recent feedback
        recent_feedback = db.query(TransferFeedback).order_by(
            TransferFeedback.created_at.desc()
        ).limit(10).all()
        
        # Calculate top transfers by effectiveness
        top_transfers = sorted(transfers, key=lambda x: x.effectiveness, reverse=True)[:5]
        
        db.close()
        
        return {
            "status": "success",
            "overview": {
                "total_transfers": len(transfers),
                "total_users": total_progress,
                "completed_journeys": completed_transfers,
                "completion_rate": (completed_transfers / total_progress * 100) if total_progress > 0 else 0
            },
            "top_transfers": [
                {
                    "id": t.id,
                    "source_skill": t.source_skill,
                    "target_skill": t.target_skill,
                    "effectiveness": t.effectiveness
                }
                for t in top_transfers
            ],
            "recent_feedback": [
                {
                    "transfer_id": f.transfer_id,
                    "improvement_score": f.improvement_score,
                    "effectiveness_rating": f.effectiveness_rating,
                    "created_at": f.created_at
                }
                for f in recent_feedback
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting overview: {str(e)}")

@router.get("/spotlight/daily")
async def get_daily_transfer_spotlight():
    """
    Get daily featured skill transfer with special recommendations
    
    Returns:
        Featured transfer with detailed learning opportunities
    """
    try:
        # For now, rotate through transfers based on day of year
        import calendar
        day_of_year = datetime.now().timetuple().tm_yday
        
        db = get_database_session()
        transfers = db.query(SkillTransfer).all()
        
        if not transfers:
            raise HTTPException(status_code=404, detail="No transfers available")
        
        # Select transfer based on day
        featured_transfer = transfers[day_of_year % len(transfers)]
        
        # Get detailed analytics
        engine = SkillTransferEngine()
        analytics = engine.get_transfer_analytics(featured_transfer.id)
        recommendations = engine.get_transfer_recommendations([featured_transfer.source_skill], featured_transfer.target_skill)
        engine.close()
        
        db.close()
        
        return {
            "status": "success",
            "spotlight_date": datetime.now().date(),
            "featured_transfer": {
                "id": featured_transfer.id,
                "source_skill": featured_transfer.source_skill,
                "target_skill": featured_transfer.target_skill,
                "effectiveness": featured_transfer.effectiveness,
                "why_featured": f"Discover how {featured_transfer.source_skill} skills can transform your {featured_transfer.target_skill} abilities!"
            },
            "learning_path": recommendations[0]["learning_path"] if recommendations else None,
            "analytics": analytics,
            "daily_tip": f"Today's insight: The {featured_transfer.source_skill} to {featured_transfer.target_skill} transfer has a {featured_transfer.effectiveness:.0%} effectiveness rate!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting daily spotlight: {str(e)}")

# Health check endpoint for cross-domain service
@router.get("/health")
async def cross_domain_health():
    """Health check for cross-domain skill transfer service"""
    try:
        # Test database connection
        db = get_database_session()
        transfer_count = db.query(SkillTransfer).count()
        db.close()
        
        return {
            "status": "healthy",
            "service": "Cross-Domain Skill Transfer",
            "timestamp": datetime.now(),
            "available_transfers": transfer_count
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "Cross-Domain Skill Transfer",
            "timestamp": datetime.now(),
            "error": str(e)
        }