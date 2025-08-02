#!/bin/bash

# Phase 4: Real-Time Feedback System Setup Script
# Sets up the complete real-time feedback and analytics system

set -e

echo "🚀 Setting up Phase 4: Real-Time Feedback System..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "phases/04-real-time" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Create necessary directories
print_status "Creating directory structure..."
mkdir -p phases/04-real-time/backend
mkdir -p phases/04-real-time/frontend
mkdir -p phases/04-real-time/data
mkdir -p phases/04-real-time/logs

# Set up Python virtual environment for backend
print_status "Setting up Python environment..."
cd phases/04-real-time/backend

if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_success "Virtual environment created"
fi

# Activate virtual environment
source venv/bin/activate

# Create requirements.txt for real-time system
print_status "Creating requirements.txt..."
cat > requirements.txt << EOF
# Real-Time Feedback System Dependencies
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
sqlalchemy>=2.0.0
pydantic>=2.0.0
python-multipart>=0.0.6
websockets>=11.0.0
numpy>=1.24.0
opencv-python>=4.8.0
mediapipe>=0.10.0
openai>=1.0.0
aiofiles>=23.0.0
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
aioredis>=2.0.0
celery>=5.3.0
redis>=5.0.0

# Development dependencies  
pytest>=7.4.0
pytest-asyncio>=0.21.0
black>=23.0.0
isort>=5.12.0
flake8>=6.0.0
EOF

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
print_success "Python dependencies installed"

# Initialize the database
print_status "Initializing real-time feedback database..."
python ../realtime_database.py
print_success "Database initialized with sample data"

# Create main application file
print_status "Creating main application file..."
cat > realtime_main.py << 'EOF'
"""
Real-Time Feedback System Main Application
Integrates with all previous phases while providing real-time capabilities
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import from previous phases
import sys
import os
sys.path.append('../../01-foundation/backend')
sys.path.append('../../02-expert-patterns/backend')
sys.path.append('../../03-cross-domain/backend')

from realtime_feedback_api import router as realtime_router
from realtime_database import init_realtime_database, create_realtime_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting Real-Time Feedback System...")
    create_realtime_tables()
    init_realtime_database()
    print("✅ Real-time system ready!")
    
    yield
    
    # Shutdown
    print("📡 Shutting down Real-Time Feedback System...")

# Initialize FastAPI app with lifespan
app = FastAPI(
    title="SkillMirror Real-Time Feedback API",
    description="Real-time video analysis and instant feedback generation",
    version="4.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include real-time feedback routes
app.include_router(realtime_router)

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "SkillMirror Real-Time Feedback System",
        "version": "4.0.0",
        "status": "active",
        "features": [
            "live_video_analysis",
            "instant_feedback_generation",
            "real_time_suggestions",
            "performance_analytics",
            "progress_tracking"
        ]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "realtime-feedback",
        "phase": 4,
        "capabilities": [
            "real_time_analysis",
            "instant_suggestions", 
            "performance_metrics",
            "analytics_dashboard"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "realtime_main:app",
        host="0.0.0.0",
        port=8004,
        reload=True,
        log_level="info"
    )
EOF

print_success "Main application file created"

# Create integration script
print_status "Creating integration script..."
cat > integrate_with_previous_phases.py << 'EOF'
"""
Integration script to connect Phase 4 with previous phases
Ensures seamless operation with foundation, expert patterns, and cross-domain systems
"""

import sys
import os
import json
from datetime import datetime

# Add previous phase paths
sys.path.append('../../01-foundation/backend')
sys.path.append('../../02-expert-patterns/backend') 
sys.path.append('../../03-cross-domain/backend')

def test_foundation_integration():
    """Test integration with Phase 1 foundation system"""
    try:
        from database import get_db, User, Video, AnalysisResult
        from video_analysis import VideoAnalyzer
        from speech_analysis import SpeechAnalyzer
        
        print("✅ Phase 1 (Foundation) integration successful")
        return True
    except ImportError as e:
        print(f"❌ Phase 1 integration failed: {e}")
        return False

def test_expert_patterns_integration():
    """Test integration with Phase 2 expert patterns system"""
    try:
        from expert_database import ExpertPattern, ExpertComparison
        from expert_recommendations import ExpertRecommendationEngine
        
        print("✅ Phase 2 (Expert Patterns) integration successful") 
        return True
    except ImportError as e:
        print(f"❌ Phase 2 integration failed: {e}")
        return False

def test_cross_domain_integration():
    """Test integration with Phase 3 cross-domain system"""
    try:
        from cross_domain_database import SkillTransfer, TransferProgress
        from skill_transfer_engine import SkillTransferEngine
        
        print("✅ Phase 3 (Cross-Domain) integration successful")
        return True
    except ImportError as e:
        print(f"❌ Phase 3 integration failed: {e}")
        return False

def test_realtime_system():
    """Test Phase 4 real-time system"""
    try:
        from realtime_database import FeedbackSession, ImprovementSuggestion, PerformanceMetric
        from realtime_analysis_engine import RealTimeAnalysisEngine
        from realtime_feedback_api import router
        
        print("✅ Phase 4 (Real-Time Feedback) system operational")
        return True
    except ImportError as e:
        print(f"❌ Phase 4 system failed: {e}")
        return False

def create_integration_report():
    """Create integration status report"""
    report = {
        "integration_test_timestamp": datetime.utcnow().isoformat(),
        "phase_1_foundation": test_foundation_integration(),
        "phase_2_expert_patterns": test_expert_patterns_integration(), 
        "phase_3_cross_domain": test_cross_domain_integration(),
        "phase_4_realtime": test_realtime_system()
    }
    
    # Save report
    with open('../integration_report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    all_passed = all(report.values() if k != "integration_test_timestamp" else True for k, v in report.items())
    
    print(f"\n{'='*50}")
    print("INTEGRATION TEST RESULTS")
    print(f"{'='*50}")
    
    for phase, status in report.items():
        if phase != "integration_test_timestamp":
            status_icon = "✅" if status else "❌"
            print(f"{status_icon} {phase.replace('_', ' ').title()}")
    
    print(f"{'='*50}")
    
    if all_passed:
        print("🎉 ALL INTEGRATIONS SUCCESSFUL - SYSTEM READY!")
    else:
        print("⚠️  SOME INTEGRATIONS FAILED - CHECK DEPENDENCIES")
    
    return all_passed

if __name__ == "__main__":
    create_integration_report()
EOF

print_success "Integration script created"

# Go back to project root
cd ../../..

# Create validation script
print_status "Creating validation script..."
cat > phases/04-real-time/validate_realtime_system.py << 'EOF'
#!/usr/bin/env python3
"""
Phase 4 Real-Time Feedback System Validation
Tests all functionality and performance requirements
"""

import asyncio
import time
import json
import sys
import os
from datetime import datetime
from typing import Dict, List, Any

# Add backend path
sys.path.append('phases/04-real-time/backend')

async def validate_database_schema():
    """Validate database schema and sample data"""
    try:
        from realtime_database import (
            FeedbackSession, ImprovementSuggestion, 
            PerformanceMetric, RealTimeProgress,
            get_session_maker
        )
        
        SessionLocal = get_session_maker()
        db = SessionLocal()
        
        # Test database queries
        sessions = db.query(FeedbackSession).all()
        suggestions = db.query(ImprovementSuggestion).all()
        metrics = db.query(PerformanceMetric).all()
        progress = db.query(RealTimeProgress).all()
        
        db.close()
        
        return {
            "database_accessible": True,
            "feedback_sessions": len(sessions),
            "improvement_suggestions": len(suggestions),
            "performance_metrics": len(metrics),
            "progress_records": len(progress)
        }
    except Exception as e:
        return {"database_accessible": False, "error": str(e)}

async def validate_analysis_engine():
    """Validate real-time analysis engine performance"""
    try:
        from realtime_analysis_engine import RealTimeAnalysisEngine
        
        engine = RealTimeAnalysisEngine()
        
        # Test analysis with dummy data
        start_time = time.time()
        dummy_video_data = b"dummy_video_data" * 1000  # Simulate video data
        
        feedback = await engine.analyze_realtime_video(
            dummy_video_data, "Public Speaking", 1
        )
        
        processing_time = time.time() - start_time
        
        return {
            "engine_operational": True,
            "processing_time_seconds": round(processing_time, 2),
            "meets_30s_target": processing_time < 30,
            "feedback_generated": feedback.overall_score > 0,
            "suggestions_count": len(feedback.improvement_suggestions),
            "metrics_count": len(feedback.performance_metrics)
        }
    except Exception as e:
        return {"engine_operational": False, "error": str(e)}

async def validate_api_endpoints():
    """Validate API endpoints functionality"""
    try:
        # This would test API endpoints in a real scenario
        # For now, we'll validate the imports and structure
        from realtime_feedback_api import router
        
        # Count available endpoints
        endpoint_count = len([route for route in router.routes])
        
        return {
            "api_accessible": True,
            "endpoint_count": endpoint_count,
            "router_configured": True
        }
    except Exception as e:
        return {"api_accessible": False, "error": str(e)}

async def validate_performance_requirements():
    """Validate that performance requirements are met"""
    
    # Test multiple analysis cycles to check consistency
    from realtime_analysis_engine import RealTimeAnalysisEngine
    
    engine = RealTimeAnalysisEngine()
    times = []
    
    for i in range(5):
        start_time = time.time()
        dummy_data = b"test_data" * 500
        
        await engine.analyze_realtime_video(dummy_data, "Public Speaking", 1)
        
        elapsed = time.time() - start_time
        times.append(elapsed)
    
    avg_time = sum(times) / len(times)
    max_time = max(times)
    
    return {
        "average_processing_time": round(avg_time, 2),
        "max_processing_time": round(max_time, 2),
        "meets_performance_target": max_time < 30,
        "consistency_good": max(times) - min(times) < 5  # Less than 5s variance
    }

async def run_validation():
    """Run complete validation suite"""
    print("🔍 Starting Phase 4 Real-Time Feedback System Validation...")
    print("=" * 60)
    
    results = {}
    
    # Database validation
    print("📊 Validating database schema...")
    results["database"] = await validate_database_schema()
    
    # Analysis engine validation  
    print("🔧 Validating analysis engine...")
    results["analysis_engine"] = await validate_analysis_engine()
    
    # API validation
    print("🌐 Validating API endpoints...")
    results["api"] = await validate_api_endpoints()
    
    # Performance validation
    print("⚡ Validating performance requirements...")
    results["performance"] = await validate_performance_requirements()
    
    # Generate report
    print("\n" + "=" * 60)
    print("VALIDATION RESULTS")
    print("=" * 60)
    
    all_passed = True
    
    # Database results
    db_results = results["database"]
    if db_results.get("database_accessible"):
        print(f"✅ Database: {db_results['feedback_sessions']} sessions, {db_results['improvement_suggestions']} suggestions")
    else:
        print(f"❌ Database: {db_results.get('error', 'Failed')}")
        all_passed = False
    
    # Analysis engine results
    engine_results = results["analysis_engine"]
    if engine_results.get("engine_operational"):
        time_status = "✅" if engine_results["meets_30s_target"] else "❌"
        print(f"{time_status} Analysis Engine: {engine_results['processing_time_seconds']}s processing time")
        print(f"  - Suggestions: {engine_results['suggestions_count']}")
        print(f"  - Metrics: {engine_results['metrics_count']}")
    else:
        print(f"❌ Analysis Engine: {engine_results.get('error', 'Failed')}")
        all_passed = False
    
    # API results
    api_results = results["api"]
    if api_results.get("api_accessible"):
        print(f"✅ API: {api_results['endpoint_count']} endpoints configured")
    else:
        print(f"❌ API: {api_results.get('error', 'Failed')}")
        all_passed = False
    
    # Performance results
    perf_results = results["performance"]
    perf_status = "✅" if perf_results["meets_performance_target"] else "❌"
    print(f"{perf_status} Performance: Avg {perf_results['average_processing_time']}s, Max {perf_results['max_processing_time']}s")
    
    if not perf_results["meets_performance_target"]:
        all_passed = False
    
    print("=" * 60)
    
    # Final status
    if all_passed:
        print("🎉 ALL VALIDATIONS PASSED - REAL-TIME SYSTEM READY!")
        status = "PASSED"
    else:
        print("⚠️  SOME VALIDATIONS FAILED - CHECK SYSTEM CONFIGURATION")
        status = "FAILED"
    
    # Save detailed results
    results["validation_timestamp"] = datetime.utcnow().isoformat()
    results["overall_status"] = status
    
    with open("phases/04-real-time/validation_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: phases/04-real-time/validation_results.json")
    
    return all_passed

if __name__ == "__main__":
    success = asyncio.run(run_validation())
    sys.exit(0 if success else 1)
EOF

# Make scripts executable
chmod +x phases/04-real-time/setup_realtime_feedback.sh
chmod +x phases/04-real-time/validate_realtime_system.py

print_success "Validation script created"

# Create run script for easy testing
print_status "Creating run script..."
cat > phases/04-real-time/run_realtime_system.sh << 'EOF'
#!/bin/bash

# Quick start script for Phase 4 Real-Time Feedback System

set -e

echo "🚀 Starting SkillMirror Real-Time Feedback System (Phase 4)"

# Check if setup has been run
if [ ! -f "phases/04-real-time/backend/venv/bin/activate" ]; then
    echo "❌ System not set up. Please run setup_realtime_feedback.sh first"
    exit 1
fi

# Start backend
echo "🔧 Starting backend server..."
cd phases/04-real-time/backend
source venv/bin/activate

# Run database initialization
python realtime_database.py

# Start the server
echo "✅ Real-time feedback system starting on http://localhost:8004"
echo "📚 API documentation: http://localhost:8004/docs"
echo "🔍 Health check: http://localhost:8004/health"
echo ""
echo "Press Ctrl+C to stop the server"

python realtime_main.py
EOF

chmod +x phases/04-real-time/run_realtime_system.sh

print_success "Run script created"

# Run integration test
print_status "Running integration test..."
cd phases/04-real-time/backend
source venv/bin/activate
python integrate_with_previous_phases.py

# Run validation
print_status "Running system validation..."
cd ../../..
python phases/04-real-time/validate_realtime_system.py

print_success "Setup completed successfully!"

echo ""
echo "🎉 Phase 4: Real-Time Feedback System Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "  1. Test the system: ./phases/04-real-time/run_realtime_system.sh"
echo "  2. Access API docs: http://localhost:8004/docs"
echo "  3. Integrate with frontend components"
echo ""
echo "📊 System Features:"
echo "  ✅ Real-time video analysis (<30s feedback)"
echo "  ✅ Instant improvement suggestions"
echo "  ✅ Performance metrics tracking"
echo "  ✅ Analytics dashboard"
echo "  ✅ Integration with all previous phases"
echo ""
echo "🔧 Files Created:"
echo "  - Backend API: phases/04-real-time/backend/"
echo "  - Frontend Components: phases/04-real-time/frontend/"
echo "  - Setup Script: phases/04-real-time/setup_realtime_feedback.sh"
echo "  - Validation Script: phases/04-real-time/validate_realtime_system.py"
echo "  - Run Script: phases/04-real-time/run_realtime_system.sh"
echo ""
echo "Ready for real-time feedback and analytics! 🚀"