'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Star, Clock, Target, TrendingUp, User, Lightbulb, Calendar } from 'lucide-react';

interface ExpertRecommendationsProps {
  userId: number;
  skillType: string;
  onExpertSelect?: (expertId: number) => void;
}

interface Expert {
  expert_id: number;
  expert_name: string;
  domain: string;
  biography: string;
  achievements: string[];
}

interface LearningPath {
  total_estimated_weeks: number;
  learning_steps: Array<{
    step: number;
    focus_area: string;
    current_level: number;
    target_level: number;
    improvement_needed: number;
    priority: string;
    estimated_weeks: number;
  }>;
  recommended_practice_frequency: string;
  key_focus: string;
}

interface Recommendation {
  expert_id: number;
  expert_name: string;
  domain: string;
  biography: string;
  achievements: string[];
  similarity_reason: string;
  recommendation_score: number;
  strategy: string;
  learning_path: LearningPath;
  expected_timeline: {
    timeframe: string;
    difficulty: string;
  };
}

interface RecommendationData {
  recommendations: Recommendation[];
  user_current_level: string;
  skill_type: string;
  personalization_factors: {
    experience_level: string;
    practice_frequency: number;
    improvement_trend: string;
    focus_areas: string[];
  };
}

const ExpertRecommendations: React.FC<ExpertRecommendationsProps> = ({ 
  userId, 
  skillType, 
  onExpertSelect 
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [userId, skillType]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/experts/recommendations/${userId}?skill_type=${skillType}&num_recommendations=5`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      
      const data = await response.json();
      setRecommendations(data);
      setSelectedRec(data.recommendations[0] || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'similar_level': return <User className="w-4 h-4" />;
      case 'aspirational': return <Star className="w-4 h-4" />;
      case 'progressive': return <TrendingUp className="w-4 h-4" />;
      case 'improvement_focused': return <Target className="w-4 h-4" />;
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'similar_level': return 'bg-blue-100 text-blue-800';
      case 'aspirational': return 'bg-purple-100 text-purple-800';
      case 'progressive': return 'bg-green-100 text-green-800';
      case 'improvement_focused': return 'bg-orange-100 text-orange-800';
      case 'trending': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-gray-100 text-gray-800';
      case 'beginner_plus': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-green-100 text-green-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-lg">Finding your perfect expert matches...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Button onClick={fetchRecommendations}>Retry</Button>
      </div>
    );
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-600 mb-4">No recommendations available</div>
        <Button onClick={fetchRecommendations}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Expert Recommendations</h2>
          <p className="text-gray-600 mt-1">Personalized expert matches for your {skillType} journey</p>
        </div>
        
        {/* User Level Summary */}
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Your Level:</span>
            <Badge className={getLevelBadgeColor(recommendations.user_current_level)}>
              {recommendations.user_current_level.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Practice Frequency:</span>
            <span className="text-sm font-medium">{recommendations.personalization_factors.practice_frequency} sessions</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Trend:</span>
            <Badge variant="outline">{recommendations.personalization_factors.improvement_trend.replace('_', ' ')}</Badge>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expert Cards */}
        <div className="lg:col-span-1 space-y-4">
          {recommendations.recommendations.map((rec, index) => (
            <Card
              key={rec.expert_id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedRec?.expert_id === rec.expert_id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedRec(rec)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{rec.expert_name}</CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      #{index + 1}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{rec.domain}</Badge>
                  <Badge className={`${getStrategyColor(rec.strategy)} flex items-center space-x-1`}>
                    {getStrategyIcon(rec.strategy)}
                    <span>{rec.strategy.replace('_', ' ')}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium mb-1">Match Score</div>
                    <Progress value={rec.recommendation_score * 100} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round(rec.recommendation_score * 100)}% compatibility
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    {rec.similarity_reason}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{rec.expected_timeline.timeframe}</span>
                    <Badge variant="outline" className="text-xs">
                      {rec.expected_timeline.difficulty}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed View */}
        {selectedRec && (
          <div className="lg:col-span-2 space-y-6">
            {/* Expert Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedRec.expert_name}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onExpertSelect?.(selectedRec.expert_id)}
                  >
                    View Full Profile
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">{selectedRec.biography}</p>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Key Achievements</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedRec.achievements.slice(0, 4).map((achievement, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <Star className="w-3 h-3 text-yellow-400 mr-2 flex-shrink-0" />
                        <span>{achievement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Path */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-green-500" />
                  <span>Your Learning Path</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedRec.learning_path.total_estimated_weeks}
                    </div>
                    <div className="text-sm text-green-700">Weeks to Target</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-700">
                      {selectedRec.learning_path.recommended_practice_frequency}
                    </div>
                    <div className="text-xs text-green-600">Recommended Practice</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Learning Steps</h4>
                  <div className="space-y-3">
                    {selectedRec.learning_path.learning_steps.map((step, index) => (
                      <div key={step.step} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">
                              {step.step}
                            </div>
                            <span className="font-medium">{step.focus_area}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(step.priority)}>
                              {step.priority}
                            </Badge>
                            <Badge variant="outline">
                              {step.estimated_weeks}w
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Current: {Math.round(step.current_level * 100)}%</span>
                            <span>Target: {Math.round(step.target_level * 100)}%</span>
                          </div>
                          <Progress value={(step.current_level / step.target_level) * 100} className="h-2" />
                          <div className="text-xs text-gray-500">
                            Improvement needed: +{Math.round(step.improvement_needed * 100)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-blue-800">Key Focus</span>
                  </div>
                  <p className="text-blue-700 text-sm">{selectedRec.learning_path.key_focus}</p>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <span>Expected Timeline</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedRec.expected_timeline.timeframe}
                    </div>
                    <div className="text-sm text-purple-700">To reach this level</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <div className="text-lg font-semibold text-purple-600 capitalize">
                      {selectedRec.expected_timeline.difficulty}
                    </div>
                    <div className="text-sm text-purple-700">Difficulty level</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpertRecommendations;