from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import sqlite3
import os

# SQLite database setup
DATABASE_URL = "sqlite:///./skillmirror.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    videos = relationship("Video", back_populates="user")

class Video(Base):
    __tablename__ = "videos"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    file_path = Column(String, nullable=False)
    skill_type = Column(String, nullable=False)
    duration = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="videos")
    analysis_results = relationship("AnalysisResult", back_populates="video")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    analysis_data = Column(Text, nullable=False)  # JSON string
    feedback = Column(Text, nullable=False)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    video = relationship("Video", back_populates="analysis_results")

class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    category = Column(String, nullable=False)
    expert_patterns = Column(Text, nullable=False)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Initialize default skills
def init_default_skills():
    db = SessionLocal()
    try:
        # Check if skills already exist
        if db.query(Skill).count() > 0:
            return
        
        default_skills = [
            {
                "name": "Public Speaking",
                "category": "communication",
                "expert_patterns": '{"confidence_markers": ["steady_voice", "eye_contact", "hand_gestures"], "pace_range": [120, 180], "pause_frequency": "optimal"}'
            },
            {
                "name": "Dance/Fitness",
                "category": "movement",
                "expert_patterns": '{"joint_stability": ["hip", "knee", "ankle"], "rhythm_accuracy": 0.95, "movement_fluidity": "high"}'
            },
            {
                "name": "Cooking",
                "category": "technique",
                "expert_patterns": '{"knife_skills": ["grip", "posture", "speed"], "timing_precision": 0.9, "efficiency_score": "high"}'
            },
            {
                "name": "Music/Instrument",
                "category": "creative",
                "expert_patterns": '{"rhythm_consistency": 0.98, "technique_markers": ["finger_position", "posture"], "timing_accuracy": 0.95}'
            },
            {
                "name": "Sports/Athletics",
                "category": "physical",
                "expert_patterns": '{"form_analysis": ["posture", "balance", "coordination"], "performance_metrics": ["speed", "accuracy", "endurance"]}'
            }
        ]
        
        for skill_data in default_skills:
            skill = Skill(**skill_data)
            db.add(skill)
        
        db.commit()
    finally:
        db.close()

if __name__ == "__main__":
    create_tables()
    init_default_skills()
    print("Database initialized successfully!")