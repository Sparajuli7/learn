"""
Core Skill Transfer Engine
Analyzes user skills and generates cross-domain transfer recommendations
"""

import json
import math
from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from cross_domain_database import (
    SkillTransfer, TransferProgress, TransferFeedback, SkillMapping,
    get_database_session, CROSS_DOMAIN_MAPPINGS
)

class SkillTransferEngine:
    """Main engine for cross-domain skill transfer analysis and recommendations"""
    
    def __init__(self):
        self.db = get_database_session()
        self.min_similarity_threshold = 0.3
        self.max_recommendations = 5
        
    def analyze_skill_compatibility(self, source_skill: str, target_skill: str) -> float:
        """
        Analyze compatibility between two skills
        Returns compatibility score (0-1)
        """
        # Get transfer mapping if exists
        transfer = self.db.query(SkillTransfer).filter(
            SkillTransfer.source_skill == source_skill,
            SkillTransfer.target_skill == target_skill
        ).first()
        
        if transfer:
            return transfer.effectiveness
        
        # Calculate compatibility based on skill characteristics
        skill_characteristics = {
            "Boxing": {"physical": 0.9, "mental": 0.8, "timing": 0.9, "coordination": 0.9},
            "Public Speaking": {"physical": 0.3, "mental": 0.9, "timing": 0.8, "coordination": 0.4},
            "Coding": {"physical": 0.1, "mental": 0.9, "timing": 0.6, "coordination": 0.3},
            "Cooking": {"physical": 0.6, "mental": 0.7, "timing": 0.8, "coordination": 0.8},
            "Music": {"physical": 0.7, "mental": 0.8, "timing": 0.9, "coordination": 0.9},
            "Business": {"physical": 0.2, "mental": 0.9, "timing": 0.7, "coordination": 0.6}
        }
        
        source_chars = skill_characteristics.get(source_skill, {})
        target_chars = skill_characteristics.get(target_skill, {})
        
        if not source_chars or not target_chars:
            return 0.0
        
        # Calculate weighted similarity
        total_similarity = 0.0
        weight_sum = 0.0
        weights = {"mental": 0.4, "timing": 0.3, "coordination": 0.2, "physical": 0.1}
        
        for characteristic, weight in weights.items():
            if characteristic in source_chars and characteristic in target_chars:
                similarity = 1 - abs(source_chars[characteristic] - target_chars[characteristic])
                total_similarity += similarity * weight
                weight_sum += weight
        
        return total_similarity / weight_sum if weight_sum > 0 else 0.0
    
    def get_transfer_recommendations(self, user_skills: List[str], target_skill: str = None) -> List[Dict]:
        """
        Get cross-domain transfer recommendations for a user
        """
        recommendations = []
        
        # Get all available transfers
        available_transfers = self.db.query(SkillTransfer).all()
        
        for transfer in available_transfers:
            # Check if user has the source skill
            if transfer.source_skill in user_skills:
                # Skip if target skill specified and doesn't match
                if target_skill and transfer.target_skill != target_skill:
                    continue
                
                # Get detailed mappings
                mappings = self.db.query(SkillMapping).filter(
                    SkillMapping.transfer_id == transfer.id
                ).all()
                
                # Calculate recommendation strength
                avg_mapping_strength = sum(m.mapping_strength for m in mappings) / len(mappings) if mappings else 0
                recommendation_score = (transfer.effectiveness * 0.6) + (avg_mapping_strength * 0.4)
                
                # Check if meets minimum threshold
                if recommendation_score >= self.min_similarity_threshold:
                    # Calculate estimated learning time
                    total_hours = sum(m.estimated_hours for m in mappings)
                    avg_difficulty = sum(m.difficulty_level for m in mappings) / len(mappings) if mappings else 1
                    
                    recommendations.append({
                        "transfer_id": transfer.id,
                        "source_skill": transfer.source_skill,
                        "target_skill": transfer.target_skill,
                        "recommendation_score": recommendation_score,
                        "effectiveness": transfer.effectiveness,
                        "total_estimated_hours": total_hours,
                        "average_difficulty": round(avg_difficulty, 1),
                        "num_mappings": len(mappings),
                        "key_mappings": [
                            {
                                "source": m.source_component,
                                "target": m.target_component,
                                "strength": m.mapping_strength,
                                "description": m.description
                            }
                            for m in sorted(mappings, key=lambda x: x.mapping_strength, reverse=True)[:3]
                        ],
                        "learning_path": self._generate_learning_path(transfer, mappings)
                    })
        
        # Sort by recommendation score and limit results
        recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)
        return recommendations[:self.max_recommendations]
    
    def _generate_learning_path(self, transfer: SkillTransfer, mappings: List[SkillMapping]) -> Dict:
        """Generate a structured learning path for a skill transfer"""
        # Sort mappings by difficulty
        sorted_mappings = sorted(mappings, key=lambda x: x.difficulty_level)
        
        phases = []
        cumulative_hours = 0
        
        for i, mapping in enumerate(sorted_mappings):
            cumulative_hours += mapping.estimated_hours
            
            phase = {
                "phase_number": i + 1,
                "title": f"Master {mapping.target_component}",
                "description": mapping.description,
                "source_skill": mapping.source_component,
                "target_skill": mapping.target_component,
                "difficulty": mapping.difficulty_level,
                "estimated_hours": mapping.estimated_hours,
                "cumulative_hours": cumulative_hours,
                "exercises": self._generate_exercises(mapping),
                "success_criteria": self._generate_success_criteria(mapping)
            }
            phases.append(phase)
        
        return {
            "total_phases": len(phases),
            "total_hours": cumulative_hours,
            "estimated_weeks": math.ceil(cumulative_hours / 10),  # Assuming 10 hours per week
            "phases": phases,
            "completion_milestones": [25, 50, 75, 100]  # Percentage milestones
        }
    
    def _generate_exercises(self, mapping: SkillMapping) -> List[Dict]:
        """Generate practice exercises for a skill mapping"""
        exercises = []
        
        # Base exercises for each mapping type
        exercise_templates = {
            "Footwork_Stage_Presence": [
                {
                    "title": "Shadow Boxing Presentation",
                    "description": "Practice presentation while doing basic footwork drills",
                    "duration": 15,
                    "difficulty": 2
                },
                {
                    "title": "Stage Movement Patterns",
                    "description": "Apply boxing footwork principles to stage movement",
                    "duration": 20,
                    "difficulty": 3
                }
            ],
            "default": [
                {
                    "title": f"Practice {mapping.target_component} Basics",
                    "description": f"Apply {mapping.source_component} principles to {mapping.target_component}",
                    "duration": 15,
                    "difficulty": mapping.difficulty_level
                },
                {
                    "title": f"Advanced {mapping.target_component} Integration",
                    "description": f"Master advanced concepts from {mapping.source_component}",
                    "duration": 30,
                    "difficulty": mapping.difficulty_level + 1
                }
            ]
        }
        
        # Use specific template if available, otherwise use default
        template_key = f"{mapping.source_component}_{mapping.target_component}".replace(" ", "_")
        template = exercise_templates.get(template_key, exercise_templates["default"])
        
        for exercise in template:
            exercises.append({
                **exercise,
                "mapping_id": mapping.id,
                "examples": mapping.examples[:2] if mapping.examples else []
            })
        
        return exercises
    
    def _generate_success_criteria(self, mapping: SkillMapping) -> List[str]:
        """Generate success criteria for mastering a skill mapping"""
        criteria = [
            f"Demonstrate understanding of how {mapping.source_component} applies to {mapping.target_component}",
            f"Successfully execute {mapping.target_component} using {mapping.source_component} principles",
            f"Show consistent improvement in {mapping.target_component} performance"
        ]
        
        # Add specific criteria based on examples
        if mapping.examples:
            criteria.append(f"Apply at least 2 of the example techniques: {', '.join(mapping.examples[:2])}")
        
        return criteria
    
    def start_transfer_journey(self, user_id: int, transfer_id: int) -> Dict:
        """Start a new skill transfer journey for a user"""
        # Check if user already has progress on this transfer
        existing_progress = self.db.query(TransferProgress).filter(
            TransferProgress.user_id == user_id,
            TransferProgress.transfer_id == transfer_id
        ).first()
        
        if existing_progress:
            return {
                "status": "resumed",
                "progress_id": existing_progress.id,
                "current_progress": existing_progress.progress_percentage,
                "current_step": existing_progress.current_step
            }
        
        # Create new progress record
        new_progress = TransferProgress(
            user_id=user_id,
            transfer_id=transfer_id,
            progress_percentage=0.0,
            completed_steps=[],
            current_step=0
        )
        
        self.db.add(new_progress)
        self.db.commit()
        
        return {
            "status": "started",
            "progress_id": new_progress.id,
            "current_progress": 0.0,
            "current_step": 0
        }
    
    def update_progress(self, progress_id: int, step_completed: int, feedback: str = None) -> Dict:
        """Update user progress on a skill transfer journey"""
        progress = self.db.query(TransferProgress).filter(
            TransferProgress.id == progress_id
        ).first()
        
        if not progress:
            return {"error": "Progress record not found"}
        
        # Update completed steps
        if step_completed not in progress.completed_steps:
            progress.completed_steps.append(step_completed)
        
        # Get total steps for this transfer
        total_mappings = self.db.query(SkillMapping).filter(
            SkillMapping.transfer_id == progress.transfer_id
        ).count()
        
        # Calculate progress percentage
        progress.progress_percentage = (len(progress.completed_steps) / total_mappings) * 100 if total_mappings > 0 else 0
        progress.current_step = max(progress.completed_steps) if progress.completed_steps else 0
        progress.last_activity = datetime.utcnow()
        
        # Check if completed
        if progress.progress_percentage >= 100:
            progress.is_completed = True
        
        # Add feedback if provided
        if feedback:
            transfer_feedback = TransferFeedback(
                user_id=progress.user_id,
                transfer_id=progress.transfer_id,
                progress_id=progress.id,
                feedback=feedback,
                created_at=datetime.utcnow()
            )
            self.db.add(transfer_feedback)
        
        self.db.commit()
        
        return {
            "progress_percentage": progress.progress_percentage,
            "current_step": progress.current_step,
            "is_completed": progress.is_completed,
            "completed_steps": progress.completed_steps
        }
    
    def get_transfer_analytics(self, transfer_id: int) -> Dict:
        """Get analytics for a specific skill transfer"""
        transfer = self.db.query(SkillTransfer).filter(
            SkillTransfer.id == transfer_id
        ).first()
        
        if not transfer:
            return {"error": "Transfer not found"}
        
        # Get all progress records
        progress_records = self.db.query(TransferProgress).filter(
            TransferProgress.transfer_id == transfer_id
        ).all()
        
        # Get all feedback
        feedback_records = self.db.query(TransferFeedback).filter(
            TransferFeedback.transfer_id == transfer_id
        ).all()
        
        # Calculate analytics
        total_users = len(progress_records)
        completed_users = len([p for p in progress_records if p.is_completed])
        avg_progress = sum(p.progress_percentage for p in progress_records) / total_users if total_users > 0 else 0
        
        # Feedback analytics
        improvement_scores = [f.improvement_score for f in feedback_records if f.improvement_score]
        avg_improvement = sum(improvement_scores) / len(improvement_scores) if improvement_scores else 0
        
        effectiveness_ratings = [f.effectiveness_rating for f in feedback_records if f.effectiveness_rating]
        avg_effectiveness = sum(effectiveness_ratings) / len(effectiveness_ratings) if effectiveness_ratings else 0
        
        return {
            "transfer_info": {
                "source_skill": transfer.source_skill,
                "target_skill": transfer.target_skill,
                "effectiveness": transfer.effectiveness
            },
            "usage_stats": {
                "total_users": total_users,
                "completed_users": completed_users,
                "completion_rate": (completed_users / total_users * 100) if total_users > 0 else 0,
                "average_progress": round(avg_progress, 1)
            },
            "feedback_stats": {
                "total_feedback": len(feedback_records),
                "average_improvement_score": round(avg_improvement, 1),
                "average_effectiveness_rating": round(avg_effectiveness, 1)
            }
        }
    
    def get_user_transfers(self, user_id: int) -> List[Dict]:
        """Get all transfers for a specific user"""
        progress_records = self.db.query(TransferProgress).filter(
            TransferProgress.user_id == user_id
        ).all()
        
        user_transfers = []
        for progress in progress_records:
            transfer = self.db.query(SkillTransfer).filter(
                SkillTransfer.id == progress.transfer_id
            ).first()
            
            if transfer:
                user_transfers.append({
                    "progress_id": progress.id,
                    "transfer_id": transfer.id,
                    "source_skill": transfer.source_skill,
                    "target_skill": transfer.target_skill,
                    "progress_percentage": progress.progress_percentage,
                    "current_step": progress.current_step,
                    "is_completed": progress.is_completed,
                    "started_at": progress.started_at,
                    "last_activity": progress.last_activity
                })
        
        return user_transfers
    
    def close(self):
        """Close database connection"""
        self.db.close()

# Utility functions for quick access
def get_quick_recommendations(user_skills: List[str]) -> List[Dict]:
    """Quick function to get transfer recommendations"""
    engine = SkillTransferEngine()
    try:
        return engine.get_transfer_recommendations(user_skills)
    finally:
        engine.close()

def start_user_transfer(user_id: int, transfer_id: int) -> Dict:
    """Quick function to start a transfer for a user"""
    engine = SkillTransferEngine()
    try:
        return engine.start_transfer_journey(user_id, transfer_id)
    finally:
        engine.close()

if __name__ == "__main__":
    # Test the engine
    engine = SkillTransferEngine()
    
    # Test recommendations
    recommendations = engine.get_transfer_recommendations(["Boxing", "Music"])
    print("Recommendations:", json.dumps(recommendations, indent=2, default=str))
    
    engine.close()