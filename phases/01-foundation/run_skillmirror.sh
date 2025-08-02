#!/bin/bash

echo "🎯 Starting SkillMirror - Real-Time Learning Feedback System"
echo "============================================================"

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null; then
        return 0
    else
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo "🐍 Starting Backend Server..."
    cd backend
    
    if [ ! -d "venv" ]; then
        echo "❌ Backend not set up. Please run ./setup_backend.sh first"
        exit 1
    fi
    
    source venv/bin/activate
    
    if [ ! -f ".env" ]; then
        echo "❌ Backend .env file not found. Please run ./setup_backend.sh first"
        exit 1
    fi
    
    python run.py &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to start
    echo "⏳ Waiting for backend to start..."
    for i in {1..30}; do
        if check_port 8000; then
            echo "✅ Backend started successfully on http://localhost:8000"
            break
        fi
        sleep 1
    done
}

# Function to start frontend
start_frontend() {
    echo "⚛️  Starting Frontend Server..."
    cd frontend
    
    if [ ! -d "node_modules" ]; then
        echo "❌ Frontend not set up. Please run ./setup_frontend.sh first"
        exit 1
    fi
    
    if [ ! -f ".env.local" ]; then
        echo "❌ Frontend .env.local file not found. Please run ./setup_frontend.sh first"
        exit 1
    fi
    
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Wait for frontend to start
    echo "⏳ Waiting for frontend to start..."
    for i in {1..30}; do
        if check_port 3000; then
            echo "✅ Frontend started successfully on http://localhost:3000"
            break
        fi
        sleep 1
    done
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down SkillMirror..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "✅ Backend stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Frontend stopped"
    fi
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Check if ports are already in use
if check_port 8000; then
    echo "⚠️  Port 8000 is already in use. Please stop the existing service or change the backend port."
    exit 1
fi

if check_port 3000; then
    echo "⚠️  Port 3000 is already in use. Please stop the existing service or change the frontend port."
    exit 1
fi

# Start services
start_backend
start_frontend

echo ""
echo "🎉 SkillMirror is now running!"
echo "============================================================"
echo "🌐 Frontend: http://localhost:3000"
echo "🚀 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "📋 Validation Checklist:"
echo "[ ] Video upload works with 10MB+ files"
echo "[ ] Analysis completes in <2 minutes"
echo "[ ] Joint tracking detects 15+ body points accurately"
echo "[ ] Speech analysis covers pace, tone, content, and word choice"
echo "[ ] Feedback appears in real-time"
echo "[ ] Database stores all data correctly"
echo "[ ] UI is responsive on mobile/desktop"
echo ""
echo "💡 Press Ctrl+C to stop all services"

# Keep the script running
wait