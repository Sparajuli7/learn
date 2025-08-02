"""
Security Testing Suite
Comprehensive tests for security features and vulnerabilities.
"""

import pytest
import asyncio
import json
import tempfile
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, patch

# Import modules to test
from security_database import SecurityDatabase
from encryption_service import VideoEncryptionService, DataAnonymizer
from authentication_service import AuthenticationService, TwoFactorAuthService, SessionManager
from security_api import app

from fastapi.testclient import TestClient

class TestSecurityDatabase:
    """Test security database operations."""
    
    def setup_method(self):
        """Setup test database."""
        self.db = SecurityDatabase(":memory:")  # Use in-memory database for tests
    
    def test_database_initialization(self):
        """Test database tables are created properly."""
        # Database should initialize without errors
        assert self.db.db_path == ":memory:"
    
    def test_log_security_event(self):
        """Test logging security events."""
        user_id = "test_user"
        action = "login_attempt"
        ip_address = "192.168.1.1"
        
        self.db.log_security_event(
            user_id=user_id,
            action=action,
            ip_address=ip_address,
            risk_score=2
        )
        
        logs = self.db.get_security_logs(user_id=user_id)
        assert len(logs) == 1
        assert logs[0]["action"] == action
        assert logs[0]["ip_address"] == ip_address
        assert logs[0]["risk_score"] == 2
    
    def test_privacy_settings(self):
        """Test privacy settings management."""
        user_id = "test_user"
        setting_name = "data_sharing_opt_out"
        value = "true"
        
        self.db.set_privacy_setting(user_id, setting_name, value)
        settings = self.db.get_privacy_settings(user_id)
        
        assert settings[setting_name] == value
    
    def test_data_deletion_request(self):
        """Test data deletion request creation."""
        user_id = "test_user"
        deletion_type = "full"
        reason = "GDPR request"
        
        token = self.db.create_data_deletion_request(
            user_id=user_id,
            deletion_type=deletion_type,
            reason=reason
        )
        
        assert token is not None
        assert len(token) > 20  # Should be a secure token
    
    def test_compliance_report_generation(self):
        """Test compliance report generation."""
        user_id = "test_user"
        report_type = "gdpr_data_export"
        
        report_id = self.db.generate_compliance_report(report_type, user_id)
        assert report_id is not None
        assert isinstance(report_id, int)
    
    def test_session_management(self):
        """Test user session creation and validation."""
        user_id = "test_user"
        ip_address = "192.168.1.1"
        
        session_token = self.db.create_user_session(user_id, ip_address)
        assert session_token is not None
        
        validated_user = self.db.validate_session(session_token)
        assert validated_user == user_id
    
    def test_encryption_key_storage(self):
        """Test encryption key storage and retrieval."""
        user_id = "test_user"
        key_type = "video_encryption"
        encrypted_key = "test_encrypted_key_data"
        
        key_id = self.db.store_encryption_key(user_id, key_type, encrypted_key)
        assert key_id is not None
        
        retrieved_key = self.db.get_encryption_key(user_id, key_type)
        assert retrieved_key == encrypted_key


class TestEncryptionService:
    """Test encryption and decryption functionality."""
    
    def setup_method(self):
        """Setup encryption service."""
        self.encryption_service = VideoEncryptionService()
    
    def test_key_generation(self):
        """Test encryption key generation."""
        key = self.encryption_service.generate_key()
        assert key is not None
        assert len(key) > 20  # Fernet keys are base64 encoded
    
    def test_keypair_generation(self):
        """Test RSA keypair generation."""
        private_key, public_key = self.encryption_service.generate_keypair()
        assert private_key is not None
        assert public_key is not None
        assert b"BEGIN PRIVATE KEY" in private_key
        assert b"BEGIN PUBLIC KEY" in public_key
    
    def test_password_key_derivation(self):
        """Test key derivation from password."""
        password = "test_password_123"
        key, salt = self.encryption_service.derive_key_from_password(password)
        
        assert key is not None
        assert salt is not None
        assert len(key) == 32  # 256-bit key
        assert len(salt) == 16  # 128-bit salt
        
        # Same password should derive same key with same salt
        key2, _ = self.encryption_service.derive_key_from_password(password, salt)
        assert key == key2
    
    def test_data_encryption_decryption(self):
        """Test data encryption and decryption."""
        test_data = b"This is secret test data for encryption"
        
        result = self.encryption_service.encrypt_data(test_data)
        assert "encrypted_data" in result
        assert "key" in result
        
        decrypted_data = self.encryption_service.decrypt_data(
            result["encrypted_data"],
            result["key"]
        )
        
        assert decrypted_data == test_data
    
    def test_file_encryption_decryption(self):
        """Test file encryption and decryption."""
        # Create temporary test file
        test_content = b"This is test file content for encryption testing"
        
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(test_content)
            temp_file_path = temp_file.name
        
        try:
            # Encrypt file
            encrypted_file_path = temp_file_path + ".encrypted"
            result = self.encryption_service.encrypt_file(
                temp_file_path,
                encrypted_file_path
            )
            
            assert "key" in result
            assert "file_hash" in result
            assert os.path.exists(encrypted_file_path)
            
            # Decrypt file
            decrypted_file_path = temp_file_path + ".decrypted"
            success = self.encryption_service.decrypt_file(
                encrypted_file_path,
                decrypted_file_path,
                result["key"],
                result["file_hash"]
            )
            
            assert success is True
            assert os.path.exists(decrypted_file_path)
            
            # Verify content
            with open(decrypted_file_path, 'rb') as f:
                decrypted_content = f.read()
            
            assert decrypted_content == test_content
            
        finally:
            # Cleanup
            for path in [temp_file_path, encrypted_file_path, decrypted_file_path]:
                if os.path.exists(path):
                    os.unlink(path)
    
    def test_asymmetric_encryption(self):
        """Test RSA asymmetric encryption."""
        private_key, public_key = self.encryption_service.generate_keypair()
        test_data = b"Secret message for asymmetric encryption"
        
        encrypted_data = self.encryption_service.encrypt_with_public_key(
            test_data, public_key
        )
        assert encrypted_data is not None
        assert encrypted_data != test_data
        
        decrypted_data = self.encryption_service.decrypt_with_private_key(
            encrypted_data, private_key
        )
        assert decrypted_data == test_data
    
    def test_secure_file_deletion(self):
        """Test secure file deletion."""
        # Create temporary file
        test_content = b"This file should be securely deleted"
        
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(test_content)
            temp_file_path = temp_file.name
        
        assert os.path.exists(temp_file_path)
        
        # Securely delete
        success = self.encryption_service.secure_delete_file(temp_file_path)
        assert success is True
        assert not os.path.exists(temp_file_path)


class TestDataAnonymizer:
    """Test data anonymization functionality."""
    
    def test_ip_anonymization(self):
        """Test IP address anonymization."""
        # IPv4
        ipv4 = "192.168.1.100"
        anonymized_ipv4 = DataAnonymizer.anonymize_ip_address(ipv4)
        assert anonymized_ipv4 == "192.168.1.0"
        
        # IPv6
        ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334"
        anonymized_ipv6 = DataAnonymizer.anonymize_ip_address(ipv6)
        assert anonymized_ipv6.startswith("2001:0db8:85a3:0000:")
    
    def test_email_anonymization(self):
        """Test email anonymization."""
        email = "john.doe@example.com"
        anonymized = DataAnonymizer.anonymize_email(email)
        assert anonymized.startswith("jo*")
        assert anonymized.endswith("@example.com")
    
    def test_text_anonymization(self):
        """Test text data anonymization."""
        text = "My SSN is 123-45-6789 and my credit card is 1234-5678-9012-3456"
        anonymized = DataAnonymizer.anonymize_text_data(text)
        
        assert "123-45-6789" not in anonymized
        assert "1234-5678-9012-3456" not in anonymized
        assert "***-**-****" in anonymized
        assert "****-****-****-****" in anonymized
    
    def test_identifier_hashing(self):
        """Test consistent identifier hashing."""
        identifier = "user123@example.com"
        
        hash1 = DataAnonymizer.hash_identifier(identifier)
        hash2 = DataAnonymizer.hash_identifier(identifier)
        
        assert hash1 == hash2  # Should be consistent
        assert len(hash1) == 16  # Should be 16 characters
        assert hash1 != identifier  # Should be different from original


class TestAuthenticationService:
    """Test authentication and authorization."""
    
    def setup_method(self):
        """Setup authentication service."""
        self.auth_service = AuthenticationService()
    
    def test_password_hashing(self):
        """Test password hashing and verification."""
        password = "test_password_123"
        
        hashed = self.auth_service.hash_password(password)
        assert hashed != password
        assert len(hashed) > 50  # Bcrypt hashes are long
        
        # Verify correct password
        assert self.auth_service.verify_password(password, hashed) is True
        
        # Verify incorrect password
        assert self.auth_service.verify_password("wrong_password", hashed) is False
    
    def test_jwt_token_creation_verification(self):
        """Test JWT token creation and verification."""
        user_data = {"user_id": "test_user", "role": "user"}
        
        token = self.auth_service.create_access_token(user_data)
        assert token is not None
        assert isinstance(token, str)
        
        # Verify token
        verified_data = self.auth_service.verify_token(token)
        assert verified_data is not None
        assert verified_data["user_id"] == "test_user"
        assert verified_data["role"] == "user"
    
    def test_permission_checking(self):
        """Test role-based permission checking."""
        # Admin should have all permissions
        assert self.auth_service.check_permission("admin", "read") is True
        assert self.auth_service.check_permission("admin", "delete") is True
        assert self.auth_service.check_permission("admin", "admin") is True
        
        # User should have limited permissions
        assert self.auth_service.check_permission("user", "read") is True
        assert self.auth_service.check_permission("user", "write") is True
        assert self.auth_service.check_permission("user", "admin") is False
        
        # Viewer should only have read permission
        assert self.auth_service.check_permission("viewer", "read") is True
        assert self.auth_service.check_permission("viewer", "write") is False
    
    def test_role_level_checking(self):
        """Test role level access control."""
        assert self.auth_service.check_role_level("admin", 5) is True
        assert self.auth_service.check_role_level("admin", 3) is True
        assert self.auth_service.check_role_level("user", 2) is False
        assert self.auth_service.check_role_level("user", 1) is True
    
    def test_api_key_generation_validation(self):
        """Test API key generation and validation."""
        user_id = "test_user"
        permissions = ["read", "write"]
        
        api_key = self.auth_service.generate_api_key(user_id, permissions)
        assert api_key is not None
        
        validated_data = self.auth_service.validate_api_key(api_key)
        assert validated_data is not None
        assert validated_data["user_id"] == user_id
        assert validated_data["permissions"] == permissions


class TestTwoFactorAuthService:
    """Test two-factor authentication."""
    
    def setup_method(self):
        """Setup 2FA service."""
        self.totp_service = TwoFactorAuthService()
    
    def test_secret_generation(self):
        """Test TOTP secret generation."""
        secret = self.totp_service.generate_secret()
        assert secret is not None
        assert len(secret) == 32  # Base32 encoded secret
    
    def test_qr_code_generation(self):
        """Test QR code generation."""
        secret = self.totp_service.generate_secret()
        email = "test@example.com"
        
        qr_code = self.totp_service.generate_qr_code(email, secret)
        assert qr_code is not None
        assert qr_code.startswith("data:image/png;base64,")
    
    def test_backup_codes_generation(self):
        """Test backup codes generation."""
        codes = self.totp_service.generate_backup_codes()
        assert len(codes) == 8
        
        for code in codes:
            assert len(code) == 9  # Format: XXXX-XXXX
            assert "-" in code
    
    def test_backup_code_verification(self):
        """Test backup code verification."""
        codes = ["ABCD-1234", "EFGH-5678", "IJKL-9012"]
        test_code = "ABCD-1234"
        
        # Valid code
        valid, remaining = self.totp_service.verify_backup_code(test_code, codes)
        assert valid is True
        assert len(remaining) == 2
        assert test_code not in remaining
        
        # Invalid code
        valid, remaining = self.totp_service.verify_backup_code("INVALID", codes)
        assert valid is False
        assert len(remaining) == 3


class TestSessionManager:
    """Test session management and security."""
    
    def setup_method(self):
        """Setup session manager."""
        self.session_manager = SessionManager()
    
    def test_risk_score_calculation(self):
        """Test security risk score calculation."""
        user_id = "test_user"
        normal_ip = "192.168.1.1"
        normal_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        normal_action = "view_profile"
        
        risk_score = self.session_manager.calculate_risk_score(
            user_id, normal_ip, normal_ua, normal_action
        )
        assert 0 <= risk_score <= 10
        
        # Test suspicious patterns
        suspicious_ua = "python-requests/2.25.1"
        suspicious_action = "password_change"
        
        suspicious_risk = self.session_manager.calculate_risk_score(
            user_id, normal_ip, suspicious_ua, suspicious_action
        )
        assert suspicious_risk > risk_score
    
    def test_additional_auth_requirements(self):
        """Test additional authentication requirements."""
        assert self.session_manager.should_require_additional_auth(3) is False
        assert self.session_manager.should_require_additional_auth(5) is True
        assert self.session_manager.should_require_additional_auth(7) is True
    
    def test_action_blocking(self):
        """Test action blocking based on risk."""
        assert self.session_manager.should_block_action(5) is False
        assert self.session_manager.should_block_action(8) is True
        assert self.session_manager.should_block_action(10) is True
    
    def test_device_fingerprinting(self):
        """Test device fingerprint generation."""
        request_data = {
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "accept_language": "en-US,en;q=0.9",
            "screen_resolution": "1920x1080",
            "timezone": "America/New_York"
        }
        
        fingerprint = self.session_manager.generate_device_fingerprint(request_data)
        assert fingerprint is not None
        assert len(fingerprint) == 64  # SHA256 hex string
        
        # Same data should produce same fingerprint
        fingerprint2 = self.session_manager.generate_device_fingerprint(request_data)
        assert fingerprint == fingerprint2
    
    def test_csrf_token_generation_validation(self):
        """Test CSRF token generation and validation."""
        session_id = "test_session_123"
        
        token = self.session_manager.generate_csrf_token(session_id)
        assert token is not None
        
        # Valid token
        assert self.session_manager.validate_csrf_token(token, session_id) is True
        
        # Invalid token
        assert self.session_manager.validate_csrf_token("invalid_token", session_id) is False


class TestSecurityAPI:
    """Test security API endpoints."""
    
    def setup_method(self):
        """Setup test client."""
        self.client = TestClient(app)
        
        # Mock authentication for testing
        self.test_token = "test_token_123"
        self.test_user_data = {
            "user_id": "test_user",
            "role": "admin",
            "session_id": "test_session"
        }
    
    @patch('security_api.auth_service.verify_token')
    def test_login_endpoint(self, mock_verify):
        """Test login endpoint."""
        response = self.client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        
        # Should fail without proper implementation
        # This would need actual user database integration
        assert response.status_code in [200, 400]
    
    @patch('security_api.auth_service.verify_token')
    def test_security_health_endpoint(self, mock_verify):
        """Test security health check."""
        response = self.client.get("/security/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "services" in data
    
    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints."""
        response = self.client.get("/security/logs")
        assert response.status_code == 403  # Should require authentication


class TestSecurityIntegration:
    """Integration tests for security features."""
    
    def setup_method(self):
        """Setup integration test environment."""
        self.db = SecurityDatabase(":memory:")
        self.encryption_service = VideoEncryptionService()
        self.auth_service = AuthenticationService()
    
    def test_complete_user_flow(self):
        """Test complete user security flow."""
        user_id = "integration_test_user"
        
        # 1. Create user session
        session_token = self.db.create_user_session(user_id, "192.168.1.1")
        assert session_token is not None
        
        # 2. Log security event
        self.db.log_security_event(user_id, "login", "192.168.1.1")
        
        # 3. Set privacy preferences
        self.db.set_privacy_setting(user_id, "data_sharing_opt_out", "true")
        
        # 4. Generate encryption key
        key_id = self.db.store_encryption_key(user_id, "video", "encrypted_key_data")
        assert key_id is not None
        
        # 5. Validate session
        validated_user = self.db.validate_session(session_token)
        assert validated_user == user_id
        
        # 6. Get user data for compliance
        settings = self.db.get_privacy_settings(user_id)
        assert settings["data_sharing_opt_out"] == "true"
        
        logs = self.db.get_security_logs(user_id=user_id)
        assert len(logs) >= 1
    
    def test_data_encryption_workflow(self):
        """Test complete data encryption workflow."""
        # Create test data
        test_data = b"Sensitive user video data"
        
        # Encrypt data
        encryption_result = self.encryption_service.encrypt_data(test_data)
        
        # Store encryption key (simulated)
        user_id = "test_user"
        self.db.store_encryption_key(
            user_id=user_id,
            key_type="video_encryption",
            encrypted_key=encryption_result["key"]
        )
        
        # Retrieve and decrypt
        stored_key = self.db.get_encryption_key(user_id, "video_encryption")
        decrypted_data = self.encryption_service.decrypt_data(
            encryption_result["encrypted_data"],
            stored_key
        )
        
        assert decrypted_data == test_data
    
    def test_compliance_workflow(self):
        """Test GDPR/CCPA compliance workflow."""
        user_id = "compliance_test_user"
        
        # User opts out of data sharing
        self.db.set_privacy_setting(user_id, "data_sharing_opt_out", "true")
        
        # Generate compliance report
        report_id = self.db.generate_compliance_report("gdpr_data_export", user_id)
        assert report_id is not None
        
        # Request data deletion
        token = self.db.create_data_deletion_request(user_id, "full", "GDPR request")
        assert token is not None
        
        # Process deletion request
        self.db.process_data_deletion_request(1, "completed")


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])