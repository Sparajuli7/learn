/**
 * Skill Transfer Screen - SkillMirror Mobile App
 * Cross-domain skill transfer analysis and learning paths
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Surface,
  Button,
  Card,
  ProgressBar,
  Chip,
  Portal,
  Modal,
  List,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { APIService, SkillTransferAnalysis } from '../services/APIService';

interface SkillOption {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
}

interface TransferResult {
  id: string;
  source_skill: string;
  target_skill: string;
  effectiveness_score: number;
  estimated_time: number;
  learning_path: {
    phases: TransferPhase[];
    total_exercises: number;
    estimated_weeks: number;
  };
  transfer_principles: string[];
  success_stories: string[];
}

interface TransferPhase {
  id: number;
  title: string;
  description: string;
  duration_weeks: number;
  exercises: string[];
  key_concepts: string[];
}

const SkillTransferScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [sourceSkill, setSourceSkill] = useState<SkillOption | null>(null);
  const [targetSkill, setTargetSkill] = useState<SkillOption | null>(null);
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

  const skillOptions: SkillOption[] = [
    {
      id: 'public_speaking',
      name: 'Public Speaking',
      description: 'Presentation and communication skills',
      category: 'Communication',
      difficulty: 'Beginner',
    },
    {
      id: 'boxing',
      name: 'Boxing',
      description: 'Combat sports and physical training',
      category: 'Sports',
      difficulty: 'Intermediate',
    },
    {
      id: 'coding',
      name: 'Coding',
      description: 'Software development and programming',
      category: 'Technology',
      difficulty: 'Intermediate',
    },
    {
      id: 'cooking',
      name: 'Cooking',
      description: 'Culinary arts and food preparation',
      category: 'Lifestyle',
      difficulty: 'Beginner',
    },
    {
      id: 'music',
      name: 'Music Performance',
      description: 'Musical instruments and composition',
      category: 'Arts',
      difficulty: 'Advanced',
    },
    {
      id: 'business',
      name: 'Business Leadership',
      description: 'Management and entrepreneurship',
      category: 'Business',
      difficulty: 'Advanced',
    },
    {
      id: 'dance',
      name: 'Dance/Fitness',
      description: 'Movement and physical coordination',
      category: 'Fitness',
      difficulty: 'Intermediate',
    },
  ];

  useEffect(() => {
    // Check if we have a source skill from route params
    if (route.params?.sourceSkill) {
      const skill = skillOptions.find(s => s.name === route.params.sourceSkill);
      if (skill) {
        setSourceSkill(skill);
      }
    }
  }, [route.params]);

  const analyzeTransfer = async () => {
    if (!sourceSkill || !targetSkill) {
      Alert.alert('Error', 'Please select both source and target skills');
      return;
    }

    if (sourceSkill.id === targetSkill.id) {
      Alert.alert('Error', 'Source and target skills must be different');
      return;
    }

    try {
      setIsAnalyzing(true);
      
      // Mock transfer analysis - in a real app, this would use the API
      const mockResult: TransferResult = {
        id: `transfer_${Date.now()}`,
        source_skill: sourceSkill.name,
        target_skill: targetSkill.name,
        effectiveness_score: getTransferEffectiveness(sourceSkill.id, targetSkill.id),
        estimated_time: getEstimatedTime(sourceSkill.id, targetSkill.id),
        learning_path: generateLearningPath(sourceSkill.name, targetSkill.name),
        transfer_principles: getTransferPrinciples(sourceSkill.id, targetSkill.id),
        success_stories: getSuccessStories(sourceSkill.id, targetSkill.id),
      };

      setTransferResult(mockResult);
    } catch (error) {
      console.error('Transfer analysis failed:', error);
      Alert.alert('Error', 'Failed to analyze skill transfer');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTransferEffectiveness = (source: string, target: string): number => {
    const transferMap: { [key: string]: number } = {
      'boxing-public_speaking': 0.85,
      'coding-cooking': 0.75,
      'music-business': 0.80,
      'dance-boxing': 0.70,
      'public_speaking-business': 0.90,
    };
    
    const key = `${source}-${target}`;
    return transferMap[key] || 0.65;
  };

  const getEstimatedTime = (source: string, target: string): number => {
    const timeMap: { [key: string]: number } = {
      'boxing-public_speaking': 8,
      'coding-cooking': 12,
      'music-business': 10,
    };
    
    const key = `${source}-${target}`;
    return timeMap[key] || 16;
  };

  const generateLearningPath = (source: string, target: string): TransferResult['learning_path'] => {
    if (source === 'Boxing' && target === 'Public Speaking') {
      return {
        phases: [
          {
            id: 1,
            title: 'Stance & Presence',
            description: 'Transfer physical confidence and grounding',
            duration_weeks: 2,
            exercises: ['Mirror practice', 'Power poses', 'Breathing techniques'],
            key_concepts: ['Physical confidence', 'Grounding', 'Body awareness'],
          },
          {
            id: 2,
            title: 'Rhythm & Timing',
            description: 'Apply combat timing to speech delivery',
            duration_weeks: 3,
            exercises: ['Paced speaking', 'Pause control', 'Tempo variation'],
            key_concepts: ['Timing', 'Rhythm', 'Flow control'],
          },
          {
            id: 3,
            title: 'Mental Fortitude',
            description: 'Use fighting mindset for stage presence',
            duration_weeks: 3,
            exercises: ['Visualization', 'Pressure training', 'Confidence building'],
            key_concepts: ['Mental toughness', 'Pressure handling', 'Focus'],
          },
        ],
        total_exercises: 9,
        estimated_weeks: 8,
      };
    }
    
    // Default learning path
    return {
      phases: [
        {
          id: 1,
          title: 'Foundation Transfer',
          description: 'Identify and adapt core principles',
          duration_weeks: 4,
          exercises: ['Principle mapping', 'Basic adaptation', 'Practice sessions'],
          key_concepts: ['Core principles', 'Adaptation', 'Foundation'],
        },
        {
          id: 2,
          title: 'Skill Integration',
          description: 'Combine transferred skills with target domain',
          duration_weeks: 6,
          exercises: ['Integration practice', 'Feedback sessions', 'Refinement'],
          key_concepts: ['Integration', 'Synthesis', 'Application'],
        },
        {
          id: 3,
          title: 'Mastery Development',
          description: 'Achieve proficiency in the new domain',
          duration_weeks: 6,
          exercises: ['Advanced practice', 'Performance testing', 'Optimization'],
          key_concepts: ['Mastery', 'Optimization', 'Performance'],
        },
      ],
      total_exercises: 9,
      estimated_weeks: 16,
    };
  };

  const getTransferPrinciples = (source: string, target: string): string[] => {
    const principlesMap: { [key: string]: string[] } = {
      'boxing-public_speaking': [
        'Physical confidence translates to stage presence',
        'Training discipline applies to speech preparation',
        'Combat timing improves delivery rhythm',
        'Mental toughness builds audience confidence',
      ],
      'coding-cooking': [
        'Logical thinking improves recipe execution',
        'Debugging skills help troubleshoot dishes',
        'System thinking organizes kitchen workflow',
        'Attention to detail ensures consistency',
      ],
    };
    
    const key = `${source}-${target}`;
    return principlesMap[key] || [
      'Fundamental skills often transfer across domains',
      'Practice discipline is universally applicable',
      'Mental frameworks can be adapted',
      'Performance principles are often similar',
    ];
  };

  const getSuccessStories = (source: string, target: string): string[] => {
    return [
      'Athletes who became successful public speakers',
      'Musicians who applied rhythm to business communication',
      'Programmers who used logical thinking in creative pursuits',
    ];
  };

  const SkillSelector: React.FC<{
    visible: boolean;
    onDismiss: () => void;
    onSelect: (skill: SkillOption) => void;
    title: string;
    excludeSkill?: SkillOption;
  }> = ({ visible, onDismiss, onSelect, title, excludeSkill }) => (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Surface style={styles.modalSurface}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.skillsList}>
            {skillOptions
              .filter(skill => skill.id !== excludeSkill?.id)
              .map((skill) => (
                <TouchableOpacity
                  key={skill.id}
                  style={styles.skillOption}
                  onPress={() => {
                    onSelect(skill);
                    onDismiss();
                  }}
                >
                  <View style={styles.skillOptionContent}>
                    <Text style={styles.skillOptionName}>{skill.name}</Text>
                    <Text style={styles.skillOptionDescription}>{skill.description}</Text>
                    <View style={styles.skillOptionTags}>
                      <Chip mode="outlined" compact>{skill.category}</Chip>
                      <Chip mode="outlined" compact>{skill.difficulty}</Chip>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
          <Button mode="text" onPress={onDismiss}>Close</Button>
        </Surface>
      </Modal>
    </Portal>
  );

  const PhaseCard: React.FC<{ phase: TransferPhase; isExpanded: boolean; onToggle: () => void }> = ({
    phase,
    isExpanded,
    onToggle,
  }) => (
    <Card style={styles.phaseCard}>
      <TouchableOpacity onPress={onToggle}>
        <Card.Content>
          <View style={styles.phaseHeader}>
            <View style={styles.phaseInfo}>
              <Text style={styles.phaseTitle}>Phase {phase.id}: {phase.title}</Text>
              <Text style={styles.phaseDuration}>{phase.duration_weeks} weeks</Text>
            </View>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
          <Text style={styles.phaseDescription}>{phase.description}</Text>
          
          {isExpanded && (
            <View style={styles.phaseDetails}>
              <View style={styles.phaseSection}>
                <Text style={styles.phaseSectionTitle}>Key Concepts:</Text>
                {phase.key_concepts.map((concept, index) => (
                  <Text key={index} style={styles.phaseListItem}>• {concept}</Text>
                ))}
              </View>
              
              <View style={styles.phaseSection}>
                <Text style={styles.phaseSectionTitle}>Exercises:</Text>
                {phase.exercises.map((exercise, index) => (
                  <Text key={index} style={styles.phaseListItem}>• {exercise}</Text>
                ))}
              </View>
            </View>
          )}
        </Card.Content>
      </TouchableOpacity>
    </Card>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Skill Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Skills for Transfer</Text>
        
        <View style={styles.skillSelectionContainer}>
          <TouchableOpacity
            style={styles.skillSelector}
            onPress={() => setShowSourceSelector(true)}
          >
            <Surface style={styles.skillSelectorSurface}>
              <Text style={styles.skillSelectorLabel}>Source Skill</Text>
              <Text style={styles.skillSelectorValue}>
                {sourceSkill?.name || 'Select skill you know'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />
            </Surface>
          </TouchableOpacity>

          <View style={styles.transferArrow}>
            <Ionicons name="arrow-down" size={32} color={theme.colors.primary} />
          </View>

          <TouchableOpacity
            style={styles.skillSelector}
            onPress={() => setShowTargetSelector(true)}
          >
            <Surface style={styles.skillSelectorSurface}>
              <Text style={styles.skillSelectorLabel}>Target Skill</Text>
              <Text style={styles.skillSelectorValue}>
                {targetSkill?.name || 'Select skill to learn'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />
            </Surface>
          </TouchableOpacity>
        </View>

        <Button
          mode="contained"
          onPress={analyzeTransfer}
          disabled={!sourceSkill || !targetSkill || isAnalyzing}
          loading={isAnalyzing}
          style={styles.analyzeButton}
        >
          Analyze Transfer Potential
        </Button>
      </View>

      {/* Transfer Results */}
      {transferResult && (
        <>
          {/* Effectiveness Score */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transfer Analysis</Text>
            <Surface style={styles.effectivenessCard}>
              <View style={styles.effectivenessHeader}>
                <Text style={styles.effectivenessLabel}>Transfer Effectiveness</Text>
                <Text style={styles.effectivenessValue}>
                  {Math.round(transferResult.effectiveness_score * 100)}%
                </Text>
              </View>
              <ProgressBar
                progress={transferResult.effectiveness_score}
                color={theme.colors.primary}
                style={styles.effectivenessProgress}
              />
              <Text style={styles.effectivenessSubtext}>
                Estimated learning time: {transferResult.estimated_time} weeks
              </Text>
            </Surface>
          </View>

          {/* Transfer Principles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <Surface style={styles.principlesCard}>
              <Text style={styles.principlesTitle}>Transfer Principles:</Text>
              {transferResult.transfer_principles.map((principle, index) => (
                <Text key={index} style={styles.principleItem}>• {principle}</Text>
              ))}
            </Surface>
          </View>

          {/* Learning Path */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Learning Path</Text>
            <View style={styles.pathOverview}>
              <Text style={styles.pathStats}>
                {transferResult.learning_path.phases.length} phases • {transferResult.learning_path.total_exercises} exercises • {transferResult.learning_path.estimated_weeks} weeks
              </Text>
            </View>
            
            {transferResult.learning_path.phases.map((phase) => (
              <PhaseCard
                key={phase.id}
                phase={phase}
                isExpanded={expandedPhase === phase.id}
                onToggle={() => setExpandedPhase(expandedPhase === phase.id ? null : phase.id)}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.section}>
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={() => Alert.alert('Success', 'Learning path saved to your profile!')}
                style={styles.actionButton}
              >
                Start Learning Path
              </Button>
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Experts', {
                  skillType: transferResult.target_skill
                })}
                style={styles.actionButton}
              >
                Find {transferResult.target_skill} Experts
              </Button>
            </View>
          </View>
        </>
      )}

      {/* Skill Selectors */}
      <SkillSelector
        visible={showSourceSelector}
        onDismiss={() => setShowSourceSelector(false)}
        onSelect={setSourceSkill}
        title="Select Source Skill"
        excludeSkill={targetSkill}
      />
      
      <SkillSelector
        visible={showTargetSelector}
        onDismiss={() => setShowTargetSelector(false)}
        onSelect={setTargetSkill}
        title="Select Target Skill"
        excludeSkill={sourceSkill}
      />
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
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.headingSmall,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  skillSelectionContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  skillSelector: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  skillSelectorSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
  },
  skillSelectorLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  skillSelectorValue: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
    flex: 1,
  },
  transferArrow: {
    marginVertical: theme.spacing.sm,
  },
  analyzeButton: {
    marginTop: theme.spacing.md,
  },
  modalContainer: {
    margin: theme.spacing.lg,
    maxHeight: '80%',
  },
  modalSurface: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  modalTitle: {
    ...theme.typography.headingMedium,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  skillsList: {
    maxHeight: 400,
  },
  skillOption: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  skillOptionContent: {},
  skillOptionName: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  skillOptionDescription: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
  },
  skillOptionTags: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  effectivenessCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    elevation: 2,
  },
  effectivenessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  effectivenessLabel: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
  },
  effectivenessValue: {
    ...theme.typography.headingLarge,
    color: theme.colors.primary,
  },
  effectivenessProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  effectivenessSubtext: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  principlesCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
  },
  principlesTitle: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.md,
  },
  principleItem: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  pathOverview: {
    marginBottom: theme.spacing.md,
  },
  pathStats: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  phaseCard: {
    marginBottom: theme.spacing.md,
    elevation: 1,
  },
  phaseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseTitle: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  phaseDuration: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
  },
  phaseDescription: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
  },
  phaseDetails: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  phaseSection: {
    marginBottom: theme.spacing.md,
  },
  phaseSectionTitle: {
    ...theme.typography.labelMedium,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  phaseListItem: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  actionButtons: {
    gap: theme.spacing.md,
  },
  actionButton: {
    marginBottom: theme.spacing.sm,
  },
});

export default SkillTransferScreen;