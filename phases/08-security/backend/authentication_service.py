"""
Authentication Service Module
Handles user authentication, authorization, and multi-factor authentication.
"""

import hashlib
import secrets
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
import json

class AuthenticationService:
    """Service for handling user authentication and authorization."""
    
    def __init__(self, secret_key: str = None):
        self.secret_key = secret_key or secrets.token_urlsafe(32)
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Role-based access control definitions
        self.roles = {
            "admin": {
                "permissions": ["read", "write", "delete", "admin", "security_audit"],
                "level": 5
            },
            "moderator": {
                "permissions": ["read", "write", "moderate"],
                "level": 3
            },
            "premium_user": {
                "permissions": ["read", "write", "premium_features"],
                "level": 2
            },
            "user": {
                "permissions": ["read", "write"],
                "level": 1
            },
            "viewer": {
                "permissions": ["read"],
                "level": 0
            }
        }
    
    def hash_password(self, password: str) -> str:
        """Hash a password using bcrypt."""
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def create_access_token(self, data: Dict, expires_delta: timedelta = None) -> str:
        """Create a JWT access token."""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        
        return encoded_jwt
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify and decode a JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            return None
    
    def check_permission(self, user_role: str, required_permission: str) -> bool:
        """Check if a user role has a specific permission."""
        if user_role not in self.roles:
            return False
        
        return required_permission in self.roles[user_role]["permissions"]
    
    def check_role_level(self, user_role: str, required_level: int) -> bool:
        """Check if a user role meets the required access level."""
        if user_role not in self.roles:
            return False
        
        return self.roles[user_role]["level"] >= required_level
    
    def generate_api_key(self, user_id: str, permissions: List[str] = None) -> str:
        """Generate an API key for a user."""
        if permissions is None:
            permissions = ["read"]
        
        api_key_data = {
            "user_id": user_id,
            "permissions": permissions,
            "created_at": datetime.utcnow().isoformat(),
            "key_type": "api"
        }
        
        # Create a long-lived token (1 year)
        expires_delta = timedelta(days=365)
        api_key = self.create_access_token(api_key_data, expires_delta)
        
        return api_key
    
    def validate_api_key(self, api_key: str) -> Optional[Dict]:
        """Validate an API key and return user information."""
        token_data = self.verify_token(api_key)
        
        if token_data and token_data.get("key_type") == "api":
            return {
                "user_id": token_data.get("user_id"),
                "permissions": token_data.get("permissions", []),
                "created_at": token_data.get("created_at")
            }
        
        return None


class TwoFactorAuthService:
    """Service for handling two-factor authentication."""
    
    def __init__(self, issuer_name: str = "SkillMirror"):
        self.issuer_name = issuer_name
    
    def generate_secret(self) -> str:
        """Generate a new TOTP secret."""
        return pyotp.random_base32()
    
    def generate_qr_code(self, user_email: str, secret: str) -> str:
        """Generate QR code for TOTP setup."""
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            user_email,
            issuer_name=self.issuer_name
        )
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        
        # Convert to base64 image
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    def verify_totp(self, secret: str, token: str, window: int = 1) -> bool:
        """Verify a TOTP token."""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=window)
    
    def generate_backup_codes(self, count: int = 8) -> List[str]:
        """Generate backup codes for 2FA recovery."""
        codes = []
        for _ in range(count):
            code = secrets.token_hex(4).upper()
            codes.append(f"{code[:4]}-{code[4:]}")
        return codes
    
    def verify_backup_code(self, provided_code: str, stored_codes: List[str]) -> Tuple[bool, List[str]]:
        """Verify a backup code and remove it from the list."""
        normalized_code = provided_code.upper().replace(" ", "").replace("-", "")
        
        for i, stored_code in enumerate(stored_codes):
            normalized_stored = stored_code.replace("-", "")
            if normalized_code == normalized_stored:
                # Remove the used code
                remaining_codes = stored_codes[:i] + stored_codes[i+1:]
                return True, remaining_codes
        
        return False, stored_codes


class SessionManager:
    """Service for managing user sessions and security."""
    
    def __init__(self, max_sessions_per_user: int = 5):
        self.max_sessions_per_user = max_sessions_per_user
        self.suspicious_activity_threshold = 5
    
    def calculate_risk_score(self, user_id: str, ip_address: str, 
                           user_agent: str, action: str) -> int:
        """Calculate risk score for a user action."""
        risk_score = 0
        
        # Check for suspicious patterns
        if self._is_suspicious_ip(ip_address):
            risk_score += 3
        
        if self._is_suspicious_user_agent(user_agent):
            risk_score += 2
        
        if self._is_suspicious_action(action):
            risk_score += 4
        
        # Check login patterns (this would typically query recent login history)
        if self._has_unusual_login_pattern(user_id, ip_address):
            risk_score += 3
        
        return min(risk_score, 10)  # Cap at 10
    
    def _is_suspicious_ip(self, ip_address: str) -> bool:
        """Check if IP address is suspicious."""
        # In production, this would check against threat intelligence feeds
        suspicious_patterns = [
            "tor-exit",  # TOR exit nodes
            "proxy",     # Known proxy services
            "vpn"        # Known VPN services
        ]
        
        # Simple check for now - in production would use IP reputation services
        return any(pattern in ip_address.lower() for pattern in suspicious_patterns)
    
    def _is_suspicious_user_agent(self, user_agent: str) -> bool:
        """Check if user agent is suspicious."""
        if not user_agent:
            return True
        
        suspicious_patterns = [
            "bot",
            "crawler",
            "spider",
            "scraper",
            "python-requests",  # Automated tools
            "curl"
        ]
        
        return any(pattern in user_agent.lower() for pattern in suspicious_patterns)
    
    def _is_suspicious_action(self, action: str) -> bool:
        """Check if action is inherently risky."""
        high_risk_actions = [
            "password_change",
            "email_change",
            "2fa_disable",
            "api_key_generate",
            "data_export",
            "account_delete"
        ]
        
        return action in high_risk_actions
    
    def _has_unusual_login_pattern(self, user_id: str, ip_address: str) -> bool:
        """Check for unusual login patterns."""
        # In production, this would analyze:
        # - Geographic location changes
        # - Time-based patterns
        # - Device fingerprinting
        # - Velocity checks
        
        # Simplified check for demonstration
        return False
    
    def should_require_additional_auth(self, risk_score: int) -> bool:
        """Determine if additional authentication is required."""
        return risk_score >= 5
    
    def should_block_action(self, risk_score: int) -> bool:
        """Determine if action should be blocked entirely."""
        return risk_score >= 8
    
    def generate_device_fingerprint(self, request_data: Dict) -> str:
        """Generate a device fingerprint from request data."""
        fingerprint_data = {
            "user_agent": request_data.get("user_agent", ""),
            "accept_language": request_data.get("accept_language", ""),
            "screen_resolution": request_data.get("screen_resolution", ""),
            "timezone": request_data.get("timezone", ""),
            "plugins": request_data.get("plugins", [])
        }
        
        # Create hash of fingerprint data
        fingerprint_str = json.dumps(fingerprint_data, sort_keys=True)
        return hashlib.sha256(fingerprint_str.encode()).hexdigest()
    
    def validate_csrf_token(self, token: str, session_id: str) -> bool:
        """Validate CSRF token for session."""
        # Simple implementation - in production would be more sophisticated
        expected_token = hashlib.sha256(f"{session_id}_csrf".encode()).hexdigest()
        return secrets.compare_digest(token, expected_token)
    
    def generate_csrf_token(self, session_id: str) -> str:
        """Generate CSRF token for session."""
        return hashlib.sha256(f"{session_id}_csrf".encode()).hexdigest()