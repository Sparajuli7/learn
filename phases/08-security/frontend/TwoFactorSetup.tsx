/**
 * Two-Factor Authentication Setup Component
 * Handles 2FA setup and management
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  QrCode, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  Smartphone,
  Key,
  Download
} from 'lucide-react';

interface BackupCode {
  code: string;
  used: boolean;
}

const TwoFactorSetup: React.FC = () => {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<'initial' | 'qr' | 'verify' | 'backup' | 'complete'>('initial');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleStart2FASetup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: localStorage.getItem('userEmail') || 'user@example.com'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qr_code);
        setSecret(data.secret);
        setBackupCodes(data.backup_codes);
        setSetupStep('qr');
      } else {
        throw new Error('Failed to setup 2FA');
      }
    } catch (err) {
      setError('Failed to initialize 2FA setup');
      console.error('2FA setup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          token: verificationCode,
          secret: secret
        })
      });

      if (response.ok) {
        setIs2FAEnabled(true);
        setSetupStep('backup');
        setSuccess('2FA has been successfully enabled!');
      } else {
        throw new Error('Invalid verification code');
      }
    } catch (err) {
      setError('Invalid verification code. Please try again.');
      console.error('2FA verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would call the disable 2FA endpoint
      setIs2FAEnabled(false);
      setSetupStep('initial');
      setSuccess('2FA has been disabled');
    } catch (err) {
      setError('Failed to disable 2FA');
      console.error('2FA disable error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const downloadBackupCodes = () => {
    const content = `SkillMirror Two-Factor Authentication Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nIMPORTANT: Store these codes in a safe place. Each code can only be used once.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skillmirror-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatSecretForManualEntry = (secret: string) => {
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          Two-Factor Authentication
        </h1>
        <Badge variant={is2FAEnabled ? "default" : "secondary"}>
          {is2FAEnabled ? 'Enabled' : 'Disabled'}
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Two-Factor Authentication is {is2FAEnabled ? 'enabled' : 'disabled'}
              </p>
              <p className="text-sm text-gray-600">
                {is2FAEnabled 
                  ? 'Your account is protected with 2FA. You can manage your settings below.'
                  : 'Add an extra layer of security to your account by enabling 2FA.'
                }
              </p>
            </div>
            {is2FAEnabled ? (
              <Button variant="destructive" onClick={handleDisable2FA} disabled={loading}>
                Disable 2FA
              </Button>
            ) : (
              <Button onClick={handleStart2FASetup} disabled={loading}>
                <Shield className="h-4 w-4 mr-2" />
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Process */}
      {setupStep !== 'initial' && !is2FAEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Two-Factor Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: QR Code */}
            {setupStep === 'qr' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Step 1: Scan QR Code</h3>
                  <p className="text-gray-600 mb-4">
                    Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code:
                  </p>
                  
                  {qrCode && (
                    <div className="flex justify-center mb-4">
                      <img src={qrCode} alt="2FA QR Code" className="border rounded-lg" />
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Manual Entry Code:</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="bg-white px-3 py-2 rounded border text-sm">
                        {formatSecretForManualEntry(secret)}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(secret)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button onClick={() => setSetupStep('verify')}>
                    <QrCode className="h-4 w-4 mr-2" />
                    I've Added the Account
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Verify */}
            {setupStep === 'verify' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Step 2: Verify Setup</h3>
                  <p className="text-gray-600 mb-4">
                    Enter the 6-digit code from your authenticator app:
                  </p>
                  
                  <div className="flex justify-center mb-4">
                    <Input
                      type="text"
                      placeholder="123456"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-2xl font-mono w-48"
                      maxLength={6}
                    />
                  </div>
                </div>
                
                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => setSetupStep('qr')}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleVerify2FA} 
                    disabled={verificationCode.length !== 6 || loading}
                  >
                    Verify & Enable 2FA
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Backup Codes */}
            {setupStep === 'backup' && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Step 3: Save Backup Codes</h3>
                  <p className="text-gray-600 mb-4">
                    Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
                  </p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="bg-white p-2 rounded border text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={downloadBackupCodes}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Codes
                    </Button>
                    <Button onClick={() => copyToClipboard(backupCodes.join('\n'))}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All Codes
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button onClick={() => setSetupStep('complete')}>
                    I've Saved My Backup Codes
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {setupStep === 'complete' && (
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                <h3 className="text-lg font-semibold">2FA Successfully Enabled!</h3>
                <p className="text-gray-600">
                  Your account is now protected with two-factor authentication.
                </p>
                <Button onClick={() => window.location.reload()}>
                  Continue to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2FA Management (when enabled) */}
      {is2FAEnabled && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Backup Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recovery Codes</p>
                  <p className="text-sm text-gray-600">
                    Use these codes if you lose access to your authenticator app
                  </p>
                </div>
                <Button variant="outline">
                  View Codes
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trusted Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Current Device</p>
                    <p className="text-sm text-gray-600">Added today</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>About Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">What is 2FA?</h4>
              <p className="text-sm text-gray-600">
                Two-factor authentication adds an extra layer of security by requiring both your password 
                and a verification code from your phone.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Recommended Apps</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Google Authenticator</li>
                <li>• Authy</li>
                <li>• Microsoft Authenticator</li>
                <li>• 1Password</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TwoFactorSetup;