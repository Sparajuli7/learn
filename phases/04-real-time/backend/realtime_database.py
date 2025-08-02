"""
Real-Time Feedback Database Schema
Handles real-time feedback sessions, improvement suggestions, and performance metrics
"""

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy import create_engine
from datetime import datetime
import json
import os

Base = declarative_base()

class FeedbackSession(Base):
    """
    Tracks real-time feedback sessions with instant analysis data
    Stores feedback generated during live video recording/analysis
    """
    __tablename__ = "feedback_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # References users table
    skill_type = Column(String(100), nullable=False)  # e.g., "Public Speaking", "Dance"
    session_duration = Column(Float, default=0.0)  # Duration in seconds
    feedback_data = Column(JSON, nullable=False)  # Real-time feedback analysis
    improvement_score = Column(Float, default=0.0)  # Overall improvement score (0-100)
    analysis_timestamp = Column(DateTime, default=datetime.utcnow)
    session_start = Column(DateTime, default=datetime.utcnow)
    session_end = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)  # Whether session is currently active
    
    # Relationships
    suggestions = relationship("ImprovementSuggestion", back_populates="feedback_session")
    metrics = relationship("PerformanceMetric", back_populates="feedback_session")

class ImprovementSuggestion(Base):
    """
    Stores specific, actionable improvement suggestions generated in real-time
    Provides instant feedback with priority-based recommendations
    """
    __tablename__ = "improvement_suggestions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("feedback_sessions.id"), nullable=False)
    user_id = Column(Integer, nullable=False)  # References users table
    suggestion_type = Column(String(100), nullable=False)  # e.g., "posture", "speech_pace", "movement"
    content = Column(Text, nullable=False)  # The actual suggestion text
    priority = Column(String(20), default="medium")  # "high", "medium", "low"
    category = Column(String(50), nullable=False)  # "movement", "speech", "timing", "technique"
    confidence_score = Column(Float, default=0.0)  # AI confidence in suggestion (0-1)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_implemented = Column(Boolean, default=False)  # Whether user acted on suggestion
    effectiveness = Column(Float, nullable=True)  # User feedback on suggestion effectiveness
    
    # Relationships
    feedback_session = relationship("FeedbackSession", back_populates="suggestions")

class PerformanceMetric(Base):
    """
    Tracks detailed performance metrics during real-time sessions
    Provides quantitative data for progress tracking and analytics
    """
    __tablename__ = "performance_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("feedback_sessions.id"), nullable=False)
    user_id = Column(Integer, nullable=False)  # References users table
    skill_type = Column(String(100), nullable=False)
    metric_name = Column(String(100), nullable=False)  # e.g., "posture_stability", "speech_pace"
    value = Column(Float, nullable=False)  # The metric value
    unit = Column(String(50), nullable=True)  # e.g., "degrees", "words_per_minute", "percentage"
    timestamp = Column(DateTime, default=datetime.utcnow)
    measurement_window = Column(Float, default=1.0)  # Time window for measurement in seconds
    baseline_value = Column(Float, nullable=True)  # Baseline comparison value
    improvement_delta = Column(Float, nullable=True)  # Improvement from baseline
    target_value = Column(Float, nullable=True)  # Target value for this metric
    
    # Relationships
    feedback_session = relationship("FeedbackSession", back_populates="metrics")

class RealTimeProgress(Base):
    """
    Tracks progress and improvement over multiple real-time sessions
    Provides long-term analytics and progress visualization
    """
    __tablename__ = "realtime_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # References users table
    skill_type = Column(String(100), nullable=False)
    total_sessions = Column(Integer, default=0)
    total_practice_time = Column(Float, default=0.0)  # Total time in seconds
    average_improvement_score = Column(Float, default=0.0)
    best_session_score = Column(Float, default=0.0)
    progress_trend = Column(String(20), default="stable")  # "improving", "declining", "stable"
    key_strengths = Column(JSON, default=list)  # List of identified strengths
    improvement_areas = Column(JSON, default=list)  # List of areas needing work
    last_session_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Database configuration
DATABASE_URL = "sqlite:///./phases/04-real-time/realtime_feedback.db"

def get_engine():
    """Create database engine"""
    os.makedirs("phases/04-real-time", exist_ok=True)
    return create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

def get_session_maker():
    """Create session maker"""
    engine = get_engine()
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_database_session():
    """Database dependency for API endpoints"""
    SessionLocal = get_session_maker()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_realtime_tables():
    """Create all real-time feedback tables"""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    print("✅ Real-time feedback database tables created successfully")

def init_realtime_database():
    """Initialize the real-time feedback database with sample data"""
    SessionLocal = get_session_maker()
    db = SessionLocal()
    try:
        create_realtime_tables()
        
        # Check if data already exists
        if db.query(FeedbackSession).count() > 0:
            print("ℹ️ Real-time database already initialized")
            return
        
        # Create sample feedback session for demonstration
        sample_session = FeedbackSession(
            user_id=1,
            skill_type="Public Speaking",
            session_duration=120.0,  # 2 minutes
            feedback_data={
                "overall_score": 75.0,
                "movement_analysis": {
                    "posture_stability": 80.0,
                    "gesture_frequency": 12,
                    "eye_contact_percentage": 70.0
                },
                "speech_analysis": {
                    "pace_words_per_minute": 145,
                    "pause_frequency": 8,
                    "volume_consistency": 85.0,
                    "confidence_score": 78.0
                },
                "timing_analysis": {
                    "rhythm_consistency": 82.0,
                    "transition_smoothness": 75.0
                }
            },
            improvement_score=75.0,
            is_active=False
        )
        db.add(sample_session)
        db.commit()
        db.refresh(sample_session)
        
        # Add sample improvement suggestions
        suggestions = [
            ImprovementSuggestion(
                session_id=sample_session.id,
                user_id=1,
                suggestion_type="posture",
                content="Try standing with your feet shoulder-width apart for better stability. This will improve your overall presence.",
                priority="high",
                category="movement",
                confidence_score=0.9
            ),
            ImprovementSuggestion(
                session_id=sample_session.id,
                user_id=1,
                suggestion_type="speech_pace",
                content="Slow down slightly - aim for 130-140 words per minute for better audience comprehension.",
                priority="medium",
                category="speech",
                confidence_score=0.85
            ),
            ImprovementSuggestion(
                session_id=sample_session.id,
                user_id=1,
                suggestion_type="eye_contact",
                content="Increase eye contact with the audience. Try looking at different sections for 3-5 seconds each.",
                priority="high",
                category="movement",
                confidence_score=0.88
            )
        ]
        
        for suggestion in suggestions:
            db.add(suggestion)
        
        # Add sample performance metrics
        metrics = [
            PerformanceMetric(
                session_id=sample_session.id,
                user_id=1,
                skill_type="Public Speaking",
                metric_name="posture_stability",
                value=80.0,
                unit="percentage",
                baseline_value=65.0,
                improvement_delta=15.0,
                target_value=90.0
            ),
            PerformanceMetric(
                session_id=sample_session.id,
                user_id=1,
                skill_type="Public Speaking",
                metric_name="speech_pace",
                value=145.0,
                unit="words_per_minute",
                baseline_value=160.0,
                improvement_delta=-15.0,
                target_value=135.0
            ),
            PerformanceMetric(
                session_id=sample_session.id,
                user_id=1,
                skill_type="Public Speaking",
                metric_name="confidence_score",
                value=78.0,
                unit="percentage",
                baseline_value=70.0,
                improvement_delta=8.0,
                target_value=85.0
            )
        ]
        
        for metric in metrics:
            db.add(metric)
        
        # Add sample progress tracking
        progress = RealTimeProgress(
            user_id=1,
            skill_type="Public Speaking",
            total_sessions=1,
            total_practice_time=120.0,
            average_improvement_score=75.0,
            best_session_score=75.0,
            progress_trend="improving",
            key_strengths=["confident_voice", "good_gestures"],
            improvement_areas=["eye_contact", "speech_pace"],
            last_session_date=datetime.utcnow()
        )
        db.add(progress)
        
        db.commit()
        print("✅ Real-time feedback database initialized with sample data")
        
    except Exception as e:
        print(f"❌ Error initializing real-time database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_realtime_database()