#!/bin/bash

# SkillMirror Security and Compliance Setup Script
# Phase 8: Security, Compliance, and Final Integration

set -e  # Exit on any error

echo "🛡️  Setting up SkillMirror Security and Compliance (Phase 8)..."
echo "=================================================================="

# Check if we're in the right directory
if [ ! -d "phases/08-security" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "phases/08-security/venv" ]; then
    echo "📦 Creating virtual environment..."
    cd phases/08-security
    python3 -m venv venv
    cd ../..
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source phases/08-security/venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip
pip install -r phases/08-security/backend/requirements.txt

# Create necessary directories
echo "📁 Creating directory structure..."
mkdir -p phases/08-security/backend/logs
mkdir -p phases/08-security/backend/keys
mkdir -p phases/08-security/backend/temp
mkdir -p phases/08-security/frontend/dist
mkdir -p phases/08-security/tests
mkdir -p phases/08-security/docs

# Set up secure directories with proper permissions
echo "🔒 Setting up secure directories..."
chmod 700 phases/08-security/backend/keys
chmod 700 phases/08-security/backend/temp

# Initialize security database
echo "🗄️  Initializing security database..."
cd phases/08-security/backend
python3 -c "
from security_database import SecurityDatabase
db = SecurityDatabase('security.db')
print('Security database initialized successfully!')
"
cd ../../..

# Generate initial encryption keys
echo "🔑 Generating initial encryption keys..."
cd phases/08-security/backend
python3 -c "
from encryption_service import VideoEncryptionService
import os

encryption_service = VideoEncryptionService()

# Generate master key
master_key = encryption_service.generate_key()
with open('keys/master_key.key', 'wb') as f:
    f.write(master_key)

# Generate RSA keypair for asymmetric encryption
private_key, public_key = encryption_service.generate_keypair()
with open('keys/rsa_private.pem', 'wb') as f:
    f.write(private_key)
with open('keys/rsa_public.pem', 'wb') as f:
    f.write(public_key)

print('Encryption keys generated successfully!')
print('Keys stored in: phases/08-security/backend/keys/')
"
cd ../../..

# Set up JWT secret
echo "🔐 Setting up JWT secret..."
cd phases/08-security/backend
python3 -c "
import secrets
import os

# Generate JWT secret
jwt_secret = secrets.token_urlsafe(64)
with open('keys/jwt_secret.key', 'w') as f:
    f.write(jwt_secret)

print('JWT secret generated successfully!')
"
cd ../../..

# Run security tests
echo "🧪 Running security tests..."
cd phases/08-security/backend
python3 -m pytest security_tests.py -v --tb=short
cd ../../..

# Create environment configuration
echo "⚙️  Creating environment configuration..."
cat > phases/08-security/backend/.env << EOF
# SkillMirror Security Configuration
# Generated on $(date)

# Database
DATABASE_URL=sqlite:///security.db

# Security Keys
JWT_SECRET_FILE=keys/jwt_secret.key
MASTER_KEY_FILE=keys/master_key.key
RSA_PRIVATE_KEY_FILE=keys/rsa_private.pem
RSA_PUBLIC_KEY_FILE=keys/rsa_public.pem

# API Configuration
API_HOST=0.0.0.0
API_PORT=8008
DEBUG=false

# Security Settings
SESSION_TIMEOUT_HOURS=24
MAX_LOGIN_ATTEMPTS=5
RATE_LIMIT_PER_MINUTE=60
ENCRYPTION_ALGORITHM=AES-256-CBC

# Compliance Settings
GDPR_DATA_RETENTION_DAYS=90
CCPA_DATA_RETENTION_DAYS=365
AUDIT_LOG_RETENTION_DAYS=2555  # 7 years

# Two-Factor Authentication
TOTP_ISSUER_NAME=SkillMirror
BACKUP_CODES_COUNT=8

# Email Configuration (for notifications)
EMAIL_ENABLED=false
# EMAIL_SMTP_HOST=smtp.example.com
# EMAIL_SMTP_PORT=587
# EMAIL_SMTP_USER=noreply@skillmirror.com
# EMAIL_SMTP_PASSWORD=your_password

# Monitoring
SECURITY_MONITORING_ENABLED=true
ALERT_HIGH_RISK_THRESHOLD=7
ALERT_EMAIL=security@skillmirror.com

EOF

# Create systemd service file for production
echo "🖥️  Creating systemd service file..."
cat > phases/08-security/skillmirror-security.service << EOF
[Unit]
Description=SkillMirror Security API
After=network.target

[Service]
Type=forking
User=skillmirror
Group=skillmirror
WorkingDirectory=/opt/skillmirror/phases/08-security/backend
Environment=PATH=/opt/skillmirror/phases/08-security/venv/bin
ExecStart=/opt/skillmirror/phases/08-security/venv/bin/gunicorn security_api:app \\
    --bind 0.0.0.0:8008 \\
    --workers 4 \\
    --worker-class uvicorn.workers.UvicornWorker \\
    --access-logfile /var/log/skillmirror/security-access.log \\
    --error-logfile /var/log/skillmirror/security-error.log \\
    --pid /var/run/skillmirror/security.pid \\
    --daemon
ExecReload=/bin/kill -s HUP \$MAINPID
ExecStop=/bin/kill -s TERM \$MAINPID
PIDFile=/var/run/skillmirror/security.pid
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Create log rotation configuration
echo "📋 Creating log rotation configuration..."
cat > phases/08-security/skillmirror-security-logrotate << EOF
/var/log/skillmirror/security-*.log {
    daily
    missingok
    rotate 365
    compress
    delaycompress
    notifempty
    create 644 skillmirror skillmirror
    postrotate
        systemctl reload skillmirror-security
    endscript
}
EOF

# Create security monitoring script
echo "📊 Creating security monitoring script..."
cat > phases/08-security/security_monitor.py << 'EOF'
#!/usr/bin/env python3
"""
Security Monitoring Script
Monitors security events and sends alerts for suspicious activity.
"""

import sqlite3
import smtplib
import json
import sys
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class SecurityMonitor:
    def __init__(self, db_path="backend/security.db"):
        self.db_path = db_path
        self.alert_threshold = 7  # High risk threshold
        
    def check_security_events(self):
        """Check for suspicious security events."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Check for high-risk events in the last hour
        one_hour_ago = datetime.now() - timedelta(hours=1)
        
        cursor.execute('''
            SELECT COUNT(*) as high_risk_count,
                   COUNT(DISTINCT user_id) as affected_users
            FROM security_logs 
            WHERE risk_score >= ? AND timestamp > ?
        ''', (self.alert_threshold, one_hour_ago.isoformat()))
        
        result = cursor.fetchone()
        high_risk_count, affected_users = result
        
        # Check for failed login attempts
        cursor.execute('''
            SELECT COUNT(*) as failed_logins,
                   COUNT(DISTINCT ip_address) as unique_ips
            FROM security_logs 
            WHERE action LIKE '%login%' AND risk_score > 3 
            AND timestamp > ?
        ''', (one_hour_ago.isoformat(),))
        
        failed_result = cursor.fetchone()
        failed_logins, unique_ips = failed_result
        
        conn.close()
        
        return {
            'high_risk_events': high_risk_count,
            'affected_users': affected_users,
            'failed_logins': failed_logins,
            'unique_attack_ips': unique_ips,
            'check_time': datetime.now().isoformat()
        }
    
    def send_alert(self, alert_data):
        """Send security alert email."""
        if alert_data['high_risk_events'] == 0 and alert_data['failed_logins'] < 5:
            return  # No alert needed
        
        subject = f"🚨 SkillMirror Security Alert - {alert_data['high_risk_events']} High Risk Events"
        
        body = f"""
Security Alert Report
Generated: {alert_data['check_time']}

Summary:
- High Risk Events (last hour): {alert_data['high_risk_events']}
- Affected Users: {alert_data['affected_users']}
- Failed Login Attempts: {alert_data['failed_logins']}
- Unique Attack IPs: {alert_data['unique_attack_ips']}

Please review the security logs immediately if any values are concerning.

This is an automated alert from SkillMirror Security Monitoring.
        """
        
        print(f"SECURITY ALERT: {subject}")
        print(body)
        
        # In production, send actual email
        # self._send_email(subject, body)
    
    def generate_daily_report(self):
        """Generate daily security report."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Get daily statistics
        yesterday = datetime.now() - timedelta(days=1)
        
        cursor.execute('''
            SELECT 
                COUNT(*) as total_events,
                COUNT(DISTINCT user_id) as active_users,
                AVG(risk_score) as avg_risk_score,
                MAX(risk_score) as max_risk_score
            FROM security_logs 
            WHERE timestamp > ?
        ''', (yesterday.isoformat(),))
        
        stats = cursor.fetchone()
        
        # Get top actions
        cursor.execute('''
            SELECT action, COUNT(*) as count
            FROM security_logs 
            WHERE timestamp > ?
            GROUP BY action
            ORDER BY count DESC
            LIMIT 10
        ''', (yesterday.isoformat(),))
        
        top_actions = cursor.fetchall()
        
        conn.close()
        
        report = {
            'date': datetime.now().date().isoformat(),
            'total_events': stats[0],
            'active_users': stats[1],
            'avg_risk_score': round(stats[2] or 0, 2),
            'max_risk_score': stats[3] or 0,
            'top_actions': [{'action': action, 'count': count} for action, count in top_actions]
        }
        
        return report

if __name__ == "__main__":
    monitor = SecurityMonitor()
    
    if len(sys.argv) > 1 and sys.argv[1] == "daily":
        # Generate daily report
        report = monitor.generate_daily_report()
        print("Daily Security Report:")
        print(json.dumps(report, indent=2))
    else:
        # Check for alerts
        alert_data = monitor.check_security_events()
        monitor.send_alert(alert_data)
EOF

chmod +x phases/08-security/security_monitor.py

# Create cron job for monitoring
echo "⏰ Creating cron jobs for security monitoring..."
cat > phases/08-security/security-crontab << EOF
# SkillMirror Security Monitoring Cron Jobs
# Check for security alerts every 15 minutes
*/15 * * * * cd /opt/skillmirror/phases/08-security && ./security_monitor.py

# Generate daily security report at 2 AM
0 2 * * * cd /opt/skillmirror/phases/08-security && ./security_monitor.py daily >> /var/log/skillmirror/security-daily.log 2>&1

# Backup security database daily at 3 AM
0 3 * * * cp /opt/skillmirror/phases/08-security/backend/security.db /var/backups/skillmirror/security-\$(date +\%Y\%m\%d).db
EOF

# Create backup script
echo "💾 Creating backup script..."
cat > phases/08-security/backup_security.sh << 'EOF'
#!/bin/bash

# SkillMirror Security Backup Script

BACKUP_DIR="/var/backups/skillmirror"
SECURITY_DIR="/opt/skillmirror/phases/08-security"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
echo "Backing up security database..."
cp $SECURITY_DIR/backend/security.db $BACKUP_DIR/security_$DATE.db

# Backup configuration
echo "Backing up configuration..."
tar -czf $BACKUP_DIR/security_config_$DATE.tar.gz \
    $SECURITY_DIR/backend/.env \
    $SECURITY_DIR/backend/keys/ \
    $SECURITY_DIR/*.service \
    $SECURITY_DIR/*-logrotate \
    $SECURITY_DIR/security-crontab

# Remove backups older than 30 days
echo "Cleaning old backups..."
find $BACKUP_DIR -name "security_*" -mtime +30 -delete

echo "Security backup completed: $DATE"
EOF

chmod +x phases/08-security/backup_security.sh

# Create production deployment script
echo "🚀 Creating production deployment script..."
cat > phases/08-security/deploy_production.sh << 'EOF'
#!/bin/bash

# SkillMirror Security Production Deployment Script

set -e

echo "🚀 Deploying SkillMirror Security to Production..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run this script as root"
    exit 1
fi

# Create user and directories
echo "👤 Creating system user and directories..."
useradd -r -s /bin/false skillmirror || true
mkdir -p /opt/skillmirror
mkdir -p /var/log/skillmirror
mkdir -p /var/run/skillmirror
mkdir -p /var/backups/skillmirror

# Copy application files
echo "📁 Copying application files..."
cp -r phases/08-security /opt/skillmirror/

# Set ownership and permissions
echo "🔒 Setting permissions..."
chown -R skillmirror:skillmirror /opt/skillmirror/phases/08-security
chown -R skillmirror:skillmirror /var/log/skillmirror
chown -R skillmirror:skillmirror /var/run/skillmirror
chown -R skillmirror:skillmirror /var/backups/skillmirror

# Set strict permissions on sensitive files
chmod 700 /opt/skillmirror/phases/08-security/backend/keys
chmod 600 /opt/skillmirror/phases/08-security/backend/keys/*
chmod 600 /opt/skillmirror/phases/08-security/backend/.env

# Install systemd service
echo "⚙️  Installing systemd service..."
cp /opt/skillmirror/phases/08-security/skillmirror-security.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable skillmirror-security

# Install log rotation
echo "📋 Installing log rotation..."
cp /opt/skillmirror/phases/08-security/skillmirror-security-logrotate /etc/logrotate.d/skillmirror-security

# Install cron jobs
echo "⏰ Installing cron jobs..."
crontab -u skillmirror /opt/skillmirror/phases/08-security/security-crontab

# Setup firewall rules
echo "🔥 Setting up firewall rules..."
ufw allow 8008/tcp comment "SkillMirror Security API"

# Start services
echo "🎬 Starting services..."
systemctl start skillmirror-security
systemctl status skillmirror-security

echo "✅ Production deployment completed!"
echo "📊 Security API is running on port 8008"
echo "📋 Logs are in /var/log/skillmirror/"
echo "🔧 Service can be managed with: systemctl {start|stop|restart} skillmirror-security"
EOF

chmod +x phases/08-security/deploy_production.sh

# Create Docker configuration
echo "🐳 Creating Docker configuration..."
cat > phases/08-security/Dockerfile << EOF
# SkillMirror Security API Docker Image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ .

# Create necessary directories
RUN mkdir -p logs keys temp

# Set environment variables
ENV PYTHONPATH=/app
ENV API_HOST=0.0.0.0
ENV API_PORT=8008

# Expose port
EXPOSE 8008

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8008/security/health || exit 1

# Run the application
CMD ["python", "security_api.py"]
EOF

cat > phases/08-security/docker-compose.yml << EOF
version: '3.8'

services:
  security-api:
    build: .
    container_name: skillmirror-security
    ports:
      - "8008:8008"
    volumes:
      - ./backend/security.db:/app/security.db
      - ./backend/keys:/app/keys:ro
      - ./backend/logs:/app/logs
    environment:
      - API_HOST=0.0.0.0
      - API_PORT=8008
      - DEBUG=false
    restart: unless-stopped
    networks:
      - skillmirror-network

networks:
  skillmirror-network:
    driver: bridge
EOF

# Start the security API in development mode
echo "🎬 Starting security API in development mode..."
cd phases/08-security/backend
python3 security_api.py &
SECURITY_PID=$!
sleep 5

# Test API health
echo "🔍 Testing API health..."
if curl -f http://localhost:8008/security/health >/dev/null 2>&1; then
    echo "✅ Security API is running successfully!"
    echo "📊 API URL: http://localhost:8008"
    echo "📖 API Documentation: http://localhost:8008/docs"
else
    echo "⚠️  Security API health check failed"
fi

# Kill the test process
kill $SECURITY_PID 2>/dev/null || true
cd ../../..

echo ""
echo "🛡️  SkillMirror Security Setup Complete!"
echo "================================================"
echo ""
echo "✅ Security database initialized"
echo "✅ Encryption keys generated"
echo "✅ JWT secret configured"
echo "✅ Tests passed"
echo "✅ Environment configured"
echo "✅ Production deployment scripts created"
echo "✅ Docker configuration created"
echo "✅ Monitoring and backup scripts created"
echo ""
echo "📁 Files created:"
echo "  - Backend API: phases/08-security/backend/"
echo "  - Frontend components: phases/08-security/frontend/"
echo "  - Security database: phases/08-security/backend/security.db"
echo "  - Encryption keys: phases/08-security/backend/keys/"
echo "  - Configuration: phases/08-security/backend/.env"
echo "  - Service file: phases/08-security/skillmirror-security.service"
echo "  - Deployment script: phases/08-security/deploy_production.sh"
echo "  - Monitoring script: phases/08-security/security_monitor.py"
echo ""
echo "🚀 To start the security API:"
echo "  cd phases/08-security/backend"
echo "  source ../venv/bin/activate"
echo "  python security_api.py"
echo ""
echo "🐳 To run with Docker:"
echo "  cd phases/08-security"
echo "  docker-compose up -d"
echo ""
echo "🔒 Security Features Implemented:"
echo "  ✅ End-to-end video encryption"
echo "  ✅ Multi-factor authentication"
echo "  ✅ Role-based access control"
echo "  ✅ Security monitoring and logging"
echo "  ✅ GDPR/CCPA compliance tools"
echo "  ✅ Data anonymization"
echo "  ✅ Session management"
echo "  ✅ API key management"
echo "  ✅ Automated security testing"
echo "  ✅ Production deployment pipeline"
echo ""
echo "Phase 8 setup complete! 🎉"