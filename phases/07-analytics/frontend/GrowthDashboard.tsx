/**
 * Growth Optimization Dashboard
 * Advanced features for viral growth, A/B testing, and user engagement optimization
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

interface GrowthDashboardProps {
  apiBaseUrl?: string;
}

interface ExperimentData {
  name: string;
  hypothesis: string;
  variants: string[];
  success_metric: string;
  target_improvement: number;
  duration_days: number;
  sample_size_needed: number;
}

interface ViralData {
  overall_stats: {
    total_referrals: number;
    successful_referrals: number;
    conversion_rate: number;
    avg_days_to_convert: number;
  };
  viral_champions: Array<{
    referrer_id: string;
    referrals_created: number;
    successful_referrals: number;
    success_rate: number;
    engagement_score: number;
  }>;
  optimization_opportunities: string[];
  viral_coefficient: number;
}

interface UserSegments {
  segments: {
    [key: string]: {
      count: number;
      percentage: number;
      growth_strategy: string;
    };
  };
  recommendations: string[];
  total_users: number;
}

const GrowthDashboard: React.FC<GrowthDashboardProps> = ({ 
  apiBaseUrl = 'http://localhost:8001' 
}) => {
  const [activeTab, setActiveTab] = useState('segments');
  const [userSegments, setUserSegments] = useState<UserSegments | null>(null);
  const [viralData, setViralData] = useState<ViralData | null>(null);
  const [experiments, setExperiments] = useState<ExperimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentData | null>(null);

  useEffect(() => {
    fetchGrowthData();
  }, []);

  const fetchGrowthData = async () => {
    try {
      // Simulate API calls for growth data
      // In a real implementation, these would be actual API endpoints
      
      // User segments analysis
      const segmentsData: UserSegments = {
        segments: {
          power_users: { count: 45, percentage: 15.2, growth_strategy: 'Leverage for referrals and testimonials' },
          engaged_users: { count: 89, percentage: 30.1, growth_strategy: 'Upsell premium features and expert consultations' },
          casual_users: { count: 102, percentage: 34.5, growth_strategy: 'Re-engagement campaigns with personalized content' },
          at_risk_users: { count: 38, percentage: 12.8, growth_strategy: 'Win-back campaigns with special offers' },
          new_users: { count: 22, percentage: 7.4, growth_strategy: 'Optimize onboarding and early value delivery' }
        },
        recommendations: [
          'High churn risk detected. Implement retention campaigns.',
          'Low power user percentage. Focus on engagement features.',
          'High new user influx. Optimize onboarding experience.'
        ],
        total_users: 296
      };

      // Viral loop analysis
      const viralAnalysis: ViralData = {
        overall_stats: {
          total_referrals: 156,
          successful_referrals: 89,
          conversion_rate: 57.1,
          avg_days_to_convert: 3.2
        },
        viral_champions: [
          { referrer_id: 'user_123', referrals_created: 8, successful_referrals: 6, success_rate: 75.0, engagement_score: 9 },
          { referrer_id: 'user_456', referrals_created: 5, successful_referrals: 4, success_rate: 80.0, engagement_score: 8 },
          { referrer_id: 'user_789', referrals_created: 6, successful_referrals: 4, success_rate: 66.7, engagement_score: 7 }
        ],
        optimization_opportunities: [
          'A/B test referral messaging and timing',
          'Implement viral features like challenges and achievements',
          'Add social proof to referral pages'
        ],
        viral_coefficient: 0.62
      };

      // Growth experiments
      const experimentsData: ExperimentData[] = [
        {
          name: 'Onboarding_Flow_Optimization',
          hypothesis: 'Simplified 3-step onboarding will increase completion rate by 25%',
          variants: ['current_flow', 'simplified_flow'],
          success_metric: 'onboarding_completion_rate',
          target_improvement: 0.25,
          duration_days: 14,
          sample_size_needed: 1000
        },
        {
          name: 'Referral_Reward_Testing',
          hypothesis: 'Higher referral rewards ($20 vs $10) will increase referral activity',
          variants: ['reward_10', 'reward_20'],
          success_metric: 'referrals_per_user',
          target_improvement: 0.30,
          duration_days: 21,
          sample_size_needed: 500
        },
        {
          name: 'Social_Sharing_Optimization',
          hypothesis: 'Custom achievement graphics will increase social sharing by 40%',
          variants: ['text_sharing', 'graphic_sharing'],
          success_metric: 'social_shares_per_achievement',
          target_improvement: 0.40,
          duration_days: 14,
          sample_size_needed: 800
        }
      ];

      setUserSegments(segmentsData);
      setViralData(viralAnalysis);
      setExperiments(experimentsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching growth data:', error);
      setLoading(false);
    }
  };

  const createExperiment = async (experiment: ExperimentData) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/experiments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment_name: experiment.name,
          variants: experiment.variants,
          description: experiment.hypothesis
        })
      });

      if (response.ok) {
        alert('Experiment created successfully!');
        // Refresh data
        fetchGrowthData();
      }
    } catch (error) {
      console.error('Error creating experiment:', error);
      alert('Failed to create experiment');
    }
  };

  const formatSegmentData = () => {
    if (!userSegments) return [];
    
    return Object.entries(userSegments.segments).map(([segment, data]) => ({
      name: segment.replace('_', ' ').toUpperCase(),
      count: data.count,
      percentage: data.percentage
    }));
  };

  const formatViralChampions = () => {
    if (!viralData) return [];
    
    return viralData.viral_champions.map(champion => ({
      user: champion.referrer_id.slice(-3),
      referrals: champion.referrals_created,
      successful: champion.successful_referrals,
      rate: champion.success_rate,
      engagement: champion.engagement_score
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Growth Optimization Dashboard</h1>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['segments', 'viral', 'experiments', 'performance'].map((tab) => (
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

        {/* User Segments Tab */}
        {activeTab === 'segments' && userSegments && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">User Segment Analysis</h2>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Segment Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={formatSegmentData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Strategies</h3>
                  <div className="space-y-4">
                    {Object.entries(userSegments.segments).map(([segment, data]) => (
                      <div key={segment} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-900">
                            {segment.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">
                            {data.count} users ({data.percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{data.growth_strategy}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Strategic Recommendations</h3>
                <div className="space-y-2">
                  {userSegments.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                      <p className="text-gray-700">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Viral Growth Tab */}
        {activeTab === 'viral' && viralData && (
          <div className="space-y-8">
            {/* Viral Metrics Overview */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{viralData.overall_stats.total_referrals}</div>
                <div className="text-sm text-gray-600">Total Referrals</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-green-600">{viralData.overall_stats.successful_referrals}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">{viralData.overall_stats.conversion_rate.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl font-bold text-orange-600">{viralData.viral_coefficient.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Viral Coefficient</div>
              </div>
            </div>

            {/* Viral Champions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Viral Champions</h2>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={formatViralChampions()}>
                      <CartesianGrid />
                      <XAxis dataKey="referrals" name="Referrals Created" />
                      <YAxis dataKey="rate" name="Success Rate %" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Champions" dataKey="rate" fill="#8884d8" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Top Performers</h3>
                    {viralData.viral_champions.slice(0, 5).map((champion, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">User {champion.referrer_id.slice(-3)}</div>
                          <div className="text-sm text-gray-600">
                            {champion.successful_referrals}/{champion.referrals_created} referrals
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{champion.success_rate.toFixed(1)}%</div>
                          <div className="text-sm text-gray-500">Success Rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optimization Opportunities */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Optimization Opportunities</h3>
                <div className="grid grid-cols-2 gap-4">
                  {viralData.optimization_opportunities.map((opportunity, index) => (
                    <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-800">{opportunity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Experiments Tab */}
        {activeTab === 'experiments' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Growth Experiments</h2>
                <button
                  onClick={() => setSelectedExperiment(experiments[0])}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create New Experiment
                </button>
              </div>

              <div className="space-y-6">
                {experiments.map((experiment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{experiment.name.replace(/_/g, ' ')}</h3>
                        <p className="text-gray-600 mt-2">{experiment.hypothesis}</p>
                      </div>
                      <button
                        onClick={() => createExperiment(experiment)}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                      >
                        Launch
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Variants:</span>
                        <div className="text-gray-600">{experiment.variants.join(', ')}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Success Metric:</span>
                        <div className="text-gray-600">{experiment.success_metric.replace(/_/g, ' ')}</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Target Improvement:</span>
                        <div className="text-gray-600">{(experiment.target_improvement * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Duration:</span>
                        <div className="text-gray-600">{experiment.duration_days} days</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0 participants</span>
                        <span>{experiment.sample_size_needed} needed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Performance Optimization</h2>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">98.5%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">245ms</div>
                  <div className="text-sm text-gray-600">Avg Response Time</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">94</div>
                  <div className="text-sm text-gray-600">Performance Score</div>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Optimization Recommendations</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="font-medium text-blue-900">Implement CDN for static assets</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-2">Expected improvement: 15% faster load times</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                      </svg>
                      <span className="font-medium text-green-900">Database query optimization</span>
                    </div>
                    <p className="text-sm text-green-700 mt-2">Expected improvement: 25% reduction in API response times</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrowthDashboard;