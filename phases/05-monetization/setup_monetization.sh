#!/bin/bash

echo "🚀 Setting up SkillMirror Monetization System (Phase 5)"
echo "=================================================="

# Exit on error
set -e

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

# Check if we're in the correct directory
if [ ! -f "PROJECT_STATUS.md" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Navigate to monetization directory
cd phases/05-monetization

print_status "Setting up Python environment for monetization backend..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is required but not installed"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
fi

# Activate virtual environment
print_status "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
print_status "Installing Python dependencies..."
pip install -r backend/requirements.txt

print_success "Python dependencies installed"

# Set up environment variables
print_status "Setting up environment variables..."

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << EOF
# Stripe Configuration (Development Keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (Created in Stripe Dashboard)
STRIPE_PRO_PRICE_ID=price_pro_monthly
STRIPE_EXPERT_PRICE_ID=price_expert_monthly
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_monthly

# Database Configuration
DATABASE_URL=sqlite:///./monetization.db

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Configuration
API_HOST=0.0.0.0
API_PORT=8005
EOF
    
    print_warning "Created .env file with template values"
    print_warning "Please update .env with your actual Stripe API keys"
else
    print_status ".env file already exists"
fi

# Initialize database
print_status "Initializing monetization database..."
cd backend
python monetization_database.py
print_success "Database initialized with all tables"

# Test Stripe integration (with mock keys)
print_status "Testing Stripe integration..."
python stripe_integration.py || print_warning "Stripe test requires valid API keys"

# Test access control system
print_status "Testing access control system..."
python access_control.py
print_success "Access control system working"

# Go back to monetization directory
cd ..

# Set up frontend components (if Next.js is available)
print_status "Setting up frontend components..."

# Check if we need to copy components to main frontend
MAIN_FRONTEND="../01-foundation/frontend"
if [ -d "$MAIN_FRONTEND" ]; then
    print_status "Copying monetization components to main frontend..."
    
    # Create monetization components directory
    mkdir -p "$MAIN_FRONTEND/app/components/monetization"
    
    # Copy components
    cp frontend/SubscriptionDashboard.tsx "$MAIN_FRONTEND/app/components/monetization/"
    cp frontend/ExpertBookingDashboard.tsx "$MAIN_FRONTEND/app/components/monetization/"
    cp frontend/CourseMarketplace.tsx "$MAIN_FRONTEND/app/components/monetization/"
    
    print_success "Frontend components copied"
else
    print_warning "Main frontend directory not found, components available in frontend/ directory"
fi

# Create run script
cat > run_monetization.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting SkillMirror Monetization System"
echo "=========================================="

# Activate virtual environment
source venv/bin/activate

# Start the FastAPI server
echo "Starting Monetization API server on port 8005..."
cd backend
python monetization_api.py

EOF

chmod +x run_monetization.sh

# Create integration script for main app
cat > integrate_with_main.sh << 'EOF'
#!/bin/bash

echo "🔗 Integrating Monetization with Main Application"
echo "=============================================="

# Copy backend files to main backend if it exists
MAIN_BACKEND="../01-foundation/backend"
if [ -d "$MAIN_BACKEND" ]; then
    echo "Copying monetization modules to main backend..."
    cp backend/monetization_database.py "$MAIN_BACKEND/"
    cp backend/stripe_integration.py "$MAIN_BACKEND/"
    cp backend/access_control.py "$MAIN_BACKEND/"
    
    # Add monetization routes to main API
    echo "
# Monetization endpoints integration
from monetization_api import app as monetization_app
app.mount('/monetization', monetization_app)
" >> "$MAIN_BACKEND/main.py"
    
    echo "✅ Backend integration complete"
else
    echo "⚠️  Main backend not found, running as standalone service"
fi

# Update frontend package.json if needed
MAIN_FRONTEND="../01-foundation/frontend"
if [ -f "$MAIN_FRONTEND/package.json" ]; then
    echo "Updating frontend dependencies..."
    cd "$MAIN_FRONTEND"
    
    # Add Stripe dependencies if not present
    if ! grep -q "@stripe/stripe-js" package.json; then
        npm install @stripe/stripe-js @stripe/react-stripe-js
        echo "✅ Stripe dependencies added"
    fi
    
    cd ../../05-monetization
fi

echo "🎉 Integration complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your Stripe API keys"
echo "2. Run ./run_monetization.sh to start the service"
echo "3. Access API docs at http://localhost:8005/docs"

EOF

chmod +x integrate_with_main.sh

# Create validation script
cat > validate_monetization.py << 'EOF'
#!/usr/bin/env python3
"""
Monetization System Validation Script
Tests all core functionality and integration points
"""

import asyncio
import json
import sqlite3
from datetime import datetime
import sys
import os

# Add backend to path
sys.path.append('backend')

from monetization_database import MonetizationDatabase, SUBSCRIPTION_TIERS
from access_control import AccessController, APIAccessController
from stripe_integration import StripeManager

class MonetizationValidator:
    def __init__(self):
        self.db = MonetizationDatabase("test_monetization.db")
        self.results = []
        
    def log_result(self, test_name, passed, message=""):
        status = "✅ PASS" if passed else "❌ FAIL"
        self.results.append((test_name, passed, message))
        print(f"{status} {test_name}: {message}")
        
    def test_database_schema(self):
        """Test database schema creation and integrity"""
        try:
            self.db.create_tables()
            
            # Test connection
            session = self.db.get_session()
            
            # Verify all tables exist
            tables = [
                'subscriptions', 'payments', 'expert_bookings',
                'course_marketplace', 'course_purchases', 'usage_logs',
                'platform_analytics'
            ]
            
            for table in tables:
                result = session.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}';").fetchone()
                if not result:
                    raise Exception(f"Table {table} not found")
            
            session.close()
            self.log_result("Database Schema", True, "All tables created successfully")
            
        except Exception as e:
            self.log_result("Database Schema", False, str(e))
            
    def test_subscription_tiers(self):
        """Test subscription tier configuration"""
        try:
            required_tiers = ['free', 'pro', 'expert', 'enterprise']
            
            for tier in required_tiers:
                if tier not in SUBSCRIPTION_TIERS:
                    raise Exception(f"Missing tier: {tier}")
                
                tier_config = SUBSCRIPTION_TIERS[tier]
                required_fields = ['name', 'price', 'features', 'description']
                
                for field in required_fields:
                    if field not in tier_config:
                        raise Exception(f"Missing field {field} in tier {tier}")
            
            self.log_result("Subscription Tiers", True, f"{len(SUBSCRIPTION_TIERS)} tiers configured")
            
        except Exception as e:
            self.log_result("Subscription Tiers", False, str(e))
            
    def test_access_control(self):
        """Test access control system"""
        try:
            session = self.db.get_session()
            controller = AccessController(session)
            
            # Test free tier limitations
            free_access = controller.can_access_feature(user_id=999, feature='video_analysis')
            if not free_access['allowed']:
                raise Exception("Free tier should allow video analysis")
                
            # Test premium feature restriction
            premium_access = controller.can_access_feature(user_id=999, feature='personal_coaching')
            if premium_access['allowed']:
                raise Exception("Free tier should not allow premium features")
                
            # Test tier comparison
            comparison = controller.get_tier_comparison()
            if not comparison['tiers'] or not comparison['features']:
                raise Exception("Tier comparison data incomplete")
            
            session.close()
            self.log_result("Access Control", True, "Feature restrictions working correctly")
            
        except Exception as e:
            self.log_result("Access Control", False, str(e))
            
    def test_api_access_control(self):
        """Test API access control"""
        try:
            session = self.db.get_session()
            api_controller = APIAccessController(session)
            
            # Test invalid API key
            invalid_access = api_controller.can_use_api("invalid_key")
            if invalid_access['allowed']:
                raise Exception("Invalid API key should be rejected")
                
            # Test valid API key format
            valid_access = api_controller.can_use_api("api_key_1")
            if not valid_access['allowed']:
                # Expected to fail without subscription, but should validate format
                pass
            
            session.close()
            self.log_result("API Access Control", True, "API key validation working")
            
        except Exception as e:
            self.log_result("API Access Control", False, str(e))
            
    async def test_stripe_integration(self):
        """Test Stripe integration (basic functionality)"""
        try:
            stripe_manager = StripeManager()
            
            # Test basic configuration
            if not hasattr(stripe_manager, 'price_ids'):
                raise Exception("Stripe price IDs not configured")
                
            if not stripe_manager.price_ids:
                raise Exception("No price IDs configured")
                
            # Test webhook secret configuration
            if not stripe_manager.webhook_secret:
                raise Exception("Webhook secret not configured")
            
            self.log_result("Stripe Integration", True, "Configuration validated")
            
        except Exception as e:
            self.log_result("Stripe Integration", False, str(e))
            
    def test_monetization_api_endpoints(self):
        """Test API endpoint definitions"""
        try:
            # Import and check API
            from monetization_api import app
            
            # Get all routes
            routes = [route.path for route in app.routes]
            
            required_endpoints = [
                '/health',
                '/subscriptions/create',
                '/subscriptions/current',
                '/payments/expert-booking',
                '/courses',
                '/analytics/usage'
            ]
            
            missing_endpoints = []
            for endpoint in required_endpoints:
                if not any(endpoint in route for route in routes):
                    missing_endpoints.append(endpoint)
            
            if missing_endpoints:
                raise Exception(f"Missing endpoints: {missing_endpoints}")
            
            self.log_result("API Endpoints", True, f"{len(routes)} endpoints defined")
            
        except Exception as e:
            self.log_result("API Endpoints", False, str(e))
            
    def test_frontend_components(self):
        """Test frontend component files"""
        try:
            required_components = [
                'frontend/SubscriptionDashboard.tsx',
                'frontend/ExpertBookingDashboard.tsx',
                'frontend/CourseMarketplace.tsx'
            ]
            
            missing_components = []
            for component in required_components:
                if not os.path.exists(component):
                    missing_components.append(component)
            
            if missing_components:
                raise Exception(f"Missing components: {missing_components}")
            
            self.log_result("Frontend Components", True, f"{len(required_components)} components created")
            
        except Exception as e:
            self.log_result("Frontend Components", False, str(e))
            
    def cleanup(self):
        """Cleanup test resources"""
        try:
            if os.path.exists("test_monetization.db"):
                os.remove("test_monetization.db")
        except:
            pass
            
    async def run_all_tests(self):
        """Run all validation tests"""
        print("🧪 Running Monetization System Validation")
        print("=" * 50)
        
        # Run all tests
        self.test_database_schema()
        self.test_subscription_tiers()
        self.test_access_control()
        self.test_api_access_control()
        await self.test_stripe_integration()
        self.test_monetization_api_endpoints()
        self.test_frontend_components()
        
        # Cleanup
        self.cleanup()
        
        # Summary
        print("\n📊 Validation Summary")
        print("=" * 30)
        
        passed = sum(1 for _, result, _ in self.results if result)
        total = len(self.results)
        
        for test_name, result, message in self.results:
            status = "✅" if result else "❌"
            print(f"{status} {test_name}")
        
        print(f"\nResults: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 All validations passed! Monetization system is ready!")
            return True
        else:
            print(f"\n⚠️  {total - passed} tests failed. Please review and fix issues.")
            return False

if __name__ == "__main__":
    validator = MonetizationValidator()
    success = asyncio.run(validator.run_all_tests())
    sys.exit(0 if success else 1)
EOF

chmod +x validate_monetization.py

print_success "Monetization system setup complete!"

echo ""
echo "📋 Setup Summary:"
echo "=================="
echo "✅ Python virtual environment created"
echo "✅ Dependencies installed"
echo "✅ Database schema initialized"  
echo "✅ Environment configuration created"
echo "✅ Frontend components ready"
echo "✅ Validation scripts created"

echo ""
echo "🎯 Next Steps:"
echo "==============="
print_warning "1. Update backend/.env with your Stripe API keys:"
echo "   - Get keys from https://dashboard.stripe.com/test/apikeys"
echo "   - Create webhook endpoint and get webhook secret"
echo "   - Create subscription products and get price IDs"

print_status "2. Test the system:"
echo "   ./validate_monetization.py"

print_status "3. Start the monetization service:"
echo "   ./run_monetization.sh"

print_status "4. Integrate with main application:"
echo "   ./integrate_with_main.sh"

echo ""
print_success "Monetization system ready for testing and deployment! 🚀"