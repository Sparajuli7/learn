"""
Cross-Domain Skill Transfer Database Schema
Handles skill transfers, progress tracking, and effectiveness feedback
"""

from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from sqlalchemy import create_engine
from datetime import datetime
import json

Base = declarative_base()

class SkillTransfer(Base):
    """
    Defines cross-domain skill transfers with mapping data
    Maps skills from one domain to another with effectiveness tracking
    """
    __tablename__ = "skill_transfers"
    
    id = Column(Integer, primary_key=True, index=True)
    source_skill = Column(String(100), nullable=False)  # e.g., "Boxing"
    target_skill = Column(String(100), nullable=False)  # e.g., "Public Speaking"
    mapping_data = Column(JSON, nullable=False)  # Detailed mapping information
    effectiveness = Column(Float, default=0.0)  # Overall effectiveness score (0-1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    progress_records = relationship("TransferProgress", back_populates="skill_transfer")
    feedback_records = relationship("TransferFeedback", back_populates="skill_transfer")

class TransferProgress(Base):
    """
    Tracks individual user progress through skill transfers
    Monitors completion of steps and overall progress percentage
    """
    __tablename__ = "transfer_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # References users table
    transfer_id = Column(Integer, ForeignKey("skill_transfers.id"), nullable=False)
    progress_percentage = Column(Float, default=0.0)  # 0-100%
    completed_steps = Column(JSON, default=list)  # List of completed step IDs
    current_step = Column(Integer, default=0)  # Current step index
    started_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    is_completed = Column(Boolean, default=False)
    
    # Relationships
    skill_transfer = relationship("SkillTransfer", back_populates="progress_records")
    feedback_records = relationship("TransferFeedback", back_populates="progress_record")

class TransferFeedback(Base):
    """
    Stores user feedback and improvement scores for skill transfers
    Helps track effectiveness and improve transfer algorithms
    """
    __tablename__ = "transfer_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # References users table
    transfer_id = Column(Integer, ForeignKey("skill_transfers.id"), nullable=False)
    progress_id = Column(Integer, ForeignKey("transfer_progress.id"), nullable=True)
    feedback = Column(Text)  # User feedback text
    improvement_score = Column(Float)  # Self-reported improvement (1-10)
    effectiveness_rating = Column(Float)  # Transfer effectiveness (1-5)
    specific_comments = Column(JSON, default=dict)  # Detailed feedback by category
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    skill_transfer = relationship("SkillTransfer", back_populates="feedback_records")
    progress_record = relationship("TransferProgress", back_populates="feedback_records")

class SkillMapping(Base):
    """
    Detailed skill component mappings between domains
    Defines specific component relationships with confidence scores
    """
    __tablename__ = "skill_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("skill_transfers.id"), nullable=False)
    source_component = Column(String(150), nullable=False)  # e.g., "Footwork"
    target_component = Column(String(150), nullable=False)  # e.g., "Stage Presence"
    mapping_strength = Column(Float, default=0.5)  # 0-1 confidence score
    description = Column(Text)  # How the mapping works
    examples = Column(JSON, default=list)  # Practical examples
    difficulty_level = Column(Integer, default=1)  # 1-5 difficulty scale
    estimated_hours = Column(Integer, default=10)  # Hours to master transfer
    
    # Relationships
    skill_transfer = relationship("SkillTransfer")

def create_cross_domain_tables(engine):
    """Create all cross-domain skill transfer tables"""
    Base.metadata.create_all(bind=engine)
    print("✅ Cross-domain skill transfer tables created successfully")

def get_database_session():
    """Get database session for cross-domain operations"""
    engine = create_engine("sqlite:///../01-foundation/backend/skillmirror.db", echo=False)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

# Transfer mapping data structures
CROSS_DOMAIN_MAPPINGS = {
    "Boxing_to_Public_Speaking": {
        "source_skill": "Boxing",
        "target_skill": "Public Speaking",
        "mappings": [
            {
                "source_component": "Footwork",
                "target_component": "Stage Presence",
                "mapping_strength": 0.85,
                "description": "Boxing footwork translates to confident stage movement and positioning",
                "examples": [
                    "Maintain balanced stance -> Stand confidently with weight distributed",
                    "Quick lateral movement -> Move purposefully across stage",
                    "Pivot on balls of feet -> Turn to address different audience sections"
                ],
                "difficulty_level": 2,
                "estimated_hours": 15
            },
            {
                "source_component": "Timing and Rhythm",
                "target_component": "Speech Rhythm",
                "mapping_strength": 0.9,
                "description": "Boxing timing sense transfers to speech pacing and dramatic pauses",
                "examples": [
                    "Reading opponent's rhythm -> Reading audience energy",
                    "Timing combination punches -> Timing key message delivery",
                    "Creating rhythm disruption -> Using strategic pauses for impact"
                ],
                "difficulty_level": 3,
                "estimated_hours": 20
            },
            {
                "source_component": "Mental Focus",
                "target_component": "Audience Engagement",
                "mapping_strength": 0.8,
                "description": "Boxing mental discipline enhances sustained audience connection",
                "examples": [
                    "Maintaining focus under pressure -> Staying composed during tough questions",
                    "Reading opponent reactions -> Reading audience body language",
                    "Strategic thinking mid-fight -> Adapting message based on audience response"
                ],
                "difficulty_level": 4,
                "estimated_hours": 25
            }
        ]
    },
    
    "Coding_to_Cooking": {
        "source_skill": "Coding",
        "target_skill": "Cooking",
        "mappings": [
            {
                "source_component": "Logical Structure",
                "target_component": "Recipe Organization",
                "mapping_strength": 0.9,
                "description": "Code organization principles apply to recipe development and meal planning",
                "examples": [
                    "Function modularity -> Breaking recipes into components",
                    "Code dependencies -> Understanding ingredient interactions",
                    "Error handling -> Troubleshooting cooking problems"
                ],
                "difficulty_level": 2,
                "estimated_hours": 12
            },
            {
                "source_component": "Debugging Skills",
                "target_component": "Taste Testing",
                "mapping_strength": 0.85,
                "description": "Systematic debugging translates to iterative taste refinement",
                "examples": [
                    "Isolating bugs -> Identifying specific flavor issues",
                    "Testing edge cases -> Trying recipe variations",
                    "Performance optimization -> Balancing flavors and textures"
                ],
                "difficulty_level": 3,
                "estimated_hours": 18
            },
            {
                "source_component": "Version Control",
                "target_component": "Recipe Iteration",
                "mapping_strength": 0.75,
                "description": "Code versioning principles improve recipe development tracking",
                "examples": [
                    "Commit messages -> Documenting recipe changes",
                    "Branching -> Trying alternative ingredient combinations",
                    "Merging -> Combining successful recipe elements"
                ],
                "difficulty_level": 2,
                "estimated_hours": 10
            }
        ]
    },
    
    "Music_to_Business": {
        "source_skill": "Music",
        "target_skill": "Business",
        "mappings": [
            {
                "source_component": "Rhythm and Timing",
                "target_component": "Market Timing",
                "mapping_strength": 0.8,
                "description": "Musical timing sense enhances business opportunity recognition",
                "examples": [
                    "Feeling the beat -> Sensing market rhythms",
                    "Tempo changes -> Adapting to market pace",
                    "Syncopation -> Finding unique market entry points"
                ],
                "difficulty_level": 4,
                "estimated_hours": 30
            },
            {
                "source_component": "Harmony and Arrangement",
                "target_component": "Team Collaboration",
                "mapping_strength": 0.85,
                "description": "Musical harmony principles improve team dynamics and leadership",
                "examples": [
                    "Balancing instruments -> Balancing team roles",
                    "Creating musical tension -> Managing productive conflict",
                    "Ensemble coordination -> Team synchronization"
                ],
                "difficulty_level": 3,
                "estimated_hours": 25
            },
            {
                "source_component": "Improvisation",
                "target_component": "Strategic Adaptation",
                "mapping_strength": 0.9,
                "description": "Musical improvisation skills enhance business agility and problem-solving",
                "examples": [
                    "Real-time adaptation -> Responding to market changes",
                    "Building on themes -> Developing core business strategies",
                    "Reading the room -> Adapting pitch to audience"
                ],
                "difficulty_level": 5,
                "estimated_hours": 35
            }
        ]
    }
}

def populate_initial_transfers():
    """Populate database with initial cross-domain transfer mappings"""
    db = get_database_session()
    
    try:
        # Clear existing data for fresh start
        db.query(SkillMapping).delete()
        db.query(SkillTransfer).delete()
        db.commit()
        
        for transfer_key, transfer_data in CROSS_DOMAIN_MAPPINGS.items():
            # Create skill transfer record
            skill_transfer = SkillTransfer(
                source_skill=transfer_data["source_skill"],
                target_skill=transfer_data["target_skill"],
                mapping_data=transfer_data,
                effectiveness=0.75  # Initial effectiveness estimate
            )
            db.add(skill_transfer)
            db.flush()  # Get the ID
            
            # Create detailed skill mappings
            for mapping in transfer_data["mappings"]:
                skill_mapping = SkillMapping(
                    transfer_id=skill_transfer.id,
                    source_component=mapping["source_component"],
                    target_component=mapping["target_component"],
                    mapping_strength=mapping["mapping_strength"],
                    description=mapping["description"],
                    examples=mapping["examples"],
                    difficulty_level=mapping["difficulty_level"],
                    estimated_hours=mapping["estimated_hours"]
                )
                db.add(skill_mapping)
        
        db.commit()
        print("✅ Initial cross-domain transfer mappings populated successfully")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error populating transfer mappings: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Initialize database and populate initial data
    engine = create_engine("sqlite:///../01-foundation/backend/skillmirror.db", echo=True)
    create_cross_domain_tables(engine)
    populate_initial_transfers()