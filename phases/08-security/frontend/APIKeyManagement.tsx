/**
 * API Key Management Component
 * Handles creation, viewing, and management of API keys
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Key, 
  Copy, 
  Trash2, 
  Plus, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Shield,
  Activity
} from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  created_at: string;
  last_used?: string;
  is_active: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const APIKeyManagement: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const availablePermissions: Permission[] = [
    { id: 'read', name: 'Read', description: 'View data and resources', category: 'Basic' },
    { id: 'write', name: 'Write', description: 'Create and update resources', category: 'Basic' },
    { id: 'delete', name: 'Delete', description: 'Delete resources', category: 'Advanced' },
    { id: 'admin', name: 'Admin', description: 'Administrative access', category: 'Advanced' },
    { id: 'video_upload', name: 'Video Upload', description: 'Upload video files', category: 'Media' },
    { id: 'video_analyze', name: 'Video Analysis', description: 'Analyze uploaded videos', category: 'Media' },
    { id: 'export_data', name: 'Data Export', description: 'Export user data', category: 'Compliance' },
    { id: 'security_audit', name: 'Security Audit', description: 'Access security logs', category: 'Security' },
  ];

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockKeys: APIKey[] = [
        {
          id: '1',
          name: 'Mobile App Integration',
          key: 'sk_test_123456789abcdef...',
          permissions: ['read', 'write', 'video_upload'],
          created_at: '2024-01-15T10:30:00Z',
          last_used: '2024-01-20T14:22:00Z',
          is_active: true
        },
        {
          id: '2',
          name: 'Analytics Dashboard',
          key: 'sk_live_987654321fedcba...',
          permissions: ['read', 'video_analyze'],
          created_at: '2024-01-10T09:15:00Z',
          is_active: true
        }
      ];
      
      setApiKeys(mockKeys);
    } catch (err) {
      setError('Failed to fetch API keys');
      console.error('API keys fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/security/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          permissions: selectedPermissions
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data.api_key);
        
        // Add the new key to the list
        const newKey: APIKey = {
          id: Date.now().toString(),
          name: newKeyName,
          key: data.api_key,
          permissions: selectedPermissions,
          created_at: new Date().toISOString(),
          is_active: true
        };
        
        setApiKeys(prev => [newKey, ...prev]);
        setSuccess('API key created successfully!');
        
        // Reset form
        setNewKeyName('');
        setSelectedPermissions([]);
      } else {
        throw new Error('Failed to create API key');
      }
    } catch (err) {
      setError('Failed to create API key');
      console.error('API key creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      setApiKeys(prev => prev.filter(key => key.id !== keyId));
      setSuccess('API key deleted successfully');
    } catch (err) {
      setError('Failed to delete API key');
      console.error('API key deletion error:', err);
    }
  };

  const handleToggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('API key copied to clipboard!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  };

  const getPermissionBadgeColor = (permission: string) => {
    const colors: Record<string, string> = {
      'read': 'default',
      'write': 'secondary',
      'delete': 'destructive',
      'admin': 'destructive',
      'video_upload': 'default',
      'video_analyze': 'default',
      'export_data': 'secondary',
      'security_audit': 'destructive'
    };
    return colors[permission] || 'default';
  };

  const groupedPermissions = availablePermissions.reduce((groups, permission) => {
    const category = permission.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  if (loading && apiKeys.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Key className="h-8 w-8 text-blue-600" />
          API Key Management
        </h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New API Key</DialogTitle>
              <DialogDescription>
                Create a new API key with specific permissions for your application.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Key Name</label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Mobile App Integration"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-3 block">Permissions</label>
                <div className="space-y-4">
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <div key={category}>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">{category}</h4>
                      <div className="space-y-2">
                        {permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-3">
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPermissions(prev => [...prev, permission.id]);
                                } else {
                                  setSelectedPermissions(prev => prev.filter(p => p !== permission.id));
                                }
                              }}
                            />
                            <div className="flex-1">
                              <label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                                {permission.name}
                              </label>
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateApiKey} 
                  disabled={!newKeyName || selectedPermissions.length === 0 || loading}
                >
                  Create API Key
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

      {/* New API Key Display */}
      {newApiKey && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              API Key Created Successfully
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> This is the only time you'll be able to see this API key. 
                  Make sure to copy it and store it in a safe place.
                </AlertDescription>
              </Alert>
              
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono break-all">{newApiKey}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newApiKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setNewApiKey(null);
                  setShowCreateDialog(false);
                }}
              >
                I've Saved This Key
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No API Keys</h3>
              <p className="text-gray-600 mb-4">
                Create your first API key to start integrating with the SkillMirror API.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{apiKey.name}</h3>
                      <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                        {apiKey.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono">
                          {visibleKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleKeyVisibility(apiKey.id)}
                        >
                          {visibleKeys.has(apiKey.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.map((permission) => (
                          <Badge 
                            key={permission} 
                            variant={getPermissionBadgeColor(permission)}
                            className="text-xs"
                          >
                            {permission}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Created: {new Date(apiKey.created_at).toLocaleDateString()}
                        </div>
                        {apiKey.last_used && (
                          <div className="flex items-center gap-1">
                            <Activity className="h-4 w-4" />
                            Last used: {new Date(apiKey.last_used).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteApiKey(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">API Key Security</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Never share your API keys publicly</li>
                <li>• Store keys securely in environment variables</li>
                <li>• Rotate keys regularly</li>
                <li>• Use the minimum required permissions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Monitoring</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Monitor API key usage regularly</li>
                <li>• Set up alerts for unusual activity</li>
                <li>• Review and audit permissions quarterly</li>
                <li>• Disable unused keys immediately</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIKeyManagement;