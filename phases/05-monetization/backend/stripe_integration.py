"""
Stripe Integration for SkillMirror Monetization
Handles payments, subscriptions, and webhook events
"""

import stripe
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import HTTPException
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StripeManager:
    def __init__(self):
        # Initialize Stripe with API keys
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_...')  # Use test key for development
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET', 'whsec_...')
        
        # Price IDs for subscription tiers (would be created in Stripe Dashboard)
        self.price_ids = {
            'pro': os.getenv('STRIPE_PRO_PRICE_ID', 'price_pro_monthly'),
            'expert': os.getenv('STRIPE_EXPERT_PRICE_ID', 'price_expert_monthly'),
            'enterprise': os.getenv('STRIPE_ENTERPRISE_PRICE_ID', 'price_enterprise_monthly')
        }
        
    async def create_customer(self, user_email: str, user_name: str, user_id: int) -> Dict[str, Any]:
        """Create a new Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=user_email,
                name=user_name,
                metadata={'skillmirror_user_id': str(user_id)}
            )
            
            logger.info(f"Created Stripe customer: {customer.id} for user {user_id}")
            return {
                'customer_id': customer.id,
                'email': customer.email,
                'name': customer.name
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe customer creation failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Payment system error: {str(e)}")
    
    async def create_subscription(self, customer_id: str, plan_type: str, user_id: int) -> Dict[str, Any]:
        """Create a new subscription"""
        try:
            if plan_type not in self.price_ids:
                raise HTTPException(status_code=400, detail=f"Invalid plan type: {plan_type}")
            
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{'price': self.price_ids[plan_type]}],
                payment_behavior='default_incomplete',
                payment_settings={'save_default_payment_method': 'on_subscription'},
                expand=['latest_invoice.payment_intent'],
                metadata={'skillmirror_user_id': str(user_id), 'plan_type': plan_type}
            )
            
            logger.info(f"Created subscription: {subscription.id} for user {user_id}")
            
            return {
                'subscription_id': subscription.id,
                'client_secret': subscription.latest_invoice.payment_intent.client_secret,
                'status': subscription.status,
                'current_period_start': datetime.fromtimestamp(subscription.current_period_start),
                'current_period_end': datetime.fromtimestamp(subscription.current_period_end)
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Subscription creation failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Subscription error: {str(e)}")
    
    async def cancel_subscription(self, subscription_id: str) -> Dict[str, Any]:
        """Cancel a subscription"""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            
            logger.info(f"Cancelled subscription: {subscription_id}")
            
            return {
                'subscription_id': subscription.id,
                'status': subscription.status,
                'cancel_at_period_end': subscription.cancel_at_period_end,
                'current_period_end': datetime.fromtimestamp(subscription.current_period_end)
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Subscription cancellation failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Cancellation error: {str(e)}")
    
    async def create_payment_intent(self, amount: float, currency: str = 'usd', 
                                  customer_id: Optional[str] = None, 
                                  description: str = '') -> Dict[str, Any]:
        """Create a payment intent for one-time payments (expert bookings, courses)"""
        try:
            intent_data = {
                'amount': int(amount * 100),  # Convert to cents
                'currency': currency,
                'description': description,
                'automatic_payment_methods': {'enabled': True}
            }
            
            if customer_id:
                intent_data['customer'] = customer_id
            
            payment_intent = stripe.PaymentIntent.create(**intent_data)
            
            logger.info(f"Created payment intent: {payment_intent.id} for ${amount}")
            
            return {
                'payment_intent_id': payment_intent.id,
                'client_secret': payment_intent.client_secret,
                'amount': amount,
                'status': payment_intent.status
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Payment intent creation failed: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    
    async def create_expert_booking_payment(self, expert_rate: float, duration_hours: float,
                                          customer_id: str, expert_name: str) -> Dict[str, Any]:
        """Create payment for expert consultation booking"""
        total_amount = expert_rate * duration_hours
        description = f"Expert consultation with {expert_name} ({duration_hours}h)"
        
        return await self.create_payment_intent(
            amount=total_amount,
            customer_id=customer_id,
            description=description
        )
    
    async def create_course_payment(self, course_price: float, course_title: str,
                                  customer_id: str) -> Dict[str, Any]:
        """Create payment for course purchase"""
        description = f"Course purchase: {course_title}"
        
        return await self.create_payment_intent(
            amount=course_price,
            customer_id=customer_id,
            description=description
        )
    
    async def get_subscription_status(self, subscription_id: str) -> Dict[str, Any]:
        """Get current subscription status"""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            return {
                'subscription_id': subscription.id,
                'status': subscription.status,
                'current_period_start': datetime.fromtimestamp(subscription.current_period_start),
                'current_period_end': datetime.fromtimestamp(subscription.current_period_end),
                'cancel_at_period_end': subscription.cancel_at_period_end,
                'plan_type': subscription.metadata.get('plan_type', 'unknown')
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Subscription status retrieval failed: {str(e)}")
            raise HTTPException(status_code=404, detail=f"Subscription not found: {str(e)}")
    
    async def handle_webhook_event(self, payload: bytes, sig_header: str) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            
            logger.info(f"Received webhook event: {event['type']}")
            
            # Handle different event types
            if event['type'] == 'payment_intent.succeeded':
                return await self._handle_payment_success(event['data']['object'])
            elif event['type'] == 'payment_intent.payment_failed':
                return await self._handle_payment_failure(event['data']['object'])
            elif event['type'] == 'customer.subscription.created':
                return await self._handle_subscription_created(event['data']['object'])
            elif event['type'] == 'customer.subscription.updated':
                return await self._handle_subscription_updated(event['data']['object'])
            elif event['type'] == 'customer.subscription.deleted':
                return await self._handle_subscription_cancelled(event['data']['object'])
            elif event['type'] == 'invoice.payment_succeeded':
                return await self._handle_invoice_payment_success(event['data']['object'])
            
            return {'status': 'event_ignored', 'type': event['type']}
            
        except ValueError as e:
            logger.error(f"Invalid webhook payload: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid webhook signature: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid signature")
    
    async def _handle_payment_success(self, payment_intent: Dict[str, Any]) -> Dict[str, Any]:
        """Handle successful payment"""
        logger.info(f"Payment succeeded: {payment_intent['id']}")
        
        return {
            'status': 'payment_succeeded',
            'payment_intent_id': payment_intent['id'],
            'amount': payment_intent['amount'] / 100,
            'customer_id': payment_intent.get('customer')
        }
    
    async def _handle_payment_failure(self, payment_intent: Dict[str, Any]) -> Dict[str, Any]:
        """Handle failed payment"""
        logger.warning(f"Payment failed: {payment_intent['id']}")
        
        return {
            'status': 'payment_failed',
            'payment_intent_id': payment_intent['id'],
            'amount': payment_intent['amount'] / 100,
            'failure_reason': payment_intent.get('last_payment_error', {}).get('message', 'Unknown error')
        }
    
    async def _handle_subscription_created(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """Handle new subscription creation"""
        logger.info(f"Subscription created: {subscription['id']}")
        
        return {
            'status': 'subscription_created',
            'subscription_id': subscription['id'],
            'customer_id': subscription['customer'],
            'status': subscription['status']
        }
    
    async def _handle_subscription_updated(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """Handle subscription updates"""
        logger.info(f"Subscription updated: {subscription['id']}")
        
        return {
            'status': 'subscription_updated',
            'subscription_id': subscription['id'],
            'customer_id': subscription['customer'],
            'new_status': subscription['status']
        }
    
    async def _handle_subscription_cancelled(self, subscription: Dict[str, Any]) -> Dict[str, Any]:
        """Handle subscription cancellation"""
        logger.info(f"Subscription cancelled: {subscription['id']}")
        
        return {
            'status': 'subscription_cancelled',
            'subscription_id': subscription['id'],
            'customer_id': subscription['customer']
        }
    
    async def _handle_invoice_payment_success(self, invoice: Dict[str, Any]) -> Dict[str, Any]:
        """Handle successful subscription payment"""
        logger.info(f"Invoice payment succeeded: {invoice['id']}")
        
        return {
            'status': 'invoice_payment_succeeded',
            'invoice_id': invoice['id'],
            'subscription_id': invoice['subscription'],
            'amount_paid': invoice['amount_paid'] / 100
        }

# Usage example and testing
if __name__ == "__main__":
    import asyncio
    
    async def test_stripe_integration():
        """Test basic Stripe functionality"""
        stripe_manager = StripeManager()
        
        print("🔧 Testing Stripe Integration...")
        
        # Test customer creation
        try:
            customer = await stripe_manager.create_customer(
                user_email="test@skillmirror.com",
                user_name="Test User",
                user_id=1
            )
            print(f"✅ Customer created: {customer['customer_id']}")
            
            # Test payment intent creation
            payment = await stripe_manager.create_payment_intent(
                amount=49.99,
                description="Test expert consultation",
                customer_id=customer['customer_id']
            )
            print(f"✅ Payment intent created: {payment['payment_intent_id']}")
            
        except Exception as e:
            print(f"❌ Stripe test failed: {str(e)}")
            print("💡 Make sure to set STRIPE_SECRET_KEY environment variable")
    
    # Run test
    asyncio.run(test_stripe_integration())