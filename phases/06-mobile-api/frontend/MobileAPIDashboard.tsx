/**
 * Mobile API Dashboard - SkillMirror Web Frontend
 * Developer portal for API management and documentation
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Code,
  Key,
  Analytics,
  Add,
  Visibility,
  VisibilityOff,
  ContentCopy,
  Download,
  Api,
  Security,
  Speed,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, AreaChart, Area, ResponsiveContainer } from 'recharts';

interface APIToken {
  id: string;
  name: string;
  token: string;
  permissions: { [key: string]: boolean };
  rate_limit: number;
  usage_count: number;
  created_at: string;
  last_used?: string;
  is_active: boolean;
}

interface APIUsageStats {
  date: string;
  endpoint: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time: number;
  unique_users: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`api-tabpanel-${index}`}
      aria-labelledby={`api-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MobileAPIDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [tokens, setTokens] = useState<APIToken[]>([]);
  const [usageStats, setUsageStats] = useState<APIUsageStats[]>([]);
  const [showCreateToken, setShowCreateToken] = useState(false);
  const [newTokenData, setNewTokenData] = useState({
    name: '',
    permissions: {
      video_upload: false,
      video_analysis: false,
      expert_comparison: false,
      skill_transfer: false,
      real_time_feedback: false,
      analytics: false,
    },
    rate_limit: 1000,
  });
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data - in a real app, this would come from the API
      const mockTokens: APIToken[] = [
        {
          id: '1',
          name: 'Mobile App Production',
          token: 'sk_live_1234567890abcdef',
          permissions: {
            video_upload: true,
            video_analysis: true,
            expert_comparison: true,
            skill_transfer: true,
            real_time_feedback: true,
            analytics: false,
          },
          rate_limit: 10000,
          usage_count: 2847,
          created_at: '2024-01-01T00:00:00Z',
          last_used: '2024-01-15T10:30:00Z',
          is_active: true,
        },
        {
          id: '2',
          name: 'Development Testing',
          token: 'sk_test_abcdef1234567890',
          permissions: {
            video_upload: true,
            video_analysis: true,
            expert_comparison: false,
            skill_transfer: false,
            real_time_feedback: false,
            analytics: true,
          },
          rate_limit: 1000,
          usage_count: 156,
          created_at: '2024-01-10T12:00:00Z',
          last_used: '2024-01-15T09:15:00Z',
          is_active: true,
        },
      ];

      const mockUsageStats: APIUsageStats[] = [
        { date: '2024-01-01', endpoint: '/api/video/upload', total_requests: 120, successful_requests: 118, failed_requests: 2, avg_response_time: 2.3, unique_users: 45 },
        { date: '2024-01-02', endpoint: '/api/video/upload', total_requests: 135, successful_requests: 133, failed_requests: 2, avg_response_time: 2.1, unique_users: 52 },
        { date: '2024-01-03', endpoint: '/api/video/upload', total_requests: 142, successful_requests: 140, failed_requests: 2, avg_response_time: 2.4, unique_users: 48 },
        { date: '2024-01-04', endpoint: '/api/video/upload', total_requests: 158, successful_requests: 155, failed_requests: 3, avg_response_time: 2.2, unique_users: 61 },
        { date: '2024-01-05', endpoint: '/api/video/upload', total_requests: 167, successful_requests: 164, failed_requests: 3, avg_response_time: 2.5, unique_users: 58 },
      ];

      setTokens(mockTokens);
      setUsageStats(mockUsageStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateToken = async () => {
    try {
      // In a real app, this would make an API call
      const newToken: APIToken = {
        id: (tokens.length + 1).toString(),
        name: newTokenData.name,
        token: `sk_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        permissions: newTokenData.permissions,
        rate_limit: newTokenData.rate_limit,
        usage_count: 0,
        created_at: new Date().toISOString(),
        is_active: true,
      };

      setTokens([...tokens, newToken]);
      setShowCreateToken(false);
      setNewTokenData({
        name: '',
        permissions: {
          video_upload: false,
          video_analysis: false,
          expert_comparison: false,
          skill_transfer: false,
          real_time_feedback: false,
          analytics: false,
        },
        rate_limit: 1000,
      });
    } catch (error) {
      console.error('Failed to create token:', error);
    }
  };

  const toggleTokenVisibility = (tokenId: string) => {
    const newVisibleTokens = new Set(visibleTokens);
    if (newVisibleTokens.has(tokenId)) {
      newVisibleTokens.delete(tokenId);
    } else {
      newVisibleTokens.add(tokenId);
    }
    setVisibleTokens(newVisibleTokens);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, show a toast notification
  };

  const formatPermissions = (permissions: { [key: string]: boolean }) => {
    const enabled = Object.entries(permissions)
      .filter(([_, value]) => value)
      .map(([key, _]) => key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    return enabled.join(', ') || 'None';
  };

  const getUsageChartData = () => {
    return usageStats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString(),
      requests: stat.total_requests,
      success_rate: (stat.successful_requests / stat.total_requests) * 100,
      response_time: stat.avg_response_time,
    }));
  };

  const getTotalStats = () => {
    const totalRequests = usageStats.reduce((sum, stat) => sum + stat.total_requests, 0);
    const totalSuccessful = usageStats.reduce((sum, stat) => sum + stat.successful_requests, 0);
    const avgResponseTime = usageStats.reduce((sum, stat) => sum + stat.avg_response_time, 0) / usageStats.length;
    const totalUsers = Math.max(...usageStats.map(stat => stat.unique_users));

    return {
      totalRequests,
      successRate: totalSuccessful / totalRequests,
      avgResponseTime,
      totalUsers,
    };
  };

  const stats = getTotalStats();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        SkillMirror API Dashboard
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your API tokens, monitor usage, and access comprehensive documentation for SkillMirror's mobile API.
      </Typography>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography color="text.secondary" gutterBottom>
                    Total Requests
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalRequests.toLocaleString()}
                  </Typography>
                </div>
                <Api color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography color="text.secondary" gutterBottom>
                    Success Rate
                  </Typography>
                  <Typography variant="h4">
                    {(stats.successRate * 100).toFixed(1)}%
                  </Typography>
                </div>
                <Security color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography color="text.secondary" gutterBottom>
                    Avg Response Time
                  </Typography>
                  <Typography variant="h4">
                    {stats.avgResponseTime.toFixed(1)}s
                  </Typography>
                </div>
                <Speed color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <div>
                  <Typography color="text.secondary" gutterBottom>
                    Active Users
                  </Typography>
                  <Typography variant="h4">
                    {stats.totalUsers}
                  </Typography>
                </div>
                <Analytics color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="API Tokens" icon={<Key />} />
          <Tab label="Usage Analytics" icon={<Analytics />} />
          <Tab label="Documentation" icon={<Code />} />
        </Tabs>
      </Box>

      {/* API Tokens Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h5">API Tokens</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowCreateToken(true)}
          >
            Create New Token
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Token</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Rate Limit</TableCell>
                <TableCell>Usage</TableCell>
                <TableCell>Last Used</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id}>
                  <TableCell>{token.name}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" fontFamily="monospace">
                        {visibleTokens.has(token.id) 
                          ? token.token 
                          : '•'.repeat(20)
                        }
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => toggleTokenVisibility(token.id)}
                      >
                        {visibleTokens.has(token.id) ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                      {visibleTokens.has(token.id) && (
                        <IconButton
                          size="small"
                          onClick={() => copyToClipboard(token.token)}
                        >
                          <ContentCopy />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatPermissions(token.permissions)}
                    </Typography>
                  </TableCell>
                  <TableCell>{token.rate_limit.toLocaleString()}/hour</TableCell>
                  <TableCell>{token.usage_count.toLocaleString()}</TableCell>
                  <TableCell>
                    {token.last_used 
                      ? new Date(token.last_used).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={token.is_active ? 'Active' : 'Inactive'}
                      color={token.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Usage Analytics Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h5" gutterBottom>
          Usage Analytics
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Daily Requests
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={getUsageChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="requests" stroke="#2563eb" fill="#dbeafe" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Response Time
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getUsageChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="response_time" stroke="#059669" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            sx={{ mr: 2 }}
          >
            Export CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<Analytics />}
          >
            Advanced Analytics
          </Button>
        </Box>
      </TabPanel>

      {/* Documentation Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h5" gutterBottom>
          API Documentation
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Complete API documentation with interactive examples is available at{' '}
          <strong>/docs</strong> and <strong>/redoc</strong> endpoints.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Start Guide
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Get started with the SkillMirror API in minutes
                </Typography>
                <Button variant="contained" fullWidth>
                  View Guide
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  SDK Downloads
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Official SDKs for popular programming languages
                </Typography>
                <Button variant="contained" fullWidth>
                  Download SDKs
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API Reference
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Complete reference for all endpoints and parameters
                </Typography>
                <Button variant="contained" fullWidth>
                  Browse Reference
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Code Examples
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Ready-to-use code examples in multiple languages
                </Typography>
                <Button variant="contained" fullWidth>
                  View Examples
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Create Token Dialog */}
      <Dialog open={showCreateToken} onClose={() => setShowCreateToken(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New API Token</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Token Name"
            value={newTokenData.name}
            onChange={(e) => setNewTokenData({ ...newTokenData, name: e.target.value })}
            margin="normal"
            helperText="Choose a descriptive name for this token"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Rate Limit (requests/hour)</InputLabel>
            <Select
              value={newTokenData.rate_limit}
              onChange={(e) => setNewTokenData({ ...newTokenData, rate_limit: Number(e.target.value) })}
            >
              <MenuItem value={100}>100 requests/hour</MenuItem>
              <MenuItem value={1000}>1,000 requests/hour</MenuItem>
              <MenuItem value={10000}>10,000 requests/hour</MenuItem>
              <MenuItem value={100000}>100,000 requests/hour</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Permissions
          </Typography>
          
          {Object.entries(newTokenData.permissions).map(([permission, enabled]) => (
            <Box key={permission} display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="body2">
                {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Typography>
              <Button
                size="small"
                variant={enabled ? 'contained' : 'outlined'}
                onClick={() => setNewTokenData({
                  ...newTokenData,
                  permissions: {
                    ...newTokenData.permissions,
                    [permission]: !enabled
                  }
                })}
              >
                {enabled ? 'Enabled' : 'Disabled'}
              </Button>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateToken(false)}>Cancel</Button>
          <Button
            onClick={handleCreateToken}
            variant="contained"
            disabled={!newTokenData.name.trim()}
          >
            Create Token
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MobileAPIDashboard;