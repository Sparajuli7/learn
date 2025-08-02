"""
Growth Optimization Engine
Advanced algorithms for user acquisition, retention, and viral growth
"""

import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
import json
import sqlite3
from analytics_database import AnalyticsDatabase

class GrowthOptimizationEngine:
    def __init__(self, analytics_db: AnalyticsDatabase):
        self.analytics_db = analytics_db
    
    def analyze_user_segments(self, days: int = 30) -> Dict[str, Any]:
        """Analyze user segments for targeted growth strategies"""
        conn = sqlite3.connect(self.analytics_db.db_path)
        cursor = conn.cursor()
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Segment users by activity level
        cursor.execute('''
            SELECT 
                user_id,
                COUNT(*) as event_count,
                COUNT(DISTINCT DATE(timestamp)) as active_days,
                MIN(timestamp) as first_seen,
                MAX(timestamp) as last_seen
            FROM user_events 
            WHERE timestamp >= ?
            GROUP BY user_id
        ''', (start_date,))
        
        user_activity = cursor.fetchall()
        
        segments = {
            'power_users': [],
            'engaged_users': [],
            'casual_users': [],
            'at_risk_users': [],
            'new_users': []
        }
        
        for user_id, event_count, active_days, first_seen, last_seen in user_activity:
            # Calculate user metrics
            first_seen_dt = datetime.fromisoformat(first_seen.replace('Z', '+00:00'))
            last_seen_dt = datetime.fromisoformat(last_seen.replace('Z', '+00:00'))
            
            days_since_first_seen = (end_date - first_seen_dt).days
            days_since_last_seen = (end_date - last_seen_dt).days
            
            events_per_day = event_count / max(active_days, 1)
            
            # Segment logic
            if days_since_first_seen <= 7:
                segments['new_users'].append(user_id)
            elif events_per_day >= 10 and active_days >= 15:
                segments['power_users'].append(user_id)
            elif events_per_day >= 3 and active_days >= 7:
                segments['engaged_users'].append(user_id)
            elif days_since_last_seen <= 7:
                segments['casual_users'].append(user_id)
            else:
                segments['at_risk_users'].append(user_id)
        
        conn.close()
        
        # Calculate segment insights
        total_users = len(user_activity)
        segment_insights = {}
        
        for segment, users in segments.items():
            segment_insights[segment] = {
                'count': len(users),
                'percentage': (len(users) / total_users * 100) if total_users > 0 else 0,
                'growth_strategy': self._get_growth_strategy(segment)
            }
        
        return {
            'segments': segment_insights,
            'recommendations': self._generate_segment_recommendations(segment_insights),
            'total_users': total_users
        }
    
    def optimize_onboarding_flow(self) -> Dict[str, Any]:
        """Analyze onboarding flow and suggest optimizations"""
        conn = sqlite3.connect(self.analytics_db.db_path)
        cursor = conn.cursor()
        
        # Analyze onboarding funnel
        onboarding_events = [
            'user_registration',
            'profile_setup',
            'first_video_upload',
            'first_analysis_complete',
            'first_expert_comparison'
        ]
        
        funnel_data = {}
        for i, event in enumerate(onboarding_events):
            cursor.execute('''
                SELECT COUNT(DISTINCT user_id) as user_count
                FROM user_events 
                WHERE event_type = ?
                AND timestamp >= datetime('now', '-30 days')
            ''', (event,))
            
            count = cursor.fetchone()[0]
            funnel_data[event] = count
        
        # Calculate conversion rates
        conversion_rates = {}
        previous_count = None
        
        for event, count in funnel_data.items():
            if previous_count is not None:
                conversion_rates[event] = (count / previous_count) * 100 if previous_count > 0 else 0
            previous_count = count
        
        # Identify bottlenecks
        bottlenecks = []
        for event, rate in conversion_rates.items():
            if rate < 50:  # Less than 50% conversion
                bottlenecks.append({
                    'step': event,
                    'conversion_rate': rate,
                    'priority': 'high' if rate < 30 else 'medium'
                })
        
        conn.close()
        
        return {
            'funnel_data': funnel_data,
            'conversion_rates': conversion_rates,
            'bottlenecks': bottlenecks,
            'optimization_suggestions': self._generate_onboarding_optimizations(bottlenecks)
        }
    
    def predict_churn_risk(self, user_id: str = None) -> Dict[str, Any]:
        """Predict user churn risk using behavioral patterns"""
        conn = sqlite3.connect(self.analytics_db.db_path)
        cursor = conn.cursor()
        
        if user_id:
            # Analyze specific user
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_events,
                    COUNT(DISTINCT DATE(timestamp)) as active_days,
                    MAX(timestamp) as last_activity,
                    MIN(timestamp) as first_activity
                FROM user_events 
                WHERE user_id = ?
            ''', (user_id,))
            
            user_data = cursor.fetchone()
            if not user_data or user_data[0] == 0:
                return {'error': 'User not found or no activity'}
            
            days_since_last_activity = (datetime.now() - 
                                      datetime.fromisoformat(user_data[2].replace('Z', '+00:00'))).days
            
            churn_score = self._calculate_churn_score(
                total_events=user_data[0],
                active_days=user_data[1],
                days_since_last_activity=days_since_last_activity
            )
            
            return {
                'user_id': user_id,
                'churn_score': churn_score,
                'risk_level': self._get_risk_level(churn_score),
                'recommendations': self._get_retention_recommendations(churn_score)
            }
        else:
            # Analyze all users
            cursor.execute('''
                SELECT 
                    user_id,
                    COUNT(*) as total_events,
                    COUNT(DISTINCT DATE(timestamp)) as active_days,
                    MAX(timestamp) as last_activity
                FROM user_events 
                GROUP BY user_id
                HAVING COUNT(*) > 0
            ''')
            
            all_users = cursor.fetchall()
            high_risk_users = []
            
            for user_data in all_users:
                days_since_last_activity = (datetime.now() - 
                                          datetime.fromisoformat(user_data[3].replace('Z', '+00:00'))).days
                
                churn_score = self._calculate_churn_score(
                    total_events=user_data[1],
                    active_days=user_data[2],
                    days_since_last_activity=days_since_last_activity
                )
                
                if churn_score >= 0.7:  # High risk threshold
                    high_risk_users.append({
                        'user_id': user_data[0],
                        'churn_score': churn_score,
                        'days_since_last_activity': days_since_last_activity
                    })
            
            conn.close()
            
            return {
                'total_users_analyzed': len(all_users),
                'high_risk_users': len(high_risk_users),
                'high_risk_details': high_risk_users[:20],  # Top 20 at-risk users
                'retention_campaign_suggestions': self._generate_retention_campaigns()
            }
    
    def analyze_viral_loops(self) -> Dict[str, Any]:
        """Analyze viral loops and referral effectiveness"""
        conn = sqlite3.connect(self.analytics_db.db_path)
        cursor = conn.cursor()
        
        # Referral conversion analysis
        cursor.execute('''
            SELECT 
                COUNT(*) as total_referrals,
                COUNT(CASE WHEN referred_id IS NOT NULL THEN 1 END) as successful_referrals,
                AVG(reward_amount) as avg_reward,
                COUNT(DISTINCT referrer_id) as unique_referrers
            FROM referrals
        ''')
        
        referral_stats = cursor.fetchone()
        
        # Time to conversion analysis
        cursor.execute('''
            SELECT 
                AVG(JULIANDAY(conversion_date) - JULIANDAY(created_at)) as avg_days_to_convert
            FROM referrals 
            WHERE conversion_date IS NOT NULL
        ''')
        
        avg_conversion_time = cursor.fetchone()[0] or 0
        
        # Viral coefficient by referrer segment
        cursor.execute('''
            SELECT 
                r.referrer_id,
                COUNT(r.id) as referrals_created,
                COUNT(CASE WHEN r.referred_id IS NOT NULL THEN 1 END) as successful_referrals,
                COUNT(DISTINCT e.event_type) as user_engagement_types
            FROM referrals r
            LEFT JOIN user_events e ON r.referrer_id = e.user_id
            GROUP BY r.referrer_id
            HAVING referrals_created > 0
        ''')
        
        referrer_analysis = cursor.fetchall()
        
        # Calculate viral insights
        total_referrals = referral_stats[0] if referral_stats else 0
        successful_referrals = referral_stats[1] if referral_stats else 0
        conversion_rate = (successful_referrals / total_referrals * 100) if total_referrals > 0 else 0
        
        # Identify viral champions (top referrers)
        viral_champions = []
        for referrer_id, created, successful, engagement in referrer_analysis:
            success_rate = (successful / created * 100) if created > 0 else 0
            if successful >= 3:  # At least 3 successful referrals
                viral_champions.append({
                    'referrer_id': referrer_id,
                    'referrals_created': created,
                    'successful_referrals': successful,
                    'success_rate': success_rate,
                    'engagement_score': engagement
                })
        
        # Sort by successful referrals
        viral_champions.sort(key=lambda x: x['successful_referrals'], reverse=True)
        
        conn.close()
        
        return {
            'overall_stats': {
                'total_referrals': total_referrals,
                'successful_referrals': successful_referrals,
                'conversion_rate': conversion_rate,
                'avg_days_to_convert': avg_conversion_time
            },
            'viral_champions': viral_champions[:10],  # Top 10
            'optimization_opportunities': self._generate_viral_optimizations(conversion_rate),
            'viral_coefficient': self.analytics_db.calculate_viral_coefficient()
        }
    
    def generate_growth_experiments(self) -> List[Dict[str, Any]]:
        """Generate A/B testing experiments for growth optimization"""
        experiments = [
            {
                'name': 'Onboarding_Flow_Optimization',
                'hypothesis': 'Simplified 3-step onboarding will increase completion rate by 25%',
                'variants': ['current_flow', 'simplified_flow'],
                'success_metric': 'onboarding_completion_rate',
                'target_improvement': 0.25,
                'duration_days': 14,
                'sample_size_needed': 1000
            },
            {
                'name': 'Referral_Reward_Testing',
                'hypothesis': 'Higher referral rewards ($20 vs $10) will increase referral activity',
                'variants': ['reward_10', 'reward_20'],
                'success_metric': 'referrals_per_user',
                'target_improvement': 0.30,
                'duration_days': 21,
                'sample_size_needed': 500
            },
            {
                'name': 'Social_Sharing_Optimization',
                'hypothesis': 'Custom achievement graphics will increase social sharing by 40%',
                'variants': ['text_sharing', 'graphic_sharing'],
                'success_metric': 'social_shares_per_achievement',
                'target_improvement': 0.40,
                'duration_days': 14,
                'sample_size_needed': 800
            },
            {
                'name': 'Retention_Email_Campaign',
                'hypothesis': 'Personalized skill progress emails will reduce 7-day churn by 20%',
                'variants': ['no_email', 'progress_email'],
                'success_metric': '7_day_retention_rate',
                'target_improvement': 0.20,
                'duration_days': 30,
                'sample_size_needed': 2000
            },
            {
                'name': 'Feature_Discovery_Prompt',
                'hypothesis': 'In-app feature discovery prompts will increase feature adoption by 35%',
                'variants': ['no_prompts', 'discovery_prompts'],
                'success_metric': 'feature_adoption_rate',
                'target_improvement': 0.35,
                'duration_days': 21,
                'sample_size_needed': 1200
            }
        ]
        
        return experiments
    
    # Helper methods
    def _get_growth_strategy(self, segment: str) -> str:
        """Get growth strategy for user segment"""
        strategies = {
            'power_users': 'Leverage for referrals and testimonials',
            'engaged_users': 'Upsell premium features and expert consultations',
            'casual_users': 'Re-engagement campaigns with personalized content',
            'at_risk_users': 'Win-back campaigns with special offers',
            'new_users': 'Optimize onboarding and early value delivery'
        }
        return strategies.get(segment, 'Standard growth tactics')
    
    def _generate_segment_recommendations(self, segments: Dict) -> List[str]:
        """Generate actionable recommendations based on segment analysis"""
        recommendations = []
        
        if segments['at_risk_users']['percentage'] > 20:
            recommendations.append("High churn risk detected. Implement retention campaigns.")
        
        if segments['power_users']['percentage'] < 5:
            recommendations.append("Low power user percentage. Focus on engagement features.")
        
        if segments['new_users']['percentage'] > 30:
            recommendations.append("High new user influx. Optimize onboarding experience.")
        
        return recommendations
    
    def _generate_onboarding_optimizations(self, bottlenecks: List) -> List[str]:
        """Generate onboarding optimization suggestions"""
        optimizations = []
        
        for bottleneck in bottlenecks:
            if 'profile_setup' in bottleneck['step']:
                optimizations.append("Simplify profile setup - reduce required fields")
            elif 'video_upload' in bottleneck['step']:
                optimizations.append("Add video upload tutorial and progress indicators")
            elif 'analysis' in bottleneck['step']:
                optimizations.append("Improve analysis feedback and explanation")
        
        return optimizations
    
    def _calculate_churn_score(self, total_events: int, active_days: int, 
                              days_since_last_activity: int) -> float:
        """Calculate churn risk score (0-1, higher = more likely to churn)"""
        # Normalize metrics
        activity_score = min(total_events / 50, 1.0)  # 50+ events = very active
        consistency_score = min(active_days / 30, 1.0)  # 30+ days = very consistent
        recency_penalty = min(days_since_last_activity / 14, 1.0)  # 14+ days = concerning
        
        # Combine scores (lower activity + higher recency = higher churn risk)
        churn_score = (1 - activity_score * 0.4 - consistency_score * 0.3) + recency_penalty * 0.3
        
        return max(0, min(1, churn_score))
    
    def _get_risk_level(self, churn_score: float) -> str:
        """Convert churn score to risk level"""
        if churn_score >= 0.7:
            return 'high'
        elif churn_score >= 0.4:
            return 'medium'
        else:
            return 'low'
    
    def _get_retention_recommendations(self, churn_score: float) -> List[str]:
        """Get retention recommendations based on churn score"""
        if churn_score >= 0.7:
            return [
                "Send personalized re-engagement email",
                "Offer limited-time premium trial",
                "Schedule customer success call"
            ]
        elif churn_score >= 0.4:
            return [
                "Send progress summary and achievements",
                "Suggest new skills to explore",
                "Share relevant expert content"
            ]
        else:
            return [
                "Continue current engagement strategy",
                "Monitor for changes in activity"
            ]
    
    def _generate_retention_campaigns(self) -> List[Dict]:
        """Generate retention campaign suggestions"""
        return [
            {
                'name': 'Win-Back Email Series',
                'target': 'high_risk_users',
                'duration': '7 days',
                'expected_recovery': '15-25%'
            },
            {
                'name': 'Achievement Celebration',
                'target': 'medium_risk_users',
                'duration': '3 days',
                'expected_recovery': '30-40%'
            },
            {
                'name': 'Premium Feature Showcase',
                'target': 'engaged_users',
                'duration': '5 days',
                'expected_conversion': '10-15%'
            }
        ]
    
    def _generate_viral_optimizations(self, conversion_rate: float) -> List[str]:
        """Generate viral loop optimization suggestions"""
        optimizations = []
        
        if conversion_rate < 20:
            optimizations.append("Increase referral rewards or incentives")
            optimizations.append("Improve referral sharing UX and messaging")
        
        if conversion_rate < 30:
            optimizations.append("Add social proof to referral pages")
            optimizations.append("Create referral leaderboards and competitions")
        
        optimizations.append("A/B test referral messaging and timing")
        optimizations.append("Implement viral features like challenges and achievements")
        
        return optimizations