"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target,
  Award,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Users,
  Zap,
  CheckCircle
} from 'lucide-react';

interface AnalyticsData {
  user_id: number;
  analysis_period: {
    start_date: string;
    end_date: string;
    days_included: number;
  };
  overall_stats: {
    total_sessions: number;
    total_practice_time_minutes: number;
    average_score: number;
    best_score: number;
    latest_score: number;
    improvement_trend: string;
  };
  skill_summaries: SkillSummary[];
  top_improvement_areas: ImprovementArea[];
  recent_sessions: RecentSession[];
}

interface SkillSummary {
  skill_type: string;
  total_sessions: number;
  practice_time_hours: number;
  average_score: number;
  best_score: number;
  progress_trend: string;
  last_session: string | null;
}

interface ImprovementArea {
  area: string;
  frequency: number;
}

interface RecentSession {
  session_id: number;
  skill_type: string;
  score: number;
  duration_minutes: number;
  date: string;
}

interface PerformanceAnalyticsDashboardProps {
  userId: number;
  skillType?: string;
  daysBack?: number;
}

export default function PerformanceAnalyticsDashboard({ 
  userId, 
  skillType,
  daysBack = 30 
}: PerformanceAnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(daysBack);

  useEffect(() => {
    loadAnalytics();
  }, [userId, skillType, selectedPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        user_id: userId.toString(),
        days_back: selectedPeriod.toString()
      });

      if (skillType) {
        params.append('skill_type', skillType);
      }

      const response = await fetch(`/api/realtime/analytics/dashboard?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatTrend = (trend: string) => {
    switch (trend) {
      case 'improving': return { text: 'Improving', color: 'text-green-600', icon: TrendingUp };
      case 'declining': return { text: 'Declining', color: 'text-red-600', icon: TrendingDown };
      case 'stable': return { text: 'Stable', color: 'text-yellow-600', icon: Target };
      default: return { text: 'No Data', color: 'text-gray-600', icon: Target };
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes.toFixed(0)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const prepareChartData = () => {
    if (!analyticsData) return [];
    
    return analyticsData.recent_sessions
      .slice(-10)
      .map((session, index) => ({
        session: `Session ${index + 1}`,
        score: session.score,
        duration: session.duration_minutes,
        date: new Date(session.date).toLocaleDateString()
      }));
  };

  const preparePieData = () => {
    if (!analyticsData) return [];
    
    return analyticsData.top_improvement_areas.map((area, index) => ({
      name: area.area.replace(/_/g, ' '),
      value: area.frequency,
      color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
    }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-800">Failed to load analytics: {error}</p>
            <Button onClick={loadAnalytics} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No analytics data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trendInfo = formatTrend(analyticsData.overall_stats.improvement_trend);
  const TrendIcon = trendInfo.icon;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600">
            Last {analyticsData.analysis_period.days_included} days
            {skillType && ` • ${skillType}`}
          </p>
        </div>
        
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={selectedPeriod === days ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(days)}
            >
              {days}d
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.overall_stats.total_sessions}
            </div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(analyticsData.overall_stats.total_practice_time_minutes)}
            </div>
            <div className="text-sm text-gray-600">Practice Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <Award className="w-8 h-8 text-yellow-600" />
            </div>
            <div className={`text-2xl font-bold ${getScoreColor(analyticsData.overall_stats.average_score)}`}>
              {analyticsData.overall_stats.average_score.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendIcon className={`w-8 h-8 ${trendInfo.color}`} />
            </div>
            <div className={`text-lg font-bold ${trendInfo.color}`}>
              {trendInfo.text}
            </div>
            <div className="text-sm text-gray-600">Trend</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Score Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={prepareChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="session" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}${name === 'score' ? '/100' : 'm'}`, 
                    name === 'score' ? 'Score' : 'Duration'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Improvement Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Top Improvement Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {preparePieData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={preparePieData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {preparePieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No improvement areas identified yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Skill Summaries */}
      {analyticsData.skill_summaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Skills Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analyticsData.skill_summaries.map((skill, index) => {
                const skillTrend = formatTrend(skill.progress_trend);
                const SkillTrendIcon = skillTrend.icon;
                
                return (
                  <div key={index} className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{skill.skill_type}</h3>
                      <Badge variant="outline" className={skillTrend.color}>
                        <SkillTrendIcon className="w-3 h-3 mr-1" />
                        {skillTrend.text}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Sessions:</span>
                        <span className="font-medium">{skill.total_sessions}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Practice Time:</span>
                        <span className="font-medium">{skill.practice_time_hours.toFixed(1)}h</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Average Score:</span>
                        <span className={`font-medium ${getScoreColor(skill.average_score)}`}>
                          {skill.average_score.toFixed(1)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Best Score:</span>
                        <span className={`font-medium ${getScoreColor(skill.best_score)}`}>
                          {skill.best_score.toFixed(1)}
                        </span>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progress</span>
                          <span>{skill.average_score.toFixed(0)}/100</span>
                        </div>
                        <Progress value={skill.average_score} className="h-2" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analyticsData.recent_sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Skill</th>
                    <th className="text-left py-2">Score</th>
                    <th className="text-left py-2">Duration</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.recent_sessions.slice(-10).reverse().map((session, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div className="font-medium">{session.skill_type}</div>
                      </td>
                      <td className="py-3">
                        <span className={`font-medium ${getScoreColor(session.score)}`}>
                          {session.score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3">
                        {formatDuration(session.duration_minutes)}
                      </td>
                      <td className="py-3 text-gray-600">
                        {new Date(session.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent sessions found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Practice Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Practice Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Performance Highlights</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Best score: {analyticsData.overall_stats.best_score.toFixed(1)}/100</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Latest score: {analyticsData.overall_stats.latest_score.toFixed(1)}/100</span>
                </div>
                {analyticsData.overall_stats.improvement_trend === 'improving' && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span>Performance is improving over time</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Focus Areas</h4>
              <div className="space-y-2">
                {analyticsData.top_improvement_areas.slice(0, 3).map((area, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-yellow-600" />
                    <span className="capitalize">
                      Work on {area.area.replace(/_/g, ' ')} ({area.frequency} suggestions)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}