"""
Mobile API Database Schema
Handles API tokens, mobile sessions, and API usage tracking for third-party integrations
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, timedelta
import os
import secrets
import hashlib
import json

Base = declarative_base()

class APIToken(Base):
    """API token management for third-party access"""
    __tablename__ = 'api_tokens'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    token = Column(String(100), unique=True, nullable=False)
    token_hash = Column(String(64), nullable=False)  # SHA-256 hash of token
    name = Column(String(100), nullable=False)  # Human-readable name
    permissions = Column(JSON, nullable=False, default={})  # {'video_analysis': True, 'expert_comparison': False}
    rate_limit = Column(Integer, default=1000)  # Requests per hour
    usage_count = Column(Integer, default=0)
    last_used = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    api_logs = relationship("APILog", back_populates="api_token")
    
    @classmethod
    def generate_token(cls, user_id, name, permissions, rate_limit=1000, expires_days=365):
        """Generate a new API token"""
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(days=expires_days) if expires_days else None
        
        return cls(
            user_id=user_id,
            token=token,
            token_hash=token_hash,
            name=name,
            permissions=permissions,
            rate_limit=rate_limit,
            expires_at=expires_at
        )

class APILog(Base):
    """API usage logging for analytics and rate limiting"""
    __tablename__ = 'api_logs'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    api_token_id = Column(Integer, ForeignKey('api_tokens.id'), nullable=True)
    endpoint = Column(String(200), nullable=False)
    method = Column(String(10), nullable=False)  # GET, POST, PUT, DELETE
    ip_address = Column(String(45), nullable=False)  # Support IPv6
    user_agent = Column(Text, nullable=True)
    request_data = Column(JSON, nullable=True)  # Request payload (sanitized)
    response_time = Column(Float, nullable=False)  # Response time in seconds
    status_code = Column(Integer, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    api_token = relationship("APIToken", back_populates="api_logs")

class MobileSession(Base):
    """Mobile app session tracking"""
    __tablename__ = 'mobile_sessions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    session_id = Column(String(100), unique=True, nullable=False)
    device_info = Column(JSON, nullable=False)  # Device type, OS, app version
    session_data = Column(JSON, nullable=True)  # Session-specific data
    is_active = Column(Boolean, default=True)
    last_activity = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    
    # Performance metrics
    network_type = Column(String(20), nullable=True)  # 'wifi', '4g', '5g'
    battery_level = Column(Integer, nullable=True)  # 0-100
    app_version = Column(String(20), nullable=True)
    os_version = Column(String(50), nullable=True)
    
    @classmethod
    def create_session(cls, user_id, device_info):
        """Create a new mobile session"""
        session_id = secrets.token_urlsafe(16)
        return cls(
            user_id=user_id,
            session_id=session_id,
            device_info=device_info
        )

class APIUsageStats(Base):
    """Aggregated API usage statistics for analytics"""
    __tablename__ = 'api_usage_stats'
    
    id = Column(Integer, primary_key=True)
    date = Column(DateTime, nullable=False, index=True)
    endpoint = Column(String(200), nullable=False)
    total_requests = Column(Integer, default=0)
    successful_requests = Column(Integer, default=0)
    failed_requests = Column(Integer, default=0)
    avg_response_time = Column(Float, default=0.0)
    unique_users = Column(Integer, default=0)
    unique_tokens = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class MobileApiDatabase:
    """Database manager for mobile API system"""
    
    def __init__(self, db_path="phases/06-mobile-api/mobile_api.db"):
        self.db_path = db_path
        self.engine = create_engine(f'sqlite:///{db_path}')
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        self.create_tables()
    
    def create_tables(self):
        """Create all tables"""
        Base.metadata.create_all(bind=self.engine)
    
    def get_session(self):
        """Get database session"""
        return self.SessionLocal()
    
    def create_api_token(self, user_id, name, permissions, rate_limit=1000, expires_days=365):
        """Create a new API token"""
        with self.get_session() as db:
            token = APIToken.generate_token(user_id, name, permissions, rate_limit, expires_days)
            db.add(token)
            db.commit()
            db.refresh(token)
            return token
    
    def validate_token(self, token_string):
        """Validate API token and return token object"""
        token_hash = hashlib.sha256(token_string.encode()).hexdigest()
        
        with self.get_session() as db:
            token = db.query(APIToken).filter(
                APIToken.token_hash == token_hash,
                APIToken.is_active == True
            ).first()
            
            if not token:
                return None
            
            # Check if token is expired
            if token.expires_at and token.expires_at < datetime.utcnow():
                return None
            
            return token
    
    def log_api_request(self, user_id, api_token_id, endpoint, method, ip_address, 
                       response_time, status_code, user_agent=None, 
                       request_data=None, error_message=None):
        """Log API request for analytics"""
        with self.get_session() as db:
            log = APILog(
                user_id=user_id,
                api_token_id=api_token_id,
                endpoint=endpoint,
                method=method,
                ip_address=ip_address,
                user_agent=user_agent,
                request_data=request_data,
                response_time=response_time,
                status_code=status_code,
                error_message=error_message
            )
            db.add(log)
            db.commit()
    
    def create_mobile_session(self, user_id, device_info):
        """Create a new mobile session"""
        with self.get_session() as db:
            session = MobileSession.create_session(user_id, device_info)
            db.add(session)
            db.commit()
            db.refresh(session)
            return session
    
    def update_mobile_session(self, session_id, session_data=None, 
                             network_type=None, battery_level=None):
        """Update mobile session data"""
        with self.get_session() as db:
            session = db.query(MobileSession).filter(
                MobileSession.session_id == session_id,
                MobileSession.is_active == True
            ).first()
            
            if session:
                if session_data:
                    session.session_data = session_data
                if network_type:
                    session.network_type = network_type
                if battery_level is not None:
                    session.battery_level = battery_level
                
                session.last_activity = datetime.utcnow()
                db.commit()
                return session
            
            return None
    
    def end_mobile_session(self, session_id):
        """End a mobile session"""
        with self.get_session() as db:
            session = db.query(MobileSession).filter(
                MobileSession.session_id == session_id
            ).first()
            
            if session:
                session.is_active = False
                session.ended_at = datetime.utcnow()
                db.commit()
                return session
            
            return None
    
    def get_api_usage_stats(self, start_date=None, end_date=None, endpoint=None):
        """Get API usage statistics"""
        with self.get_session() as db:
            query = db.query(APIUsageStats)
            
            if start_date:
                query = query.filter(APIUsageStats.date >= start_date)
            if end_date:
                query = query.filter(APIUsageStats.date <= end_date)
            if endpoint:
                query = query.filter(APIUsageStats.endpoint == endpoint)
            
            return query.all()

# Initialize database on import
if __name__ == "__main__":
    db = MobileApiDatabase()
    print("✅ Mobile API Database initialized successfully!")