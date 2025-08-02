/**
 * Security Dashboard Component
 * Main dashboard for security monitoring and management
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Key, AlertTriangle, CheckCircle, Settings, Activity } from 'lucide-react';

interface SecurityLog {
  id: number;
  action: string;
  timestamp: string;
  ip_address: string;
  risk_score: number;
  details?: any;
}

interface SecurityMetrics {
  totalEvents: number;
  highRiskEvents: number;
  activeSession: number;
  last2FAUsed?: string;
  encryptedVideos: number;
}

const SecurityDashboard: React.FC = () => {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Fetch security logs
      const logsResponse = await fetch('/api/security/logs/user', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setSecurityLogs(logsData.logs || []);
      }

      // Calculate metrics from logs
      const totalEvents = securityLogs.length;
      const highRiskEvents = securityLogs.filter(log => log.risk_score >= 5).length;
      const encryptedVideos = securityLogs.filter(log => log.action === 'video_encrypted').length;

      setMetrics({
        totalEvents,
        highRiskEvents,
        activeSession: 1,
        encryptedVideos
      });

    } catch (err) {
      setError('Failed to fetch security data');
      console.error('Security data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeColor = (riskScore: number) => {
    if (riskScore >= 7) return 'destructive';
    if (riskScore >= 4) return 'secondary';
    return 'default';
  };

  const getRiskBadgeText = (riskScore: number) => {
    if (riskScore >= 7) return 'High Risk';
    if (riskScore >= 4) return 'Medium Risk';
    return 'Low Risk';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-blue-600" />
          Security Dashboard
        </h1>
        <Button onClick={fetchSecurityData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold">{metrics?.totalEvents || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Risk Events</p>
                <p className="text-2xl font-bold text-red-600">{metrics?.highRiskEvents || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-green-600">{metrics?.activeSession || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Encrypted Videos</p>
                <p className="text-2xl font-bold text-purple-600">{metrics?.encryptedVideos || 0}</p>
              </div>
              <Key className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Tabs */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Security Logs</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityLogs.length === 0 ? (
                  <p className="text-gray-500">No security events found</p>
                ) : (
                  securityLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.action}</span>
                          <Badge variant={getRiskBadgeColor(log.risk_score)}>
                            {getRiskBadgeText(log.risk_score)}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          IP: {log.ip_address} • {formatTimestamp(log.timestamp)}
                        </p>
                        {log.details && (
                          <p className="text-xs text-gray-500 mt-1">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Risk: {log.risk_score}/10</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-gray-600">Started: {new Date().toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Active</Badge>
                    <Button variant="outline" size="sm">
                      End Session
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </div>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">API Keys</p>
                  <p className="text-sm text-gray-600">Manage your API access keys</p>
                </div>
                <Button variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  Manage Keys
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Video Encryption</p>
                  <p className="text-sm text-gray-600">Automatically encrypt uploaded videos</p>
                </div>
                <Button variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;