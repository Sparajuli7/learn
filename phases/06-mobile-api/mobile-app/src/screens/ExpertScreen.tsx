/**
 * Expert Screen - SkillMirror Mobile App
 * Browse and compare with industry experts
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
  Image,
} from 'react-native';
import { Card, Surface, Button, Chip, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/theme';
import { APIService, Expert } from '../services/APIService';

interface ExpertWithImage extends Expert {
  image_url?: string;
}

const ExpertScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const [experts, setExperts] = useState<ExpertWithImage[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<ExpertWithImage[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const domains = ['All', 'Public Speaking', 'Business', 'Sports', 'Entertainment', 'Music', 'Leadership'];

  useEffect(() => {
    loadExperts();
    
    // Check if we have a specific skill type filter from route params
    if (route.params?.skillType) {
      setSelectedDomain(route.params.skillType);
    }
  }, [route.params]);

  useEffect(() => {
    filterExperts();
  }, [experts, selectedDomain, searchQuery]);

  const loadExperts = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, this would come from the API
      // For now, we'll use mock data with comprehensive expert profiles
      const mockExperts: ExpertWithImage[] = [
        {
          id: 1,
          name: 'Martin Luther King Jr.',
          domain: 'Public Speaking',
          specialty: 'Civil Rights Oratory',
          achievements: ['I Have a Dream Speech', 'Nobel Peace Prize', 'Civil Rights Leader'],
          bio: 'Iconic civil rights leader known for powerful and inspirational speeches that changed the world.',
          image_url: 'https://via.placeholder.com/150x150?text=MLK',
        },
        {
          id: 2,
          name: 'Barack Obama',
          domain: 'Public Speaking',
          specialty: 'Political Communication',
          achievements: ['44th US President', 'Nobel Peace Prize', 'Bestselling Author'],
          bio: 'Former President known for eloquent speeches and exceptional communication skills.',
          image_url: 'https://via.placeholder.com/150x150?text=Obama',
        },
        {
          id: 3,
          name: 'Steve Jobs',
          domain: 'Business',
          specialty: 'Product Presentations',
          achievements: ['Apple Co-founder', 'Revolutionary Presentations', 'Visionary Leader'],
          bio: 'Apple co-founder who revolutionized product presentations and business communication.',
          image_url: 'https://via.placeholder.com/150x150?text=Jobs',
        },
        {
          id: 4,
          name: 'Muhammad Ali',
          domain: 'Sports',
          specialty: 'Boxing & Motivation',
          achievements: ['3x World Heavyweight Champion', 'Olympic Gold Medal', 'Cultural Icon'],
          bio: 'Legendary boxer known for his confidence, charisma, and motivational speaking.',
          image_url: 'https://via.placeholder.com/150x150?text=Ali',
        },
        {
          id: 5,
          name: 'Oprah Winfrey',
          domain: 'Entertainment',
          specialty: 'Media & Communication',
          achievements: ['Media Mogul', 'Philanthropist', 'Influential Speaker'],
          bio: 'Media executive and talk show host known for powerful storytelling and emotional connection.',
          image_url: 'https://via.placeholder.com/150x150?text=Oprah',
        },
        {
          id: 6,
          name: 'Wolfgang Amadeus Mozart',
          domain: 'Music',
          specialty: 'Classical Composition',
          achievements: ['600+ Compositions', 'Child Prodigy', 'Musical Genius'],
          bio: 'Classical composer known for exceptional musical technique and emotional expression.',
          image_url: 'https://via.placeholder.com/150x150?text=Mozart',
        },
      ];

      setExperts(mockExperts);
    } catch (error) {
      console.error('Failed to load experts:', error);
      Alert.alert('Error', 'Failed to load expert data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterExperts = () => {
    let filtered = experts;

    // Filter by domain
    if (selectedDomain && selectedDomain !== 'All') {
      filtered = filtered.filter(expert => 
        expert.domain === selectedDomain || 
        expert.specialty.toLowerCase().includes(selectedDomain.toLowerCase())
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(expert =>
        expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expert.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expert.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredExperts(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExperts();
    setRefreshing(false);
  };

  const handleExpertSelect = (expert: ExpertWithImage) => {
    Alert.alert(
      'Compare with Expert',
      `Would you like to compare your performance with ${expert.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Profile',
          onPress: () => showExpertProfile(expert),
        },
        {
          text: 'Compare Now',
          onPress: () => initiateComparison(expert),
        },
      ]
    );
  };

  const showExpertProfile = (expert: ExpertWithImage) => {
    Alert.alert(
      expert.name,
      `Domain: ${expert.domain}\nSpecialty: ${expert.specialty}\n\n${expert.bio}\n\nAchievements:\n${expert.achievements.join('\n• ')}`,
      [{ text: 'Close' }]
    );
  };

  const initiateComparison = async (expert: ExpertWithImage) => {
    try {
      // In a real app, we'd need a user analysis to compare
      // For now, we'll show a message about needing an analysis
      Alert.alert(
        'Comparison Required',
        'You need a recent analysis to compare with this expert. Would you like to record a new session?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Record Now',
            onPress: () => navigation.navigate('Record'),
          },
        ]
      );
    } catch (error) {
      console.error('Comparison failed:', error);
      Alert.alert('Error', 'Failed to start comparison');
    }
  };

  const ExpertCard: React.FC<{ expert: ExpertWithImage }> = ({ expert }) => (
    <TouchableOpacity
      style={styles.expertCard}
      onPress={() => handleExpertSelect(expert)}
      activeOpacity={0.7}
    >
      <Surface style={styles.expertCardSurface}>
        <View style={styles.expertHeader}>
          <View style={styles.expertImageContainer}>
            {expert.image_url ? (
              <Image source={{ uri: expert.image_url }} style={styles.expertImage} />
            ) : (
              <View style={styles.expertImagePlaceholder}>
                <Ionicons name="person" size={40} color={theme.colors.onSurfaceVariant} />
              </View>
            )}
          </View>
          <View style={styles.expertInfo}>
            <Text style={styles.expertName}>{expert.name}</Text>
            <Text style={styles.expertDomain}>{expert.domain}</Text>
            <Chip mode="outlined" compact style={styles.specialtyChip}>
              {expert.specialty}
            </Chip>
          </View>
        </View>
        
        <Text style={styles.expertBio} numberOfLines={2}>
          {expert.bio}
        </Text>
        
        <View style={styles.achievementsContainer}>
          <Text style={styles.achievementsTitle}>Key Achievements:</Text>
          {expert.achievements.slice(0, 2).map((achievement, index) => (
            <View key={index} style={styles.achievementItem}>
              <Ionicons name="trophy" size={12} color={theme.colors.tertiary} />
              <Text style={styles.achievementText}>{achievement}</Text>
            </View>
          ))}
          {expert.achievements.length > 2 && (
            <Text style={styles.moreAchievements}>
              +{expert.achievements.length - 2} more
            </Text>
          )}
        </View>

        <View style={styles.expertActions}>
          <Button
            mode="outlined"
            compact
            onPress={() => showExpertProfile(expert)}
            style={styles.profileButton}
          >
            View Profile
          </Button>
          <Button
            mode="contained"
            compact
            onPress={() => initiateComparison(expert)}
            style={styles.compareButton}
          >
            Compare
          </Button>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const DomainChip: React.FC<{ domain: string }> = ({ domain }) => (
    <Chip
      mode={selectedDomain === domain ? 'flat' : 'outlined'}
      selected={selectedDomain === domain}
      onPress={() => setSelectedDomain(domain === 'All' ? null : domain)}
      style={styles.domainChip}
    >
      {domain}
    </Chip>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading experts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search experts..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      {/* Domain Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter by Domain:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.domainFilter}
        >
          {domains.map((domain) => (
            <DomainChip key={domain} domain={domain} />
          ))}
        </ScrollView>
      </View>

      {/* Experts List */}
      <ScrollView
        style={styles.expertsContainer}
        contentContainerStyle={styles.expertsContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredExperts.length > 0 ? (
          filteredExperts.map((expert) => (
            <ExpertCard key={expert.id} expert={expert} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.emptyStateTitle}>No Experts Found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or filter criteria
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  searchContainer: {
    padding: theme.spacing.md,
  },
  searchBar: {
    elevation: 1,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  filterTitle: {
    ...theme.typography.labelLarge,
    color: theme.colors.onBackground,
    marginBottom: theme.spacing.sm,
  },
  domainFilter: {
    paddingRight: theme.spacing.md,
  },
  domainChip: {
    marginRight: theme.spacing.sm,
  },
  expertsContainer: {
    flex: 1,
  },
  expertsContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  expertCard: {
    marginBottom: theme.spacing.md,
  },
  expertCardSurface: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    elevation: 2,
  },
  expertHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  expertImageContainer: {
    marginRight: theme.spacing.md,
  },
  expertImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  expertImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    ...theme.typography.headingSmall,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  expertDomain: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  specialtyChip: {
    alignSelf: 'flex-start',
  },
  expertBio: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  achievementsContainer: {
    marginBottom: theme.spacing.md,
  },
  achievementsTitle: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  achievementText: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginLeft: theme.spacing.xs,
    flex: 1,
  },
  moreAchievements: {
    ...theme.typography.bodySmall,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  expertActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  compareButton: {
    flex: 1,
    marginLeft: theme.spacing.sm,
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
  },
});

export default ExpertScreen;