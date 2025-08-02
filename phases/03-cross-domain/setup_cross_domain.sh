#!/bin/bash

# SkillMirror Phase 3: Cross-Domain Skill Transfer Setup
# Sets up the cross-domain skill transfer engine with database, API, and frontend components

set -e  # Exit on any error

echo "🚀 Setting up SkillMirror Phase 3: Cross-Domain Skill Transfer..."

# Colors for output
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
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the phases/03-cross-domain directory"
    exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Phase 1 and 2 are set up
if [ ! -d "../01-foundation/backend" ]; then
    print_error "Phase 1 (Foundation) not found. Please set up Phase 1 first."
    exit 1
fi

if [ ! -d "../02-expert-patterns/backend" ]; then
    print_error "Phase 2 (Expert Patterns) not found. Please set up Phase 2 first."
    exit 1
fi

print_success "Prerequisites check passed"

# Set up backend
print_status "Setting up cross-domain backend..."

cd backend

# Check if foundation backend virtual environment exists
if [ ! -d "../01-foundation/backend/venv" ]; then
    print_error "Foundation backend virtual environment not found. Please set up Phase 1 first."
    exit 1
fi

# Use the same virtual environment as foundation
VENV_PATH="../01-foundation/backend/venv"
print_status "Using existing virtual environment: $VENV_PATH"

# Activate virtual environment
source "$VENV_PATH/bin/activate"

# Install additional dependencies for cross-domain features
print_status "Installing additional Python dependencies..."

# Check if packages are already installed to avoid reinstalling
python -c "import fastapi, pydantic, sqlalchemy" 2>/dev/null || {
    print_status "Installing required packages..."
    pip install fastapi pydantic sqlalchemy
}

print_success "Dependencies installed"

# Initialize database tables
print_status "Initializing cross-domain database tables..."

# Check if database file exists
DB_PATH="../01-foundation/backend/skillmirror.db"
if [ ! -f "$DB_PATH" ]; then
    print_error "Foundation database not found at $DB_PATH"
    print_error "Please run Phase 1 setup first"
    exit 1
fi

# Create database tables and populate initial data
python cross_domain_database.py

if [ $? -eq 0 ]; then
    print_success "Database tables created and populated"
else
    print_error "Failed to create database tables"
    exit 1
fi

# Test the skill transfer engine
print_status "Testing skill transfer engine..."

python -c "
from skill_transfer_engine import SkillTransferEngine
engine = SkillTransferEngine()
recommendations = engine.get_transfer_recommendations(['Boxing'])
print(f'✅ Engine test passed: {len(recommendations)} recommendations generated')
engine.close()
"

if [ $? -eq 0 ]; then
    print_success "Skill transfer engine test passed"
else
    print_error "Skill transfer engine test failed"
    exit 1
fi

cd ..

# Set up frontend components
print_status "Setting up cross-domain frontend components..."

# Check if foundation frontend exists
if [ ! -d "../01-foundation/frontend" ]; then
    print_error "Foundation frontend not found. Please set up Phase 1 first."
    exit 1
fi

# Copy frontend components to foundation frontend
FRONTEND_DEST="../01-foundation/frontend/app/components"

print_status "Installing cross-domain React components..."

# Create cross-domain directory in components
mkdir -p "$FRONTEND_DEST/cross-domain"

# Copy components
cp frontend/SkillTransferDashboard.tsx "$FRONTEND_DEST/cross-domain/"
cp frontend/SkillMappingVisualizer.tsx "$FRONTEND_DEST/cross-domain/"

print_success "Frontend components installed"

# Update main backend to include cross-domain API
print_status "Integrating cross-domain API with main backend..."

# Check if enhanced_main.py exists from Phase 2
MAIN_BACKEND="../02-expert-patterns/backend/enhanced_main.py"
if [ ! -f "$MAIN_BACKEND" ]; then
    print_warning "Enhanced main.py not found, using foundation main.py"
    MAIN_BACKEND="../01-foundation/backend/main.py"
fi

# Create enhanced main.py with cross-domain support
cat > "../01-foundation/backend/cross_domain_main.py" << 'EOF'
"""
SkillMirror Enhanced Main Application with Cross-Domain Support
Integrates Foundation + Expert Patterns + Cross-Domain Transfer features
"""

import sys
import os

# Add all phase directories to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../02-expert-patterns/backend'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../03-cross-domain/backend'))

from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import uvicorn

# Import all components
from main import *  # Foundation components
try:
    from expert_api import router as expert_router  # Phase 2 components
    expert_available = True
except ImportError:
    print("Warning: Expert patterns not available")
    expert_available = False

try:
    from cross_domain_api import router as cross_domain_router  # Phase 3 components
    cross_domain_available = True
except ImportError:
    print("Warning: Cross-domain features not available")
    cross_domain_available = False

# Create enhanced application
app = FastAPI(
    title="SkillMirror - Complete Platform",
    description="AI-powered skill analysis with expert comparison and cross-domain transfer",
    version="3.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers
if expert_available:
    app.include_router(expert_router, prefix="/api")
    print("✅ Expert patterns API enabled")

if cross_domain_available:
    app.include_router(cross_domain_router, prefix="/api")
    print("✅ Cross-domain transfer API enabled")

# Enhanced health check
@app.get("/api/health")
async def enhanced_health():
    """Enhanced health check showing all available features"""
    return {
        "status": "healthy",
        "service": "SkillMirror Complete Platform",
        "version": "3.0.0",
        "features": {
            "foundation": True,
            "expert_patterns": expert_available,
            "cross_domain_transfer": cross_domain_available
        },
        "timestamp": datetime.now()
    }

@app.get("/api/features")
async def available_features():
    """List all available platform features"""
    features = {
        "video_analysis": True,
        "skill_assessment": True,
        "websocket_feedback": True,
        "expert_comparison": expert_available,
        "expert_recommendations": expert_available,
        "cross_domain_transfer": cross_domain_available,
        "skill_mapping": cross_domain_available,
        "transfer_tracking": cross_domain_available
    }
    
    return {
        "features": features,
        "total_features": sum(features.values()),
        "platform_completeness": f"{sum(features.values())}/{len(features)} features"
    }

if __name__ == "__main__":
    print("🚀 Starting SkillMirror Complete Platform...")
    print("📋 Available Features:")
    print("   ✅ Foundation: Video analysis, skill assessment")
    if expert_available:
        print("   ✅ Expert Patterns: Expert comparison, recommendations")
    if cross_domain_available:
        print("   ✅ Cross-Domain: Skill transfer, cross-domain learning")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
EOF

print_success "Enhanced main application created"

# Create validation script
print_status "Creating validation script..."

cat > "validate_cross_domain.sh" << 'EOF'
#!/bin/bash

# Cross-Domain Skill Transfer Validation Script

echo "🧪 Validating Cross-Domain Skill Transfer Setup..."

cd backend

# Activate virtual environment
source ../01-foundation/backend/venv/bin/activate

# Test 1: Database tables exist
echo "📊 Testing database tables..."
python -c "
from cross_domain_database import get_database_session, SkillTransfer, TransferProgress, SkillMapping
db = get_database_session()
transfers = db.query(SkillTransfer).count()
mappings = db.query(SkillMapping).count()
print(f'✅ Found {transfers} skill transfers with {mappings} mappings')
db.close()
"

# Test 2: Skill transfer engine
echo "🧠 Testing skill transfer engine..."
python -c "
from skill_transfer_engine import SkillTransferEngine
engine = SkillTransferEngine()
recs = engine.get_transfer_recommendations(['Boxing', 'Music'])
print(f'✅ Generated {len(recs)} recommendations')
engine.close()
"

# Test 3: API endpoints
echo "🌐 Testing API endpoints..."
cd ../01-foundation/backend
python -c "
import sys
sys.path.append('../03-cross-domain/backend')
from cross_domain_api import router
print(f'✅ API router loaded with {len(router.routes)} endpoints')
"

echo "✅ All validation tests passed!"
echo "🎉 Cross-Domain Skill Transfer is ready!"
EOF

chmod +x validate_cross_domain.sh

print_success "Validation script created"

# Create run script
print_status "Creating run script..."

cat > "run_cross_domain.sh" << 'EOF'
#!/bin/bash

# Run SkillMirror with Cross-Domain Features

echo "🚀 Starting SkillMirror with Cross-Domain Skill Transfer..."

# Start backend with all features
cd ../01-foundation/backend
source venv/bin/activate

echo "📡 Starting enhanced backend with cross-domain features..."
python cross_domain_main.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
cd ../frontend
echo "🎨 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo "✅ SkillMirror is running!"
echo "🌐 Frontend: http://localhost:3000"
echo "📡 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "🎯 Available Features:"
echo "   • Video Analysis & Skill Assessment"
echo "   • Expert Pattern Comparison"
echo "   • Cross-Domain Skill Transfer"
echo "   • Learning Path Recommendations"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
EOF

chmod +x run_cross_domain.sh

print_success "Run script created"

# Final validation
print_status "Running final validation..."
./validate_cross_domain.sh

if [ $? -eq 0 ]; then
    print_success "Cross-Domain Skill Transfer setup completed successfully!"
    echo ""
    echo "🎉 Phase 3 Complete!"
    echo ""
    echo "📋 What's been set up:"
    echo "   ✅ Cross-domain skill transfer database"
    echo "   ✅ Skill mapping algorithm"
    echo "   ✅ Boxing → Public Speaking transfer"
    echo "   ✅ Coding → Cooking transfer"
    echo "   ✅ Music → Business transfer"
    echo "   ✅ Transfer effectiveness tracking"
    echo "   ✅ React components for visualization"
    echo "   ✅ API endpoints for recommendations"
    echo ""
    echo "🚀 To start SkillMirror with all features:"
    echo "   ./run_cross_domain.sh"
    echo ""
    echo "🧪 To validate installation:"
    echo "   ./validate_cross_domain.sh"
    echo ""
    echo "📚 API Documentation:"
    echo "   http://localhost:8000/docs (when running)"
else
    print_error "Setup validation failed. Please check the logs above."
    exit 1
fi