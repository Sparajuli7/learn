/**
 * Real-Time Analytics Dashboard
 * Comprehensive analytics view with real-time metrics, user behavior, and growth insights
 */

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsDashboardProps {
  apiBaseUrl?: string;
}

interface DashboardData {
  engagement: {
    daily_data: Array<[string, number, number]>;
    top_events: Array<[string, number]>;
  };
  growth: {
    total_users: number;
    new_users: number;
  };
  referrals: {
    total: number;
    successful: number;
    avg_reward: number;
  };
  experiments: Array<[string, string, number, number]>;
  insights: {
    viral_coefficient: number;
    growth_rate: number;
    engagement_score: number;
  };
}

interface RealTimeMetrics {
  timestamp: string;
  active_users_last_hour: number;
  events_last_hour: number;
  top_events: Array<{ event_type: string; count: number }>;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  apiBaseUrl = 'http://localhost:8001' 
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(30);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
    fetchRealTimeMetrics();

    // Set up real-time updates
    const interval = setInterval(() => {
      fetchRealTimeMetrics();
      if (activeTab === 'overview') {
        fetchDashboardData();
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [selectedTimeRange, activeTab]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/analytics/dashboard?days=${selectedTimeRange}`);
      const data = await response.json();
      setDashboardData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const fetchRealTimeMetrics = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/analytics/real-time-metrics`);
      const data = await response.json();
      setRealTimeMetrics(data);
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
    }
  };

  const formatEngagementData = () => {
    if (!dashboardData?.engagement?.daily_data) return [];
    
    return dashboardData.engagement.daily_data.map(([date, users, events]) => ({
      date: new Date(date).toLocaleDateString(),
      active_users: users,
      total_events: events,
      events_per_user: users > 0 ? Math.round(events / users * 100) / 100 : 0
    }));
  };

  const formatTopEvents = () => {
    if (!dashboardData?.engagement?.top_events) return [];
    
    return dashboardData.engagement.top_events.map(([event, count]) => ({
      name: event.replace('_', ' ').toUpperCase(),
      value: count
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <div className="text-sm text-gray-500">
                Last updated: {realTimeMetrics?.timestamp ? new Date(realTimeMetrics.timestamp).toLocaleTimeString() : 'Loading...'}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'engagement', 'growth', 'experiments'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Real-time Metrics Bar */}
        {realTimeMetrics && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8 text-white">
            <h2 className="text-lg font-semibold mb-4">🔴 Live Metrics (Last Hour)</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{realTimeMetrics.active_users_last_hour}</div>
                <div className="text-blue-100">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{realTimeMetrics.events_last_hour}</div>
                <div className="text-blue-100">Events</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">
                  {realTimeMetrics.top_events.slice(0, 2).map(event => event.event_type).join(', ')}
                </div>
                <div className="text-blue-100">Top Events</div>
              </div>
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && dashboardData && (
          <>
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 0a6 6 0 00-9-5.197" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData.growth.total_users.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-green-600 text-sm font-medium">
                    +{dashboardData.growth.new_users} new
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData.insights.growth_rate.toFixed(1)}%</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-gray-600 text-sm">
                    {selectedTimeRange} day period
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Engagement Score</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData.insights.engagement_score}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-gray-600 text-sm">
                    Events per user
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Viral Coefficient</p>
                    <p className="text-2xl font-semibold text-gray-900">{dashboardData.insights.viral_coefficient.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-sm font-medium ${
                    dashboardData.insights.viral_coefficient >= 1.0 ? 'text-green-600' :
                    dashboardData.insights.viral_coefficient >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {dashboardData.insights.viral_coefficient >= 1.0 ? 'Viral!' :
                     dashboardData.insights.viral_coefficient >= 0.5 ? 'Good' : 'Needs work'}
                  </span>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Engagement Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={formatEngagementData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="active_users" stroke="#8884d8" name="Active Users" />
                    <Line type="monotone" dataKey="events_per_user" stroke="#82ca9d" name="Events/User" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Top Events Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={formatTopEvents()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {formatTopEvents().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* Engagement Tab */}
        {activeTab === 'engagement' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">User Engagement Analysis</h2>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Active Users</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatEngagementData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="active_users" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Event Volume</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={formatEngagementData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_events" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Growth Tab */}
        {activeTab === 'growth' && dashboardData && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Growth Metrics</h2>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{dashboardData.referrals.total}</div>
                  <div className="text-sm text-gray-600">Total Referrals</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{dashboardData.referrals.successful}</div>
                  <div className="text-sm text-gray-600">Successful Referrals</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {dashboardData.referrals.total > 0 
                      ? ((dashboardData.referrals.successful / dashboardData.referrals.total) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Viral Insights</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Viral Coefficient</span>
                  <span className="text-lg font-bold">{dashboardData.insights.viral_coefficient.toFixed(3)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Average Reward</span>
                  <span className="text-lg font-bold">${dashboardData.referrals.avg_reward.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Experiments Tab */}
        {activeTab === 'experiments' && dashboardData && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">A/B Testing Results</h2>
            
            {dashboardData.experiments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Experiment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participants
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Conversion Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.experiments.map((experiment, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {experiment[0]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {experiment[1]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {experiment[2]}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {experiment[3] ? `${(experiment[3] * 100).toFixed(1)}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">No active experiments</div>
                <p className="text-gray-500 mt-2">Create A/B tests to optimize your growth metrics</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;