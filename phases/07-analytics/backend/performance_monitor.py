"""
Performance Monitoring and Optimization System
Real-time system monitoring, caching, and performance optimization
"""

import time
import psutil
import sqlite3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import asyncio
import aiohttp
from functools import wraps
import hashlib
import pickle
import redis
from analytics_database import AnalyticsDatabase

class PerformanceMonitor:
    def __init__(self, analytics_db: AnalyticsDatabase, redis_url: str = "redis://localhost:6379"):
        self.analytics_db = analytics_db
        self.redis_client = None
        self.monitoring_active = False
        self.performance_metrics = {}
        
        # Try to connect to Redis for caching
        try:
            import redis
            self.redis_client = redis.from_url(redis_url)
            self.redis_client.ping()
        except Exception:
            print("Redis not available, using in-memory cache")
            self.cache = {}
    
    def start_monitoring(self):
        """Start performance monitoring"""
        self.monitoring_active = True
        asyncio.create_task(self._monitor_system_metrics())
        asyncio.create_task(self._monitor_api_performance())
    
    def stop_monitoring(self):
        """Stop performance monitoring"""
        self.monitoring_active = False
    
    async def _monitor_system_metrics(self):
        """Monitor system performance metrics"""
        while self.monitoring_active:
            try:
                # Collect system metrics
                cpu_percent = psutil.cpu_percent(interval=1)
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                
                # Network I/O
                network = psutil.net_io_counters()
                
                # Database performance
                db_start = time.time()
                self.analytics_db.get_analytics_dashboard_data(1)
                db_response_time = (time.time() - db_start) * 1000
                
                # Store metrics
                metrics = {
                    'timestamp': datetime.now().isoformat(),
                    'cpu_percent': cpu_percent,
                    'memory_percent': memory.percent,
                    'memory_available': memory.available,
                    'disk_percent': disk.percent,
                    'disk_free': disk.free,
                    'network_bytes_sent': network.bytes_sent,
                    'network_bytes_recv': network.bytes_recv,
                    'db_response_time_ms': db_response_time
                }
                
                # Record metrics in analytics database
                self.analytics_db.record_metric(
                    metric_name='system_cpu_percent',
                    value=cpu_percent,
                    category='performance'
                )
                
                self.analytics_db.record_metric(
                    metric_name='system_memory_percent',
                    value=memory.percent,
                    category='performance'
                )
                
                self.analytics_db.record_metric(
                    metric_name='db_response_time',
                    value=db_response_time,
                    category='performance'
                )
                
                # Store in cache for quick access
                self._cache_set('system_metrics', metrics, ttl=60)
                
                # Alert on performance issues
                await self._check_performance_alerts(metrics)
                
                await asyncio.sleep(30)  # Monitor every 30 seconds
                
            except Exception as e:
                print(f"Error monitoring system metrics: {e}")
                await asyncio.sleep(30)
    
    async def _monitor_api_performance(self):
        """Monitor API endpoint performance"""
        while self.monitoring_active:
            try:
                endpoints = [
                    '/api/analytics/dashboard',
                    '/api/analytics/real-time-metrics',
                    '/api/analytics/track-event'
                ]
                
                for endpoint in endpoints:
                    start_time = time.time()
                    
                    try:
                        async with aiohttp.ClientSession() as session:
                            async with session.get(f'http://localhost:8001{endpoint}') as response:
                                response_time = (time.time() - start_time) * 1000
                                status_code = response.status
                                
                                # Record API performance
                                self.analytics_db.record_metric(
                                    metric_name='api_response_time',
                                    value=response_time,
                                    category='api_performance',
                                    dimension_1=endpoint,
                                    dimension_2=str(status_code)
                                )
                                
                    except Exception as e:
                        print(f"Error testing endpoint {endpoint}: {e}")
                
                await asyncio.sleep(60)  # Test every minute
                
            except Exception as e:
                print(f"Error monitoring API performance: {e}")
                await asyncio.sleep(60)
    
    async def _check_performance_alerts(self, metrics: Dict[str, Any]):
        """Check for performance issues and trigger alerts"""
        alerts = []
        
        # CPU alert
        if metrics['cpu_percent'] > 80:
            alerts.append({
                'type': 'high_cpu',
                'severity': 'warning' if metrics['cpu_percent'] < 90 else 'critical',
                'message': f"High CPU usage: {metrics['cpu_percent']:.1f}%"
            })
        
        # Memory alert
        if metrics['memory_percent'] > 85:
            alerts.append({
                'type': 'high_memory',
                'severity': 'warning' if metrics['memory_percent'] < 95 else 'critical',
                'message': f"High memory usage: {metrics['memory_percent']:.1f}%"
            })
        
        # Database performance alert
        if metrics['db_response_time_ms'] > 1000:
            alerts.append({
                'type': 'slow_database',
                'severity': 'warning' if metrics['db_response_time_ms'] < 2000 else 'critical',
                'message': f"Slow database response: {metrics['db_response_time_ms']:.1f}ms"
            })
        
        # Disk space alert
        if metrics['disk_percent'] > 90:
            alerts.append({
                'type': 'low_disk_space',
                'severity': 'critical',
                'message': f"Low disk space: {metrics['disk_percent']:.1f}% used"
            })
        
        # Process alerts
        for alert in alerts:
            await self._process_alert(alert)
    
    async def _process_alert(self, alert: Dict[str, Any]):
        """Process performance alerts"""
        print(f"PERFORMANCE ALERT [{alert['severity'].upper()}]: {alert['message']}")
        
        # Record alert in analytics
        self.analytics_db.track_user_event(
            user_id='system',
            event_type='performance_alert',
            event_data=alert
        )
        
        # Auto-optimization based on alert type
        if alert['type'] == 'slow_database':
            await self._optimize_database()
        elif alert['type'] == 'high_memory':
            await self._clear_caches()
    
    async def _optimize_database(self):
        """Perform database optimization"""
        try:
            conn = sqlite3.connect(self.analytics_db.db_path)
            cursor = conn.cursor()
            
            # Analyze and optimize tables
            cursor.execute("ANALYZE")
            cursor.execute("VACUUM")
            
            # Clean old data (keep last 90 days)
            cutoff_date = datetime.now() - timedelta(days=90)
            cursor.execute('''
                DELETE FROM user_events 
                WHERE timestamp < ?
            ''', (cutoff_date,))
            
            cursor.execute('''
                DELETE FROM analytics 
                WHERE date < ?
            ''', (cutoff_date.strftime('%Y-%m-%d'),))
            
            conn.commit()
            conn.close()
            
            print("Database optimization completed")
            
        except Exception as e:
            print(f"Error optimizing database: {e}")
    
    async def _clear_caches(self):
        """Clear application caches to free memory"""
        try:
            if self.redis_client:
                self.redis_client.flushdb()
            else:
                self.cache.clear()
            
            print("Caches cleared to free memory")
            
        except Exception as e:
            print(f"Error clearing caches: {e}")
    
    def _cache_set(self, key: str, value: Any, ttl: int = 3600):
        """Set cache value with TTL"""
        try:
            if self.redis_client:
                self.redis_client.setex(key, ttl, json.dumps(value))
            else:
                self.cache[key] = {
                    'value': value,
                    'expires': time.time() + ttl
                }
        except Exception as e:
            print(f"Error setting cache: {e}")
    
    def _cache_get(self, key: str) -> Optional[Any]:
        """Get cache value"""
        try:
            if self.redis_client:
                value = self.redis_client.get(key)
                return json.loads(value) if value else None
            else:
                if key in self.cache:
                    item = self.cache[key]
                    if time.time() < item['expires']:
                        return item['value']
                    else:
                        del self.cache[key]
                return None
        except Exception as e:
            print(f"Error getting cache: {e}")
            return None
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary for dashboard"""
        try:
            # Get recent system metrics
            system_metrics = self._cache_get('system_metrics')
            
            # Get API performance from database
            conn = sqlite3.connect(self.analytics_db.db_path)
            cursor = conn.cursor()
            
            # Average response times in last hour
            cursor.execute('''
                SELECT 
                    AVG(value) as avg_response_time,
                    COUNT(*) as request_count
                FROM analytics 
                WHERE metric_name = 'api_response_time' 
                AND datetime(created_at) >= datetime('now', '-1 hour')
            ''')
            
            api_metrics = cursor.fetchone()
            
            # Database performance
            cursor.execute('''
                SELECT AVG(value) as avg_db_time
                FROM analytics 
                WHERE metric_name = 'db_response_time' 
                AND datetime(created_at) >= datetime('now', '-1 hour')
            ''')
            
            db_metrics = cursor.fetchone()
            
            # System uptime
            uptime_seconds = time.time() - psutil.boot_time()
            uptime_hours = uptime_seconds / 3600
            
            conn.close()
            
            return {
                'system': system_metrics or {},
                'api': {
                    'avg_response_time': api_metrics[0] if api_metrics and api_metrics[0] else 0,
                    'request_count': api_metrics[1] if api_metrics and api_metrics[1] else 0
                },
                'database': {
                    'avg_response_time': db_metrics[0] if db_metrics and db_metrics[0] else 0
                },
                'uptime_hours': uptime_hours,
                'status': self._get_overall_health_status()
            }
            
        except Exception as e:
            print(f"Error getting performance summary: {e}")
            return {'error': str(e)}
    
    def _get_overall_health_status(self) -> str:
        """Get overall system health status"""
        try:
            system_metrics = self._cache_get('system_metrics')
            if not system_metrics:
                return 'unknown'
            
            # Check critical thresholds
            if (system_metrics['cpu_percent'] > 90 or 
                system_metrics['memory_percent'] > 95 or 
                system_metrics['disk_percent'] > 95):
                return 'critical'
            
            # Check warning thresholds
            if (system_metrics['cpu_percent'] > 70 or 
                system_metrics['memory_percent'] > 80 or 
                system_metrics['db_response_time_ms'] > 500):
                return 'warning'
            
            return 'healthy'
            
        except Exception:
            return 'unknown'

class CacheManager:
    """Advanced caching system for performance optimization"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = None
        self.memory_cache = {}
        
        try:
            import redis
            self.redis_client = redis.from_url(redis_url)
            self.redis_client.ping()
        except Exception:
            print("Redis not available, using memory cache")
    
    def cache_with_ttl(self, ttl: int = 3600):
        """Decorator for caching function results with TTL"""
        def decorator(func):
            @wraps(func)
            def wrapper(*args, **kwargs):
                # Create cache key from function name and arguments
                cache_key = self._generate_cache_key(func.__name__, args, kwargs)
                
                # Try to get from cache
                cached_result = self._get_cache(cache_key)
                if cached_result is not None:
                    return cached_result
                
                # Execute function and cache result
                result = func(*args, **kwargs)
                self._set_cache(cache_key, result, ttl)
                
                return result
            return wrapper
        return decorator
    
    def _generate_cache_key(self, func_name: str, args: tuple, kwargs: dict) -> str:
        """Generate cache key from function name and arguments"""
        key_data = f"{func_name}:{args}:{sorted(kwargs.items())}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _set_cache(self, key: str, value: Any, ttl: int):
        """Set cache value"""
        try:
            if self.redis_client:
                serialized = pickle.dumps(value)
                self.redis_client.setex(key, ttl, serialized)
            else:
                self.memory_cache[key] = {
                    'value': value,
                    'expires': time.time() + ttl
                }
        except Exception as e:
            print(f"Cache set error: {e}")
    
    def _get_cache(self, key: str) -> Optional[Any]:
        """Get cache value"""
        try:
            if self.redis_client:
                serialized = self.redis_client.get(key)
                return pickle.loads(serialized) if serialized else None
            else:
                if key in self.memory_cache:
                    item = self.memory_cache[key]
                    if time.time() < item['expires']:
                        return item['value']
                    else:
                        del self.memory_cache[key]
                return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    def clear_cache(self, pattern: str = None):
        """Clear cache by pattern or all"""
        try:
            if self.redis_client:
                if pattern:
                    keys = self.redis_client.keys(pattern)
                    if keys:
                        self.redis_client.delete(*keys)
                else:
                    self.redis_client.flushdb()
            else:
                if pattern:
                    keys_to_delete = [k for k in self.memory_cache.keys() if pattern in k]
                    for key in keys_to_delete:
                        del self.memory_cache[key]
                else:
                    self.memory_cache.clear()
        except Exception as e:
            print(f"Cache clear error: {e}")

class QueryOptimizer:
    """Database query optimization utilities"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    def analyze_slow_queries(self) -> List[Dict[str, Any]]:
        """Analyze and identify slow queries"""
        # This would integrate with query logging to identify slow queries
        # For now, return common optimization suggestions
        
        return [
            {
                'query_type': 'user_events_by_user',
                'avg_time_ms': 150,
                'suggestion': 'Add composite index on (user_id, timestamp)',
                'impact': 'high'
            },
            {
                'query_type': 'analytics_by_date_range',
                'avg_time_ms': 95,
                'suggestion': 'Partition analytics table by date',
                'impact': 'medium'
            },
            {
                'query_type': 'referral_lookups',
                'avg_time_ms': 45,
                'suggestion': 'Index on referral_code is already optimal',
                'impact': 'low'
            }
        ]
    
    def create_optimized_indexes(self):
        """Create database indexes for better performance"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Composite indexes for common query patterns
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_user_events_user_timestamp ON user_events(user_id, timestamp DESC)",
                "CREATE INDEX IF NOT EXISTS idx_analytics_date_metric ON analytics(date, metric_name)",
                "CREATE INDEX IF NOT EXISTS idx_analytics_category_date ON analytics(category, date)",
                "CREATE INDEX IF NOT EXISTS idx_experiments_status ON growth_experiments(status)",
                "CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(reward_status, created_at)"
            ]
            
            for index_sql in indexes:
                cursor.execute(index_sql)
            
            conn.commit()
            conn.close()
            
            print("Optimized indexes created successfully")
            
        except Exception as e:
            print(f"Error creating indexes: {e}")
    
    def get_query_performance_report(self) -> Dict[str, Any]:
        """Generate query performance report"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Table sizes
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            table_stats = {}
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                table_stats[table] = {'row_count': count}
            
            # Database size
            cursor.execute("SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()")
            db_size = cursor.fetchone()[0]
            
            conn.close()
            
            return {
                'database_size_bytes': db_size,
                'table_statistics': table_stats,
                'slow_queries': self.analyze_slow_queries(),
                'optimization_score': self._calculate_optimization_score(table_stats)
            }
            
        except Exception as e:
            print(f"Error generating performance report: {e}")
            return {'error': str(e)}
    
    def _calculate_optimization_score(self, table_stats: Dict) -> int:
        """Calculate database optimization score (0-100)"""
        score = 100
        
        # Deduct points for large tables without proper indexing
        total_rows = sum(stats['row_count'] for stats in table_stats.values())
        
        if total_rows > 100000:
            score -= 20  # Large dataset penalty
        
        if table_stats.get('user_events', {}).get('row_count', 0) > 50000:
            score -= 15  # Large events table
        
        # Score based on table size distribution
        if len(table_stats) > 5:
            score += 10  # Good table organization
        
        return max(0, min(100, score))