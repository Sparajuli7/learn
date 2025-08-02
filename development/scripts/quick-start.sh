#!/bin/bash

echo "🚀 SkillMirror Quick Start"
echo "========================="
echo ""

# Check if we're in the right directory
if [ ! -d "phases/01-foundation" ]; then
    echo "❌ Error: Please run this script from the SkillMirror root directory"
    echo "Expected directory structure:"
    echo "  skillmirror/"
    echo "  ├── phases/01-foundation/"
    echo "  ├── development/"
    echo "  └── development/scripts/quick-start.sh (this script)"
    exit 1
fi

echo "📁 Entering foundation directory..."
cd phases/01-foundation

echo ""
echo "🎯 Starting SkillMirror Foundation System..."
echo "This will launch both frontend and backend servers."
echo ""

# Check if setup has been run
if [ ! -d "backend/venv" ] || [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  Setup required! Running initial setup..."
    echo ""
    
    if [ ! -d "backend/venv" ]; then
        echo "🐍 Setting up backend..."
        ./setup_backend.sh
    fi
    
    if [ ! -d "frontend/node_modules" ]; then
        echo "⚛️  Setting up frontend..."
        ./setup_frontend.sh
    fi
fi

# Check for OpenAI API key
if [ ! -f "backend/.env" ]; then
    echo "📝 Environment file not found. Creating from template..."
    cd backend
    cp .env.example .env
    cd ..
    echo ""
    echo "⚠️  IMPORTANT: Please add your OpenAI API key to backend/.env"
    echo "Edit the file and add: OPENAI_API_KEY=your_key_here"
    echo ""
    echo "You can edit it with: nano phases/01-foundation/backend/.env"
    echo ""
    read -p "Press Enter after you've added your API key to continue..."
fi

echo ""
echo "🚀 Launching SkillMirror..."
echo ""

# Run the application
./run_skillmirror.sh