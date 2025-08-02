/**
 * Profile Screen - SkillMirror Mobile App
 * User profile, settings, and account management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import {
  Surface,
  Button,
  Switch,
  List,
  Avatar,
  ProgressBar,
  Chip,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { APIService } from '../services/APIService';
import { SessionManager } from '../services/SessionManager';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  subscription_tier: string;
  join_date: string;
  total_analyses: number;
  current_streak: number;
  favorite_skills: string[];
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_date: string;
  progress?: number;
}

interface Setting {
  id: string;
  title: string;
  subtitle?: string;
  type: 'switch' | 'action' | 'navigation';
  value?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
}

const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<Setting[]>([]);

  useEffect(() => {
    loadProfile();
    initializeSettings();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      // Mock profile data - in a real app, this would come from the API
      const mockProfile: UserProfile = {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar_url: 'https://via.placeholder.com/150x150?text=JD',
        subscription_tier: 'Pro',
        join_date: '2024-01-01T00:00:00Z',
        total_analyses: 42,
        current_streak: 7,
        favorite_skills: ['Public Speaking', 'Dance/Fitness', 'Cooking'],
        achievements: [
          {
            id: 'first_analysis',
            title: 'First Steps',
            description: 'Completed your first analysis',
            icon: 'rocket',
            earned_date: '2024-01-01T12:00:00Z',
          },
          {
            id: 'week_streak',
            title: 'Week Warrior',
            description: 'Maintained a 7-day practice streak',
            icon: 'flame',
            earned_date: '2024-01-15T10:30:00Z',
          },
          {
            id: 'expert_comparison',
            title: 'Expert Explorer',
            description: 'Compared with 5 different experts',
            icon: 'people',
            earned_date: '2024-01-10T14:20:00Z',
          },
          {
            id: 'skill_transfer',
            title: 'Transfer Master',
            description: 'Progress: 3/5 skill transfers completed',
            icon: 'shuffle',
            earned_date: '',
            progress: 0.6,
          },
        ],
      };

      setProfile(mockProfile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSettings = () => {
    const settingsData: Setting[] = [
      {
        id: 'notifications',
        title: 'Push Notifications',
        subtitle: 'Receive reminders and updates',
        type: 'switch',
        value: true,
        icon: 'notifications',
      },
      {
        id: 'real_time_feedback',
        title: 'Real-time Feedback',
        subtitle: 'Enable live analysis during recording',
        type: 'switch',
        value: true,
        icon: 'pulse',
      },
      {
        id: 'auto_upload',
        title: 'Auto Upload',
        subtitle: 'Automatically upload recordings for analysis',
        type: 'switch',
        value: false,
        icon: 'cloud-upload',
      },
      {
        id: 'analytics',
        title: 'Usage Analytics',
        type: 'navigation',
        icon: 'analytics',
        onPress: () => showAnalytics(),
      },
      {
        id: 'subscription',
        title: 'Subscription',
        subtitle: 'Manage your subscription',
        type: 'navigation',
        icon: 'card',
        onPress: () => showSubscription(),
      },
      {
        id: 'api_tokens',
        title: 'API Access',
        subtitle: 'Manage API tokens',
        type: 'navigation',
        icon: 'key',
        onPress: () => showApiTokens(),
      },
      {
        id: 'privacy',
        title: 'Privacy Settings',
        type: 'navigation',
        icon: 'shield-checkmark',
        onPress: () => showPrivacySettings(),
      },
      {
        id: 'help',
        title: 'Help & Support',
        type: 'navigation',
        icon: 'help-circle',
        onPress: () => showHelp(),
      },
      {
        id: 'about',
        title: 'About SkillMirror',
        type: 'navigation',
        icon: 'information-circle',
        onPress: () => showAbout(),
      },
    ];

    setSettings(settingsData);
  };

  const handleSettingToggle = (settingId: string, value: boolean) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === settingId 
          ? { ...setting, value }
          : setting
      )
    );
    
    // In a real app, save the setting to the backend
    console.log(`Setting ${settingId} changed to:`, value);
  };

  const showAnalytics = () => {
    Alert.alert(
      'Usage Analytics',
      `Total Sessions: ${profile?.total_analyses || 0}\nCurrent Streak: ${profile?.current_streak || 0} days\nFavorite Skills: ${profile?.favorite_skills.join(', ') || 'None'}`
    );
  };

  const showSubscription = () => {
    Alert.alert(
      'Subscription',
      `Current Plan: ${profile?.subscription_tier || 'Free'}\n\nUpgrade to unlock more features and unlimited analyses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Upgrade', onPress: () => console.log('Navigate to subscription') },
      ]
    );
  };

  const showApiTokens = () => {
    Alert.alert(
      'API Access',
      'Manage your API tokens for third-party integrations. Create tokens with specific permissions for different applications.',
      [
        { text: 'Close' },
        { text: 'Manage Tokens', onPress: () => console.log('Navigate to API tokens') },
      ]
    );
  };

  const showPrivacySettings = () => {
    Alert.alert(
      'Privacy Settings',
      'Control how your data is used and shared. All video analyses are processed securely and can be deleted at any time.',
      [{ text: 'Close' }]
    );
  };

  const showHelp = () => {
    Alert.alert(
      'Help & Support',
      'Need help with SkillMirror? Check our FAQ, contact support, or browse our video tutorials.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Contact Support', onPress: () => console.log('Open support') },
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'About SkillMirror',
      'SkillMirror v1.0.0\n\nAI-powered skill development platform that helps you learn faster through expert comparison and cross-domain skill transfer.\n\nBuilt with ❤️ for learners everywhere.',
      [{ text: 'Close' }]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await SessionManager.endSession();
            // In a real app, navigate to login screen
            console.log('User signed out');
          },
        },
      ]
    );
  };

  const AchievementCard: React.FC<{ achievement: Achievement }> = ({ achievement }) => (
    <Surface style={styles.achievementCard}>
      <View style={styles.achievementHeader}>
        <View style={[
          styles.achievementIcon,
          { backgroundColor: achievement.earned_date ? theme.colors.primaryContainer : theme.colors.surfaceVariant }
        ]}>
          <Ionicons
            name={achievement.icon as keyof typeof Ionicons.glyphMap}
            size={24}
            color={achievement.earned_date ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        </View>
        <View style={styles.achievementInfo}>
          <Text style={styles.achievementTitle}>{achievement.title}</Text>
          <Text style={styles.achievementDescription}>{achievement.description}</Text>
          {achievement.progress !== undefined && (
            <ProgressBar
              progress={achievement.progress}
              color={theme.colors.primary}
              style={styles.achievementProgress}
            />
          )}
        </View>
      </View>
      {achievement.earned_date && (
        <Text style={styles.achievementDate}>
          Earned: {new Date(achievement.earned_date).toLocaleDateString()}
        </Text>
      )}
    </Surface>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header */}
      <Surface style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <Avatar.Text
              size={80}
              label={profile.name.split(' ').map(n => n[0]).join('')}
              style={styles.avatar}
            />
          )}
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
            <Chip mode="outlined" compact style={styles.subscriptionChip}>
              {profile.subscription_tier}
            </Chip>
          </View>
        </View>
      </Surface>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsContainer}>
          <Surface style={styles.statCard}>
            <Text style={styles.statValue}>{profile.total_analyses}</Text>
            <Text style={styles.statLabel}>Total Analyses</Text>
          </Surface>
          <Surface style={styles.statCard}>
            <Text style={styles.statValue}>{profile.current_streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </Surface>
          <Surface style={styles.statCard}>
            <Text style={styles.statValue}>{profile.favorite_skills.length}</Text>
            <Text style={styles.statLabel}>Skills</Text>
          </Surface>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {profile.achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <Surface style={styles.settingsContainer}>
          {settings.map((setting) => (
            <List.Item
              key={setting.id}
              title={setting.title}
              description={setting.subtitle}
              left={(props) => (
                <List.Icon {...props} icon={setting.icon} color={theme.colors.onSurfaceVariant} />
              )}
              right={(props) => {
                if (setting.type === 'switch') {
                  return (
                    <Switch
                      value={setting.value}
                      onValueChange={(value) => handleSettingToggle(setting.id, value)}
                    />
                  );
                } else if (setting.type === 'navigation') {
                  return <List.Icon {...props} icon="chevron-right" />;
                }
                return null;
              }}
              onPress={setting.onPress}
            />
          ))}
        </Surface>
      </View>

      {/* Sign Out */}
      <View style={styles.section}>
        <Button
          mode="outlined"
          onPress={handleSignOut}
          style={styles.signOutButton}
          textColor={theme.colors.error}
        >
          Sign Out
        </Button>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...theme.typography.bodyLarge,
    color: theme.colors.error,
  },
  profileHeader: {
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: theme.spacing.md,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    ...theme.typography.headingMedium,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  profileEmail: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
  },
  subscriptionChip: {
    alignSelf: 'flex-start',
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.headingSmall,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.md,
    margin: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    elevation: 1,
  },
  statValue: {
    ...theme.typography.headingLarge,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  achievementCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  achievementDescription: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  achievementProgress: {
    height: 4,
    borderRadius: 2,
  },
  achievementDate: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
    textAlign: 'right',
  },
  settingsContainer: {
    borderRadius: theme.borderRadius.md,
    elevation: 1,
  },
  signOutButton: {
    marginTop: theme.spacing.md,
    borderColor: theme.colors.error,
  },
});

export default ProfileScreen;