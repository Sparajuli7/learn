"""
Freemium Access Control System
Manages subscription tiers and feature access restrictions
"""

from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from monetization_database import Subscription, UsageLog, SUBSCRIPTION_TIERS
import logging

logger = logging.getLogger(__name__)

class AccessController:
    """Manages user access based on subscription tiers"""
    
    def __init__(self, db_session: Session):
        self.db = db_session
        self.tiers = SUBSCRIPTION_TIERS
    
    def get_user_subscription(self, user_id: int) -> Optional[Subscription]:
        """Get user's active subscription"""
        return self.db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status == 'active',
            Subscription.end_date > datetime.utcnow()
        ).first()
    
    def get_user_tier(self, user_id: int) -> str:
        """Get user's current subscription tier"""
        subscription = self.get_user_subscription(user_id)
        if subscription:
            return subscription.plan_type
        return 'free'  # Default to free tier
    
    def can_access_feature(self, user_id: int, feature: str) -> Dict[str, Any]:
        """Check if user can access a specific feature"""
        tier = self.get_user_tier(user_id)
        tier_config = self.tiers.get(tier, self.tiers['free'])
        
        # Check feature access
        has_access = feature in tier_config['features']
        
        # For basic features, also check usage limits
        if feature == 'video_analysis':
            usage_check = self._check_analysis_usage(user_id, tier_config)
            has_access = has_access and usage_check['allowed']
            
            return {
                'allowed': has_access,
                'tier': tier,
                'reason': 'Monthly analysis limit exceeded' if not usage_check['allowed'] else 'Access granted',
                'usage_info': usage_check
            }
        
        return {
            'allowed': has_access,
            'tier': tier,
            'reason': f'Feature requires {self._get_required_tier(feature)} tier or higher' if not has_access else 'Access granted'
        }
    
    def _check_analysis_usage(self, user_id: int, tier_config: Dict) -> Dict[str, Any]:
        """Check if user has analysis usage remaining"""
        monthly_limit = tier_config['monthly_analyses']
        
        # Unlimited for paid tiers
        if monthly_limit == -1:
            return {
                'allowed': True,
                'used': 0,
                'limit': 'unlimited',
                'resets_at': None
            }
        
        # Get current month usage
        subscription = self.get_user_subscription(user_id)
        if not subscription:
            # Create a virtual free subscription for tracking
            reset_date = datetime.utcnow().replace(day=1) + timedelta(days=32)
            reset_date = reset_date.replace(day=1)  # First day of next month
            
            used = self._get_monthly_usage(user_id, 'video_analysis')
            
            return {
                'allowed': used < monthly_limit,
                'used': used,
                'limit': monthly_limit,
                'resets_at': reset_date
            }
        
        # Check if reset is needed
        if subscription.monthly_reset_date < datetime.utcnow():
            self._reset_monthly_usage(subscription)
        
        return {
            'allowed': subscription.monthly_analyses_used < monthly_limit,
            'used': subscription.monthly_analyses_used,
            'limit': monthly_limit,
            'resets_at': subscription.monthly_reset_date
        }
    
    def _get_monthly_usage(self, user_id: int, feature_type: str) -> int:
        """Get monthly usage count for free users"""
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        usage_count = self.db.query(UsageLog).filter(
            UsageLog.user_id == user_id,
            UsageLog.feature_type == feature_type,
            UsageLog.usage_date >= start_of_month
        ).count()
        
        return usage_count
    
    def _reset_monthly_usage(self, subscription: Subscription):
        """Reset monthly usage counter"""
        next_month = subscription.monthly_reset_date.replace(day=1) + timedelta(days=32)
        subscription.monthly_reset_date = next_month.replace(day=1)
        subscription.monthly_analyses_used = 0
        self.db.commit()
        logger.info(f"Reset monthly usage for subscription {subscription.id}")
    
    def record_usage(self, user_id: int, feature_type: str, endpoint: str = '', 
                    api_key: str = '', billing_amount: float = 0.0) -> bool:
        """Record feature usage for billing and limits"""
        try:
            # Get subscription
            subscription = self.get_user_subscription(user_id)
            
            # Create usage log
            usage_log = UsageLog(
                user_id=user_id,
                subscription_id=subscription.id if subscription else None,
                feature_type=feature_type,
                endpoint=endpoint,
                api_key=api_key,
                billing_amount=billing_amount,
                billing_period=datetime.utcnow().strftime('%Y-%m')
            )
            
            self.db.add(usage_log)
            
            # Update subscription usage if it's a tracked feature
            if subscription and feature_type == 'video_analysis':
                subscription.monthly_analyses_used += 1
            
            self.db.commit()
            logger.info(f"Recorded usage: {feature_type} for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to record usage: {str(e)}")
            self.db.rollback()
            return False
    
    def _get_required_tier(self, feature: str) -> str:
        """Get the minimum tier required for a feature"""
        for tier_id, tier_config in self.tiers.items():
            if feature in tier_config['features']:
                return tier_config['name']
        return 'Unknown'
    
    def get_tier_comparison(self) -> Dict[str, Any]:
        """Get feature comparison across all tiers"""
        return {
            'tiers': self.tiers,
            'features': {
                'basic_feedback': ['Free', 'Pro', 'Expert', 'Enterprise'],
                'video_upload': ['Free', 'Pro', 'Expert', 'Enterprise'],
                'unlimited_analyses': ['Pro', 'Expert', 'Enterprise'],
                'expert_comparisons': ['Pro', 'Expert', 'Enterprise'],
                'cross_domain_transfers': ['Pro', 'Expert', 'Enterprise'],
                'personal_coaching': ['Expert', 'Enterprise'],
                'advanced_analytics': ['Expert', 'Enterprise'],
                'priority_support': ['Expert', 'Enterprise'],
                'team_management': ['Enterprise'],
                'custom_integrations': ['Enterprise'],
                'dedicated_support': ['Enterprise']
            }
        }
    
    def upgrade_subscription_preview(self, user_id: int, target_tier: str) -> Dict[str, Any]:
        """Preview what upgrading would unlock"""
        current_tier = self.get_user_tier(user_id)
        current_features = set(self.tiers[current_tier]['features'])
        target_features = set(self.tiers[target_tier]['features'])
        
        new_features = target_features - current_features
        
        return {
            'current_tier': current_tier,
            'target_tier': target_tier,
            'price_difference': self.tiers[target_tier]['price'] - self.tiers[current_tier]['price'],
            'new_features': list(new_features),
            'benefits': self._get_feature_benefits(new_features)
        }
    
    def _get_feature_benefits(self, features: set) -> List[str]:
        """Get human-readable benefits for features"""
        benefits_map = {
            'unlimited_analyses': 'Analyze unlimited videos every month',
            'expert_comparisons': 'Compare your performance to industry experts',
            'cross_domain_transfers': 'Transfer skills between different domains',
            'personal_coaching': 'Book 1-on-1 sessions with expert coaches',
            'advanced_analytics': 'Detailed progress tracking and insights',
            'priority_support': 'Get help faster with priority customer support',
            'team_management': 'Manage team members and track group progress',
            'custom_integrations': 'Integrate with your existing tools and workflows',
            'dedicated_support': 'Dedicated customer success manager'
        }
        
        return [benefits_map.get(feature, feature.replace('_', ' ').title()) for feature in features]

class APIAccessController:
    """Manages external API access and billing"""
    
    def __init__(self, db_session: Session):
        self.db = db_session
        self.api_rate = 0.10  # $0.10 per analysis
    
    def validate_api_key(self, api_key: str) -> Optional[int]:
        """Validate API key and return user_id"""
        # In production, this would check against an API keys table
        # For now, using a simple format: api_key_user_id
        try:
            if api_key.startswith('api_key_'):
                user_id = int(api_key.replace('api_key_', ''))
                return user_id
        except ValueError:
            pass
        return None
    
    def can_use_api(self, api_key: str) -> Dict[str, Any]:
        """Check if API key has valid access"""
        user_id = self.validate_api_key(api_key)
        if not user_id:
            return {'allowed': False, 'reason': 'Invalid API key'}
        
        # Check subscription status
        access_controller = AccessController(self.db)
        tier = access_controller.get_user_tier(user_id)
        
        # API access requires Pro tier or higher
        if tier == 'free':
            return {
                'allowed': False, 
                'reason': 'API access requires Pro subscription or higher',
                'current_tier': tier
            }
        
        return {
            'allowed': True,
            'user_id': user_id,
            'tier': tier,
            'rate': self.api_rate
        }
    
    def record_api_usage(self, api_key: str, endpoint: str) -> bool:
        """Record API usage and bill accordingly"""
        access_check = self.can_use_api(api_key)
        if not access_check['allowed']:
            return False
        
        user_id = access_check['user_id']
        access_controller = AccessController(self.db)
        
        return access_controller.record_usage(
            user_id=user_id,
            feature_type='api_analysis',
            endpoint=endpoint,
            api_key=api_key,
            billing_amount=self.api_rate
        )

# Decorators for easy access control
def require_tier(required_tier: str):
    """Decorator to require specific subscription tier"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # This would be used with FastAPI dependency injection
            # Implementation depends on how user context is passed
            return func(*args, **kwargs)
        return wrapper
    return decorator

def require_feature(feature: str):
    """Decorator to require specific feature access"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # This would be used with FastAPI dependency injection
            return func(*args, **kwargs)
        return wrapper
    return decorator

if __name__ == "__main__":
    # Test access control system
    from monetization_database import MonetizationDatabase
    
    print("🔧 Testing Access Control System...")
    
    # Initialize database
    db = MonetizationDatabase("test_monetization.db")
    db.create_tables()
    session = db.get_session()
    
    # Test access controller
    controller = AccessController(session)
    
    # Test free user access
    print("\n👤 Testing Free User Access:")
    free_access = controller.can_access_feature(user_id=1, feature='video_analysis')
    print(f"Video Analysis: {free_access}")
    
    expert_access = controller.can_access_feature(user_id=1, feature='personal_coaching')
    print(f"Personal Coaching: {expert_access}")
    
    # Test tier comparison
    print("\n📊 Tier Comparison:")
    comparison = controller.get_tier_comparison()
    for tier_id, tier in comparison['tiers'].items():
        print(f"{tier['name']}: ${tier['price']}/month - {len(tier['features'])} features")
    
    print("✅ Access Control System working!")
    
    # Cleanup
    session.close()
    import os
    os.remove("test_monetization.db")