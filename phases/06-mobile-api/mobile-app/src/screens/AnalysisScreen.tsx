/**
 * Analysis Screen - SkillMirror Mobile App
 * Display video analysis results with visualizations and insights
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Card, Surface, Button, ProgressBar, Chip } from 'react-native-paper';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { APIService, AnalysisResult } from '../services/APIService';

interface AnalysisData {
  id: number;
  skill_type: string;
  confidence_score: number;
  analysis_time: string;
  results: {
    video_analysis: any;
    speech_analysis: any;
  };
  feedback: string;
}

interface MetricCard {
  title: string;
  value: number;
  maxValue: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const AnalysisScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyses();
    
    // Check if we have a specific analysis to show from route params
    if (route.params?.analysisId) {
      // In a real app, we'd load the specific analysis
      console.log('Loading analysis:', route.params.analysisId);
    }
  }, [route.params]);

  const loadAnalyses = async () => {
    try {
      setIsLoading(true);
      
      // Mock analysis data - in a real app, this would come from the API
      const mockAnalyses: AnalysisData[] = [
        {
          id: 1,
          skill_type: 'Public Speaking',
          confidence_score: 0.85,
          analysis_time: '2024-01-15T10:30:00Z',
          results: {
            video_analysis: {
              posture_score: 82,
              gesture_score: 78,
              eye_contact: 85,
              facial_expression: 88,
            },
            speech_analysis: {
              clarity_score: 90,
              pace_score: 75,
              volume_score: 82,
              filler_words: 12,
            },
          },
          feedback: 'Great presentation! Focus on reducing filler words and maintaining consistent pace.',
        },
        {
          id: 2,
          skill_type: 'Dance/Fitness',
          confidence_score: 0.72,
          analysis_time: '2024-01-14T15:45:00Z',
          results: {
            video_analysis: {
              coordination_score: 75,
              rhythm_score: 68,
              form_score: 78,
              energy_level: 85,
            },
            speech_analysis: null,
          },
          feedback: 'Good energy and form! Work on rhythm and coordination for better synchronization.',
        },
      ];

      setAnalyses(mockAnalyses);
      if (mockAnalyses.length > 0) {
        setSelectedAnalysis(mockAnalyses[0]);
      }
    } catch (error) {
      console.error('Failed to load analyses:', error);
      Alert.alert('Error', 'Failed to load analysis data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalyses();
    setRefreshing(false);
  };

  const getMetricCards = (analysis: AnalysisData): MetricCard[] => {
    const { video_analysis, speech_analysis } = analysis.results;
    const cards: MetricCard[] = [];

    if (video_analysis) {
      if (analysis.skill_type === 'Public Speaking') {
        cards.push(
          { title: 'Posture', value: video_analysis.posture_score, maxValue: 100, color: theme.colors.primary, icon: 'person-standing' },
          { title: 'Gestures', value: video_analysis.gesture_score, maxValue: 100, color: theme.colors.secondary, icon: 'hand-left' },
          { title: 'Eye Contact', value: video_analysis.eye_contact, maxValue: 100, color: theme.colors.tertiary, icon: 'eye' },
          { title: 'Expression', value: video_analysis.facial_expression, maxValue: 100, color: '#f59e0b', icon: 'happy' }
        );
      } else if (analysis.skill_type === 'Dance/Fitness') {
        cards.push(
          { title: 'Coordination', value: video_analysis.coordination_score, maxValue: 100, color: theme.colors.primary, icon: 'body' },
          { title: 'Rhythm', value: video_analysis.rhythm_score, maxValue: 100, color: theme.colors.secondary, icon: 'musical-notes' },
          { title: 'Form', value: video_analysis.form_score, maxValue: 100, color: theme.colors.tertiary, icon: 'fitness' },
          { title: 'Energy', value: video_analysis.energy_level, maxValue: 100, color: '#f59e0b', icon: 'flash' }
        );
      }
    }

    if (speech_analysis) {
      cards.push(
        { title: 'Clarity', value: speech_analysis.clarity_score, maxValue: 100, color: '#8b5cf6', icon: 'chatbubble' },
        { title: 'Pace', value: speech_analysis.pace_score, maxValue: 100, color: '#06b6d4', icon: 'speedometer' },
        { title: 'Volume', value: speech_analysis.volume_score, maxValue: 100, color: '#10b981', icon: 'volume-high' }
      );
    }

    return cards;
  };

  const getChartData = (analysis: AnalysisData) => {
    const metrics = getMetricCards(analysis);
    return {
      labels: metrics.map(m => m.title),
      datasets: [{
        data: metrics.map(m => m.value),
        colors: metrics.map(m => () => m.color),
      }],
    };
  };

  const MetricCard: React.FC<{ metric: MetricCard }> = ({ metric }) => (
    <Surface style={[styles.metricCard, { borderLeftColor: metric.color }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={metric.icon} size={24} color={metric.color} />
        <Text style={styles.metricTitle}>{metric.title}</Text>
      </View>
      <Text style={[styles.metricValue, { color: metric.color }]}>
        {metric.value}%
      </Text>
      <ProgressBar
        progress={metric.value / metric.maxValue}
        color={metric.color}
        style={styles.metricProgress}
      />
    </Surface>
  );

  const AnalysisCard: React.FC<{ analysis: AnalysisData; isSelected: boolean }> = ({ 
    analysis, 
    isSelected 
  }) => (
    <TouchableOpacity
      onPress={() => setSelectedAnalysis(analysis)}
      style={[styles.analysisCard, isSelected && styles.analysisCardSelected]}
    >
      <Surface style={styles.analysisCardSurface}>
        <View style={styles.analysisCardHeader}>
          <Text style={styles.analysisSkillType}>{analysis.skill_type}</Text>
          <Chip mode="outlined" compact>
            {Math.round(analysis.confidence_score * 100)}%
          </Chip>
        </View>
        <Text style={styles.analysisTime}>
          {new Date(analysis.analysis_time).toLocaleDateString()}
        </Text>
        <Text style={styles.analysisFeedback} numberOfLines={2}>
          {analysis.feedback}
        </Text>
      </Surface>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading analyses...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Analysis List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Analyses</Text>
        {analyses.map((analysis) => (
          <AnalysisCard
            key={analysis.id}
            analysis={analysis}
            isSelected={selectedAnalysis?.id === analysis.id}
          />
        ))}
      </View>

      {/* Selected Analysis Details */}
      {selectedAnalysis && (
        <>
          {/* Overall Score */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Performance</Text>
            <Surface style={styles.overallScoreCard}>
              <View style={styles.overallScoreContent}>
                <Text style={styles.overallScoreLabel}>Confidence Score</Text>
                <Text style={styles.overallScoreValue}>
                  {Math.round(selectedAnalysis.confidence_score * 100)}%
                </Text>
                <ProgressBar
                  progress={selectedAnalysis.confidence_score}
                  color={theme.colors.primary}
                  style={styles.overallScoreProgress}
                />
              </View>
              <View style={styles.overallScoreIcon}>
                <Ionicons
                  name={selectedAnalysis.confidence_score > 0.8 ? 'trophy' : 'ribbon'}
                  size={48}
                  color={selectedAnalysis.confidence_score > 0.8 ? '#f59e0b' : theme.colors.primary}
                />
              </View>
            </Surface>
          </View>

          {/* Metrics Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detailed Metrics</Text>
            <View style={styles.metricsGrid}>
              {getMetricCards(selectedAnalysis).map((metric, index) => (
                <MetricCard key={index} metric={metric} />
              ))}
            </View>
          </View>

          {/* Performance Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <Surface style={styles.chartCard}>
              <LineChart
                data={getChartData(selectedAnalysis)}
                width={350}
                height={200}
                chartConfig={{
                  backgroundColor: theme.colors.surface,
                  backgroundGradientFrom: theme.colors.surface,
                  backgroundGradientTo: theme.colors.surface,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
                }}
                bezier
                style={styles.chart}
              />
            </Surface>
          </View>

          {/* Feedback */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Feedback</Text>
            <Surface style={styles.feedbackCard}>
              <Text style={styles.feedbackText}>{selectedAnalysis.feedback}</Text>
            </Surface>
          </View>

          {/* Action Buttons */}
          <View style={styles.section}>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Experts', {
                  skillType: selectedAnalysis.skill_type
                })}
                style={styles.actionButton}
              >
                Compare with Experts
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('SkillTransfer', {
                  sourceSkill: selectedAnalysis.skill_type
                })}
                style={styles.actionButton}
              >
                Explore Skill Transfer
              </Button>
            </View>
          </View>
        </>
      )}

      {analyses.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={64} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.emptyStateTitle}>No Analyses Yet</Text>
          <Text style={styles.emptyStateText}>
            Record your first practice session to see detailed analysis results
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Record')}
            style={styles.emptyStateButton}
          >
            Start Recording
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.headingSmall,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  analysisCard: {
    marginBottom: theme.spacing.sm,
  },
  analysisCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  analysisCardSurface: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
  },
  analysisCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  analysisSkillType: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurface,
  },
  analysisTime: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  analysisFeedback: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  overallScoreCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallScoreContent: {
    flex: 1,
  },
  overallScoreLabel: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  overallScoreValue: {
    ...theme.typography.headingLarge,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  overallScoreProgress: {
    height: 8,
    borderRadius: 4,
  },
  overallScoreIcon: {
    marginLeft: theme.spacing.lg,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  metricTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginLeft: theme.spacing.sm,
  },
  metricValue: {
    ...theme.typography.headingMedium,
    marginBottom: theme.spacing.sm,
  },
  metricProgress: {
    height: 6,
    borderRadius: 3,
  },
  chartCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
    alignItems: 'center',
  },
  chart: {
    borderRadius: theme.borderRadius.md,
  },
  feedbackCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
  },
  feedbackText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
    lineHeight: 24,
  },
  actionButtons: {
    gap: theme.spacing.md,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyStateTitle: {
    ...theme.typography.headingMedium,
    color: theme.colors.onBackground,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyStateButton: {
    marginTop: theme.spacing.md,
  },
});

export default AnalysisScreen;