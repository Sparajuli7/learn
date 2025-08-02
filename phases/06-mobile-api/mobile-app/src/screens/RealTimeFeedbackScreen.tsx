/**
 * Real-Time Feedback Screen - SkillMirror Mobile App
 * Live feedback and coaching during practice sessions
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import {
  Surface,
  Button,
  Card,
  ProgressBar,
  Chip,
  Portal,
  Modal,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';
import { APIService } from '../services/APIService';

const { width, height } = Dimensions.get('window');

interface FeedbackMessage {
  id: string;
  type: 'positive' | 'improvement' | 'warning';
  message: string;
  timestamp: number;
  priority: 'high' | 'medium' | 'low';
}

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface RealTimeFeedbackSession {
  session_id: string;
  skill_type: string;
  is_active: boolean;
  start_time: Date;
  metrics: PerformanceMetric[];
  feedback_messages: FeedbackMessage[];
}

const RealTimeFeedbackScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.front);
  const [session, setSession] = useState<RealTimeFeedbackSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState('Public Speaking');
  
  const cameraRef = useRef<Camera>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const feedbackTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    return () => {
      if (feedbackTimer.current) {
        clearInterval(feedbackTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      startPulseAnimation();
      startFeedbackSession();
    } else {
      stopPulseAnimation();
      endFeedbackSession();
    }
  }, [isRecording]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startFeedbackSession = async () => {
    try {
      // Mock session initialization
      const newSession: RealTimeFeedbackSession = {
        session_id: `feedback_${Date.now()}`,
        skill_type: selectedSkill,
        is_active: true,
        start_time: new Date(),
        metrics: getInitialMetrics(selectedSkill),
        feedback_messages: [],
      };

      setSession(newSession);
      
      // Start real-time feedback simulation
      feedbackTimer.current = setInterval(() => {
        generateRealtimeFeedback(newSession);
      }, 3000);

    } catch (error) {
      console.error('Failed to start feedback session:', error);
      Alert.alert('Error', 'Failed to start real-time feedback session');
    }
  };

  const endFeedbackSession = async () => {
    if (feedbackTimer.current) {
      clearInterval(feedbackTimer.current);
      feedbackTimer.current = null;
    }

    if (session) {
      setSession(prev => prev ? { ...prev, is_active: false } : null);
      
      const duration = Math.floor((Date.now() - session.start_time.getTime()) / 1000);
      Alert.alert(
        'Session Complete',
        `Your ${session.skill_type} practice session lasted ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
        [
          { text: 'Close' },
          { text: 'View Analysis', onPress: () => navigation.navigate('Analysis') },
        ]
      );
    }
  };

  const getInitialMetrics = (skillType: string): PerformanceMetric[] => {
    if (skillType === 'Public Speaking') {
      return [
        { name: 'Posture', value: 75, target: 85, color: theme.colors.primary, icon: 'person-standing' },
        { name: 'Eye Contact', value: 60, target: 80, color: theme.colors.secondary, icon: 'eye' },
        { name: 'Voice Clarity', value: 80, target: 85, color: theme.colors.tertiary, icon: 'chatbubble' },
        { name: 'Gestures', value: 70, target: 75, color: '#f59e0b', icon: 'hand-left' },
      ];
    } else if (skillType === 'Dance/Fitness') {
      return [
        { name: 'Rhythm', value: 65, target: 80, color: theme.colors.primary, icon: 'musical-notes' },
        { name: 'Coordination', value: 70, target: 85, color: theme.colors.secondary, icon: 'body' },
        { name: 'Form', value: 75, target: 80, color: theme.colors.tertiary, icon: 'fitness' },
        { name: 'Energy', value: 85, target: 90, color: '#f59e0b', icon: 'flash' },
      ];
    }
    
    return [
      { name: 'Performance', value: 70, target: 80, color: theme.colors.primary, icon: 'trending-up' },
      { name: 'Technique', value: 75, target: 85, color: theme.colors.secondary, icon: 'checkmark-circle' },
      { name: 'Consistency', value: 80, target: 85, color: theme.colors.tertiary, icon: 'repeat' },
    ];
  };

  const generateRealtimeFeedback = (currentSession: RealTimeFeedbackSession) => {
    if (!feedbackEnabled) return;

    const feedbackMessages = [
      {
        type: 'positive' as const,
        messages: [
          'Great posture! Keep it up!',
          'Excellent eye contact',
          'Your voice is clear and confident',
          'Perfect gesture timing',
          'Strong presence!',
        ],
      },
      {
        type: 'improvement' as const,
        messages: [
          'Try to maintain eye contact longer',
          'Slow down your speech pace',
          'Stand up straighter',
          'Use more varied gestures',
          'Project your voice more',
        ],
      },
      {
        type: 'warning' as const,
        messages: [
          'Avoid looking down',
          'Reduce filler words',
          'Don\'t rush through points',
          'Keep hands visible',
        ],
      },
    ];

    const randomType = Math.random();
    let selectedType: 'positive' | 'improvement' | 'warning';
    let priority: 'high' | 'medium' | 'low';

    if (randomType < 0.4) {
      selectedType = 'positive';
      priority = 'low';
    } else if (randomType < 0.8) {
      selectedType = 'improvement';
      priority = 'medium';
    } else {
      selectedType = 'warning';
      priority = 'high';
    }

    const typeMessages = feedbackMessages.find(f => f.type === selectedType);
    if (!typeMessages) return;

    const randomMessage = typeMessages.messages[Math.floor(Math.random() * typeMessages.messages.length)];

    const newFeedback: FeedbackMessage = {
      id: `feedback_${Date.now()}`,
      type: selectedType,
      message: randomMessage,
      timestamp: Date.now(),
      priority,
    };

    setSession(prev => {
      if (!prev) return prev;
      
      // Update metrics randomly
      const updatedMetrics = prev.metrics.map(metric => ({
        ...metric,
        value: Math.max(0, Math.min(100, metric.value + (Math.random() - 0.5) * 10)),
      }));

      return {
        ...prev,
        metrics: updatedMetrics,
        feedback_messages: [...prev.feedback_messages.slice(-4), newFeedback], // Keep last 5 messages
      };
    });
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const getFeedbackIcon = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'positive':
        return 'checkmark-circle';
      case 'improvement':
        return 'information-circle';
      case 'warning':
        return 'warning';
      default:
        return 'chatbubble';
    }
  };

  const getFeedbackColor = (type: FeedbackMessage['type']) => {
    switch (type) {
      case 'positive':
        return theme.colors.tertiary;
      case 'improvement':
        return theme.colors.primary;
      case 'warning':
        return '#f59e0b';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const MetricCard: React.FC<{ metric: PerformanceMetric }> = ({ metric }) => (
    <Surface style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Ionicons name={metric.icon} size={16} color={metric.color} />
        <Text style={styles.metricName}>{metric.name}</Text>
      </View>
      <Text style={[styles.metricValue, { color: metric.color }]}>
        {Math.round(metric.value)}%
      </Text>
      <ProgressBar
        progress={metric.value / 100}
        color={metric.color}
        style={styles.metricProgress}
      />
      <Text style={styles.metricTarget}>Target: {metric.target}%</Text>
    </Surface>
  );

  const FeedbackCard: React.FC<{ feedback: FeedbackMessage }> = ({ feedback }) => (
    <Surface style={[styles.feedbackCard, { borderLeftColor: getFeedbackColor(feedback.type) }]}>
      <View style={styles.feedbackHeader}>
        <Ionicons
          name={getFeedbackIcon(feedback.type)}
          size={16}
          color={getFeedbackColor(feedback.type)}
        />
        <Text style={[styles.feedbackType, { color: getFeedbackColor(feedback.type) }]}>
          {feedback.type.toUpperCase()}
        </Text>
        <Chip
          mode="outlined"
          compact
          style={[styles.priorityChip, {
            borderColor: feedback.priority === 'high' ? '#dc2626' : 
                        feedback.priority === 'medium' ? '#f59e0b' : theme.colors.outline
          }]}
        >
          {feedback.priority}
        </Chip>
      </View>
      <Text style={styles.feedbackMessage}>{feedback.message}</Text>
    </Surface>
  );

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off" size={64} color={theme.colors.onSurfaceVariant} />
        <Text style={styles.permissionText}>No access to camera</Text>
        <Text style={styles.permissionSubtext}>
          Please enable camera permissions to use real-time feedback
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={type}
          ratio="16:9"
        >
          {/* Recording Indicator */}
          {isRecording && (
            <Animated.View style={[styles.recordingIndicator, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>LIVE FEEDBACK</Text>
            </Animated.View>
          )}

          {/* Performance Metrics Overlay */}
          {session && isRecording && (
            <View style={styles.metricsOverlay}>
              <View style={styles.metricsGrid}>
                {session.metrics.map((metric, index) => (
                  <MetricCard key={index} metric={metric} />
                ))}
              </View>
            </View>
          )}

          {/* Camera Controls */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.controlsOverlay}
          >
            <View style={styles.controlsContainer}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setShowSettings(true)}
                disabled={isRecording}
              >
                <Ionicons name="settings" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordButtonActive
                ]}
                onPress={toggleRecording}
              >
                <View style={[
                  styles.recordButtonInner,
                  isRecording && styles.recordButtonInnerActive
                ]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setType(current => 
                  current === CameraType.back ? CameraType.front : CameraType.back
                )}
                disabled={isRecording}
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Camera>
      </View>

      {/* Real-time Feedback Panel */}
      {session && isRecording && session.feedback_messages.length > 0 && (
        <View style={styles.feedbackPanel}>
          <Text style={styles.feedbackPanelTitle}>Live Feedback</Text>
          {session.feedback_messages.slice(-3).map((feedback) => (
            <FeedbackCard key={feedback.id} feedback={feedback} />
          ))}
        </View>
      )}

      {/* Settings Modal */}
      <Portal>
        <Modal
          visible={showSettings}
          onDismiss={() => setShowSettings(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <Text style={styles.modalTitle}>Real-time Feedback Settings</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Enable Feedback</Text>
              <Button
                mode={feedbackEnabled ? 'contained' : 'outlined'}
                compact
                onPress={() => setFeedbackEnabled(!feedbackEnabled)}
              >
                {feedbackEnabled ? 'ON' : 'OFF'}
              </Button>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Skill Type</Text>
              <Button
                mode="outlined"
                compact
                onPress={() => {
                  const skills = ['Public Speaking', 'Dance/Fitness', 'Cooking', 'Music'];
                  const currentIndex = skills.indexOf(selectedSkill);
                  const nextIndex = (currentIndex + 1) % skills.length;
                  setSelectedSkill(skills[nextIndex]);
                }}
              >
                {selectedSkill}
              </Button>
            </View>

            <Button
              mode="text"
              onPress={() => setShowSettings(false)}
              style={styles.modalCloseButton}
            >
              Close
            </Button>
          </Surface>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  permissionText: {
    ...theme.typography.headingMedium,
    color: theme.colors.onBackground,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  permissionSubtext: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  recordingIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 8,
  },
  recordingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  metricsOverlay: {
    position: 'absolute',
    top: 100,
    left: 10,
    right: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  metricName: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurface,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  metricValue: {
    ...theme.typography.labelLarge,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  metricProgress: {
    height: 3,
    borderRadius: 2,
    marginBottom: theme.spacing.xs,
  },
  metricTarget: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: 'flex-end',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  settingsButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dc2626',
  },
  recordButtonInnerActive: {
    width: 30,
    height: 30,
    borderRadius: 4,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackPanel: {
    position: 'absolute',
    bottom: 140,
    left: 10,
    right: 10,
    maxHeight: 200,
  },
  feedbackPanelTitle: {
    ...theme.typography.labelLarge,
    color: 'white',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  feedbackCard: {
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderLeftWidth: 4,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  feedbackType: {
    ...theme.typography.bodySmall,
    fontWeight: 'bold',
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  priorityChip: {
    height: 20,
  },
  feedbackMessage: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurface,
  },
  modalContainer: {
    margin: theme.spacing.lg,
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  settingLabel: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
  },
  modalCloseButton: {
    marginTop: theme.spacing.md,
  },
});

export default RealTimeFeedbackScreen;