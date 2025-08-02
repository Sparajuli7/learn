from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import json
import sys
import os

# Import database and models
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '01-foundation', 'backend'))
from database import get_db, User, Video, AnalysisResult
from expert_database import Expert, ExpertPattern, UserComparison, init_expert_database
from pattern_comparison import pattern_comparator
from expert_recommendations import recommendation_engine

# Create API router for expert pattern endpoints
router = APIRouter(prefix="/experts", tags=["Expert Patterns"])

@router.post("/initialize-database")
async def initialize_expert_database(db: Session = Depends(get_db)):
    """Initialize the expert database with 20+ experts and their patterns"""
    try:
        init_expert_database()
        return {
            "status": "success",
            "message": "Expert database initialized successfully",
            "experts_count": db.query(Expert).count(),
            "patterns_count": db.query(ExpertPattern).count()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to initialize expert database: {str(e)}")

@router.get("/list")
async def list_experts(
    skill_type: Optional[str] = Query(None, description="Filter by skill type"),
    domain: Optional[str] = Query(None, description="Filter by domain"),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get list of available experts, optionally filtered by skill type or domain"""
    
    try:
        query = db.query(Expert)
        
        if domain:
            query = query.filter(Expert.domain == domain)
        
        if skill_type:
            query = query.join(ExpertPattern).filter(ExpertPattern.skill_type == skill_type)
        
        experts = query.limit(limit).all()
        
        expert_list = []
        for expert in experts:
            expert_data = {
                "id": expert.id,
                "name": expert.name,
                "domain": expert.domain,
                "biography": expert.biography,
                "achievements": json.loads(expert.achievements),
                "video_url": expert.video_url,
                "created_at": expert.created_at.isoformat()
            }
            
            # Get patterns for this expert
            patterns = db.query(ExpertPattern).filter(ExpertPattern.expert_id == expert.id).all()
            expert_data["patterns"] = [
                {
                    "skill_type": p.skill_type,
                    "pattern_data": json.loads(p.pattern_data),
                    "confidence_score": p.confidence_score
                }
                for p in patterns
            ]
            
            expert_list.append(expert_data)
        
        return {
            "experts": expert_list,
            "total_count": len(expert_list),
            "filters_applied": {
                "skill_type": skill_type,
                "domain": domain
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve experts: {str(e)}")

@router.get("/{expert_id}")
async def get_expert_details(expert_id: int, db: Session = Depends(get_db)):
    """Get detailed information about a specific expert"""
    
    try:
        expert = db.query(Expert).filter(Expert.id == expert_id).first()
        if not expert:
            raise HTTPException(status_code=404, detail="Expert not found")
        
        # Get expert patterns
        patterns = db.query(ExpertPattern).filter(ExpertPattern.expert_id == expert_id).all()
        
        # Get recent user comparisons for popularity metrics
        recent_comparisons = db.query(UserComparison).filter(
            UserComparison.expert_id == expert_id
        ).limit(10).all()
        
        expert_details = {
            "id": expert.id,
            "name": expert.name,
            "domain": expert.domain,
            "biography": expert.biography,
            "achievements": json.loads(expert.achievements),
            "pattern_data": json.loads(expert.pattern_data) if expert.pattern_data else {},
            "video_url": expert.video_url,
            "created_at": expert.created_at.isoformat(),
            "patterns": [
                {
                    "id": p.id,
                    "skill_type": p.skill_type,
                    "pattern_data": json.loads(p.pattern_data),
                    "confidence_score": p.confidence_score,
                    "created_at": p.created_at.isoformat()
                }
                for p in patterns
            ],
            "stats": {
                "total_patterns": len(patterns),
                "recent_comparisons": len(recent_comparisons),
                "avg_similarity_score": sum(c.similarity_score for c in recent_comparisons) / len(recent_comparisons) if recent_comparisons else 0.0
            }
        }
        
        return expert_details
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve expert details: {str(e)}")

@router.post("/compare/{video_id}")
async def compare_to_experts(
    video_id: int,
    num_experts: int = Query(3, ge=1, le=10, description="Number of expert matches to return"),
    db: Session = Depends(get_db)
):
    """Compare user's video performance to expert patterns"""
    
    try:
        # Get video and analysis data
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        analysis = db.query(AnalysisResult).filter(AnalysisResult.video_id == video_id).first()
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found for this video")
        
        analysis_data = json.loads(analysis.analysis_data)
        
        # Extract user metrics from analysis
        user_metrics = pattern_comparator.extract_user_metrics(analysis_data, video.skill_type)
        
        # Find best expert matches
        expert_matches = pattern_comparator.find_best_expert_matches(
            user_metrics, video.skill_type, num_experts
        )
        
        # Generate detailed comparisons
        comparisons = []
        for match in expert_matches:
            # Generate expert feedback
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
            
            comparison_result = {
                "comparison_id": comparison_id,
                "expert": {
                    "id": match["expert_id"],
                    "name": match["expert_name"],
                    "domain": match["expert_domain"],
                    "biography": match["expert_biography"],
                    "achievements": match["expert_achievements"]
                },
                "similarity_score": match["similarity_score"],
                "comparison_data": match["comparison_data"],
                "feedback": expert_feedback,
                "pattern_confidence": match["pattern_confidence"]
            }
            
            comparisons.append(comparison_result)
        
        return {
            "video_id": video_id,
            "skill_type": video.skill_type,
            "user_metrics": user_metrics,
            "expert_comparisons": comparisons,
            "comparison_timestamp": analysis_data.get("analysis_timestamp"),
            "summary": {
                "best_match": comparisons[0]["expert"]["name"] if comparisons else None,
                "best_similarity": comparisons[0]["similarity_score"] if comparisons else 0.0,
                "total_experts_compared": len(comparisons)
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compare to experts: {str(e)}")

@router.get("/recommendations/{user_id}")
async def get_expert_recommendations(
    user_id: int,
    skill_type: str = Query(..., description="Skill type for recommendations"),
    num_recommendations: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db)
):
    """Get personalized expert recommendations for a user"""
    
    try:
        # Check if user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get user's latest analysis for the skill type
        latest_video = db.query(Video).filter(
            Video.user_id == user_id,
            Video.skill_type == skill_type
        ).order_by(Video.created_at.desc()).first()
        
        if not latest_video:
            raise HTTPException(status_code=404, detail=f"No videos found for skill type: {skill_type}")
        
        latest_analysis = db.query(AnalysisResult).filter(
            AnalysisResult.video_id == latest_video.id
        ).first()
        
        if not latest_analysis:
            raise HTTPException(status_code=404, detail="No analysis found for latest video")
        
        analysis_data = json.loads(latest_analysis.analysis_data)
        user_metrics = pattern_comparator.extract_user_metrics(analysis_data, skill_type)
        
        # Get personalized recommendations
        recommendations = recommendation_engine.get_personalized_recommendations(
            user_id, skill_type, user_metrics, num_recommendations
        )
        
        return recommendations
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get recommendations: {str(e)}")

@router.get("/spotlight/daily")
async def get_daily_expert_spotlight(skill_type: Optional[str] = Query(None)):
    """Get daily expert spotlight with featured expert and insights"""
    
    try:
        spotlight = recommendation_engine.get_daily_expert_spotlight(skill_type)
        return spotlight
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get daily spotlight: {str(e)}")

@router.get("/combinations/{user_id}")
async def get_expert_combinations(
    user_id: int,
    skill_type: str = Query(..., description="Skill type for combinations"),
    db: Session = Depends(get_db)
):
    """Get suggested expert combinations for comprehensive learning"""
    
    try:
        # Get user's current metrics
        latest_video = db.query(Video).filter(
            Video.user_id == user_id,
            Video.skill_type == skill_type
        ).order_by(Video.created_at.desc()).first()
        
        if not latest_video:
            raise HTTPException(status_code=404, detail=f"No videos found for skill type: {skill_type}")
        
        latest_analysis = db.query(AnalysisResult).filter(
            AnalysisResult.video_id == latest_video.id
        ).first()
        
        if not latest_analysis:
            raise HTTPException(status_code=404, detail="No analysis found for latest video")
        
        analysis_data = json.loads(latest_analysis.analysis_data)
        user_metrics = pattern_comparator.extract_user_metrics(analysis_data, skill_type)
        
        # Get expert combinations
        combinations = recommendation_engine.suggest_expert_combinations(user_metrics, skill_type)
        
        return {
            "user_id": user_id,
            "skill_type": skill_type,
            "current_metrics": user_metrics,
            "combinations": combinations
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get expert combinations: {str(e)}")

@router.post("/feedback/{recommendation_id}")
async def submit_recommendation_feedback(
    recommendation_id: str,
    feedback_type: str = Query(..., description="Type of feedback: helpful, not_helpful, implemented"),
    user_id: int = Query(..., description="User ID"),
    feedback_data: Dict[str, Any] = None
):
    """Submit feedback on recommendation effectiveness"""
    
    try:
        success = recommendation_engine.track_recommendation_effectiveness(
            user_id, recommendation_id, feedback_type, feedback_data or {}
        )
        
        if success:
            return {
                "status": "success",
                "message": "Feedback recorded successfully",
                "recommendation_id": recommendation_id,
                "feedback_type": feedback_type
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to record feedback")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")

@router.get("/user-comparisons/{user_id}")
async def get_user_comparison_history(
    user_id: int,
    skill_type: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get user's comparison history with experts"""
    
    try:
        query = db.query(UserComparison).filter(UserComparison.user_id == user_id)
        
        if skill_type:
            query = query.join(Video).filter(Video.skill_type == skill_type)
        
        comparisons = query.order_by(UserComparison.created_at.desc()).limit(limit).all()
        
        comparison_history = []
        for comp in comparisons:
            expert = db.query(Expert).filter(Expert.id == comp.expert_id).first()
            video = db.query(Video).filter(Video.id == comp.video_id).first()
            
            comparison_history.append({
                "id": comp.id,
                "expert": {
                    "id": expert.id,
                    "name": expert.name,
                    "domain": expert.domain
                } if expert else None,
                "video": {
                    "id": video.id,
                    "skill_type": video.skill_type,
                    "created_at": video.created_at.isoformat()
                } if video else None,
                "similarity_score": comp.similarity_score,
                "comparison_data": json.loads(comp.comparison_data),
                "feedback": json.loads(comp.feedback),
                "created_at": comp.created_at.isoformat()
            })
        
        return {
            "user_id": user_id,
            "total_comparisons": len(comparison_history),
            "skill_type_filter": skill_type,
            "comparisons": comparison_history
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get comparison history: {str(e)}")

@router.get("/stats/overview")
async def get_expert_system_stats(db: Session = Depends(get_db)):
    """Get overview statistics of the expert system"""
    
    try:
        stats = {
            "total_experts": db.query(Expert).count(),
            "total_patterns": db.query(ExpertPattern).count(),
            "total_comparisons": db.query(UserComparison).count(),
            "experts_by_domain": {},
            "patterns_by_skill": {},
            "recent_activity": {
                "comparisons_last_7_days": 0,
                "avg_similarity_score": 0.0
            }
        }
        
        # Get experts by domain
        experts = db.query(Expert).all()
        for expert in experts:
            domain = expert.domain
            stats["experts_by_domain"][domain] = stats["experts_by_domain"].get(domain, 0) + 1
        
        # Get patterns by skill type
        patterns = db.query(ExpertPattern).all()
        for pattern in patterns:
            skill = pattern.skill_type
            stats["patterns_by_skill"][skill] = stats["patterns_by_skill"].get(skill, 0) + 1
        
        # Get recent activity
        from datetime import datetime, timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_comparisons = db.query(UserComparison).filter(
            UserComparison.created_at >= week_ago
        ).all()
        
        stats["recent_activity"]["comparisons_last_7_days"] = len(recent_comparisons)
        if recent_comparisons:
            stats["recent_activity"]["avg_similarity_score"] = sum(
                c.similarity_score for c in recent_comparisons
            ) / len(recent_comparisons)
        
        return stats
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get system stats: {str(e)}")