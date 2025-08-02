import json
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import sys
import os

# Import database models
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '01-foundation', 'backend'))
from database import SessionLocal, User, Video, AnalysisResult
from expert_database import Expert, ExpertPattern, UserComparison

class ExpertRecommendationEngine:
    """Intelligent recommendation engine for suggesting relevant experts and learning paths"""
    
    def __init__(self):
        self.recommendation_strategies = {
            "similar_performance": 0.4,    # Recommend experts with similar current level
            "aspirational": 0.3,           # Recommend top-tier experts to aspire to
            "progressive": 0.2,            # Recommend experts slightly above current level
            "cross_domain": 0.1            # Recommend experts from related domains
        }
    
    def get_personalized_recommendations(self, user_id: int, skill_type: str, 
                                       user_metrics: Dict[str, float],
                                       num_recommendations: int = 5) -> Dict[str, Any]:
        """Get personalized expert recommendations for a user"""
        
        db = SessionLocal()
        try:
            # Get user's historical performance
            user_history = self._get_user_performance_history(db, user_id, skill_type)
            
            # Get all available experts for the skill type
            available_experts = self._get_available_experts(db, skill_type)
            
            # Generate different types of recommendations
            recommendations = {
                "similar_level": self._find_similar_level_experts(available_experts, user_metrics),
                "aspirational": self._find_aspirational_experts(available_experts, user_metrics),
                "progressive": self._find_progressive_experts(available_experts, user_metrics),
                "improvement_focused": self._find_improvement_focused_experts(available_experts, user_metrics),
                "trending": self._get_trending_experts(db, skill_type)
            }
            
            # Combine and rank all recommendations
            final_recommendations = self._rank_and_combine_recommendations(
                recommendations, user_metrics, user_history, num_recommendations
            )
            
            # Add learning paths and next steps
            for rec in final_recommendations:
                rec["learning_path"] = self._generate_learning_path(rec, user_metrics)
                rec["expected_timeline"] = self._estimate_improvement_timeline(rec, user_metrics)
            
            return {
                "recommendations": final_recommendations,
                "user_current_level": self._assess_user_level(user_metrics),
                "skill_type": skill_type,
                "generated_at": datetime.utcnow().isoformat(),
                "personalization_factors": self._get_personalization_factors(user_history, user_metrics)
            }
        
        finally:
            db.close()
    
    def get_daily_expert_spotlight(self, skill_type: Optional[str] = None) -> Dict[str, Any]:
        """Get a daily expert spotlight with featured expert and insights"""
        
        db = SessionLocal()
        try:
            # Select expert based on day of year for consistency
            day_of_year = datetime.now().timetuple().tm_yday
            
            query = db.query(Expert)
            if skill_type:
                query = query.join(ExpertPattern).filter(ExpertPattern.skill_type == skill_type)
            
            experts = query.all()
            if not experts:
                return {"error": "No experts found"}
            
            # Select expert based on day
            featured_expert = experts[day_of_year % len(experts)]
            
            # Get expert's patterns
            expert_patterns = db.query(ExpertPattern).filter(
                ExpertPattern.expert_id == featured_expert.id
            ).all()
            
            # Generate spotlight content
            spotlight = {
                "expert": {
                    "id": featured_expert.id,
                    "name": featured_expert.name,
                    "domain": featured_expert.domain,
                    "biography": featured_expert.biography,
                    "achievements": json.loads(featured_expert.achievements),
                    "pattern_data": json.loads(featured_expert.pattern_data) if featured_expert.pattern_data else {}
                },
                "daily_insight": self._generate_daily_insight(featured_expert),
                "key_techniques": self._extract_key_techniques(expert_patterns),
                "practice_tip": self._generate_practice_tip(featured_expert),
                "famous_quote": self._get_expert_quote(featured_expert),
                "date": datetime.now().isoformat()
            }
            
            return spotlight
        
        finally:
            db.close()
    
    def suggest_expert_combinations(self, user_metrics: Dict[str, float], 
                                  skill_type: str) -> List[Dict[str, Any]]:
        """Suggest combinations of experts to learn from different aspects"""
        
        db = SessionLocal()
        try:
            # Get experts with strong performance in different metrics
            metric_leaders = {}
            experts = self._get_available_experts(db, skill_type)
            
            for expert in experts:
                expert_metrics = json.loads(expert["pattern_data"])
                for metric, value in expert_metrics.items():
                    if metric not in metric_leaders or value > metric_leaders[metric]["score"]:
                        metric_leaders[metric] = {
                            "expert_id": expert["expert_id"],
                            "expert_name": expert["expert_name"],
                            "score": value,
                            "metric": metric
                        }
            
            # Create combinations for comprehensive learning
            combinations = [
                {
                    "title": "Fundamentals + Advanced Techniques",
                    "description": "Master basics with one expert, then advance with another",
                    "experts": self._select_fundamentals_and_advanced_experts(experts, user_metrics),
                    "learning_approach": "sequential"
                },
                {
                    "title": "Different Style Approaches",
                    "description": "Learn different approaches to the same skill",
                    "experts": self._select_contrasting_style_experts(experts, user_metrics),
                    "learning_approach": "comparative"
                },
                {
                    "title": "Weakness-Focused Learning",
                    "description": "Target your specific improvement areas",
                    "experts": self._select_weakness_focused_experts(experts, user_metrics, metric_leaders),
                    "learning_approach": "targeted"
                }
            ]
            
            return combinations
        
        finally:
            db.close()
    
    def track_recommendation_effectiveness(self, user_id: int, recommendation_id: str, 
                                         feedback_type: str, feedback_data: Dict[str, Any]) -> bool:
        """Track how effective recommendations are for continuous improvement"""
        
        db = SessionLocal()
        try:
            # This would implement recommendation tracking
            # For now, we'll log the feedback
            tracking_data = {
                "user_id": user_id,
                "recommendation_id": recommendation_id,
                "feedback_type": feedback_type,  # "helpful", "not_helpful", "implemented"
                "feedback_data": feedback_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # In a full implementation, this would be stored in a tracking table
            print(f"Recommendation feedback tracked: {tracking_data}")
            
            return True
        
        finally:
            db.close()
    
    # Helper methods
    def _get_user_performance_history(self, db, user_id: int, skill_type: str) -> List[Dict[str, Any]]:
        """Get user's historical performance for the skill type"""
        
        # Get user's previous analyses
        user_analyses = db.query(AnalysisResult).join(Video).filter(
            Video.user_id == user_id,
            Video.skill_type == skill_type
        ).order_by(AnalysisResult.created_at.desc()).limit(10).all()
        
        history = []
        for analysis in user_analyses:
            analysis_data = json.loads(analysis.analysis_data)
            history.append({
                "analysis_id": analysis.id,
                "video_id": analysis.video_id,
                "analysis_data": analysis_data,
                "created_at": analysis.created_at.isoformat()
            })
        
        return history
    
    def _get_available_experts(self, db, skill_type: str) -> List[Dict[str, Any]]:
        """Get all available experts for a skill type"""
        
        expert_patterns = db.query(ExpertPattern).filter(
            ExpertPattern.skill_type == skill_type
        ).all()
        
        experts = []
        for pattern in expert_patterns:
            expert = db.query(Expert).filter(Expert.id == pattern.expert_id).first()
            if expert:
                experts.append({
                    "expert_id": expert.id,
                    "expert_name": expert.name,
                    "domain": expert.domain,
                    "biography": expert.biography,
                    "achievements": json.loads(expert.achievements),
                    "pattern_data": pattern.pattern_data,
                    "confidence_score": pattern.confidence_score
                })
        
        return experts
    
    def _find_similar_level_experts(self, experts: List[Dict[str, Any]], 
                                   user_metrics: Dict[str, float]) -> List[Dict[str, Any]]:
        """Find experts with similar performance levels"""
        
        user_avg_score = sum(user_metrics.values()) / len(user_metrics)
        similar_experts = []
        
        for expert in experts:
            expert_metrics = json.loads(expert["pattern_data"])
            expert_avg_score = sum(expert_metrics.values()) / len(expert_metrics)
            
            # Consider similar if within 0.2 range
            if abs(expert_avg_score - user_avg_score) <= 0.2:
                similarity_score = 1.0 - abs(expert_avg_score - user_avg_score)
                expert["similarity_reason"] = f"Similar overall performance level ({expert_avg_score:.2f} vs {user_avg_score:.2f})"
                expert["recommendation_score"] = similarity_score
                similar_experts.append(expert)
        
        return sorted(similar_experts, key=lambda x: x["recommendation_score"], reverse=True)[:3]
    
    def _find_aspirational_experts(self, experts: List[Dict[str, Any]], 
                                  user_metrics: Dict[str, float]) -> List[Dict[str, Any]]:
        """Find top-tier experts to aspire to"""
        
        aspirational_experts = []
        
        for expert in experts:
            expert_metrics = json.loads(expert["pattern_data"])
            expert_avg_score = sum(expert_metrics.values()) / len(expert_metrics)
            
            # Consider aspirational if significantly above user level
            if expert_avg_score >= 0.85:
                expert["similarity_reason"] = f"Master-level performance to aspire to ({expert_avg_score:.2f})"
                expert["recommendation_score"] = expert_avg_score
                aspirational_experts.append(expert)
        
        return sorted(aspirational_experts, key=lambda x: x["recommendation_score"], reverse=True)[:2]
    
    def _find_progressive_experts(self, experts: List[Dict[str, Any]], 
                                 user_metrics: Dict[str, float]) -> List[Dict[str, Any]]:
        """Find experts slightly above current level for progressive learning"""
        
        user_avg_score = sum(user_metrics.values()) / len(user_metrics)
        progressive_experts = []
        
        for expert in experts:
            expert_metrics = json.loads(expert["pattern_data"])
            expert_avg_score = sum(expert_metrics.values()) / len(expert_metrics)
            
            # Consider progressive if 0.1-0.3 above user level
            if 0.1 <= expert_avg_score - user_avg_score <= 0.3:
                improvement_potential = expert_avg_score - user_avg_score
                expert["similarity_reason"] = f"Next level target (+{improvement_potential:.2f} improvement potential)"
                expert["recommendation_score"] = improvement_potential
                progressive_experts.append(expert)
        
        return sorted(progressive_experts, key=lambda x: x["recommendation_score"], reverse=True)[:2]
    
    def _find_improvement_focused_experts(self, experts: List[Dict[str, Any]], 
                                        user_metrics: Dict[str, float]) -> List[Dict[str, Any]]:
        """Find experts strong in user's weak areas"""
        
        # Find user's weakest metrics
        weak_metrics = {k: v for k, v in user_metrics.items() if v < 0.6}
        if not weak_metrics:
            return []
        
        improvement_experts = []
        
        for expert in experts:
            expert_metrics = json.loads(expert["pattern_data"])
            
            # Check if expert is strong in user's weak areas
            strength_in_weakness = 0
            relevant_metrics = 0
            
            for metric, user_value in weak_metrics.items():
                if metric in expert_metrics:
                    expert_value = expert_metrics[metric]
                    if expert_value > 0.8:  # Expert is strong in this area
                        strength_in_weakness += expert_value - user_value
                        relevant_metrics += 1
            
            if relevant_metrics > 0:
                improvement_score = strength_in_weakness / relevant_metrics
                expert["similarity_reason"] = f"Strong in your improvement areas (avg +{improvement_score:.2f})"
                expert["recommendation_score"] = improvement_score
                improvement_experts.append(expert)
        
        return sorted(improvement_experts, key=lambda x: x["recommendation_score"], reverse=True)[:2]
    
    def _get_trending_experts(self, db, skill_type: str) -> List[Dict[str, Any]]:
        """Get currently trending experts based on recent user interest"""
        
        # Get recent comparisons
        recent_comparisons = db.query(UserComparison).join(Video).filter(
            Video.skill_type == skill_type,
            UserComparison.created_at >= datetime.utcnow() - timedelta(days=30)
        ).all()
        
        # Count expert popularity
        expert_popularity = {}
        for comparison in recent_comparisons:
            expert_id = comparison.expert_id
            expert_popularity[expert_id] = expert_popularity.get(expert_id, 0) + 1
        
        # Get top trending experts
        trending_experts = []
        for expert_id, count in sorted(expert_popularity.items(), key=lambda x: x[1], reverse=True)[:2]:
            expert = db.query(Expert).filter(Expert.id == expert_id).first()
            if expert:
                trending_experts.append({
                    "expert_id": expert.id,
                    "expert_name": expert.name,
                    "domain": expert.domain,
                    "biography": expert.biography,
                    "achievements": json.loads(expert.achievements),
                    "pattern_data": expert.pattern_data,
                    "similarity_reason": f"Trending expert - {count} recent comparisons",
                    "recommendation_score": count / 10.0  # Normalize
                })
        
        return trending_experts
    
    def _rank_and_combine_recommendations(self, recommendations: Dict[str, List], 
                                        user_metrics: Dict[str, float], 
                                        user_history: List[Dict[str, Any]], 
                                        num_recommendations: int) -> List[Dict[str, Any]]:
        """Combine and rank all recommendations"""
        
        all_recommendations = []
        
        # Add recommendations with strategy weights
        for strategy, experts in recommendations.items():
            weight = self.recommendation_strategies.get(strategy, 0.1)
            for expert in experts:
                expert["strategy"] = strategy
                expert["strategy_weight"] = weight
                expert["final_score"] = expert.get("recommendation_score", 0.5) * weight
                all_recommendations.append(expert)
        
        # Remove duplicates by expert_id, keeping highest scoring version
        unique_recommendations = {}
        for rec in all_recommendations:
            expert_id = rec["expert_id"]
            if expert_id not in unique_recommendations or rec["final_score"] > unique_recommendations[expert_id]["final_score"]:
                unique_recommendations[expert_id] = rec
        
        # Sort by final score and return top N
        final_list = list(unique_recommendations.values())
        final_list.sort(key=lambda x: x["final_score"], reverse=True)
        
        return final_list[:num_recommendations]
    
    def _generate_learning_path(self, recommendation: Dict[str, Any], 
                               user_metrics: Dict[str, float]) -> Dict[str, Any]:
        """Generate a learning path for following an expert"""
        
        expert_metrics = json.loads(recommendation["pattern_data"])
        
        # Find biggest gaps
        gaps = []
        for metric, expert_value in expert_metrics.items():
            if metric in user_metrics:
                gap = expert_value - user_metrics[metric]
                if gap > 0.1:
                    gaps.append({
                        "metric": metric,
                        "gap": gap,
                        "current": user_metrics[metric],
                        "target": expert_value
                    })
        
        gaps.sort(key=lambda x: x["gap"], reverse=True)
        
        # Create learning steps
        learning_steps = []
        for i, gap in enumerate(gaps[:3]):  # Top 3 gaps
            step = {
                "step": i + 1,
                "focus_area": gap["metric"].replace("_", " ").title(),
                "current_level": gap["current"],
                "target_level": gap["target"],
                "improvement_needed": gap["gap"],
                "priority": "high" if gap["gap"] > 0.3 else "medium",
                "estimated_weeks": max(2, int(gap["gap"] * 8))
            }
            learning_steps.append(step)
        
        return {
            "total_estimated_weeks": sum(step["estimated_weeks"] for step in learning_steps),
            "learning_steps": learning_steps,
            "recommended_practice_frequency": "Daily, 30-45 minutes",
            "key_focus": f"Emulate {recommendation['expert_name']}'s approach to {recommendation['domain'].lower()}"
        }
    
    def _estimate_improvement_timeline(self, recommendation: Dict[str, Any], 
                                     user_metrics: Dict[str, float]) -> Dict[str, str]:
        """Estimate improvement timeline"""
        
        expert_metrics = json.loads(recommendation["pattern_data"])
        user_avg = sum(user_metrics.values()) / len(user_metrics)
        expert_avg = sum(expert_metrics.values()) / len(expert_metrics)
        
        gap = expert_avg - user_avg
        
        if gap <= 0.1:
            return {"timeframe": "2-4 weeks", "difficulty": "easy"}
        elif gap <= 0.3:
            return {"timeframe": "2-3 months", "difficulty": "moderate"}
        else:
            return {"timeframe": "6+ months", "difficulty": "challenging"}
    
    def _assess_user_level(self, user_metrics: Dict[str, float]) -> str:
        """Assess user's current skill level"""
        
        avg_score = sum(user_metrics.values()) / len(user_metrics)
        
        if avg_score >= 0.8:
            return "advanced"
        elif avg_score >= 0.6:
            return "intermediate"
        elif avg_score >= 0.4:
            return "beginner_plus"
        else:
            return "beginner"
    
    def _get_personalization_factors(self, user_history: List[Dict[str, Any]], 
                                   user_metrics: Dict[str, float]) -> Dict[str, Any]:
        """Get factors used for personalization"""
        
        return {
            "experience_level": self._assess_user_level(user_metrics),
            "practice_frequency": len(user_history),
            "improvement_trend": "improving" if len(user_history) > 1 else "new_user",
            "focus_areas": [k for k, v in user_metrics.items() if v < 0.6]
        }
    
    def _generate_daily_insight(self, expert: Expert) -> str:
        """Generate daily insight about the expert"""
        
        insights = [
            f"{expert.name} revolutionized {expert.domain.lower()} through relentless practice and innovation.",
            f"What made {expert.name} exceptional was their attention to fundamental principles.",
            f"{expert.name}'s approach to {expert.domain.lower()} emphasizes both technical mastery and creative expression.",
            f"The key to {expert.name}'s success was their ability to perform under pressure while maintaining perfect form."
        ]
        
        # Select based on day for consistency
        day_index = datetime.now().day % len(insights)
        return insights[day_index]
    
    def _extract_key_techniques(self, expert_patterns: List) -> List[str]:
        """Extract key techniques from expert patterns"""
        
        techniques = []
        for pattern in expert_patterns:
            pattern_data = json.loads(pattern.pattern_data)
            # Get top 2 metrics for this expert
            sorted_metrics = sorted(pattern_data.items(), key=lambda x: x[1], reverse=True)[:2]
            for metric, value in sorted_metrics:
                technique = metric.replace("_", " ").title()
                techniques.append(f"{technique} (Expert Level: {value:.1%})")
        
        return list(set(techniques))[:3]  # Remove duplicates, limit to 3
    
    def _generate_practice_tip(self, expert: Expert) -> str:
        """Generate a practice tip based on the expert"""
        
        tips = {
            "Public Speaking": f"Practice like {expert.name}: Record yourself daily and focus on one improvement area at a time.",
            "Sports": f"Train like {expert.name}: Master the fundamentals before attempting advanced techniques.",
            "Music": f"Practice like {expert.name}: Use a metronome and focus on precision over speed.",
            "Cooking": f"Cook like {expert.name}: Prep everything first, then focus on technique and timing.",
            "Business": f"Present like {expert.name}: Know your material inside out, then focus on connecting with your audience."
        }
        
        return tips.get(expert.domain, f"Learn from {expert.name}: Focus on consistent daily practice and gradual improvement.")
    
    def _get_expert_quote(self, expert: Expert) -> str:
        """Get a relevant quote (simulated)"""
        
        quotes = {
            "Martin Luther King Jr.": "The ultimate measure of a man is not where he stands in moments of comfort, but where he stands at times of challenge.",
            "Steve Jobs": "Innovation distinguishes between a leader and a follower.",
            "Muhammad Ali": "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'",
            "Michael Jordan": "I've missed more than 9000 shots in my career. I've lost almost 300 games. That's why I succeed.",
            "Wolfgang Amadeus Mozart": "The music is not in the notes, but in the silence between.",
        }
        
        return quotes.get(expert.name, f"Excellence is not a skill, it's an attitude. - {expert.name}")
    
    def _select_fundamentals_and_advanced_experts(self, experts: List[Dict[str, Any]], 
                                                user_metrics: Dict[str, float]) -> List[Dict[str, Any]]:
        """Select experts for fundamentals vs advanced learning"""
        
        # This would implement logic to select complementary experts
        return experts[:2] if len(experts) >= 2 else experts
    
    def _select_contrasting_style_experts(self, experts: List[Dict[str, Any]], 
                                        user_metrics: Dict[str, float]) -> List[Dict[str, Any]]:
        """Select experts with contrasting styles"""
        
        # This would implement logic to find experts with different approaches
        return experts[:2] if len(experts) >= 2 else experts
    
    def _select_weakness_focused_experts(self, experts: List[Dict[str, Any]], 
                                       user_metrics: Dict[str, float],
                                       metric_leaders: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Select experts who excel in user's weak areas"""
        
        weak_areas = [k for k, v in user_metrics.items() if v < 0.6]
        weakness_experts = []
        
        for metric in weak_areas:
            if metric in metric_leaders:
                leader = metric_leaders[metric]
                for expert in experts:
                    if expert["expert_id"] == leader["expert_id"]:
                        weakness_experts.append(expert)
                        break
        
        return weakness_experts[:2]

# Global instance for use in API
recommendation_engine = ExpertRecommendationEngine()