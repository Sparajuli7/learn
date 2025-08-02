import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowRight, 
  Brain, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  PlayCircle,
  Star,
  BarChart3 
} from 'lucide-react';

interface SkillMapping {
  source: string;
  target: string;
  strength: number;
  description: string;
}

interface LearningPhase {
  phase_number: number;
  title: string;
  description: string;
  source_skill: string;
  target_skill: string;
  difficulty: number;
  estimated_hours: number;
  cumulative_hours: number;
  exercises: Array<{
    title: string;
    description: string;
    duration: number;
    difficulty: number;
  }>;
  success_criteria: string[];
}

interface LearningPath {
  total_phases: number;
  total_hours: number;
  estimated_weeks: number;
  phases: LearningPhase[];
  completion_milestones: number[];
}

interface TransferRecommendation {
  transfer_id: number;
  source_skill: string;
  target_skill: string;
  recommendation_score: number;
  effectiveness: number;
  total_estimated_hours: number;
  average_difficulty: number;
  num_mappings: number;
  key_mappings: SkillMapping[];
  learning_path: LearningPath;
}

interface UserTransfer {
  progress_id: number;
  transfer_id: number;
  source_skill: string;
  target_skill: string;
  progress_percentage: number;
  current_step: number;
  is_completed: boolean;
  started_at: string;
  last_activity: string;
}

const SkillTransferDashboard: React.FC = () => {
  const [userSkills, setUserSkills] = useState<string[]>(['Boxing', 'Music']);
  const [recommendations, setRecommendations] = useState<TransferRecommendation[]>([]);
  const [userTransfers, setUserTransfers] = useState<UserTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecommendation | null>(null);
  const [activeTab, setActiveTab] = useState('recommendations');

  // Fetch recommendations based on user skills
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/cross-domain/recommendations?user_skills=${userSkills.join(',')}`
      );
      const data = await response.json();
      
      if (data.status === 'success') {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's current transfers
  const fetchUserTransfers = async () => {
    try {
      const userId = 1; // Replace with actual user ID
      const response = await fetch(`/api/cross-domain/user/${userId}/transfers`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setUserTransfers(data.transfers);
      }
    } catch (error) {
      console.error('Error fetching user transfers:', error);
    }
  };

  // Start a new skill transfer
  const startTransfer = async (transferId: number) => {
    try {
      const userId = 1; // Replace with actual user ID
      const response = await fetch('/api/cross-domain/start-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          transfer_id: transferId,
        }),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Refresh user transfers
        fetchUserTransfers();
        setActiveTab('progress');
      }
    } catch (error) {
      console.error('Error starting transfer:', error);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    fetchUserTransfers();
  }, []);

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-500';
    if (difficulty <= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 0.8) return 'text-green-600';
    if (effectiveness >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          Cross-Domain Skill Transfer
        </h1>
        <p className="text-gray-600">
          Discover how your existing skills can accelerate learning in new domains
        </p>
      </div>

      {/* Skills Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Your Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {userSkills.map((skill) => (
              <Badge key={skill} variant="secondary" className="px-3 py-1">
                {skill}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Skill Transfer Recommendations</h2>
            <Button onClick={fetchRecommendations} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          <div className="grid gap-4">
            {recommendations.map((rec) => (
              <Card 
                key={rec.transfer_id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedTransfer(rec)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <span>{rec.source_skill}</span>
                        <ArrowRight className="h-4 w-4" />
                        <span>{rec.target_skill}</span>
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {(rec.effectiveness * 100).toFixed(0)}% effective
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {rec.total_estimated_hours}h total
                        </span>
                        <Badge 
                          variant="outline" 
                          className={getDifficultyColor(rec.average_difficulty)}
                        >
                          Difficulty: {rec.average_difficulty}/5
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-blue-600">
                        {(rec.recommendation_score * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500">Match Score</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Key Skill Mappings:</h4>
                      <div className="space-y-2">
                        {rec.key_mappings.slice(0, 2).map((mapping, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{mapping.source}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span className="text-sm">{mapping.target}</span>
                            </div>
                            <Badge variant="outline">
                              {(mapping.strength * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2">
                      <div className="text-sm text-gray-600">
                        {rec.learning_path.total_phases} phases • {rec.learning_path.estimated_weeks} weeks
                      </div>
                      <Button onClick={() => startTransfer(rec.transfer_id)}>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Journey
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <h2 className="text-xl font-semibold">Your Transfer Progress</h2>
          
          {userTransfers.length === 0 ? (
            <Alert>
              <AlertDescription>
                You haven't started any skill transfers yet. Check out the recommendations to begin your journey!
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {userTransfers.map((transfer) => (
                <Card key={transfer.progress_id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2">
                        <span>{transfer.source_skill}</span>
                        <ArrowRight className="h-4 w-4" />
                        <span>{transfer.target_skill}</span>
                        {transfer.is_completed && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </CardTitle>
                      <Badge variant={transfer.is_completed ? "default" : "secondary"}>
                        {transfer.is_completed ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Progress</span>
                          <span>{transfer.progress_percentage.toFixed(0)}%</span>
                        </div>
                        <Progress value={transfer.progress_percentage} className="w-full" />
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Step {transfer.current_step}</span>
                        <span>
                          Last activity: {new Date(transfer.last_activity).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm">
                          Continue Learning
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Transfer Analytics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userTransfers.length}</div>
                <p className="text-sm text-gray-600">Active journeys</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {userTransfers.filter(t => t.is_completed).length}
                </div>
                <p className="text-sm text-gray-600">Finished transfers</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Avg Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {userTransfers.length > 0 
                    ? (userTransfers.reduce((sum, t) => sum + t.progress_percentage, 0) / userTransfers.length).toFixed(0)
                    : 0}%
                </div>
                <p className="text-sm text-gray-600">Across all transfers</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Detailed Transfer Modal (simplified for this example) */}
      {selectedTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  {selectedTransfer.source_skill}
                  <ArrowRight className="h-5 w-5" />
                  {selectedTransfer.target_skill}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedTransfer(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Effectiveness</h4>
                    <div className={`text-lg font-semibold ${getEffectivenessColor(selectedTransfer.effectiveness)}`}>
                      {(selectedTransfer.effectiveness * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">Estimated Time</h4>
                    <div className="text-lg font-semibold">
                      {selectedTransfer.learning_path.estimated_weeks} weeks
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Learning Path Overview</h4>
                  <div className="space-y-2">
                    {selectedTransfer.learning_path.phases.map((phase, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">Phase {phase.phase_number}: {phase.title}</span>
                          <p className="text-sm text-gray-600">{phase.description}</p>
                        </div>
                        <Badge variant="outline">
                          {phase.estimated_hours}h
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSelectedTransfer(null)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    startTransfer(selectedTransfer.transfer_id);
                    setSelectedTransfer(null);
                  }}>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start This Journey
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SkillTransferDashboard;