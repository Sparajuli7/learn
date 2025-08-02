/**
 * Home Screen - SkillMirror Mobile App
 * Main dashboard with quick actions and recent activity
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
import { Card, Button, Surface, ProgressBar } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { APIService } from '../services/APIService';
import { SessionManager } from '../services/SessionManager';

interface DashboardStats {
  totalAnalyses: number;
  currentStreak: number;
  averageScore: number;
  skillsInProgress: number;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  screen: string;
}

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalAnalyses: 0,
    currentStreak: 0,
    averageScore: 0,
    skillsInProgress: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const quickActions: QuickAction[] = [
    {
      id: 'record',
      title: 'Record Practice',
      subtitle: 'Start a new session',
      icon: 'videocam',
      color: '#e11d48',
      screen: 'Record',
    },
    {
      id: 'analysis',
      title: 'View Analysis',
      subtitle: 'See your results',
      icon: 'analytics',
      color: '#7c3aed',
      screen: 'Analysis',
    },
    {
      id: 'experts',
      title: 'Compare Experts',
      subtitle: 'Learn from the best',
      icon: 'people',
      color: '#059669',
      screen: 'Experts',
    },
    {
      id: 'transfer',
      title: 'Skill Transfer',
      subtitle: 'Cross-domain learning',
      icon: 'shuffle',
      color: '#dc2626',
      screen: 'SkillTransfer',
    },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, we'd fetch actual user statistics
      // For now, we'll use mock data
      const mockStats: DashboardStats = {
        totalAnalyses: 42,
        currentStreak: 7,
        averageScore: 0.78,
        skillsInProgress: 3,
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleQuickAction = (action: QuickAction) => {
    if (action.screen === 'SkillTransfer') {
      navigation.navigate('SkillTransfer');
    } else {
      navigation.navigate(action.screen);
    }
  };

  const StatCard: React.FC<{ title: string; value: string; subtitle: string; color: string }> = ({
    title,
    value,
    subtitle,
    color,
  }) => (
    <Surface style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statSubtitle}>{subtitle}</Text>
    </Surface>
  );

  const QuickActionCard: React.FC<{ action: QuickAction }> = ({ action }) => (
    <TouchableOpacity
      style={styles.quickActionCard}
      onPress={() => handleQuickAction(action)}
      activeOpacity={0.7}
    >
      <Surface style={styles.quickActionSurface}>
        <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
          <Ionicons name={action.icon} size={24} color="white" />
        </View>
        <View style={styles.quickActionContent}>
          <Text style={styles.quickActionTitle}>{action.title}</Text>
          <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.onSurfaceVariant} />
      </Surface>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Welcome to SkillMirror</Text>
        <Text style={styles.headerSubtitle}>
          Ready to enhance your skills with AI?
        </Text>
      </LinearGradient>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Analyses"
            value={stats.totalAnalyses.toString()}
            subtitle="Sessions completed"
            color={theme.colors.primary}
          />
          <StatCard
            title="Current Streak"
            value={`${stats.currentStreak} days`}
            subtitle="Keep it up!"
            color={theme.colors.tertiary}
          />
          <StatCard
            title="Average Score"
            value={`${Math.round(stats.averageScore * 100)}%`}
            subtitle="Overall performance"
            color={theme.colors.secondary}
          />
          <StatCard
            title="Skills in Progress"
            value={stats.skillsInProgress.toString()}
            subtitle="Active learning"
            color="#f59e0b"
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action) => (
            <QuickActionCard key={action.id} action={action} />
          ))}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Surface style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="videocam" size={16} color="white" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Public Speaking Analysis</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
            <View style={styles.activityScore}>
              <Text style={styles.activityScoreText}>85%</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: theme.colors.tertiary }]}>
              <Ionicons name="people" size={16} color="white" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Compared with MLK Jr.</Text>
              <Text style={styles.activityTime}>Yesterday</Text>
            </View>
            <View style={styles.activityScore}>
              <Text style={styles.activityScoreText}>72%</Text>
            </View>
          </View>

          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: theme.colors.secondary }]}>
              <Ionicons name="shuffle" size={16} color="white" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>Boxing → Public Speaking</Text>
              <Text style={styles.activityTime}>3 days ago</Text>
            </View>
            <View style={styles.activityScore}>
              <Text style={styles.activityScoreText}>90%</Text>
            </View>
          </View>
        </Surface>
      </View>

      {/* Session Info */}
      <View style={styles.section}>
        <Surface style={styles.sessionCard}>
          <Text style={styles.sessionTitle}>Current Session</Text>
          <Text style={styles.sessionInfo}>
            Duration: {Math.floor(SessionManager.getSessionDuration() / 60)} minutes
          </Text>
          <Text style={styles.sessionInfo}>
            Status: {SessionManager.isSessionActive() ? 'Active' : 'Inactive'}
          </Text>
        </Surface>
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
  header: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  headerTitle: {
    ...theme.typography.headingLarge,
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    ...theme.typography.bodyLarge,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.headingSmall,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    elevation: 2,
  },
  statTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    ...theme.typography.headingMedium,
    marginBottom: theme.spacing.xs,
  },
  statSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  quickActionsContainer: {
    gap: theme.spacing.sm,
  },
  quickActionCard: {
    marginBottom: theme.spacing.sm,
  },
  quickActionSurface: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  quickActionSubtitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
  },
  activityCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
  },
  activityTime: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
  },
  activityScore: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  activityScoreText: {
    ...theme.typography.labelMedium,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  sessionCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    elevation: 1,
  },
  sessionTitle: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.sm,
  },
  sessionInfo: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
});

export default HomeScreen;