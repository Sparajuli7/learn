/**
 * Privacy Management Dashboard Component
 * GDPR and CCPA compliance interface for users
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Download, 
  Trash2, 
  Eye, 
  EyeOff, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users,
  Database
} from 'lucide-react';

interface PrivacySetting {
  setting_name: string;
  value: string;
  description: string;
  category: string;
}

interface DataDeletionRequest {
  id: number;
  deletion_type: string;
  request_date: string;
  status: string;
  completed_date?: string;
  reason?: string;
}

interface ComplianceReport {
  id: number;
  report_type: string;
  generated_at: string;
  status: string;
  download_url?: string;
}

const PrivacyManagementDashboard: React.FC = () => {
  const [privacySettings, setPrivacySettings] = useState<PrivacySetting[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DataDeletionRequest[]>([]);
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeletionDialog, setShowDeletionDialog] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [deletionType, setDeletionType] = useState('full');

  useEffect(() => {
    fetchPrivacyData();
  }, []);

  const fetchPrivacyData = async () => {
    try {
      setLoading(true);
      
      // Fetch privacy settings
      const settingsResponse = await fetch('/api/privacy/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        
        // Convert settings object to array with descriptions
        const settingsArray = Object.entries(settingsData.settings || {}).map(([key, value]) => ({
          setting_name: key,
          value: value as string,
          description: getSettingDescription(key),
          category: getSettingCategory(key)
        }));
        
        setPrivacySettings(settingsArray);
      }

      // In a real implementation, you would fetch deletion requests and reports
      // For now, we'll use mock data
      setDeletionRequests([]);
      setReports([]);

    } catch (err) {
      setError('Failed to fetch privacy data');
      console.error('Privacy data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSettingDescription = (settingName: string): string => {
    const descriptions: Record<string, string> = {
      'data_sharing_opt_out': 'Control whether your data can be shared with third parties',
      'analytics_tracking': 'Allow analytics tracking to improve our services',
      'marketing_communications': 'Receive marketing emails and notifications',
      'profile_visibility': 'Control who can see your profile information',
      'video_analytics': 'Allow analysis of your uploaded videos for insights',
      'location_tracking': 'Enable location-based features and recommendations',
      'cookies_functional': 'Allow functional cookies for basic site operation',
      'cookies_analytics': 'Allow analytics cookies to track usage patterns',
      'cookies_marketing': 'Allow marketing cookies for personalized advertisements'
    };
    return descriptions[settingName] || 'Privacy setting';
  };

  const getSettingCategory = (settingName: string): string => {
    if (settingName.includes('cookie')) return 'Cookies';
    if (settingName.includes('marketing') || settingName.includes('communication')) return 'Communications';
    if (settingName.includes('tracking') || settingName.includes('analytics')) return 'Analytics';
    return 'General';
  };

  const handleSettingChange = async (settingName: string, newValue: boolean) => {
    try {
      const response = await fetch('/api/privacy/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          setting_name: settingName,
          value: newValue.toString()
        })
      });

      if (response.ok) {
        setPrivacySettings(prev => 
          prev.map(setting => 
            setting.setting_name === settingName 
              ? { ...setting, value: newValue.toString() }
              : setting
          )
        );
      } else {
        throw new Error('Failed to update setting');
      }
    } catch (err) {
      setError('Failed to update privacy setting');
      console.error('Setting update error:', err);
    }
  };

  const handleDataExport = async () => {
    try {
      const response = await fetch('/api/compliance/export/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Data export initiated. Report ID: ${data.report_id}`);
      } else {
        throw new Error('Failed to initiate data export');
      }
    } catch (err) {
      setError('Failed to export data');
      console.error('Data export error:', err);
    }
  };

  const handleDataDeletion = async () => {
    try {
      const response = await fetch('/api/compliance/data-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          deletion_type: deletionType,
          reason: deletionReason
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Data deletion request submitted. Verification token: ${data.verification_token}`);
        setShowDeletionDialog(false);
        setDeletionReason('');
        fetchPrivacyData(); // Refresh data
      } else {
        throw new Error('Failed to submit deletion request');
      }
    } catch (err) {
      setError('Failed to submit deletion request');
      console.error('Data deletion error:', err);
    }
  };

  const groupedSettings = privacySettings.reduce((groups, setting) => {
    const category = setting.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(setting);
    return groups;
  }, {} as Record<string, PrivacySetting[]>);

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
          <Shield className="h-8 w-8 text-green-600" />
          Privacy Management
        </h1>
        <div className="flex gap-2">
          <Button onClick={handleDataExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export My Data
          </Button>
          <Dialog open={showDeletionDialog} onOpenChange={setShowDeletionDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete My Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Data Deletion</DialogTitle>
                <DialogDescription>
                  This action will permanently delete your data. Please specify the type of deletion and reason.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Deletion Type</label>
                  <Select value={deletionType} onValueChange={setDeletionType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Complete Account Deletion</SelectItem>
                      <SelectItem value="videos">Video Data Only</SelectItem>
                      <SelectItem value="analytics">Analytics Data Only</SelectItem>
                      <SelectItem value="profile">Profile Information Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Reason (Optional)</label>
                  <Textarea 
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    placeholder="Please let us know why you're requesting data deletion..."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowDeletionDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDataDeletion}>
                    Submit Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Privacy Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Privacy Settings</p>
                <p className="text-2xl font-bold">{privacySettings.length}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Requests</p>
                <p className="text-2xl font-bold">{deletionRequests.length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Status</p>
                <p className="text-2xl font-bold text-green-600">Compliant</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Tabs */}
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Privacy Settings</TabsTrigger>
          <TabsTrigger value="requests">Data Requests</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          {Object.entries(groupedSettings).map(([category, settings]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {category === 'Cookies' && <Database className="h-5 w-5" />}
                  {category === 'Communications' && <Users className="h-5 w-5" />}
                  {category === 'Analytics' && <Eye className="h-5 w-5" />}
                  {category === 'General' && <Shield className="h-5 w-5" />}
                  {category} Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.setting_name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium capitalize">
                        {setting.setting_name.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-gray-600">{setting.description}</p>
                    </div>
                    <Switch
                      checked={setting.value === 'true'}
                      onCheckedChange={(checked) => handleSettingChange(setting.setting_name, checked)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Deletion Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {deletionRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No data deletion requests</p>
                  <p className="text-sm text-gray-400">Your data deletion requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deletionRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium capitalize">{request.deletion_type} Deletion</p>
                        <p className="text-sm text-gray-600">
                          Requested: {new Date(request.request_date).toLocaleDateString()}
                        </p>
                        {request.reason && (
                          <p className="text-sm text-gray-500">Reason: {request.reason}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          request.status === 'completed' ? 'default' :
                          request.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {request.status}
                        </Badge>
                        {request.completed_date && (
                          <p className="text-xs text-gray-500 mt-1">
                            Completed: {new Date(request.completed_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">GDPR Rights</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Right to access your data</li>
                    <li>• Right to rectify inaccurate data</li>
                    <li>• Right to erase your data</li>
                    <li>• Right to restrict processing</li>
                    <li>• Right to data portability</li>
                    <li>• Right to object to processing</li>
                  </ul>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">CCPA Rights</h3>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Right to know about data collection</li>
                    <li>• Right to delete personal information</li>
                    <li>• Right to opt-out of data sales</li>
                    <li>• Right to non-discrimination</li>
                    <li>• Right to request specific pieces of information</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Processing Timeframes
                </h3>
                <div className="text-sm space-y-1">
                  <p>• Data export requests: Up to 30 days</p>
                  <p>• Data deletion requests: Up to 90 days</p>
                  <p>• Privacy setting changes: Immediate</p>
                  <p>• Compliance reports: Up to 7 business days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrivacyManagementDashboard;