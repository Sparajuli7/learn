"""
Analytics and Growth Optimization API
FastAPI endpoints for analytics dashboard, user tracking, A/B testing, and viral features
"""

from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timedelta
import json
import asyncio
from analytics_database import AnalyticsDatabase

app = FastAPI(title="SkillMirror Analytics API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database instance
analytics_db = AnalyticsDatabase()

# Pydantic models
class UserEvent(BaseModel):
    user_id: str
    event_type: str
    event_data: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
    platform: Optional[str] = "web"

class AnalyticsMetric(BaseModel):
    metric_name: str
    value: float
    category: str
    date: Optional[str] = None
    dimension_1: Optional[str] = None
    dimension_2: Optional[str] = None

class ExperimentCreate(BaseModel):
    experiment_name: str
    variants: List[str]
    description: Optional[str] = None

class ReferralCreate(BaseModel):
    referrer_id: str
    reward_amount: Optional[float] = 10.0

class ReferralRedeem(BaseModel):
    referral_code: str
    referred_id: str

# Helper function to get client IP
def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

@app.post("/api/analytics/track-event")
async def track_user_event(event: UserEvent, request: Request):
    """Track a user event"""
    try:
        client_ip = get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "")
        
        analytics_db.track_user_event(
            user_id=event.user_id,
            event_type=event.event_type,
            event_data=event.event_data,
            session_id=event.session_id,
            platform=event.platform,
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        return {"status": "success", "message": "Event tracked successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics/record-metric")
async def record_metric(metric: AnalyticsMetric):
    """Record an analytics metric"""
    try:
        analytics_db.record_metric(
            metric_name=metric.metric_name,
            value=metric.value,
            category=metric.category,
            date=metric.date,
            dimension_1=metric.dimension_1,
            dimension_2=metric.dimension_2
        )
        
        return {"status": "success", "message": "Metric recorded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/dashboard")
async def get_analytics_dashboard(days: int = 30):
    """Get comprehensive analytics dashboard data"""
    try:
        dashboard_data = analytics_db.get_analytics_dashboard_data(days)
        
        # Calculate additional insights
        viral_coefficient = analytics_db.calculate_viral_coefficient(days)
        
        dashboard_data['insights'] = {
            'viral_coefficient': viral_coefficient,
            'growth_rate': calculate_growth_rate(dashboard_data['growth']),
            'engagement_score': calculate_engagement_score(dashboard_data['engagement'])
        }
        
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/user-behavior/{user_id}")
async def get_user_behavior(user_id: str):
    """Get detailed user behavior analysis"""
    try:
        behavior_data = analytics_db.get_user_behavior_analysis(user_id)
        return behavior_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/experiments/create")
async def create_experiment(experiment: ExperimentCreate):
    """Create a new A/B testing experiment"""
    try:
        experiments = analytics_db.create_experiment(
            experiment_name=experiment.experiment_name,
            variants=experiment.variants
        )
        
        # Track experiment creation
        analytics_db.track_user_event(
            user_id="system",
            event_type="experiment_created",
            event_data={
                "experiment_name": experiment.experiment_name,
                "variants": experiment.variants,
                "description": experiment.description
            }
        )
        
        return {
            "status": "success",
            "experiments": experiments,
            "message": f"Experiment '{experiment.experiment_name}' created with {len(experiment.variants)} variants"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/experiments/assign/{user_id}/{experiment_name}")
async def assign_experiment_variant(user_id: str, experiment_name: str):
    """Assign user to experiment variant"""
    try:
        variant = analytics_db.assign_experiment_variant(user_id, experiment_name)
        
        # Track experiment assignment
        analytics_db.track_user_event(
            user_id=user_id,
            event_type="experiment_assigned",
            event_data={
                "experiment_name": experiment_name,
                "variant": variant
            }
        )
        
        return {
            "experiment_name": experiment_name,
            "variant": variant,
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/referrals/create")
async def create_referral(referral: ReferralCreate):
    """Create a new referral code"""
    try:
        referral_code = analytics_db.create_referral(
            referrer_id=referral.referrer_id,
            reward_amount=referral.reward_amount
        )
        
        # Track referral creation
        analytics_db.track_user_event(
            user_id=referral.referrer_id,
            event_type="referral_created",
            event_data={
                "referral_code": referral_code,
                "reward_amount": referral.reward_amount
            }
        )
        
        return {
            "status": "success",
            "referral_code": referral_code,
            "reward_amount": referral.reward_amount
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/referrals/redeem")
async def redeem_referral(redemption: ReferralRedeem):
    """Redeem a referral code"""
    try:
        success = analytics_db.process_referral(
            referral_code=redemption.referral_code,
            referred_id=redemption.referred_id
        )
        
        if success:
            return {
                "status": "success",
                "message": "Referral redeemed successfully",
                "referral_code": redemption.referral_code
            }
        else:
            return {
                "status": "error",
                "message": "Invalid or already used referral code"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/growth/viral-coefficient")
async def get_viral_coefficient(days: int = 30):
    """Get viral coefficient for specified period"""
    try:
        coefficient = analytics_db.calculate_viral_coefficient(days)
        return {
            "viral_coefficient": coefficient,
            "period_days": days,
            "interpretation": interpret_viral_coefficient(coefficient)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/real-time-metrics")
async def get_real_time_metrics():
    """Get real-time analytics metrics"""
    try:
        # Get metrics from last hour
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=1)
        
        import sqlite3
        conn = sqlite3.connect(analytics_db.db_path)
        cursor = conn.cursor()
        
        # Active users in last hour
        cursor.execute('''
            SELECT COUNT(DISTINCT user_id) as active_users
            FROM user_events 
            WHERE timestamp >= ?
        ''', (start_time,))
        active_users = cursor.fetchone()[0]
        
        # Events in last hour
        cursor.execute('''
            SELECT COUNT(*) as events_count
            FROM user_events 
            WHERE timestamp >= ?
        ''', (start_time,))
        events_count = cursor.fetchone()[0]
        
        # Top events in last hour
        cursor.execute('''
            SELECT event_type, COUNT(*) as count
            FROM user_events 
            WHERE timestamp >= ?
            GROUP BY event_type 
            ORDER BY count DESC 
            LIMIT 5
        ''', (start_time,))
        top_events = cursor.fetchall()
        
        conn.close()
        
        return {
            "timestamp": end_time.isoformat(),
            "active_users_last_hour": active_users,
            "events_last_hour": events_count,
            "top_events": [{"event_type": event[0], "count": event[1]} for event in top_events]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/performance-metrics")
async def get_performance_metrics():
    """Get system performance metrics"""
    try:
        import psutil
        import time
        
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Database performance
        db_start = time.time()
        analytics_db.get_analytics_dashboard_data(1)  # Quick query
        db_response_time = (time.time() - db_start) * 1000  # Convert to ms
        
        return {
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "disk_percent": disk.percent
            },
            "database": {
                "response_time_ms": round(db_response_time, 2)
            },
            "api": {
                "status": "healthy"
            }
        }
    except Exception as e:
        # If psutil not available, return basic metrics
        return {
            "system": {
                "status": "metrics_unavailable"
            },
            "database": {
                "status": "healthy"
            },
            "api": {
                "status": "healthy"
            }
        }

# Helper functions
def calculate_growth_rate(growth_data: Dict) -> float:
    """Calculate user growth rate"""
    if growth_data['total_users'] == 0:
        return 0.0
    return (growth_data['new_users'] / growth_data['total_users']) * 100

def calculate_engagement_score(engagement_data: Dict) -> float:
    """Calculate engagement score based on events per user"""
    daily_data = engagement_data['daily_data']
    if not daily_data:
        return 0.0
    
    total_users = sum(day[1] for day in daily_data)  # daily_active_users
    total_events = sum(day[2] for day in daily_data)  # total_events
    
    if total_users == 0:
        return 0.0
    
    return round(total_events / total_users, 2)

def interpret_viral_coefficient(coefficient: float) -> str:
    """Interpret viral coefficient value"""
    if coefficient >= 1.0:
        return "Excellent - Viral growth achieved!"
    elif coefficient >= 0.5:
        return "Good - Strong referral activity"
    elif coefficient >= 0.2:
        return "Fair - Moderate referral activity"
    else:
        return "Low - Needs improvement"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)