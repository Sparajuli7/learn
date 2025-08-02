"""
SkillMirror Monetization Database Schema
Handles subscriptions, payments, expert bookings, and course marketplace
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

Base = declarative_base()

class Subscription(Base):
    """User subscription management"""
    __tablename__ = 'subscriptions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    plan_type = Column(String(20), nullable=False)  # free, pro, expert, enterprise
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime)
    status = Column(String(20), default='active')  # active, cancelled, expired, paused
    stripe_subscription_id = Column(String(100), unique=True)
    stripe_customer_id = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Usage tracking
    monthly_analyses_used = Column(Integer, default=0)
    monthly_reset_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    payments = relationship("Payment", back_populates="subscription")
    usage_logs = relationship("UsageLog", back_populates="subscription")

class Payment(Base):
    """Payment transaction records"""
    __tablename__ = 'payments'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    subscription_id = Column(Integer, ForeignKey('subscriptions.id'))
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default='USD')
    payment_method = Column(String(50))  # card, bank_transfer, etc.
    status = Column(String(20), nullable=False)  # pending, completed, failed, refunded
    stripe_payment_intent_id = Column(String(100), unique=True)
    stripe_charge_id = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Payment details
    description = Column(String(500))
    invoice_url = Column(String(500))
    receipt_url = Column(String(500))
    
    # Relationships
    subscription = relationship("Subscription", back_populates="payments")

class ExpertBooking(Base):
    """Expert consultation bookings and commissions"""
    __tablename__ = 'expert_bookings'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    expert_id = Column(Integer, ForeignKey('experts.id'), nullable=False)
    booking_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    status = Column(String(20), default='pending')  # pending, confirmed, completed, cancelled
    amount = Column(Float, nullable=False)
    commission_rate = Column(Float, default=0.20)  # 20% platform commission
    platform_fee = Column(Float)  # Calculated: amount * commission_rate
    expert_payout = Column(Float)  # Calculated: amount - platform_fee
    
    # Booking details
    meeting_type = Column(String(20), default='video')  # video, phone, in_person
    meeting_url = Column(String(500))
    notes = Column(Text)
    special_requirements = Column(Text)
    
    # Payment tracking
    payment_id = Column(Integer, ForeignKey('payments.id'))
    payout_status = Column(String(20), default='pending')  # pending, processed, completed
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CourseMarketplace(Base):
    """Course marketplace with commission tracking"""
    __tablename__ = 'course_marketplace'
    
    id = Column(Integer, primary_key=True)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    price = Column(Float, nullable=False)
    commission_rate = Column(Float, default=0.15)  # 15% platform commission
    
    # Course content
    course_data = Column(JSON)  # Modules, lessons, videos, etc.
    skill_category = Column(String(50))  # public_speaking, dance, cooking, etc.
    difficulty_level = Column(String(20))  # beginner, intermediate, advanced
    duration_hours = Column(Float)
    
    # Course status
    status = Column(String(20), default='draft')  # draft, published, suspended
    is_featured = Column(Boolean, default=False)
    
    # Analytics
    total_sales = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    average_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    purchases = relationship("CoursePurchase", back_populates="course")

class CoursePurchase(Base):
    """Course purchase transactions"""
    __tablename__ = 'course_purchases'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    course_id = Column(Integer, ForeignKey('course_marketplace.id'), nullable=False)
    amount = Column(Float, nullable=False)
    commission_amount = Column(Float)  # Platform commission
    creator_payout = Column(Float)  # Amount paid to creator
    
    # Purchase details
    payment_id = Column(Integer, ForeignKey('payments.id'))
    purchase_date = Column(DateTime, default=datetime.utcnow)
    access_granted = Column(Boolean, default=True)
    completion_percentage = Column(Float, default=0.0)
    
    # Relationships
    course = relationship("CourseMarketplace", back_populates="purchases")

class UsageLog(Base):
    """Track API and feature usage for billing"""
    __tablename__ = 'usage_logs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    subscription_id = Column(Integer, ForeignKey('subscriptions.id'))
    
    # Usage details
    feature_type = Column(String(50), nullable=False)  # analysis, expert_comparison, cross_domain, etc.
    endpoint = Column(String(100))
    usage_count = Column(Integer, default=1)
    
    # API usage (for external API licensing)
    api_key = Column(String(100))
    billing_amount = Column(Float, default=0.0)  # $0.10 per analysis
    
    # Timestamps
    usage_date = Column(DateTime, default=datetime.utcnow)
    billing_period = Column(String(7))  # YYYY-MM format
    
    # Relationships
    subscription = relationship("Subscription", back_populates="usage_logs")

class PlatformAnalytics(Base):
    """Platform-wide revenue and usage analytics"""
    __tablename__ = 'platform_analytics'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, nullable=False)
    
    # Revenue metrics
    subscription_revenue = Column(Float, default=0.0)
    expert_booking_revenue = Column(Float, default=0.0)
    course_marketplace_revenue = Column(Float, default=0.0)
    api_licensing_revenue = Column(Float, default=0.0)
    total_revenue = Column(Float, default=0.0)
    
    # Usage metrics
    active_users = Column(Integer, default=0)
    new_subscriptions = Column(Integer, default=0)
    cancelled_subscriptions = Column(Integer, default=0)
    total_analyses = Column(Integer, default=0)
    total_bookings = Column(Integer, default=0)
    total_course_sales = Column(Integer, default=0)
    
    # Conversion metrics
    free_to_paid_conversion_rate = Column(Float, default=0.0)
    churn_rate = Column(Float, default=0.0)
    
    created_at = Column(DateTime, default=datetime.utcnow)

# Database connection and session management
class MonetizationDatabase:
    def __init__(self, db_path="monetization.db"):
        self.engine = create_engine(f'sqlite:///{db_path}', echo=False)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
    def create_tables(self):
        """Create all monetization tables"""
        Base.metadata.create_all(bind=self.engine)
        print("✅ Monetization database tables created successfully")
        
    def get_session(self):
        """Get database session"""
        return self.SessionLocal()
        
    def close_session(self, session):
        """Close database session"""
        session.close()

# Subscription tier definitions
SUBSCRIPTION_TIERS = {
    'free': {
        'name': 'Free',
        'price': 0,
        'monthly_analyses': 3,
        'features': ['basic_feedback', 'video_upload'],
        'description': '3 analyses per month, basic feedback'
    },
    'pro': {
        'name': 'Pro',
        'price': 19,
        'monthly_analyses': -1,  # Unlimited
        'features': ['unlimited_analyses', 'expert_comparisons', 'cross_domain_transfers'],
        'description': 'Unlimited analyses, expert comparisons, cross-domain transfers'
    },
    'expert': {
        'name': 'Expert',
        'price': 49,
        'monthly_analyses': -1,  # Unlimited
        'features': ['all_pro_features', 'personal_coaching', 'advanced_analytics', 'priority_support'],
        'description': 'Personal coaching, advanced analytics, priority support'
    },
    'enterprise': {
        'name': 'Enterprise',
        'price': 199,
        'monthly_analyses': -1,  # Unlimited
        'features': ['all_expert_features', 'team_management', 'custom_integrations', 'dedicated_support'],
        'description': 'Team features, custom integrations, dedicated support'
    }
}

if __name__ == "__main__":
    # Initialize database
    db = MonetizationDatabase("phases/05-monetization/monetization.db")
    db.create_tables()
    
    print("🎉 Monetization database schema ready!")
    print("\n📊 Subscription Tiers:")
    for tier_id, tier in SUBSCRIPTION_TIERS.items():
        print(f"  {tier['name']}: ${tier['price']}/month - {tier['description']}")