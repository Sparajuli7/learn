#!/bin/bash

echo "🚀 Setting up SkillMirror Backend..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ and try again."
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
REQUIRED_VERSION="3.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Python 3.8+ is required. Current version: $PYTHON_VERSION"
    exit 1
fi

cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "🐍 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Install additional dependencies that might be missing
echo "📦 Installing additional dependencies..."
pip install soundfile  # For audio processing fallback

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "✅ Environment file created. Please update .env with your OpenAI API key."
else
    echo "✅ Environment file already exists."
fi

# Create uploads directory
mkdir -p uploads

# Initialize database
echo "🗄️  Initializing database..."
python -c "from database import create_tables, init_default_skills; create_tables(); init_default_skills(); print('Database initialized!')"

echo "✅ Backend setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update .env with your OpenAI API key"
echo "2. Start the backend server: cd backend && source venv/bin/activate && python run.py"
echo "3. The API will be available at http://localhost:8000"
echo "4. API documentation at http://localhost:8000/docs"
echo ""