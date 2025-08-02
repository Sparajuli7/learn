"""
Database update script to add expert pattern tables to the foundation database
This script safely adds new tables without affecting existing data
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Import foundation database setup
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '01-foundation', 'backend'))
from database import Base, DATABASE_URL

# Import expert database models
from expert_database import Expert, ExpertPattern, UserComparison, init_expert_database

def update_database():
    """Update the existing database with expert pattern tables"""
    
    print("Starting database update for Expert Patterns...")
    
    try:
        # Create engine and session
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        
        # Create all new tables (this will only create tables that don't exist)
        print("Creating expert pattern tables...")
        Base.metadata.create_all(bind=engine)
        
        # Initialize expert data
        print("Initializing expert database...")
        init_expert_database()
        
        # Verify tables were created
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            expert_count = db.query(Expert).count()
            pattern_count = db.query(ExpertPattern).count()
            
            print(f"✅ Database update completed successfully!")
            print(f"   - Experts: {expert_count}")
            print(f"   - Expert Patterns: {pattern_count}")
            print(f"   - User Comparisons table ready")
            
            return True
            
        finally:
            db.close()
        
    except Exception as e:
        print(f"❌ Database update failed: {e}")
        return False

def verify_database_integrity():
    """Verify that all tables exist and are properly structured"""
    
    try:
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Check foundation tables
        foundation_tables = ["users", "videos", "analysis_results", "skills"]
        expert_tables = ["experts", "expert_patterns", "user_comparisons"]
        
        try:
            print("Verifying database integrity...")
            
            # Test foundation tables
            for table in foundation_tables:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"  ✅ {table}: {count} records")
            
            # Test expert pattern tables
            for table in expert_tables:
                result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                print(f"  ✅ {table}: {count} records")
            
            print("🎉 All tables verified successfully!")
            return True
            
        finally:
            db.close()
        
    except Exception as e:
        print(f"❌ Database verification failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 SkillMirror Expert Patterns - Database Update")
    print("=" * 50)
    
    # Update database
    success = update_database()
    
    if success:
        # Verify integrity
        verify_database_integrity()
        print("\n✅ Expert Patterns database is ready!")
        print("🔄 You can now restart the application to use expert pattern features.")
    else:
        print("\n❌ Database update failed. Please check the error messages above.")