from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json

# Import base from the foundation
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '01-foundation', 'backend'))
from database import Base, SessionLocal

# New Expert Pattern Models
class Expert(Base):
    __tablename__ = "experts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    domain = Column(String, nullable=False)  # Public Speaking, Sports, Music, etc.
    biography = Column(Text, nullable=True)
    achievements = Column(Text, nullable=False)  # JSON string
    pattern_data = Column(Text, nullable=False)  # JSON string with expert patterns
    video_url = Column(String, nullable=True)  # Optional reference video
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    expert_patterns = relationship("ExpertPattern", back_populates="expert")
    user_comparisons = relationship("UserComparison", back_populates="expert")

class ExpertPattern(Base):
    __tablename__ = "expert_patterns"
    
    id = Column(Integer, primary_key=True, index=True)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False)
    skill_type = Column(String, nullable=False)  # Specific skill within domain
    pattern_data = Column(Text, nullable=False)  # JSON with detailed pattern metrics
    confidence_score = Column(Float, default=1.0)  # How confident we are in this pattern
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    expert = relationship("Expert", back_populates="expert_patterns")

class UserComparison(Base):
    __tablename__ = "user_comparisons"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expert_id = Column(Integer, ForeignKey("experts.id"), nullable=False)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)  # 0.0 to 1.0
    comparison_data = Column(Text, nullable=False)  # JSON with detailed comparison
    feedback = Column(Text, nullable=False)  # JSON with personalized feedback
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    expert = relationship("Expert", back_populates="user_comparisons")

# Expert data initialization
EXPERT_DATA = [
    # Public Speaking Experts
    {
        "name": "Martin Luther King Jr.",
        "domain": "Public Speaking",
        "biography": "Civil rights leader known for powerful, inspiring speeches",
        "achievements": '["I Have a Dream speech", "Nobel Peace Prize", "Changed civil rights through oratory"]',
        "pattern_data": '{"voice_modulation": 0.9, "pause_timing": 0.95, "gesture_coordination": 0.9, "emotional_resonance": 0.95, "eye_contact": 0.85, "speaking_pace": 140}',
        "video_url": "https://example.com/mlk-speech"
    },
    {
        "name": "Barack Obama",
        "domain": "Public Speaking", 
        "biography": "44th President known for eloquent and inspiring speeches",
        "achievements": '["Presidential speeches", "Harvard Law Review", "Nobel Peace Prize"]',
        "pattern_data": '{"voice_modulation": 0.85, "pause_timing": 0.9, "gesture_coordination": 0.85, "emotional_resonance": 0.9, "eye_contact": 0.9, "speaking_pace": 160}',
        "video_url": "https://example.com/obama-speech"
    },
    {
        "name": "Steve Jobs",
        "domain": "Public Speaking",
        "biography": "Apple CEO known for revolutionary product presentations",
        "achievements": '["iPhone launch", "Macintosh introduction", "Stanford commencement"]',
        "pattern_data": '{"voice_modulation": 0.8, "pause_timing": 0.85, "gesture_coordination": 0.95, "emotional_resonance": 0.85, "eye_contact": 0.95, "speaking_pace": 150}',
        "video_url": "https://example.com/jobs-keynote"
    },
    {
        "name": "Tony Robbins",
        "domain": "Public Speaking",
        "biography": "Motivational speaker and life coach",
        "achievements": '["Unleash the Power Within", "TED Talks", "Life coaching millions"]',
        "pattern_data": '{"voice_modulation": 0.95, "pause_timing": 0.8, "gesture_coordination": 0.9, "emotional_resonance": 0.95, "eye_contact": 0.85, "speaking_pace": 180}',
        "video_url": "https://example.com/robbins-seminar"
    },
    
    # Sports Experts
    {
        "name": "Muhammad Ali",
        "domain": "Sports",
        "biography": "Boxing legend known for technique and showmanship",
        "achievements": '["3x Heavyweight Champion", "Olympic Gold Medal", "Fighter of the Century"]',
        "pattern_data": '{"footwork_precision": 0.95, "punch_technique": 0.9, "defensive_movement": 0.9, "timing": 0.95, "balance": 0.9, "coordination": 0.95}',
        "video_url": "https://example.com/ali-boxing"
    },
    {
        "name": "Michael Jordan",
        "domain": "Sports",
        "biography": "Basketball legend with unmatched competitive drive",
        "achievements": '["6 NBA Championships", "5 MVP Awards", "Basketball Hall of Fame"]',
        "pattern_data": '{"shooting_form": 0.95, "footwork_precision": 0.9, "defensive_stance": 0.85, "timing": 0.9, "balance": 0.9, "coordination": 0.95}',
        "video_url": "https://example.com/jordan-highlights"
    },
    {
        "name": "Serena Williams",
        "domain": "Sports", 
        "biography": "Tennis champion with powerful serve and mental strength",
        "achievements": '["23 Grand Slam titles", "Olympic Gold Medals", "Tennis Hall of Fame"]',
        "pattern_data": '{"serve_technique": 0.95, "footwork_precision": 0.9, "backhand_form": 0.9, "timing": 0.9, "balance": 0.95, "coordination": 0.9}',
        "video_url": "https://example.com/serena-tennis"
    },
    
    # Music Experts
    {
        "name": "Wolfgang Amadeus Mozart",
        "domain": "Music",
        "biography": "Classical composer with perfect pitch and musical genius",
        "achievements": '["600+ compositions", "Child prodigy", "Classical music mastery"]',
        "pattern_data": '{"rhythm_accuracy": 0.98, "timing_precision": 0.95, "finger_technique": 0.95, "musical_expression": 0.95, "tempo_control": 0.9, "dynamics": 0.95}',
        "video_url": "https://example.com/mozart-performance"
    },
    {
        "name": "Ludwig van Beethoven",
        "domain": "Music",
        "biography": "Composer who revolutionized classical music",
        "achievements": '["9 Symphonies", "32 Piano Sonatas", "Musical innovation"]',
        "pattern_data": '{"rhythm_accuracy": 0.9, "timing_precision": 0.85, "finger_technique": 0.9, "musical_expression": 0.98, "tempo_control": 0.85, "dynamics": 0.95}',
        "video_url": "https://example.com/beethoven-performance"
    },
    {
        "name": "Yo-Yo Ma",
        "domain": "Music",
        "biography": "World-renowned cellist with perfect technique",
        "achievements": '["19 Grammy Awards", "Presidential Medal of Freedom", "Bach Cello Suites"]',
        "pattern_data": '{"rhythm_accuracy": 0.95, "timing_precision": 0.95, "bow_technique": 0.98, "musical_expression": 0.95, "tempo_control": 0.95, "dynamics": 0.9}',
        "video_url": "https://example.com/yoyoma-cello"
    },
    
    # Business/Leadership Experts
    {
        "name": "Elon Musk",
        "domain": "Business",
        "biography": "Entrepreneur and innovator leading multiple companies",
        "achievements": '["Tesla CEO", "SpaceX Founder", "PayPal co-founder"]',
        "pattern_data": '{"presentation_clarity": 0.8, "technical_depth": 0.95, "vision_communication": 0.9, "confidence": 0.85, "innovation_focus": 0.98, "audience_engagement": 0.7}',
        "video_url": "https://example.com/musk-presentation"
    },
    {
        "name": "Warren Buffett",
        "domain": "Business",
        "biography": "Investment genius and business leader",
        "achievements": '["Berkshire Hathaway CEO", "Oracle of Omaha", "Billionaire investor"]',
        "pattern_data": '{"presentation_clarity": 0.95, "storytelling": 0.9, "wisdom_sharing": 0.95, "confidence": 0.9, "simplicity": 0.95, "audience_engagement": 0.85}',
        "video_url": "https://example.com/buffett-shareholder"
    },
    {
        "name": "Oprah Winfrey",
        "domain": "Business",
        "biography": "Media mogul and influential communicator",
        "achievements": '["The Oprah Winfrey Show", "Media empire", "Philanthropist"]',
        "pattern_data": '{"emotional_connection": 0.98, "storytelling": 0.95, "empathy": 0.95, "confidence": 0.9, "authenticity": 0.95, "audience_engagement": 0.98}',
        "video_url": "https://example.com/oprah-interview"
    },
    
    # Cooking Experts
    {
        "name": "Gordon Ramsay",
        "domain": "Cooking",
        "biography": "Michelin-starred chef known for technique and precision",
        "achievements": '["7 Michelin Stars", "Multiple restaurants", "TV cooking shows"]',
        "pattern_data": '{"knife_skills": 0.98, "timing_precision": 0.95, "technique_execution": 0.95, "efficiency": 0.9, "plating_artistry": 0.9, "multitasking": 0.95}',
        "video_url": "https://example.com/ramsay-cooking"
    },
    {
        "name": "Julia Child",
        "domain": "Cooking",
        "biography": "Chef who brought French cooking to American kitchens",
        "achievements": '["Mastering the Art of French Cooking", "Culinary pioneer", "TV cooking shows"]',
        "pattern_data": '{"technique_clarity": 0.95, "teaching_ability": 0.98, "patience": 0.9, "precision": 0.85, "enthusiasm": 0.95, "technique_demonstration": 0.9}',
        "video_url": "https://example.com/child-cooking"
    },
    
    # Dance/Fitness Experts
    {
        "name": "Mikhail Baryshnikov",
        "domain": "Dance",
        "biography": "Ballet dancer known for perfect technique and artistry",
        "achievements": '["Principal dancer", "Ballet mastery", "Artistic excellence"]',
        "pattern_data": '{"movement_precision": 0.98, "balance": 0.95, "flexibility": 0.95, "rhythm_accuracy": 0.9, "artistic_expression": 0.95, "technique_execution": 0.98}',
        "video_url": "https://example.com/baryshnikov-ballet"
    },
    {
        "name": "Jillian Michaels",
        "domain": "Fitness",
        "biography": "Fitness expert known for effective training methods",
        "achievements": '["The Biggest Loser trainer", "Fitness DVDs", "Health advocacy"]',
        "pattern_data": '{"form_precision": 0.9, "motivation_delivery": 0.95, "exercise_demonstration": 0.9, "safety_awareness": 0.95, "intensity_control": 0.9, "technique_coaching": 0.85}',
        "video_url": "https://example.com/michaels-workout"
    },
    
    # Additional Contemporary Experts
    {
        "name": "Simone Biles",
        "domain": "Sports",
        "biography": "Gymnast with unmatched skill and mental strength",
        "achievements": '["7 Olympic medals", "25 World Championship medals", "GOAT of gymnastics"]',
        "pattern_data": '{"technique_precision": 0.98, "balance": 0.95, "power": 0.95, "timing": 0.9, "mental_focus": 0.95, "coordination": 0.98}',
        "video_url": "https://example.com/biles-gymnastics"
    },
    {
        "name": "Brené Brown",
        "domain": "Public Speaking",
        "biography": "Researcher and storyteller on vulnerability and courage",
        "achievements": '["TED Talks", "Best-selling author", "Vulnerability research"]',
        "pattern_data": '{"authenticity": 0.98, "storytelling": 0.95, "emotional_connection": 0.95, "vulnerability": 0.95, "research_integration": 0.9, "audience_engagement": 0.9}',
        "video_url": "https://example.com/brown-ted"
    },
    {
        "name": "Hans Zimmer",
        "domain": "Music",
        "biography": "Film composer known for innovative soundscapes",
        "achievements": '["Academy Award winner", "Film score innovation", "Interstellar, Inception soundtracks"]',
        "pattern_data": '{"creativity": 0.98, "orchestration": 0.95, "emotional_depth": 0.95, "innovation": 0.98, "technical_mastery": 0.9, "collaboration": 0.85}',
        "video_url": "https://example.com/zimmer-composition"
    },
    {
        "name": "Jacques Pépin",
        "domain": "Cooking",
        "biography": "French chef known for technique and teaching",
        "achievements": '["James Beard Awards", "Culinary education", "French technique mastery"]',
        "pattern_data": '{"knife_skills": 0.95, "technique_teaching": 0.98, "efficiency": 0.9, "precision": 0.95, "culinary_wisdom": 0.95, "demonstration_clarity": 0.9}',
        "video_url": "https://example.com/pepin-technique"
    }
]

def init_expert_database():
    """Initialize the expert database with expert patterns"""
    db = SessionLocal()
    try:
        # Check if experts already exist
        if db.query(Expert).count() > 0:
            print("Expert database already initialized")
            return
        
        print("Initializing expert database with 20+ experts...")
        
        for expert_data in EXPERT_DATA:
            # Create expert record
            expert = Expert(
                name=expert_data["name"],
                domain=expert_data["domain"],
                biography=expert_data["biography"],
                achievements=expert_data["achievements"],
                pattern_data=expert_data["pattern_data"],
                video_url=expert_data.get("video_url")
            )
            db.add(expert)
            db.flush()  # Get the expert ID
            
            # Create expert patterns for different skill types within the domain
            pattern_data = json.loads(expert_data["pattern_data"])
            
            # Create a general pattern for the expert's domain
            expert_pattern = ExpertPattern(
                expert_id=expert.id,
                skill_type=expert_data["domain"],
                pattern_data=expert_data["pattern_data"],
                confidence_score=1.0
            )
            db.add(expert_pattern)
            
            # Create specific skill patterns based on domain
            if expert_data["domain"] == "Public Speaking":
                # Create pattern for presentation skills
                presentation_pattern = ExpertPattern(
                    expert_id=expert.id,
                    skill_type="Public Speaking",
                    pattern_data=expert_data["pattern_data"],
                    confidence_score=0.95
                )
                db.add(presentation_pattern)
            
            elif expert_data["domain"] == "Sports":
                # Map to Sports/Athletics skill
                sports_pattern = ExpertPattern(
                    expert_id=expert.id,
                    skill_type="Sports/Athletics", 
                    pattern_data=expert_data["pattern_data"],
                    confidence_score=0.95
                )
                db.add(sports_pattern)
            
            elif expert_data["domain"] == "Music":
                # Map to Music/Instrument skill
                music_pattern = ExpertPattern(
                    expert_id=expert.id,
                    skill_type="Music/Instrument",
                    pattern_data=expert_data["pattern_data"],
                    confidence_score=0.95
                )
                db.add(music_pattern)
            
            elif expert_data["domain"] == "Cooking":
                # Map to Cooking skill
                cooking_pattern = ExpertPattern(
                    expert_id=expert.id,
                    skill_type="Cooking",
                    pattern_data=expert_data["pattern_data"],
                    confidence_score=0.95
                )
                db.add(cooking_pattern)
            
            elif expert_data["domain"] == "Dance" or expert_data["domain"] == "Fitness":
                # Map to Dance/Fitness skill
                dance_pattern = ExpertPattern(
                    expert_id=expert.id,
                    skill_type="Dance/Fitness",
                    pattern_data=expert_data["pattern_data"],
                    confidence_score=0.95
                )
                db.add(dance_pattern)
            
            elif expert_data["domain"] == "Business":
                # Create pattern for public speaking within business context
                business_speaking_pattern = ExpertPattern(
                    expert_id=expert.id,
                    skill_type="Public Speaking",
                    pattern_data=expert_data["pattern_data"], 
                    confidence_score=0.8
                )
                db.add(business_speaking_pattern)
        
        db.commit()
        print(f"Successfully initialized {len(EXPERT_DATA)} experts with patterns!")
        
    except Exception as e:
        print(f"Error initializing expert database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_expert_database()