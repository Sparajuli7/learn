import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRight, 
  Target, 
  Lightbulb, 
  CheckCircle2, 
  PlayCircle,
  BookOpen,
  Clock
} from 'lucide-react';

interface SkillMapping {
  id: number;
  source_component: string;
  target_component: string;
  mapping_strength: number;
  description: string;
  examples: string[];
  difficulty_level: number;
  estimated_hours: number;
}

interface Exercise {
  title: string;
  description: string;
  duration: number;
  difficulty: number;
  examples: string[];
}

interface LearningPhase {
  phase_number: number;
  title: string;
  description: string;
  source_skill: string;
  target_skill: string;
  difficulty: number;
  estimated_hours: number;
  exercises: Exercise[];
  success_criteria: string[];
}

interface SkillMappingVisualizerProps {
  transferId: number;
  sourceSkill: string;
  targetSkill: string;
  onStartPhase?: (phaseNumber: number) => void;
  userProgress?: {
    current_step: number;
    completed_steps: number[];
    progress_percentage: number;
  };
}

const SkillMappingVisualizer: React.FC<SkillMappingVisualizerProps> = ({
  transferId,
  sourceSkill,
  targetSkill,
  onStartPhase,
  userProgress
}) => {
  const [mappings, setMappings] = useState<SkillMapping[]>([]);
  const [learningPhases, setLearningPhases] = useState<LearningPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMapping, setSelectedMapping] = useState<SkillMapping | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchTransferDetails();
  }, [transferId]);

  const fetchTransferDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cross-domain/transfers/${transferId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        // Extract mappings from the transfer data
        if (data.transfer.mapping_data && data.transfer.mapping_data.mappings) {
          const mappingsData = data.transfer.mapping_data.mappings.map((mapping: any, index: number) => ({
            id: index,
            source_component: mapping.source_component,
            target_component: mapping.target_component,
            mapping_strength: mapping.mapping_strength,
            description: mapping.description,
            examples: mapping.examples || [],
            difficulty_level: mapping.difficulty_level,
            estimated_hours: mapping.estimated_hours
          }));
          setMappings(mappingsData);
        }
        
        // Set learning phases from learning path
        if (data.learning_path && data.learning_path.phases) {
          setLearningPhases(data.learning_path.phases);
        }
      }
    } catch (error) {
      console.error('Error fetching transfer details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMappingStrengthColor = (strength: number) => {
    if (strength >= 0.8) return 'bg-green-500';
    if (strength >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDifficultyBadgeColor = (difficulty: number) => {
    if (difficulty <= 2) return 'bg-green-100 text-green-800';
    if (difficulty <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const isPhaseCompleted = (phaseNumber: number) => {
    return userProgress?.completed_steps.includes(phaseNumber) || false;
  };

  const isPhaseAvailable = (phaseNumber: number) => {
    if (phaseNumber === 1) return true;
    return isPhaseCompleted(phaseNumber - 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading skill mappings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-600" />
            <span>{sourceSkill}</span>
            <ArrowRight className="h-5 w-5 text-gray-400" />
            <span>{targetSkill}</span>
            <span className="text-lg">Skill Transfer</span>
          </CardTitle>
          {userProgress && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{userProgress.progress_percentage.toFixed(0)}%</span>
              </div>
              <Progress value={userProgress.progress_percentage} className="w-full" />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Mapping Overview</TabsTrigger>
          <TabsTrigger value="phases">Learning Phases</TabsTrigger>
          <TabsTrigger value="exercises">Practice Exercises</TabsTrigger>
        </TabsList>

        {/* Mapping Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4">
            {mappings.map((mapping) => (
              <Card 
                key={mapping.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedMapping(mapping)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{mapping.source_component}</div>
                        <div className="text-xs text-gray-500">{sourceSkill}</div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{mapping.target_component}</div>
                        <div className="text-xs text-gray-500">{targetSkill}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getDifficultyBadgeColor(mapping.difficulty_level)}>
                        Level {mapping.difficulty_level}
                      </Badge>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {(mapping.mapping_strength * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">Strength</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Mapping Strength</span>
                      <span>{(mapping.mapping_strength * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getMappingStrengthColor(mapping.mapping_strength)}`}
                        style={{ width: `${mapping.mapping_strength * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{mapping.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {mapping.estimated_hours} hours
                    </span>
                    <span>{mapping.examples.length} examples available</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Learning Phases */}
        <TabsContent value="phases" className="space-y-4">
          <div className="space-y-4">
            {learningPhases.map((phase) => {
              const completed = isPhaseCompleted(phase.phase_number);
              const available = isPhaseAvailable(phase.phase_number);
              
              return (
                <Card 
                  key={phase.phase_number}
                  className={`relative ${!available ? 'opacity-50' : ''}`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          completed ? 'bg-green-500' : available ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          {completed ? <CheckCircle2 className="h-5 w-5" /> : phase.phase_number}
                        </div>
                        <span>Phase {phase.phase_number}: {phase.title}</span>
                      </CardTitle>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {phase.estimated_hours}h
                        </Badge>
                        <Badge className={getDifficultyBadgeColor(phase.difficulty)}>
                          Level {phase.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-700 mb-4">{phase.description}</p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Key Focus
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{phase.source_skill}</span>
                            <ArrowRight className="h-3 w-3" />
                            <span>{phase.target_skill}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Success Criteria
                        </h4>
                        <ul className="text-sm space-y-1">
                          {phase.success_criteria.slice(0, 2).map((criteria, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="h-3 w-3 mt-1 text-green-500 flex-shrink-0" />
                              {criteria}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {phase.exercises.length} exercises • {phase.success_criteria.length} goals
                      </div>
                      
                      {available && !completed && (
                        <Button 
                          onClick={() => onStartPhase?.(phase.phase_number)}
                          size="sm"
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          {userProgress?.current_step === phase.phase_number ? 'Continue' : 'Start Phase'}
                        </Button>
                      )}
                      
                      {completed && (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Practice Exercises */}
        <TabsContent value="exercises" className="space-y-4">
          <div className="space-y-6">
            {learningPhases.map((phase) => (
              <Card key={phase.phase_number}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Phase {phase.phase_number} Exercises
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {phase.exercises.map((exercise, idx) => (
                      <div key={idx} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{exercise.title}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {exercise.duration} min
                            </Badge>
                            <Badge className={getDifficultyBadgeColor(exercise.difficulty)}>
                              Level {exercise.difficulty}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{exercise.description}</p>
                        
                        {exercise.examples.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-2">Examples:</h5>
                            <ul className="text-sm space-y-1">
                              {exercise.examples.map((example, exIdx) => (
                                <li key={exIdx} className="flex items-start gap-2">
                                  <span className="text-blue-600">•</span>
                                  {example}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Detailed Mapping Modal */}
      {selectedMapping && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  {selectedMapping.source_component}
                  <ArrowRight className="h-5 w-5" />
                  {selectedMapping.target_component}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedMapping(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-gray-700">{selectedMapping.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Mapping Strength</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {(selectedMapping.mapping_strength * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Estimated Time</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedMapping.estimated_hours}h
                    </div>
                  </div>
                </div>
                
                {selectedMapping.examples.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Practical Examples</h4>
                    <ul className="space-y-2">
                      {selectedMapping.examples.map((example, idx) => (
                        <li key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SkillMappingVisualizer;