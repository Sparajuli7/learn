"""
Security Database Module
Handles security-related database operations including logs, privacy settings, and compliance.
"""

import sqlite3
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import hashlib
import secrets

class SecurityDatabase:
    def __init__(self, db_path: str = "security.db"):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize security database with required tables."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # SecurityLogs table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS security_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                action TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                risk_score INTEGER DEFAULT 0,
                details TEXT,
                session_id TEXT
            )
        ''')
        
        # PrivacySettings table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS privacy_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                setting_name TEXT NOT NULL,
                value TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, setting_name)
            )
        ''')
        
        # ComplianceReports table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS compliance_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                report_type TEXT NOT NULL,
                data TEXT NOT NULL,
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                user_id TEXT,
                file_path TEXT
            )
        ''')
        
        # DataDeletionRequests table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS data_deletion_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                completed_date DATETIME,
                deletion_type TEXT,
                verification_token TEXT,
                reason TEXT
            )
        ''')
        
        # UserSessions table for security monitoring
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                user_agent TEXT,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        # EncryptionKeys table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS encryption_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                key_id TEXT UNIQUE NOT NULL,
                encrypted_key TEXT NOT NULL,
                key_type TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        # TwoFactorAuth table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS two_factor_auth (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT UNIQUE NOT NULL,
                secret_key TEXT NOT NULL,
                backup_codes TEXT,
                is_enabled BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_used DATETIME
            )
        ''')
        
        conn.commit()
        conn.close()

    def log_security_event(self, user_id: str, action: str, ip_address: str = None, 
                          user_agent: str = None, risk_score: int = 0, 
                          details: Dict = None, session_id: str = None):
        """Log a security event."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        details_json = json.dumps(details) if details else None
        
        cursor.execute('''
            INSERT INTO security_logs 
            (user_id, action, ip_address, user_agent, risk_score, details, session_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, action, ip_address, user_agent, risk_score, details_json, session_id))
        
        conn.commit()
        conn.close()

    def get_security_logs(self, user_id: str = None, limit: int = 100, 
                         start_date: datetime = None, end_date: datetime = None) -> List[Dict]:
        """Retrieve security logs with optional filtering."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        query = "SELECT * FROM security_logs WHERE 1=1"
        params = []
        
        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)
        
        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date.isoformat())
        
        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date.isoformat())
        
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        logs = cursor.fetchall()
        conn.close()
        
        return [dict(zip([col[0] for col in cursor.description], log)) for log in logs]

    def set_privacy_setting(self, user_id: str, setting_name: str, value: str):
        """Set or update a privacy setting for a user."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO privacy_settings (user_id, setting_name, value, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ''', (user_id, setting_name, value))
        
        conn.commit()
        conn.close()

    def get_privacy_settings(self, user_id: str) -> Dict[str, str]:
        """Get all privacy settings for a user."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT setting_name, value FROM privacy_settings 
            WHERE user_id = ?
        ''', (user_id,))
        
        settings = cursor.fetchall()
        conn.close()
        
        return {setting[0]: setting[1] for setting in settings}

    def create_data_deletion_request(self, user_id: str, deletion_type: str = "full", 
                                   reason: str = None) -> str:
        """Create a data deletion request."""
        verification_token = secrets.token_urlsafe(32)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO data_deletion_requests 
            (user_id, deletion_type, verification_token, reason)
            VALUES (?, ?, ?, ?)
        ''', (user_id, deletion_type, verification_token, reason))
        
        request_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        self.log_security_event(user_id, "data_deletion_requested", 
                               details={"request_id": request_id, "type": deletion_type})
        
        return verification_token

    def process_data_deletion_request(self, request_id: int, status: str = "completed"):
        """Process a data deletion request."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if status == "completed":
            cursor.execute('''
                UPDATE data_deletion_requests 
                SET status = ?, completed_date = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (status, request_id))
        else:
            cursor.execute('''
                UPDATE data_deletion_requests 
                SET status = ?
                WHERE id = ?
            ''', (status, request_id))
        
        conn.commit()
        conn.close()

    def generate_compliance_report(self, report_type: str, user_id: str = None) -> int:
        """Generate a compliance report."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Generate report data based on type
        if report_type == "gdpr_data_export":
            data = self._generate_gdpr_export(user_id)
        elif report_type == "ccpa_data_summary":
            data = self._generate_ccpa_summary(user_id)
        elif report_type == "security_audit":
            data = self._generate_security_audit()
        else:
            data = {"error": "Unknown report type"}
        
        data_json = json.dumps(data)
        
        cursor.execute('''
            INSERT INTO compliance_reports (report_type, data, user_id)
            VALUES (?, ?, ?)
        ''', (report_type, data_json, user_id))
        
        report_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return report_id

    def _generate_gdpr_export(self, user_id: str) -> Dict:
        """Generate GDPR data export for a user."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Collect all user data from various tables
        user_data = {
            "user_id": user_id,
            "export_date": datetime.now().isoformat(),
            "privacy_settings": self.get_privacy_settings(user_id),
            "security_logs": self.get_security_logs(user_id, limit=1000),
            "data_requests": []
        }
        
        # Get data deletion requests
        cursor.execute('''
            SELECT * FROM data_deletion_requests WHERE user_id = ?
        ''', (user_id,))
        requests = cursor.fetchall()
        user_data["data_requests"] = [dict(zip([col[0] for col in cursor.description], req)) for req in requests]
        
        conn.close()
        return user_data

    def _generate_ccpa_summary(self, user_id: str) -> Dict:
        """Generate CCPA data summary for a user."""
        privacy_settings = self.get_privacy_settings(user_id)
        security_logs = self.get_security_logs(user_id, limit=100)
        
        return {
            "user_id": user_id,
            "summary_date": datetime.now().isoformat(),
            "data_categories": ["personal_info", "video_data", "analysis_results"],
            "privacy_settings": privacy_settings,
            "recent_activities": len(security_logs),
            "opt_out_status": privacy_settings.get("data_sharing_opt_out", "false")
        }

    def _generate_security_audit(self) -> Dict:
        """Generate security audit report."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get security metrics
        cursor.execute("SELECT COUNT(*) FROM security_logs WHERE timestamp > datetime('now', '-30 days')")
        recent_events = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT user_id) FROM security_logs WHERE timestamp > datetime('now', '-30 days')")
        active_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM security_logs WHERE risk_score > 5 AND timestamp > datetime('now', '-30 days')")
        high_risk_events = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "audit_date": datetime.now().isoformat(),
            "metrics": {
                "recent_security_events": recent_events,
                "active_users_30_days": active_users,
                "high_risk_events": high_risk_events
            },
            "recommendations": self._generate_security_recommendations()
        }

    def _generate_security_recommendations(self) -> List[str]:
        """Generate security recommendations based on current state."""
        recommendations = [
            "Enable two-factor authentication for all users",
            "Regular security log monitoring",
            "Implement rate limiting for API endpoints",
            "Regular backup and encryption key rotation"
        ]
        return recommendations

    def create_user_session(self, user_id: str, ip_address: str = None, 
                           user_agent: str = None, expires_hours: int = 24) -> str:
        """Create a new user session."""
        session_token = secrets.token_urlsafe(64)
        expires_at = datetime.now() + timedelta(hours=expires_hours)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO user_sessions 
            (user_id, session_token, expires_at, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, session_token, expires_at, ip_address, user_agent))
        
        conn.commit()
        conn.close()
        
        self.log_security_event(user_id, "session_created", ip_address, user_agent, 
                               session_id=session_token)
        
        return session_token

    def validate_session(self, session_token: str) -> Optional[str]:
        """Validate a session token and return user_id if valid."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id FROM user_sessions 
            WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP AND is_active = 1
        ''', (session_token,))
        
        result = cursor.fetchone()
        
        if result:
            # Update last activity
            cursor.execute('''
                UPDATE user_sessions 
                SET last_activity = CURRENT_TIMESTAMP 
                WHERE session_token = ?
            ''', (session_token,))
            conn.commit()
            user_id = result[0]
        else:
            user_id = None
        
        conn.close()
        return user_id

    def store_encryption_key(self, user_id: str, key_type: str, 
                           encrypted_key: str, expires_days: int = None) -> str:
        """Store an encryption key for a user."""
        key_id = secrets.token_urlsafe(16)
        expires_at = datetime.now() + timedelta(days=expires_days) if expires_days else None
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO encryption_keys 
            (user_id, key_id, encrypted_key, key_type, expires_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, key_id, encrypted_key, key_type, expires_at))
        
        conn.commit()
        conn.close()
        
        return key_id

    def get_encryption_key(self, user_id: str, key_type: str) -> Optional[str]:
        """Get the active encryption key for a user."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT encrypted_key FROM encryption_keys 
            WHERE user_id = ? AND key_type = ? AND is_active = 1
            AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            ORDER BY created_at DESC LIMIT 1
        ''', (user_id, key_type))
        
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result else None