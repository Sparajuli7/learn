'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Star, Award, TrendingUp, Eye, BookOpen, Target } from 'lucide-react';

interface ExpertComparisonProps {
  videoId: number;
  onClose?: () => void;
}

interface Expert {
  id: number;
  name: string;
  domain: string;
  biography: string;
  achievements: string[];
}

interface ComparisonData {
  overall_similarity: number;
  metric_breakdown: {
    [key: string]: {
      user_value: number;
      expert_value: number;
      similarity: number;
      gap: number;
      weight: number;
    };
  };
}

interface ExpertComparison {
  comparison_id: number;
  expert: Expert;
  similarity_score: number;
  comparison_data: ComparisonData;
  feedback: {
    similarity_to_expert: number;
    expert_reference: string;
    strengths: Array<{
      metric: string;
      message: string;
      expert_level: number;
    }>;
    improvement_areas: Array<{
      metric: string;
      message: string;
      current_level: number;
      expert_level: number;
      gap: number;
    }>;
    specific_recommendations: Array<{
      metric: string;
      recommendation: string;
      difficulty: string;
      expected_improvement_time: string;
    }>;
    expert_insights: string[];
  };
}

const ExpertComparison: React.FC<ExpertComparisonProps> = ({ videoId, onClose }) => {
  const [comparisons, setComparisons] = useState<ExpertComparison[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<ExpertComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpertComparisons();
  }, [videoId]);

  const fetchExpertComparisons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/experts/compare/${videoId}?num_experts=3`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch expert comparisons');
      }
      
      const data = await response.json();
      setComparisons(data.expert_comparisons);
      setSelectedExpert(data.expert_comparisons[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatMetricName = (metric: string) => {
    return metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 0.8) return 'bg-green-100';
    if (score >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-lg">Comparing to expert patterns...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={fetchExpertComparisons}>Retry</Button>
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-600 mb-4">No expert comparisons available</div>
        {onClose && <Button onClick={onClose}>Close</Button>}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Expert Pattern Analysis</h2>
          <p className="text-gray-600 mt-1">See how your performance compares to industry experts</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close Analysis
          </Button>
        )}
      </div>

      {/* Expert Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparisons.map((comparison, index) => (
          <Card
            key={comparison.expert.id}
            className={`cursor-pointer transition-all duration-200 ${
              selectedExpert?.expert.id === comparison.expert.id
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedExpert(comparison)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-gold-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'}`}></div>
                <CardTitle className="text-lg">{comparison.expert.name}</CardTitle>
              </div>
              <Badge variant="secondary" className="w-fit">
                {comparison.expert.domain}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Similarity Match</span>
                    <span className={`font-semibold ${getScoreColor(comparison.similarity_score)}`}>
                      {Math.round(comparison.similarity_score * 100)}%
                    </span>
                  </div>
                  <Progress value={comparison.similarity_score * 100} className="h-2" />
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {comparison.expert.biography}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Comparison */}
      {selectedExpert && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expert Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-yellow-500" />
                <span>{selectedExpert.expert.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Biography</h4>
                <p className="text-gray-700 text-sm">{selectedExpert.expert.biography}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Key Achievements</h4>
                <div className="space-y-1">
                  {selectedExpert.expert.achievements.slice(0, 3).map((achievement, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <Star className="w-3 h-3 text-yellow-400 mr-2" />
                      {achievement}
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${getScoreBg(selectedExpert.similarity_score)}`}>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getScoreColor(selectedExpert.similarity_score)}`}>
                    {Math.round(selectedExpert.similarity_score * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Similarity</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metric Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <span>Performance Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(selectedExpert.comparison_data.metric_breakdown).map(([metric, data]) => (
                  <div key={metric} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{formatMetricName(metric)}</span>
                      <span className={`text-sm font-semibold ${getScoreColor(data.similarity)}`}>
                        {Math.round(data.similarity * 100)}%
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <Progress value={data.similarity * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>You: {Math.round(data.user_value * 100)}%</span>
                        <span>Expert: {Math.round(data.expert_value * 100)}%</span>
                      </div>
                    </div>
                    
                    {data.gap > 0.2 && (
                      <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                        Gap: +{Math.round(data.gap * 100)}% improvement potential
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          {selectedExpert.feedback.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700">
                  <Target className="w-5 h-5" />
                  <span>Your Strengths</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedExpert.feedback.strengths.map((strength, index) => (
                    <div key={index} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <div className="font-medium text-green-800 text-sm">
                        {formatMetricName(strength.metric)}
                      </div>
                      <div className="text-green-700 text-sm mt-1">
                        {strength.message}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Improvement Areas */}
          {selectedExpert.feedback.improvement_areas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-700">
                  <TrendingUp className="w-5 h-5" />
                  <span>Growth Opportunities</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedExpert.feedback.improvement_areas.map((area, index) => (
                    <div key={index} className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <div className="font-medium text-orange-800 text-sm">
                        {formatMetricName(area.metric)}
                      </div>
                      <div className="text-orange-700 text-sm mt-1">
                        {area.message}
                      </div>
                      <div className="text-xs text-orange-600 mt-2">
                        Current: {Math.round(area.current_level * 100)}% → 
                        Target: {Math.round(area.expert_level * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Specific Recommendations */}
          {selectedExpert.feedback.specific_recommendations.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <span>Personalized Action Plan</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedExpert.feedback.specific_recommendations.map((rec, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-blue-800 text-sm">
                          {formatMetricName(rec.metric)}
                        </div>
                        <Badge variant={rec.difficulty === 'beginner' ? 'secondary' : 'outline'}>
                          {rec.difficulty}
                        </Badge>
                      </div>
                      <div className="text-blue-700 text-sm mb-2">
                        {rec.recommendation}
                      </div>
                      <div className="text-xs text-blue-600">
                        Expected timeline: {rec.expected_improvement_time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expert Insights */}
          {selectedExpert.feedback.expert_insights.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-purple-500" />
                  <span>Expert Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedExpert.feedback.expert_insights.map((insight, index) => (
                    <div key={index} className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                      <div className="text-purple-700 text-sm">
                        {insight}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpertComparison;