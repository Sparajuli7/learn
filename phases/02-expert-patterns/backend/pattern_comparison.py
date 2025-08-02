import json
import numpy as np
from typing import Dict, List, Tuple, Any
from datetime import datetime
import sys
import os

# Import database models
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '01-foundation', 'backend'))
from database import SessionLocal, User, Video, AnalysisResult
from expert_database import Expert, ExpertPattern, UserComparison

class PatternComparator:
    """Advanced pattern comparison engine for matching user performance to expert patterns"""
    
    def __init__(self):
        self.skill_weights = {
            "Public Speaking": {
                "voice_modulation": 0.2,
                "pause_timing": 0.15,
                "gesture_coordination": 0.15,
                "emotional_resonance": 0.2,
                "eye_contact": 0.15,
                "speaking_pace": 0.15
            },
            "Sports/Athletics": {
                "footwork_precision": 0.2,
                "technique_execution": 0.25,
                "balance": 0.15,
                "timing": 0.2,
                "coordination": 0.2
            },
            "Music/Instrument": {
                "rhythm_accuracy": 0.25,
                "timing_precision": 0.2,
                "finger_technique": 0.2,
                "musical_expression": 0.15,
                "tempo_control": 0.1,
                "dynamics": 0.1
            },
            "Cooking": {
                "knife_skills": 0.25,
                "timing_precision": 0.2,
                "technique_execution": 0.2,
                "efficiency": 0.15,
                "safety_awareness": 0.1,
                "multitasking": 0.1
            },
            "Dance/Fitness": {
                "movement_precision": 0.25,
                "balance": 0.2,
                "rhythm_accuracy": 0.2,
                "flexibility": 0.15,
                "coordination": 0.2
            }
        }
    
    def extract_user_metrics(self, analysis_data: Dict[str, Any], skill_type: str) -> Dict[str, float]:
        """Extract user performance metrics from analysis data"""
        
        user_metrics = {}
        video_analysis = analysis_data.get("video_analysis", {})
        speech_analysis = analysis_data.get("speech_analysis", {})
        
        if skill_type == "Public Speaking":
            # Extract speech and gesture metrics
            user_metrics = {
                "voice_modulation": self._calculate_voice_modulation(speech_analysis),
                "pause_timing": self._calculate_pause_timing(speech_analysis),
                "gesture_coordination": video_analysis.get("gesture_score", 0.5),
                "emotional_resonance": speech_analysis.get("sentiment", {}).get("compound", 0.5),
                "eye_contact": video_analysis.get("eye_contact_score", 0.5),
                "speaking_pace": self._normalize_speaking_pace(speech_analysis.get("pace", {}).get("words_per_minute", 150))
            }
        
        elif skill_type == "Sports/Athletics":
            # Extract movement and form metrics
            joint_tracking = video_analysis.get("joint_tracking", {})
            user_metrics = {
                "footwork_precision": self._calculate_footwork_precision(joint_tracking),
                "technique_execution": video_analysis.get("technique_score", 0.5),
                "balance": video_analysis.get("balance_score", 0.5),
                "timing": video_analysis.get("timing_score", 0.5),
                "coordination": video_analysis.get("coordination_score", 0.5)
            }
        
        elif skill_type == "Music/Instrument":
            # Extract musical performance metrics
            user_metrics = {
                "rhythm_accuracy": video_analysis.get("rhythm_score", 0.5),
                "timing_precision": video_analysis.get("timing_score", 0.5),
                "finger_technique": video_analysis.get("technique_score", 0.5),
                "musical_expression": video_analysis.get("expression_score", 0.5),
                "tempo_control": video_analysis.get("tempo_consistency", 0.5),
                "dynamics": video_analysis.get("dynamics_score", 0.5)
            }
        
        elif skill_type == "Cooking":
            # Extract cooking technique metrics
            user_metrics = {
                "knife_skills": video_analysis.get("knife_technique_score", 0.5),
                "timing_precision": video_analysis.get("timing_score", 0.5),
                "technique_execution": video_analysis.get("technique_score", 0.5),
                "efficiency": video_analysis.get("efficiency_score", 0.5),
                "safety_awareness": video_analysis.get("safety_score", 0.5),
                "multitasking": video_analysis.get("multitasking_score", 0.5)
            }
        
        elif skill_type == "Dance/Fitness":
            # Extract dance and movement metrics
            user_metrics = {
                "movement_precision": video_analysis.get("movement_score", 0.5),
                "balance": video_analysis.get("balance_score", 0.5),
                "rhythm_accuracy": video_analysis.get("rhythm_score", 0.5),
                "flexibility": video_analysis.get("flexibility_score", 0.5),
                "coordination": video_analysis.get("coordination_score", 0.5)
            }
        
        # Ensure all metrics are between 0 and 1
        for key, value in user_metrics.items():
            user_metrics[key] = max(0.0, min(1.0, float(value)))
        
        return user_metrics
    
    def compare_to_expert(self, user_metrics: Dict[str, float], expert_pattern: Dict[str, float], skill_type: str) -> Tuple[float, Dict[str, Any]]:
        """Compare user metrics to expert pattern and return similarity score with detailed breakdown"""
        
        weights = self.skill_weights.get(skill_type, {})
        if not weights:
            # Default equal weighting if skill type not found
            weights = {key: 1.0/len(user_metrics) for key in user_metrics.keys()}
        
        total_score = 0.0
        metric_comparisons = {}
        
        for metric, user_value in user_metrics.items():
            expert_value = expert_pattern.get(metric, 0.5)
            weight = weights.get(metric, 0.1)
            
            # Calculate similarity (1 - normalized difference)
            difference = abs(user_value - expert_value)
            similarity = 1.0 - difference
            weighted_score = similarity * weight
            
            total_score += weighted_score
            
            metric_comparisons[metric] = {
                "user_value": user_value,
                "expert_value": expert_value,
                "similarity": similarity,
                "weight": weight,
                "weighted_score": weighted_score,
                "gap": expert_value - user_value
            }
        
        comparison_data = {
            "overall_similarity": total_score,
            "metric_breakdown": metric_comparisons,
            "skill_type": skill_type,
            "comparison_timestamp": datetime.utcnow().isoformat()
        }
        
        return total_score, comparison_data
    
    def find_best_expert_matches(self, user_metrics: Dict[str, float], skill_type: str, top_n: int = 3) -> List[Dict[str, Any]]:
        """Find the best expert matches for the user's performance"""
        
        db = SessionLocal()
        try:
            # Get all expert patterns for the skill type
            expert_patterns = db.query(ExpertPattern).filter(
                ExpertPattern.skill_type == skill_type
            ).all()
            
            matches = []
            
            for pattern in expert_patterns:
                expert = db.query(Expert).filter(Expert.id == pattern.expert_id).first()
                if not expert:
                    continue
                
                expert_metrics = json.loads(pattern.pattern_data)
                similarity_score, comparison_data = self.compare_to_expert(
                    user_metrics, expert_metrics, skill_type
                )
                
                match = {
                    "expert_id": expert.id,
                    "expert_name": expert.name,
                    "expert_domain": expert.domain,
                    "expert_biography": expert.biography,
                    "expert_achievements": json.loads(expert.achievements),
                    "similarity_score": similarity_score,
                    "comparison_data": comparison_data,
                    "pattern_confidence": pattern.confidence_score
                }
                
                matches.append(match)
            
            # Sort by similarity score and return top N
            matches.sort(key=lambda x: x["similarity_score"], reverse=True)
            return matches[:top_n]
        
        finally:
            db.close()
    
    def generate_expert_feedback(self, comparison_data: Dict[str, Any], expert_info: Dict[str, Any]) -> Dict[str, Any]:
        """Generate personalized feedback based on expert comparison"""
        
        similarity_score = comparison_data["overall_similarity"]
        metric_breakdown = comparison_data["metric_breakdown"]
        expert_name = expert_info["expert_name"]
        
        feedback = {
            "similarity_to_expert": similarity_score,
            "expert_reference": expert_name,
            "strengths": [],
            "improvement_areas": [],
            "specific_recommendations": [],
            "expert_insights": []
        }
        
        # Analyze each metric
        for metric, data in metric_breakdown.items():
            similarity = data["similarity"]
            gap = data["gap"]
            expert_value = data["expert_value"]
            
            if similarity > 0.8:
                feedback["strengths"].append({
                    "metric": metric,
                    "message": f"Your {metric.replace('_', ' ')} closely matches {expert_name}'s style ({similarity:.1%} similarity)",
                    "expert_level": expert_value
                })
            
            elif gap > 0.2:  # User significantly below expert
                feedback["improvement_areas"].append({
                    "metric": metric,
                    "message": f"Focus on improving {metric.replace('_', ' ')} - {expert_name} excels in this area",
                    "current_level": data["user_value"],
                    "expert_level": expert_value,
                    "gap": gap
                })
                
                # Add specific recommendations
                recommendation = self._get_specific_recommendation(metric, gap, expert_name)
                if recommendation:
                    feedback["specific_recommendations"].append(recommendation)
        
        # Add expert insights
        feedback["expert_insights"] = self._get_expert_insights(expert_info, comparison_data)
        
        return feedback
    
    def save_comparison_result(self, user_id: int, video_id: int, expert_id: int, 
                             similarity_score: float, comparison_data: Dict[str, Any], 
                             feedback: Dict[str, Any]) -> int:
        """Save comparison result to database"""
        
        db = SessionLocal()
        try:
            comparison = UserComparison(
                user_id=user_id,
                video_id=video_id,
                expert_id=expert_id,
                similarity_score=similarity_score,
                comparison_data=json.dumps(comparison_data),
                feedback=json.dumps(feedback)
            )
            
            db.add(comparison)
            db.commit()
            db.refresh(comparison)
            
            return comparison.id
        
        finally:
            db.close()
    
    # Helper methods
    def _calculate_voice_modulation(self, speech_analysis: Dict[str, Any]) -> float:
        """Calculate voice modulation score from speech analysis"""
        # This would use actual speech analysis data
        tone_variation = speech_analysis.get("tone_variation", 0.5)
        pitch_range = speech_analysis.get("pitch_range", 0.5)
        return (tone_variation + pitch_range) / 2
    
    def _calculate_pause_timing(self, speech_analysis: Dict[str, Any]) -> float:
        """Calculate pause timing quality"""
        pause_data = speech_analysis.get("pauses", {})
        frequency = pause_data.get("frequency", 0.5)
        appropriateness = pause_data.get("appropriateness", 0.5)
        return (frequency + appropriateness) / 2
    
    def _normalize_speaking_pace(self, wpm: float) -> float:
        """Normalize speaking pace to 0-1 scale (optimal range 120-180 WPM)"""
        if 120 <= wpm <= 180:
            return 1.0
        elif wpm < 120:
            return max(0.0, wpm / 120)
        else:
            return max(0.0, 1.0 - ((wpm - 180) / 100))
    
    def _calculate_footwork_precision(self, joint_tracking: Dict[str, Any]) -> float:
        """Calculate footwork precision from joint tracking data"""
        # This would analyze ankle and knee joint stability and movement
        ankle_stability = joint_tracking.get("ankle_stability", 0.5)
        knee_alignment = joint_tracking.get("knee_alignment", 0.5)
        return (ankle_stability + knee_alignment) / 2
    
    def _get_specific_recommendation(self, metric: str, gap: float, expert_name: str) -> Dict[str, str]:
        """Get specific recommendations based on metric and expert"""
        
        recommendations = {
            "voice_modulation": f"Practice varying your tone and pitch like {expert_name}. Record yourself and listen for monotone sections.",
            "pause_timing": f"Study {expert_name}'s pause patterns. Practice strategic pauses for emphasis and audience engagement.",
            "gesture_coordination": f"Watch {expert_name}'s hand gestures. Practice coordinating gestures with your key points.",
            "eye_contact": f"Emulate {expert_name}'s eye contact technique. Practice the triangle method: look at different audience sections.",
            "speaking_pace": f"Adjust your speaking pace to match {expert_name}'s rhythm. Practice with a metronome if needed.",
            "footwork_precision": f"Study {expert_name}'s footwork. Focus on balance and weight distribution during movement.",
            "technique_execution": f"Break down {expert_name}'s technique into steps. Practice each component slowly before combining.",
            "rhythm_accuracy": f"Practice with a metronome to match {expert_name}'s rhythmic precision.",
            "knife_skills": f"Study {expert_name}'s knife technique. Focus on grip, posture, and cutting motion.",
            "movement_precision": f"Practice {expert_name}'s movement quality. Focus on control and intention in every gesture."
        }
        
        recommendation = recommendations.get(metric)
        if recommendation:
            return {
                "metric": metric,
                "recommendation": recommendation,
                "difficulty": "intermediate" if gap > 0.3 else "beginner",
                "expected_improvement_time": "2-4 weeks" if gap > 0.3 else "1-2 weeks"
            }
        
        return None
    
    def _get_expert_insights(self, expert_info: Dict[str, Any], comparison_data: Dict[str, Any]) -> List[str]:
        """Get insights about the expert's approach"""
        
        expert_name = expert_info["expert_name"]
        domain = expert_info["expert_domain"]
        
        insights = [
            f"{expert_name} is known for {domain.lower()} excellence with a focus on technical precision",
            f"Key characteristics of {expert_name}'s style include attention to detail and consistent practice",
            f"To develop like {expert_name}, focus on fundamentals before advancing to complex techniques"
        ]
        
        # Add domain-specific insights
        if domain == "Public Speaking":
            insights.append(f"{expert_name}'s speaking style emphasizes clarity, emotional connection, and audience engagement")
        elif domain == "Sports":
            insights.append(f"{expert_name} demonstrates perfect form, timing, and mental focus in athletic performance")
        elif domain == "Music":
            insights.append(f"{expert_name}'s musical approach combines technical mastery with emotional expression")
        elif domain == "Cooking":
            insights.append(f"{expert_name} showcases efficiency, precision, and creativity in culinary techniques")
        
        return insights

# Global instance for use in API
pattern_comparator = PatternComparator()