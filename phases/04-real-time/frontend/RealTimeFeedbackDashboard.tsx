"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Square, 
  Camera, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Zap
} from 'lucide-react';

interface FeedbackSession {
  session_id: number;
  user_id: number;
  skill_type: string;
  overall_score: number;
  session_duration: number;
  improvement_suggestions: ImprovementSuggestion[];
  performance_metrics: PerformanceMetric[];
  is_active: boolean;
}

interface ImprovementSuggestion {
  id: number;
  type: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  confidence_score: number;
  timestamp: string;
  implemented: boolean;
}

interface PerformanceMetric {
  id: number;
  name: string;
  value: number;
  unit: string;
  target_value?: number;
  improvement_delta?: number;
  timestamp: string;
}

interface LiveAnalysis {
  overall_score: number;
  movement_analysis: Record<string, any>;
  speech_analysis: Record<string, any>;
  timing_analysis: Record<string, any>;
  improvement_suggestions: ImprovementSuggestion[];
  performance_metrics: PerformanceMetric[];
  processing_time: number;
}

interface RealTimeFeedbackDashboardProps {
  userId: number;
  skillType: string;
  onSessionComplete?: (sessionData: FeedbackSession) => void;
}

export default function RealTimeFeedbackDashboard({ 
  userId, 
  skillType,
  onSessionComplete 
}: RealTimeFeedbackDashboardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [currentSession, setCurrentSession] = useState<FeedbackSession | null>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<LiveAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startSession = async () => {
    try {
      setError(null);
      
      // Start feedback session
      const response = await fetch('/api/realtime/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          skill_type: skillType
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start session');
      }

      const sessionData = await response.json();
      
      setCurrentSession({
        session_id: sessionData.session_id,
        user_id: userId,
        skill_type: skillType,
        overall_score: 0,
        session_duration: 0,
        improvement_suggestions: [],
        performance_metrics: [],
        is_active: true
      });

      // Start video recording
      await startVideoRecording();
      
      // Start timer
      setSessionTimer(0);
      timerRef.current = setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);

      setIsRecording(true);
    } catch (err) {
      setError(`Failed to start session: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      // Record chunks and send for analysis every 5 seconds
      let chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (chunks.length > 0 && currentSession) {
          const blob = new Blob(chunks, { type: 'video/webm' });
          await analyzeVideoChunk(blob);
          chunks = [];
        }
      };

      mediaRecorder.start();
      
      // Send chunks for analysis every 5 seconds
      const analysisInterval = setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          mediaRecorder.start();
        }
      }, 5000);

      // Store interval reference for cleanup
      (mediaRecorder as any).analysisInterval = analysisInterval;

    } catch (err) {
      setError(`Camera access failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const analyzeVideoChunk = async (videoBlob: Blob) => {
    if (!currentSession) return;

    try {
      setIsAnalyzing(true);
      
      const formData = new FormData();
      formData.append('file', videoBlob, 'video-chunk.webm');

      const response = await fetch(`/api/realtime/analyze/live?session_id=${currentSession.session_id}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const analysisResult = await response.json();
      setLiveAnalysis(analysisResult);

      // Update current session with latest data
      setCurrentSession(prev => prev ? {
        ...prev,
        overall_score: analysisResult.overall_score,
        improvement_suggestions: analysisResult.improvement_suggestions,
        performance_metrics: analysisResult.performance_metrics
      } : null);

    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const endSession = async () => {
    try {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        const stream = mediaRecorderRef.current.stream;
        stream.getTracks().forEach(track => track.stop());
        
        // Clear analysis interval
        if ((mediaRecorderRef.current as any).analysisInterval) {
          clearInterval((mediaRecorderRef.current as any).analysisInterval);
        }
      }

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (!currentSession) return;

      // End session on backend
      const response = await fetch(`/api/realtime/session/${currentSession.session_id}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSession.session_id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to end session');
      }

      const finalData = await response.json();
      
      // Get final session details
      const sessionResponse = await fetch(`/api/realtime/session/${currentSession.session_id}`);
      const finalSession = await sessionResponse.json();

      setIsRecording(false);
      setCurrentSession(finalSession);
      
      if (onSessionComplete) {
        onSessionComplete(finalSession);
      }

    } catch (err) {
      setError(`Failed to end session: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'movement': return <Target className="w-4 h-4" />;
      case 'speech': return <Zap className="w-4 h-4" />;
      case 'timing': return <Clock className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-Time Feedback</h1>
          <p className="text-gray-600">Live analysis for {skillType}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-2 text-red-600">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
              <span className="font-mono font-bold">{formatTime(sessionTimer)}</span>
            </div>
          )}
          
          {!isRecording ? (
            <Button onClick={startSession} className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Start Session
            </Button>
          ) : (
            <Button onClick={endSession} variant="destructive" className="flex items-center gap-2">
              <Square className="w-4 h-4" />
              End Session
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Live Video Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-64 object-cover"
                style={{ transform: 'scaleX(-1)' }} // Mirror video
              />
              
              {isAnalyzing && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Analyzing...
                </div>
              )}
              
              {liveAnalysis && (
                <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg">
                  <div className="text-sm">Score: {liveAnalysis.overall_score.toFixed(1)}</div>
                  <div className="text-xs text-gray-300">
                    Analysis: {liveAnalysis.processing_time.toFixed(1)}s
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Live Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {liveAnalysis ? (
              <div className="space-y-4">
                {/* Overall Score */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Score</span>
                    <span className="font-bold">{liveAnalysis.overall_score.toFixed(1)}/100</span>
                  </div>
                  <Progress value={liveAnalysis.overall_score} className="h-3" />
                </div>

                {/* Individual Metrics */}
                {liveAnalysis.performance_metrics.slice(0, 4).map((metric, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{metric.name.replace(/_/g, ' ')}</span>
                      <span>{metric.value.toFixed(1)} {metric.unit}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={metric.target_value ? (metric.value / metric.target_value) * 100 : metric.value} 
                        className="h-2 flex-1"
                      />
                      {metric.improvement_delta && (
                        <div className="flex items-center text-xs">
                          {metric.improvement_delta > 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                          <span className={metric.improvement_delta > 0 ? 'text-green-600' : 'text-red-600'}>
                            {Math.abs(metric.improvement_delta).toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start recording to see live metrics</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Real-Time Suggestions */}
      {liveAnalysis && liveAnalysis.improvement_suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Live Improvement Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveAnalysis.improvement_suggestions.slice(0, 4).map((suggestion, index) => (
                <div 
                  key={index}
                  className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(suggestion.category)}
                      <Badge className={getPriorityColor(suggestion.priority)}>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      {(suggestion.confidence_score * 100).toFixed(0)}% confidence
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-800">{suggestion.content}</p>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500 capitalize">
                      {suggestion.category}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs h-6"
                      onClick={() => {
                        // Mark as implemented (would call API)
                        console.log('Implementing suggestion:', suggestion.id);
                      }}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Got it
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Summary (shown after session ends) */}
      {currentSession && !isRecording && currentSession.overall_score > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Session Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {currentSession.overall_score.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Final Score</div>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatTime(Math.round(currentSession.session_duration))}
                </div>
                <div className="text-sm text-gray-600">Practice Time</div>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {currentSession.improvement_suggestions.length}
                </div>
                <div className="text-sm text-gray-600">Suggestions</div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {currentSession.performance_metrics.length}
                </div>
                <div className="text-sm text-gray-600">Metrics Tracked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}