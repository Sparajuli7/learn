#!/bin/bash

# SkillMirror Phase 2: Expert Patterns Setup Script
echo "🚀 Setting up SkillMirror Expert Patterns (Phase 2)"
echo "=================================================="

# Check if foundation is set up
if [ ! -d "../01-foundation" ]; then
    echo "❌ Error: Foundation (Phase 1) not found!"
    echo "Please run Phase 1 setup first."
    exit 1
fi

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "❌ Error: Python 3.8+ required. Found: $python_version"
    exit 1
fi

echo "✅ Python version: $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip

# Copy requirements from foundation and add expert pattern dependencies
cat > requirements.txt << EOF
# Foundation dependencies
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
aiofiles==23.2.1
python-multipart==0.0.6
websockets==12.0

# AI and Analysis
openai==1.3.7
mediapipe==0.10.8
opencv-python==4.8.1.78
numpy==1.24.3
pandas==2.1.4

# Expert Pattern Analysis
scikit-learn==1.3.2
scipy==1.11.4

# Development
pytest==7.4.3
black==23.11.0
flake8==6.1.0
EOF

pip install -r requirements.txt

echo "✅ Python dependencies installed"

# Set up database with expert patterns
echo "🗄️  Setting up expert patterns database..."
cd backend
python database_update.py

if [ $? -eq 0 ]; then
    echo "✅ Expert patterns database initialized"
else
    echo "❌ Database setup failed"
    exit 1
fi

cd ..

# Create run script
cat > run_expert_patterns.sh << EOF
#!/bin/bash

echo "🚀 Starting SkillMirror with Expert Patterns"
echo "=========================================="

# Check if foundation is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "⚠️  Foundation frontend not detected. Starting it first..."
    cd ../01-foundation/frontend
    npm run dev &
    FRONTEND_PID=\$!
    cd ../../02-expert-patterns
    sleep 5
fi

# Activate virtual environment
source venv/bin/activate

# Start the enhanced backend with expert patterns
echo "🔄 Starting enhanced backend with expert patterns..."
cd backend
python enhanced_main.py &
BACKEND_PID=\$!

echo "✅ SkillMirror Expert Patterns is running!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 API Docs: http://localhost:8000/docs"
echo "📊 Expert Analysis: Available in the analysis interface"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "🛑 Stopping services..."; kill \$BACKEND_PID 2>/dev/null; if [ ! -z "\$FRONTEND_PID" ]; then kill \$FRONTEND_PID 2>/dev/null; fi; exit 0' INT

wait
EOF

chmod +x run_expert_patterns.sh

echo "✅ Run script created"

# Create validation script
cat > validate_expert_patterns.sh << EOF
#!/bin/bash

echo "🧪 Validating SkillMirror Expert Patterns"
echo "========================================"

# Activate virtual environment
source venv/bin/activate

echo "1️⃣  Testing database connection..."
python -c "
import sys
sys.path.append('backend')
from expert_database import Expert, ExpertPattern, UserComparison
from database import SessionLocal

db = SessionLocal()
try:
    expert_count = db.query(Expert).count()
    pattern_count = db.query(ExpertPattern).count()
    print(f'✅ Database: {expert_count} experts, {pattern_count} patterns')
    if expert_count >= 20:
        print('✅ Expert database properly initialized')
    else:
        print('❌ Expert database incomplete')
        sys.exit(1)
finally:
    db.close()
"

if [ $? -ne 0 ]; then
    echo "❌ Database validation failed"
    exit 1
fi

echo "2️⃣  Testing pattern comparison..."
python -c "
import sys
sys.path.append('backend')
from pattern_comparison import pattern_comparator

# Test user metrics extraction
test_analysis = {
    'video_analysis': {
        'confidence_score': 0.7,
        'gesture_score': 0.6,
        'eye_contact_score': 0.8
    },
    'speech_analysis': {
        'pace': {'words_per_minute': 150},
        'sentiment': {'compound': 0.5}
    }
}

metrics = pattern_comparator.extract_user_metrics(test_analysis, 'Public Speaking')
print(f'✅ Pattern comparison: {len(metrics)} metrics extracted')
"

if [ $? -ne 0 ]; then
    echo "❌ Pattern comparison validation failed"
    exit 1
fi

echo "3️⃣  Testing expert recommendations..."
python -c "
import sys
sys.path.append('backend')
from expert_recommendations import recommendation_engine

# Test daily spotlight
spotlight = recommendation_engine.get_daily_expert_spotlight('Public Speaking')
if 'expert' in spotlight:
    print(f'✅ Expert recommendations: Daily spotlight for {spotlight[\"expert\"][\"name\"]}')
else:
    print('❌ Expert recommendations failed')
    sys.exit(1)
"

if [ $? -ne 0 ]; then
    echo "❌ Expert recommendations validation failed"
    exit 1
fi

echo "4️⃣  Testing API endpoints..."
# Start backend temporarily for testing
cd backend
python enhanced_main.py &
BACKEND_PID=\$!
sleep 5

# Test health endpoint
if curl -s http://localhost:8000/health | grep -q "expert_patterns"; then
    echo "✅ API: Enhanced health endpoint working"
else
    echo "❌ API: Enhanced health endpoint failed"
    kill \$BACKEND_PID 2>/dev/null
    exit 1
fi

# Test expert list endpoint
if curl -s http://localhost:8000/experts/list | grep -q "experts"; then
    echo "✅ API: Expert list endpoint working"
else
    echo "❌ API: Expert list endpoint failed"
    kill \$BACKEND_PID 2>/dev/null
    exit 1
fi

# Stop test backend
kill \$BACKEND_PID 2>/dev/null
cd ..

echo ""
echo "🎉 All validations passed!"
echo "✅ Expert Patterns system is ready for use"
echo ""
echo "📋 Validation Summary:"
echo "   ✅ Database with 20+ experts initialized"
echo "   ✅ Pattern comparison algorithm working"
echo "   ✅ Expert recommendation engine functional"
echo "   ✅ Enhanced API endpoints responding"
echo ""
echo "🚀 Run './run_expert_patterns.sh' to start the system"
EOF

chmod +x validate_expert_patterns.sh

# Create README
cat > README.md << EOF
# SkillMirror Phase 2: Expert Patterns

This phase adds expert pattern comparison and recommendation features to SkillMirror.

## 🎯 What's New in Phase 2

### Expert Pattern Database
- **20+ Experts** across all skill domains
- **Detailed patterns** for each expert's performance metrics
- **Cross-domain patterns** for skill transfer learning

### Pattern Comparison Engine
- **Real-time comparison** of user performance to expert patterns
- **Similarity scoring** with detailed metric breakdown
- **Personalized feedback** based on expert benchmarks

### Expert Recommendation System
- **Personalized recommendations** based on user's current level
- **Learning paths** with specific improvement steps
- **Multiple strategies**: similar level, aspirational, progressive
- **Timeline estimates** for reaching expert levels

### Enhanced API
- \`/experts/list\` - Get available experts
- \`/experts/compare/{video_id}\` - Compare to expert patterns
- \`/experts/recommendations/{user_id}\` - Get personalized recommendations
- \`/experts/spotlight/daily\` - Daily expert spotlight

## 🚀 Quick Start

1. **Setup**: \`./setup_expert_patterns.sh\`
2. **Validate**: \`./validate_expert_patterns.sh\`
3. **Run**: \`./run_expert_patterns.sh\`

## 📊 Features

### For Users
- Compare your performance to industry experts
- Get personalized expert recommendations
- Follow structured learning paths
- Track progress toward expert-level performance

### For Developers
- Comprehensive expert pattern API
- Real-time comparison algorithms
- Flexible recommendation engine
- Detailed analytics and insights

## 🔧 Technical Details

### Database Schema
- \`experts\` - Expert profiles and achievements
- \`expert_patterns\` - Detailed performance patterns
- \`user_comparisons\` - Comparison history and feedback

### Key Components
- \`PatternComparator\` - Core comparison algorithm
- \`ExpertRecommendationEngine\` - Personalized recommendations
- \`ExpertComparison\` - Frontend visualization
- \`ExpertRecommendations\` - Learning path interface

## 📈 Performance

- **< 1 minute** for expert comparison
- **< 30 seconds** for recommendation generation
- **20+ experts** with detailed patterns
- **Real-time feedback** integration

## 🎓 Learning Strategies

1. **Similar Level** - Learn from experts at your current level
2. **Aspirational** - Study master-level performance
3. **Progressive** - Follow step-by-step improvement
4. **Improvement Focused** - Target your weak areas

Ready to learn from the best? Start with \`./setup_expert_patterns.sh\`!
EOF

echo ""
echo "🎉 SkillMirror Expert Patterns Setup Complete!"
echo "=============================================="
echo ""
echo "📋 What was created:"
echo "   ✅ Expert database with 20+ professionals"
echo "   ✅ Pattern comparison algorithm"
echo "   ✅ Recommendation engine"
echo "   ✅ Enhanced API endpoints"
echo "   ✅ Frontend visualization components"
echo ""
echo "📝 Next steps:"
echo "   1️⃣  Run: ./validate_expert_patterns.sh"
echo "   2️⃣  Start: ./run_expert_patterns.sh"
echo "   3️⃣  Visit: http://localhost:3000"
echo ""
echo "🌟 Features unlocked:"
echo "   • Expert pattern comparison"
echo "   • Personalized recommendations"
echo "   • Learning path guidance"
echo "   • Progress tracking"
echo ""
echo "Ready to learn from the experts! 🎯"