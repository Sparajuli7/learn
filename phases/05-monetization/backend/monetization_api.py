"""
SkillMirror Monetization API
FastAPI endpoints for subscriptions, payments, and premium features
"""

from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import os
import json
import logging
from pydantic import BaseModel

# Import our modules
from monetization_database import (
    MonetizationDatabase, Subscription, Payment, ExpertBooking, 
    CourseMarketplace, CoursePurchase, UsageLog, PlatformAnalytics,
    SUBSCRIPTION_TIERS
)
from stripe_integration import StripeManager
from access_control import AccessController, APIAccessController

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SkillMirror Monetization API",
    description="Subscription management, payments, and premium features",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://skillmirror.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
db = MonetizationDatabase("phases/05-monetization/monetization.db")
stripe_manager = StripeManager()
security = HTTPBearer()

# Pydantic models
class SubscriptionCreate(BaseModel):
    plan_type: str
    user_email: str
    user_name: str

class PaymentCreate(BaseModel):
    amount: float
    currency: str = 'usd'
    description: str = ''

class ExpertBookingCreate(BaseModel):
    expert_id: int
    booking_date: datetime
    duration_minutes: int = 60
    notes: str = ''

class CourseCreate(BaseModel):
    title: str
    description: str
    price: float
    skill_category: str
    difficulty_level: str
    duration_hours: float
    course_data: Dict[str, Any]

class CoursePurchaseCreate(BaseModel):
    course_id: int

# Dependency functions
def get_db_session():
    """Get database session"""
    session = db.get_session()
    try:
        yield session
    finally:
        session.close()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """Extract user ID from JWT token (simplified for demo)"""
    # In production, this would validate JWT and extract user_id
    # For demo purposes, we'll use a simple format
    try:
        token = credentials.credentials
        if token.startswith('user_'):
            return int(token.replace('user_', ''))
        raise HTTPException(status_code=401, detail="Invalid token format")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid user token")

def get_access_controller(session: Session = Depends(get_db_session)) -> AccessController:
    """Get access controller instance"""
    return AccessController(session)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "SkillMirror Monetization API",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }

# Subscription Management Endpoints
@app.post("/subscriptions/create")
async def create_subscription(
    subscription_data: SubscriptionCreate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Create a new subscription"""
    try:
        # Validate plan type
        if subscription_data.plan_type not in SUBSCRIPTION_TIERS:
            raise HTTPException(status_code=400, detail="Invalid plan type")
        
        if subscription_data.plan_type == 'free':
            # Free plan doesn't require payment
            subscription = Subscription(
                user_id=user_id,
                plan_type='free',
                status='active',
                end_date=datetime.utcnow() + timedelta(days=365 * 10)  # Long expiry for free
            )
            session.add(subscription)
            session.commit()
            
            return {
                "subscription_id": subscription.id,
                "plan_type": "free",
                "status": "active",
                "message": "Free plan activated"
            }
        
        # Create Stripe customer
        customer = await stripe_manager.create_customer(
            user_email=subscription_data.user_email,
            user_name=subscription_data.user_name,
            user_id=user_id
        )
        
        # Create Stripe subscription
        stripe_subscription = await stripe_manager.create_subscription(
            customer_id=customer['customer_id'],
            plan_type=subscription_data.plan_type,
            user_id=user_id
        )
        
        # Create local subscription record
        subscription = Subscription(
            user_id=user_id,
            plan_type=subscription_data.plan_type,
            status='incomplete',  # Will be updated via webhook
            stripe_subscription_id=stripe_subscription['subscription_id'],
            stripe_customer_id=customer['customer_id'],
            start_date=stripe_subscription['current_period_start'],
            end_date=stripe_subscription['current_period_end']
        )
        
        session.add(subscription)
        session.commit()
        
        return {
            "subscription_id": subscription.id,
            "stripe_subscription_id": stripe_subscription['subscription_id'],
            "client_secret": stripe_subscription['client_secret'],
            "status": stripe_subscription['status']
        }
        
    except Exception as e:
        logger.error(f"Subscription creation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/subscriptions/current")
async def get_current_subscription(
    user_id: int = Depends(get_current_user_id),
    controller: AccessController = Depends(get_access_controller)
):
    """Get user's current subscription details"""
    subscription = controller.get_user_subscription(user_id)
    
    if not subscription:
        return {
            "plan_type": "free",
            "status": "active",
            "features": SUBSCRIPTION_TIERS['free']['features'],
            "monthly_analyses_limit": SUBSCRIPTION_TIERS['free']['monthly_analyses']
        }
    
    return {
        "subscription_id": subscription.id,
        "plan_type": subscription.plan_type,
        "status": subscription.status,
        "start_date": subscription.start_date,
        "end_date": subscription.end_date,
        "monthly_analyses_used": subscription.monthly_analyses_used,
        "features": SUBSCRIPTION_TIERS[subscription.plan_type]['features']
    }

@app.post("/subscriptions/cancel")
async def cancel_subscription(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Cancel user's subscription"""
    subscription = session.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.status == 'active'
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription found")
    
    if subscription.stripe_subscription_id:
        # Cancel Stripe subscription
        stripe_result = await stripe_manager.cancel_subscription(
            subscription.stripe_subscription_id
        )
        
        subscription.status = 'cancelled'
        subscription.end_date = stripe_result['current_period_end']
    else:
        # Free plan
        subscription.status = 'cancelled'
        subscription.end_date = datetime.utcnow()
    
    session.commit()
    
    return {
        "message": "Subscription cancelled successfully",
        "end_date": subscription.end_date
    }

# Payment and Billing Endpoints
@app.post("/payments/expert-booking")
async def create_expert_booking_payment(
    booking_data: ExpertBookingCreate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Create payment for expert consultation booking"""
    try:
        # Get expert rate (would query from experts table in production)
        expert_rate = 150.0  # $150/hour base rate
        total_amount = expert_rate * (booking_data.duration_minutes / 60)
        
        # Get user's Stripe customer ID
        subscription = session.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()
        
        customer_id = subscription.stripe_customer_id if subscription else None
        
        # Create payment intent
        payment_intent = await stripe_manager.create_expert_booking_payment(
            expert_rate=expert_rate,
            duration_hours=booking_data.duration_minutes / 60,
            customer_id=customer_id,
            expert_name=f"Expert {booking_data.expert_id}"
        )
        
        # Create booking record
        booking = ExpertBooking(
            user_id=user_id,
            expert_id=booking_data.expert_id,
            booking_date=booking_data.booking_date,
            duration_minutes=booking_data.duration_minutes,
            amount=total_amount,
            commission_rate=0.20,
            platform_fee=total_amount * 0.20,
            expert_payout=total_amount * 0.80,
            notes=booking_data.notes,
            status='pending_payment'
        )
        
        session.add(booking)
        session.commit()
        
        return {
            "booking_id": booking.id,
            "payment_intent_id": payment_intent['payment_intent_id'],
            "client_secret": payment_intent['client_secret'],
            "amount": total_amount,
            "expert_payout": booking.expert_payout,
            "platform_fee": booking.platform_fee
        }
        
    except Exception as e:
        logger.error(f"Expert booking payment creation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/expert-bookings")
async def get_user_expert_bookings(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Get user's expert consultation bookings"""
    bookings = session.query(ExpertBooking).filter(
        ExpertBooking.user_id == user_id
    ).order_by(ExpertBooking.booking_date.desc()).all()
    
    return [
        {
            "booking_id": booking.id,
            "expert_id": booking.expert_id,
            "booking_date": booking.booking_date,
            "duration_minutes": booking.duration_minutes,
            "amount": booking.amount,
            "status": booking.status,
            "meeting_url": booking.meeting_url,
            "notes": booking.notes
        }
        for booking in bookings
    ]

# Course Marketplace Endpoints
@app.post("/courses/create")
async def create_course(
    course_data: CourseCreate,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Create a new course in the marketplace"""
    course = CourseMarketplace(
        creator_id=user_id,
        title=course_data.title,
        description=course_data.description,
        price=course_data.price,
        skill_category=course_data.skill_category,
        difficulty_level=course_data.difficulty_level,
        duration_hours=course_data.duration_hours,
        course_data=course_data.course_data
    )
    
    session.add(course)
    session.commit()
    
    return {
        "course_id": course.id,
        "title": course.title,
        "price": course.price,
        "status": course.status,
        "message": "Course created successfully"
    }

@app.get("/courses")
async def get_marketplace_courses(
    category: Optional[str] = None,
    difficulty: Optional[str] = None,
    session: Session = Depends(get_db_session)
):
    """Get available courses from marketplace"""
    query = session.query(CourseMarketplace).filter(
        CourseMarketplace.status == 'published'
    )
    
    if category:
        query = query.filter(CourseMarketplace.skill_category == category)
    if difficulty:
        query = query.filter(CourseMarketplace.difficulty_level == difficulty)
    
    courses = query.order_by(CourseMarketplace.is_featured.desc()).all()
    
    return [
        {
            "course_id": course.id,
            "title": course.title,
            "description": course.description,
            "price": course.price,
            "skill_category": course.skill_category,
            "difficulty_level": course.difficulty_level,
            "duration_hours": course.duration_hours,
            "average_rating": course.average_rating,
            "total_sales": course.total_sales,
            "is_featured": course.is_featured
        }
        for course in courses
    ]

@app.post("/courses/{course_id}/purchase")
async def purchase_course(
    course_id: int,
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Purchase a course from the marketplace"""
    try:
        # Get course details
        course = session.query(CourseMarketplace).filter(
            CourseMarketplace.id == course_id,
            CourseMarketplace.status == 'published'
        ).first()
        
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")
        
        # Check if already purchased
        existing_purchase = session.query(CoursePurchase).filter(
            CoursePurchase.user_id == user_id,
            CoursePurchase.course_id == course_id
        ).first()
        
        if existing_purchase:
            raise HTTPException(status_code=400, detail="Course already purchased")
        
        # Get user's Stripe customer ID
        subscription = session.query(Subscription).filter(
            Subscription.user_id == user_id
        ).first()
        
        customer_id = subscription.stripe_customer_id if subscription else None
        
        # Create payment intent
        payment_intent = await stripe_manager.create_course_payment(
            course_price=course.price,
            course_title=course.title,
            customer_id=customer_id
        )
        
        # Create purchase record
        purchase = CoursePurchase(
            user_id=user_id,
            course_id=course_id,
            amount=course.price,
            commission_amount=course.price * course.commission_rate,
            creator_payout=course.price * (1 - course.commission_rate)
        )
        
        session.add(purchase)
        session.commit()
        
        return {
            "purchase_id": purchase.id,
            "payment_intent_id": payment_intent['payment_intent_id'],
            "client_secret": payment_intent['client_secret'],
            "amount": course.price,
            "course_title": course.title
        }
        
    except Exception as e:
        logger.error(f"Course purchase failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Usage Analytics and Billing Dashboard
@app.get("/analytics/usage")
async def get_usage_analytics(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_db_session)
):
    """Get user's usage analytics"""
    # Get current month usage
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    usage_logs = session.query(UsageLog).filter(
        UsageLog.user_id == user_id,
        UsageLog.usage_date >= start_of_month
    ).all()
    
    # Aggregate usage by feature
    usage_summary = {}
    total_billing = 0.0
    
    for log in usage_logs:
        if log.feature_type not in usage_summary:
            usage_summary[log.feature_type] = {
                'count': 0,
                'billing_amount': 0.0
            }
        usage_summary[log.feature_type]['count'] += log.usage_count
        usage_summary[log.feature_type]['billing_amount'] += log.billing_amount
        total_billing += log.billing_amount
    
    return {
        "period": start_of_month.strftime('%Y-%m'),
        "usage_summary": usage_summary,
        "total_api_billing": total_billing,
        "total_usage_events": len(usage_logs)
    }

@app.get("/analytics/revenue")
async def get_revenue_analytics(
    session: Session = Depends(get_db_session)
):
    """Get platform revenue analytics (admin only)"""
    # This would be restricted to admin users in production
    today = datetime.utcnow().date()
    
    # Get recent analytics record
    analytics = session.query(PlatformAnalytics).filter(
        PlatformAnalytics.date >= today
    ).first()
    
    if not analytics:
        # Calculate current metrics
        total_subscriptions = session.query(Subscription).filter(
            Subscription.status == 'active'
        ).count()
        
        total_revenue = session.query(Payment).filter(
            Payment.status == 'completed'
        ).count() * 19  # Simplified calculation
        
        return {
            "date": today,
            "active_subscriptions": total_subscriptions,
            "estimated_monthly_revenue": total_revenue,
            "message": "Live calculated metrics"
        }
    
    return {
        "date": analytics.date,
        "subscription_revenue": analytics.subscription_revenue,
        "expert_booking_revenue": analytics.expert_booking_revenue,
        "course_marketplace_revenue": analytics.course_marketplace_revenue,
        "api_licensing_revenue": analytics.api_licensing_revenue,
        "total_revenue": analytics.total_revenue,
        "active_users": analytics.active_users,
        "new_subscriptions": analytics.new_subscriptions,
        "churn_rate": analytics.churn_rate
    }

# Stripe Webhook Handler
@app.post("/webhooks/stripe")
async def handle_stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_db_session)
):
    """Handle Stripe webhook events"""
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        event_data = await stripe_manager.handle_webhook_event(payload, sig_header)
        
        # Process webhook in background
        background_tasks.add_task(process_webhook_event, event_data, session)
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Webhook processing failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

async def process_webhook_event(event_data: Dict[str, Any], session: Session):
    """Process webhook event in background"""
    try:
        if event_data['status'] == 'payment_succeeded':
            # Update payment record
            payment = session.query(Payment).filter(
                Payment.stripe_payment_intent_id == event_data['payment_intent_id']
            ).first()
            
            if payment:
                payment.status = 'completed'
                session.commit()
                logger.info(f"Payment {payment.id} marked as completed")
        
        elif event_data['status'] == 'subscription_updated':
            # Update subscription status
            subscription = session.query(Subscription).filter(
                Subscription.stripe_subscription_id == event_data['subscription_id']
            ).first()
            
            if subscription:
                subscription.status = event_data['new_status']
                session.commit()
                logger.info(f"Subscription {subscription.id} status updated")
        
    except Exception as e:
        logger.error(f"Background webhook processing failed: {str(e)}")

# Access Control Endpoints
@app.get("/access/check/{feature}")
async def check_feature_access(
    feature: str,
    user_id: int = Depends(get_current_user_id),
    controller: AccessController = Depends(get_access_controller)
):
    """Check if user can access a specific feature"""
    access_result = controller.can_access_feature(user_id, feature)
    return access_result

@app.get("/tiers/comparison")
async def get_tier_comparison(
    controller: AccessController = Depends(get_access_controller)
):
    """Get feature comparison across subscription tiers"""
    return controller.get_tier_comparison()

@app.get("/tiers/upgrade-preview/{target_tier}")
async def preview_upgrade(
    target_tier: str,
    user_id: int = Depends(get_current_user_id),
    controller: AccessController = Depends(get_access_controller)
):
    """Preview benefits of upgrading to a higher tier"""
    return controller.upgrade_subscription_preview(user_id, target_tier)

if __name__ == "__main__":
    import uvicorn
    
    # Create database tables
    db.create_tables()
    
    # Run the API server
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8005,
        reload=True
    )