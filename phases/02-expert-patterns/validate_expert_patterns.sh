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
BACKEND_PID=$!
sleep 5

# Test health endpoint
if curl -s http://localhost:8000/health | grep -q "expert_patterns"; then
    echo "✅ API: Enhanced health endpoint working"
else
    echo "❌ API: Enhanced health endpoint failed"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Test expert list endpoint
if curl -s http://localhost:8000/experts/list | grep -q "experts"; then
    echo "✅ API: Expert list endpoint working"
else
    echo "❌ API: Expert list endpoint failed"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Stop test backend
kill $BACKEND_PID 2>/dev/null
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