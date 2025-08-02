/**
 * Record Screen - SkillMirror Mobile App
 * Video recording interface with real-time feedback capabilities
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Button, Surface, Chip, Modal, Portal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme/theme';
import { APIService } from '../services/APIService';

const { width, height } = Dimensions.get('window');

interface Skill {
  id: number;
  name: string;
  description: string;
  difficulty_level: string;
}

const RecordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.front);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [showSkillSelector, setShowSkillSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const cameraRef = useRef<Camera>(null);
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status === 'granted') {
        await loadSkills();
      }
    })();

    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);

  const loadSkills = async () => {
    try {
      setIsLoading(true);
      const response = await APIService.getSkills();
      setSkills(response.skills);
      
      // Select default skill
      if (response.skills.length > 0) {
        setSelectedSkill(response.skills[0]);
      }
    } catch (error) {
      console.error('Failed to load skills:', error);
      
      // Fallback skills if API fails
      const fallbackSkills: Skill[] = [
        { id: 1, name: 'Public Speaking', description: 'Improve your presentation skills', difficulty_level: 'beginner' },
        { id: 2, name: 'Dance/Fitness', description: 'Movement and coordination', difficulty_level: 'intermediate' },
        { id: 3, name: 'Cooking', description: 'Culinary techniques', difficulty_level: 'beginner' },
        { id: 4, name: 'Music', description: 'Musical performance', difficulty_level: 'advanced' },
        { id: 5, name: 'Sports', description: 'Athletic movements', difficulty_level: 'intermediate' },
      ];
      
      setSkills(fallbackSkills);
      setSelectedSkill(fallbackSkills[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    if (!cameraRef.current || !selectedSkill) {
      Alert.alert('Error', 'Please select a skill before recording');
      return;
    }

    try {
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start recording timer
      recordingTimer.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      const video = await cameraRef.current.recordAsync({
        quality: '720p',
        maxDuration: 300, // 5 minutes max
      });

      console.log('Recording completed:', video.uri);
      
      // Upload and analyze video
      await handleVideoUpload(video.uri);
      
    } catch (error) {
      console.error('Recording failed:', error);
      Alert.alert('Error', 'Failed to record video');
    } finally {
      setIsRecording(false);
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const handleVideoUpload = async (videoUri: string) => {
    if (!selectedSkill) return;

    try {
      setIsLoading(true);
      
      Alert.alert(
        'Video Recorded',
        'Your video has been recorded successfully. Would you like to analyze it now?',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Analyze Now',
            onPress: async () => {
              try {
                // Upload video
                const uploadResult = await APIService.uploadVideo(videoUri, selectedSkill.name);
                
                // Start analysis
                const analysisResult = await APIService.analyzeVideo(
                  uploadResult.video_id,
                  selectedSkill.name
                );
                
                Alert.alert(
                  'Analysis Complete',
                  `Your ${selectedSkill.name} session has been analyzed!`,
                  [
                    {
                      text: 'View Results',
                      onPress: () => navigation.navigate('Analysis', {
                        analysisId: analysisResult.analysis_id,
                        skillType: selectedSkill.name,
                      }),
                    },
                  ]
                );
              } catch (error) {
                console.error('Analysis failed:', error);
                Alert.alert('Error', 'Failed to analyze video');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setIsLoading(false);
    }
  };

  const flipCamera = () => {
    setType(current => 
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
          Please enable camera permissions in your device settings
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
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>REC</Text>
              <Text style={styles.recordingDuration}>
                {formatDuration(recordingDuration)}
              </Text>
            </View>
          )}

          {/* Camera Controls Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.controlsOverlay}
          >
            <View style={styles.controlsContainer}>
              {/* Skill Selector */}
              <TouchableOpacity
                style={styles.skillButton}
                onPress={() => setShowSkillSelector(true)}
                disabled={isRecording}
              >
                <Surface style={styles.skillButtonSurface}>
                  <Text style={styles.skillButtonText}>
                    {selectedSkill?.name || 'Select Skill'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.primary} />
                </Surface>
              </TouchableOpacity>

              {/* Recording Controls */}
              <View style={styles.recordingControls}>
                <TouchableOpacity
                  style={styles.flipButton}
                  onPress={flipCamera}
                  disabled={isRecording}
                >
                  <Ionicons name="camera-reverse" size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.recordButton,
                    isRecording && styles.recordButtonActive
                  ]}
                  onPress={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                >
                  <View style={[
                    styles.recordButtonInner,
                    isRecording && styles.recordButtonInnerActive
                  ]} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={() => navigation.navigate('RealTimeFeedback')}
                  disabled={isRecording}
                >
                  <Ionicons name="settings" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </Camera>
      </View>

      {/* Skill Selector Modal */}
      <Portal>
        <Modal
          visible={showSkillSelector}
          onDismiss={() => setShowSkillSelector(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalSurface}>
            <Text style={styles.modalTitle}>Select a Skill</Text>
            <View style={styles.skillsList}>
              {skills.map((skill) => (
                <TouchableOpacity
                  key={skill.id}
                  style={[
                    styles.skillItem,
                    selectedSkill?.id === skill.id && styles.skillItemSelected
                  ]}
                  onPress={() => {
                    setSelectedSkill(skill);
                    setShowSkillSelector(false);
                  }}
                >
                  <View style={styles.skillItemContent}>
                    <Text style={styles.skillItemName}>{skill.name}</Text>
                    <Text style={styles.skillItemDescription}>{skill.description}</Text>
                    <Chip mode="outlined" compact style={styles.difficultyChip}>
                      {skill.difficulty_level}
                    </Chip>
                  </View>
                  {selectedSkill?.id === skill.id && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Button
              mode="text"
              onPress={() => setShowSkillSelector(false)}
              style={styles.modalCloseButton}
            >
              Close
            </Button>
          </Surface>
        </Modal>
      </Portal>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Surface style={styles.loadingCard}>
            <Text style={styles.loadingText}>Processing...</Text>
          </Surface>
        </View>
      )}
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
    justifyContent: 'flex-end',
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
    marginRight: 8,
  },
  recordingDuration: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'flex-end',
  },
  controlsContainer: {
    padding: theme.spacing.lg,
  },
  skillButton: {
    marginBottom: theme.spacing.lg,
    alignSelf: 'center',
  },
  skillButtonSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  skillButtonText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurface,
    marginRight: theme.spacing.xs,
  },
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flipButton: {
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
  settingsButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    margin: theme.spacing.lg,
    maxHeight: height * 0.8,
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
    maxHeight: height * 0.5,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  skillItemSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
  skillItemContent: {
    flex: 1,
  },
  skillItemName: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  skillItemDescription: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  difficultyChip: {
    alignSelf: 'flex-start',
  },
  modalCloseButton: {
    marginTop: theme.spacing.md,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  loadingText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
  },
});

export default RecordScreen;