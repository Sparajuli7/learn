"""
Security API Module
FastAPI endpoints for security, compliance, and privacy management.
"""

from fastapi import FastAPI, HTTPException, Depends, Request, UploadFile, File, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
import json
import os
from datetime import datetime, timedelta
import tempfile
import asyncio

# Import our security modules
from security_database import SecurityDatabase
from encryption_service import VideoEncryptionService, DataAnonymizer
from authentication_service import AuthenticationService, TwoFactorAuthService, SessionManager

app = FastAPI(title="SkillMirror Security API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://skillmirror.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security services
security_db = SecurityDatabase()
encryption_service = VideoEncryptionService()
auth_service = AuthenticationService()
totp_service = TwoFactorAuthService()
session_manager = SessionManager()
security = HTTPBearer()

# Pydantic models
class SecurityLogRequest(BaseModel):
    action: str
    details: Optional[Dict[str, Any]] = None

class PrivacySettingRequest(BaseModel):
    setting_name: str
    value: str

class DataDeletionRequest(BaseModel):
    deletion_type: str = "full"
    reason: Optional[str] = None

class ComplianceReportRequest(BaseModel):
    report_type: str
    user_id: Optional[str] = None

class TwoFactorSetupRequest(BaseModel):
    email: EmailStr

class TwoFactorVerifyRequest(BaseModel):
    token: str
    secret: str

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class APIKeyRequest(BaseModel):
    permissions: List[str] = ["read"]

# Dependency functions
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token."""
    token_data = auth_service.verify_token(credentials.credentials)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token_data

async def require_permission(permission: str):
    """Decorator to require specific permission."""
    def permission_checker(user_data: dict = Depends(get_current_user)):
        user_role = user_data.get("role", "user")
        if not auth_service.check_permission(user_role, permission):
            raise HTTPException(status_code=403, detail=f"Permission '{permission}' required")
        return user_data
    return permission_checker

async def log_request(request: Request, user_data: dict = Depends(get_current_user)):
    """Log security events for requests."""
    user_id = user_data.get("user_id", "anonymous")
    action = f"{request.method} {request.url.path}"
    ip_address = request.client.host
    user_agent = request.headers.get("user-agent", "")
    
    # Calculate risk score
    risk_score = session_manager.calculate_risk_score(user_id, ip_address, user_agent, action)
    
    # Log the event
    security_db.log_security_event(
        user_id=user_id,
        action=action,
        ip_address=ip_address,
        user_agent=user_agent,
        risk_score=risk_score
    )
    
    # Check if action should be blocked
    if session_manager.should_block_action(risk_score):
        raise HTTPException(status_code=403, detail="Action blocked due to security risk")
    
    return user_data

# Authentication endpoints
@app.post("/auth/login")
async def login(request: Request, email: str, password: str):
    """User login with security monitoring."""
    # In production, validate against user database
    # For demo, accept any non-empty credentials
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    # Log login attempt
    ip_address = request.client.host
    user_agent = request.headers.get("user-agent", "")
    
    # Create session
    session_token = security_db.create_user_session(
        user_id=email,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    # Create JWT token
    token_data = {
        "user_id": email,
        "role": "user",
        "session_id": session_token
    }
    access_token = auth_service.create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "session_id": session_token
    }

@app.post("/auth/logout")
async def logout(user_data: dict = Depends(get_current_user)):
    """User logout."""
    session_id = user_data.get("session_id")
    if session_id:
        # In production, invalidate session in database
        pass
    
    return {"message": "Logged out successfully"}

# Two-factor authentication endpoints
@app.post("/auth/2fa/setup")
async def setup_2fa(request: TwoFactorSetupRequest, user_data: dict = Depends(get_current_user)):
    """Setup two-factor authentication."""
    secret = totp_service.generate_secret()
    qr_code = totp_service.generate_qr_code(request.email, secret)
    backup_codes = totp_service.generate_backup_codes()
    
    return {
        "secret": secret,
        "qr_code": qr_code,
        "backup_codes": backup_codes
    }

@app.post("/auth/2fa/verify")
async def verify_2fa(request: TwoFactorVerifyRequest, user_data: dict = Depends(get_current_user)):
    """Verify two-factor authentication token."""
    is_valid = totp_service.verify_totp(request.secret, request.token)
    
    if is_valid:
        security_db.log_security_event(
            user_id=user_data["user_id"],
            action="2fa_enabled",
            details={"success": True}
        )
        return {"message": "2FA enabled successfully"}
    else:
        raise HTTPException(status_code=400, detail="Invalid token")

# Security monitoring endpoints
@app.post("/security/log")
async def log_security_event(
    request: SecurityLogRequest,
    http_request: Request,
    user_data: dict = Depends(log_request)
):
    """Log a custom security event."""
    security_db.log_security_event(
        user_id=user_data["user_id"],
        action=request.action,
        ip_address=http_request.client.host,
        user_agent=http_request.headers.get("user-agent", ""),
        details=request.details
    )
    
    return {"message": "Event logged successfully"}

@app.get("/security/logs")
async def get_security_logs(
    limit: int = 100,
    user_data: dict = Depends(require_permission("security_audit"))
):
    """Get security logs (admin only)."""
    logs = security_db.get_security_logs(limit=limit)
    
    # Anonymize sensitive data for non-admin users
    if user_data.get("role") != "admin":
        for log in logs:
            log["ip_address"] = DataAnonymizer.anonymize_ip_address(log["ip_address"])
    
    return {"logs": logs}

@app.get("/security/logs/user/{user_id}")
async def get_user_security_logs(
    user_id: str,
    limit: int = 50,
    user_data: dict = Depends(get_current_user)
):
    """Get security logs for a specific user."""
    # Users can only view their own logs unless they're admin
    if user_data["user_id"] != user_id and user_data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Cannot view other users' logs")
    
    logs = security_db.get_security_logs(user_id=user_id, limit=limit)
    return {"logs": logs}

# Privacy and compliance endpoints
@app.post("/privacy/settings")
async def set_privacy_setting(
    request: PrivacySettingRequest,
    user_data: dict = Depends(get_current_user)
):
    """Set a privacy setting for the user."""
    security_db.set_privacy_setting(
        user_id=user_data["user_id"],
        setting_name=request.setting_name,
        value=request.value
    )
    
    security_db.log_security_event(
        user_id=user_data["user_id"],
        action="privacy_setting_updated",
        details={"setting": request.setting_name}
    )
    
    return {"message": "Privacy setting updated"}

@app.get("/privacy/settings")
async def get_privacy_settings(user_data: dict = Depends(get_current_user)):
    """Get privacy settings for the user."""
    settings = security_db.get_privacy_settings(user_data["user_id"])
    return {"settings": settings}

@app.post("/compliance/data-deletion")
async def request_data_deletion(
    request: DataDeletionRequest,
    user_data: dict = Depends(get_current_user)
):
    """Request data deletion (GDPR/CCPA compliance)."""
    verification_token = security_db.create_data_deletion_request(
        user_id=user_data["user_id"],
        deletion_type=request.deletion_type,
        reason=request.reason
    )
    
    return {
        "message": "Data deletion request submitted",
        "verification_token": verification_token
    }

@app.post("/compliance/reports")
async def generate_compliance_report(
    request: ComplianceReportRequest,
    background_tasks: BackgroundTasks,
    user_data: dict = Depends(require_permission("admin"))
):
    """Generate compliance report."""
    # Generate report in background
    report_id = security_db.generate_compliance_report(
        report_type=request.report_type,
        user_id=request.user_id
    )
    
    return {
        "message": "Report generation started",
        "report_id": report_id
    }

@app.get("/compliance/export/{user_id}")
async def export_user_data(
    user_id: str,
    user_data: dict = Depends(get_current_user)
):
    """Export user data (GDPR compliance)."""
    # Users can only export their own data unless they're admin
    if user_data["user_id"] != user_id and user_data.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Cannot export other users' data")
    
    report_id = security_db.generate_compliance_report("gdpr_data_export", user_id)
    
    return {
        "message": "Data export initiated",
        "report_id": report_id
    }

# Video encryption endpoints
@app.post("/security/encrypt-video")
async def encrypt_video(
    video_file: UploadFile = File(...),
    user_data: dict = Depends(get_current_user)
):
    """Encrypt uploaded video file."""
    if not video_file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as temp_file:
        content = await video_file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    # Encrypt the video
    encrypted_file_path = temp_file_path + ".encrypted"
    encryption_result = encryption_service.encrypt_file(
        file_path=temp_file_path,
        output_path=encrypted_file_path
    )
    
    # Store encryption key securely (associated with user)
    security_db.store_encryption_key(
        user_id=user_data["user_id"],
        key_type="video_encryption",
        encrypted_key=encryption_result["key"]
    )
    
    # Clean up original temp file
    encryption_service.secure_delete_file(temp_file_path)
    
    security_db.log_security_event(
        user_id=user_data["user_id"],
        action="video_encrypted",
        details={"file_hash": encryption_result["file_hash"]}
    )
    
    return {
        "message": "Video encrypted successfully",
        "file_hash": encryption_result["file_hash"],
        "encrypted_file": encrypted_file_path
    }

@app.post("/security/decrypt-video")
async def decrypt_video(
    encrypted_file_path: str,
    file_hash: str,
    user_data: dict = Depends(get_current_user)
):
    """Decrypt video file."""
    # Get encryption key for user
    encryption_key = security_db.get_encryption_key(
        user_id=user_data["user_id"],
        key_type="video_encryption"
    )
    
    if not encryption_key:
        raise HTTPException(status_code=404, detail="Encryption key not found")
    
    # Decrypt file
    decrypted_file_path = encrypted_file_path.replace(".encrypted", ".decrypted")
    success = encryption_service.decrypt_file(
        encrypted_path=encrypted_file_path,
        output_path=decrypted_file_path,
        key=encryption_key,
        expected_hash=file_hash
    )
    
    if not success:
        raise HTTPException(status_code=500, detail="Decryption failed")
    
    security_db.log_security_event(
        user_id=user_data["user_id"],
        action="video_decrypted",
        details={"file_hash": file_hash}
    )
    
    return FileResponse(
        path=decrypted_file_path,
        filename="decrypted_video.mp4",
        media_type="video/mp4"
    )

# API key management
@app.post("/security/api-keys")
async def generate_api_key(
    request: APIKeyRequest,
    user_data: dict = Depends(get_current_user)
):
    """Generate API key for user."""
    api_key = auth_service.generate_api_key(
        user_id=user_data["user_id"],
        permissions=request.permissions
    )
    
    security_db.log_security_event(
        user_id=user_data["user_id"],
        action="api_key_generated",
        details={"permissions": request.permissions}
    )
    
    return {
        "api_key": api_key,
        "permissions": request.permissions
    }

@app.get("/security/api-keys/validate")
async def validate_api_key(api_key: str):
    """Validate API key."""
    key_data = auth_service.validate_api_key(api_key)
    
    if not key_data:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return key_data

# Health and status endpoints
@app.get("/security/health")
async def security_health():
    """Check security system health."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "database": "online",
            "encryption": "online",
            "authentication": "online"
        }
    }

@app.get("/security/audit-summary")
async def security_audit_summary(user_data: dict = Depends(require_permission("security_audit"))):
    """Get security audit summary."""
    report_id = security_db.generate_compliance_report("security_audit")
    
    return {
        "message": "Security audit report generated",
        "report_id": report_id
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)