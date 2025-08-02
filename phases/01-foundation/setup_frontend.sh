#!/bin/bash

echo "🚀 Setting up SkillMirror Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

cd frontend

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env.local ]; then
    echo "📝 Creating environment file..."
    cp .env.local.example .env.local
    echo "✅ Environment file created. Please update .env.local with your configuration."
else
    echo "✅ Environment file already exists."
fi

# Create uploads directory (if needed)
mkdir -p public/uploads

echo "✅ Frontend setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Start the development server: cd frontend && npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""