"""
Analytics and Growth Database Schema
Handles user events, analytics metrics, growth experiments, and referrals
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import uuid

class AnalyticsDatabase:
    def __init__(self, db_path: str = "analytics.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database with analytics tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # User Events table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                event_data TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                session_id TEXT,
                platform TEXT DEFAULT 'web',
                ip_address TEXT,
                user_agent TEXT
            )
        ''')
        
        # Analytics metrics table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date DATE NOT NULL,
                metric_name TEXT NOT NULL,
                value REAL NOT NULL,
                category TEXT NOT NULL,
                dimension_1 TEXT,
                dimension_2 TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Growth experiments table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS growth_experiments (
                id TEXT PRIMARY KEY,
                experiment_name TEXT NOT NULL,
                variant TEXT NOT NULL,
                results TEXT,
                conversion_rate REAL,
                participants INTEGER DEFAULT 0,
                start_date DATETIME,
                end_date DATETIME,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Referrals table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS referrals (
                id TEXT PRIMARY KEY,
                referrer_id TEXT NOT NULL,
                referred_id TEXT,
                referral_code TEXT UNIQUE,
                reward_status TEXT DEFAULT 'pending',
                reward_amount REAL DEFAULT 0,
                conversion_date DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # User cohorts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_cohorts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                cohort_month TEXT NOT NULL,
                registration_date DATETIME,
                first_purchase_date DATETIME,
                ltv REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create indexes for performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_events_timestamp ON user_events(timestamp)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_analytics_metric ON analytics(metric_name)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code)')
        
        conn.commit()
        conn.close()
    
    def track_user_event(self, user_id: str, event_type: str, event_data: Dict = None, 
                        session_id: str = None, platform: str = 'web', 
                        ip_address: str = None, user_agent: str = None):
        """Track a user event"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO user_events 
            (user_id, event_type, event_data, session_id, platform, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id, event_type, 
            json.dumps(event_data) if event_data else None,
            session_id, platform, ip_address, user_agent
        ))
        
        conn.commit()
        conn.close()
    
    def record_metric(self, metric_name: str, value: float, category: str,
                     date: str = None, dimension_1: str = None, dimension_2: str = None):
        """Record an analytics metric"""
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO analytics 
            (date, metric_name, value, category, dimension_1, dimension_2)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (date, metric_name, value, category, dimension_1, dimension_2))
        
        conn.commit()
        conn.close()
    
    def create_experiment(self, experiment_name: str, variants: List[str]):
        """Create a new A/B testing experiment"""
        experiments = []
        for variant in variants:
            experiment_id = str(uuid.uuid4())
            experiments.append({
                'id': experiment_id,
                'name': experiment_name,
                'variant': variant
            })
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        for exp in experiments:
            cursor.execute('''
                INSERT INTO growth_experiments 
                (id, experiment_name, variant, start_date)
                VALUES (?, ?, ?, ?)
            ''', (exp['id'], exp['name'], exp['variant'], datetime.now()))
        
        conn.commit()
        conn.close()
        return experiments
    
    def assign_experiment_variant(self, user_id: str, experiment_name: str) -> str:
        """Assign user to experiment variant using hash-based assignment"""
        import hashlib
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get available variants
        cursor.execute('''
            SELECT variant FROM growth_experiments 
            WHERE experiment_name = ? AND status = 'active'
        ''', (experiment_name,))
        
        variants = [row[0] for row in cursor.fetchall()]
        conn.close()
        
        if not variants:
            return 'control'
        
        # Hash-based assignment for consistency
        hash_value = int(hashlib.md5(f"{user_id}_{experiment_name}".encode()).hexdigest(), 16)
        variant_index = hash_value % len(variants)
        
        return variants[variant_index]
    
    def create_referral(self, referrer_id: str, reward_amount: float = 10.0) -> str:
        """Create a new referral code"""
        referral_id = str(uuid.uuid4())[:8].upper()
        referral_code = f"REF{referral_id}"
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO referrals 
            (id, referrer_id, referral_code, reward_amount)
            VALUES (?, ?, ?, ?)
        ''', (referral_id, referrer_id, referral_code, reward_amount))
        
        conn.commit()
        conn.close()
        
        return referral_code
    
    def process_referral(self, referral_code: str, referred_id: str) -> bool:
        """Process a referral conversion"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Check if referral code exists and is unused
        cursor.execute('''
            SELECT id, referrer_id, reward_amount FROM referrals 
            WHERE referral_code = ? AND referred_id IS NULL
        ''', (referral_code,))
        
        result = cursor.fetchone()
        if not result:
            conn.close()
            return False
        
        referral_id, referrer_id, reward_amount = result
        
        # Update referral with referred user
        cursor.execute('''
            UPDATE referrals 
            SET referred_id = ?, conversion_date = ?, reward_status = 'completed'
            WHERE id = ?
        ''', (referred_id, datetime.now(), referral_id))
        
        # Track referral events
        self.track_user_event(referrer_id, 'referral_successful', {
            'referred_id': referred_id,
            'reward_amount': reward_amount,
            'referral_code': referral_code
        })
        
        self.track_user_event(referred_id, 'referred_signup', {
            'referrer_id': referrer_id,
            'referral_code': referral_code
        })
        
        conn.commit()
        conn.close()
        return True
    
    def get_analytics_dashboard_data(self, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive analytics data for dashboard"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # User engagement metrics
        cursor.execute('''
            SELECT 
                DATE(timestamp) as date,
                COUNT(DISTINCT user_id) as daily_active_users,
                COUNT(*) as total_events
            FROM user_events 
            WHERE timestamp >= ? 
            GROUP BY DATE(timestamp)
            ORDER BY date
        ''', (start_date,))
        
        engagement_data = cursor.fetchall()
        
        # Top events
        cursor.execute('''
            SELECT event_type, COUNT(*) as count
            FROM user_events 
            WHERE timestamp >= ?
            GROUP BY event_type 
            ORDER BY count DESC 
            LIMIT 10
        ''', (start_date,))
        
        top_events = cursor.fetchall()
        
        # Growth metrics
        cursor.execute('''
            SELECT 
                COUNT(DISTINCT user_id) as total_users,
                COUNT(DISTINCT CASE WHEN timestamp >= ? THEN user_id END) as new_users
            FROM user_events
        ''', (start_date,))
        
        growth_data = cursor.fetchone()
        
        # Referral performance
        cursor.execute('''
            SELECT 
                COUNT(*) as total_referrals,
                COUNT(CASE WHEN referred_id IS NOT NULL THEN 1 END) as successful_referrals,
                AVG(reward_amount) as avg_reward
            FROM referrals 
            WHERE created_at >= ?
        ''', (start_date,))
        
        referral_data = cursor.fetchone()
        
        # A/B testing results
        cursor.execute('''
            SELECT 
                experiment_name,
                variant,
                participants,
                conversion_rate
            FROM growth_experiments 
            WHERE start_date >= ?
        ''', (start_date,))
        
        ab_test_data = cursor.fetchall()
        
        conn.close()
        
        return {
            'engagement': {
                'daily_data': engagement_data,
                'top_events': top_events
            },
            'growth': {
                'total_users': growth_data[0] if growth_data else 0,
                'new_users': growth_data[1] if growth_data else 0
            },
            'referrals': {
                'total': referral_data[0] if referral_data else 0,
                'successful': referral_data[1] if referral_data else 0,
                'avg_reward': referral_data[2] if referral_data else 0
            },
            'experiments': ab_test_data
        }
    
    def get_user_behavior_analysis(self, user_id: str) -> Dict[str, Any]:
        """Get detailed user behavior analysis"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # User activity timeline
        cursor.execute('''
            SELECT event_type, event_data, timestamp
            FROM user_events 
            WHERE user_id = ?
            ORDER BY timestamp DESC
            LIMIT 50
        ''', (user_id,))
        
        activity = cursor.fetchall()
        
        # User cohort analysis
        cursor.execute('''
            SELECT cohort_month, ltv
            FROM user_cohorts 
            WHERE user_id = ?
        ''', (user_id,))
        
        cohort_data = cursor.fetchone()
        
        # Experiment assignments
        cursor.execute('''
            SELECT DISTINCT experiment_name
            FROM user_events 
            WHERE user_id = ? AND event_type = 'experiment_assigned'
        ''', (user_id,))
        
        experiments = cursor.fetchall()
        
        conn.close()
        
        return {
            'activity': activity,
            'cohort': cohort_data,
            'experiments': [exp[0] for exp in experiments]
        }
    
    def calculate_viral_coefficient(self, days: int = 30) -> float:
        """Calculate viral coefficient (referrals per user)"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        cursor.execute('''
            SELECT 
                COUNT(DISTINCT referrer_id) as referring_users,
                COUNT(CASE WHEN referred_id IS NOT NULL THEN 1 END) as successful_referrals
            FROM referrals 
            WHERE created_at >= ?
        ''', (start_date,))
        
        result = cursor.fetchone()
        conn.close()
        
        if result and result[0] > 0:
            return result[1] / result[0]
        return 0.0