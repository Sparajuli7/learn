/**
 * SkillMirror Mobile App
 * AI-powered skill development on mobile devices
 */

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import RecordScreen from './src/screens/RecordScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import ExpertScreen from './src/screens/ExpertScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SkillTransferScreen from './src/screens/SkillTransferScreen';
import RealTimeFeedbackScreen from './src/screens/RealTimeFeedbackScreen';

// Import services
import { APIService } from './src/services/APIService';
import { SessionManager } from './src/services/SessionManager';

// Import theme
import { theme } from './src/theme/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main tab navigation
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Record') {
            iconName = focused ? 'videocam' : 'videocam-outline';
          } else if (route.name === 'Analysis') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Experts') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName!} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'SkillMirror' }}
      />
      <Tab.Screen 
        name="Record" 
        component={RecordScreen} 
        options={{ title: 'Record' }}
      />
      <Tab.Screen 
        name="Analysis" 
        component={AnalysisScreen} 
        options={{ title: 'Analysis' }}
      />
      <Tab.Screen 
        name="Experts" 
        component={ExpertScreen} 
        options={{ title: 'Experts' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Main app component
export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize API service
      await APIService.initialize();
      
      // Start mobile session
      await SessionManager.startSession({
        device_info: {
          platform: 'mobile',
          os: 'ios', // or android
          app_version: '1.0.0'
        },
        network_type: 'wifi',
        battery_level: 100
      });

      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize app:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing SkillMirror...</Text>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="MainTabs"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SkillTransfer"
            component={SkillTransferScreen}
            options={{
              title: 'Skill Transfer',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="RealTimeFeedback"
            component={RealTimeFeedbackScreen}
            options={{
              title: 'Real-Time Feedback',
              headerStyle: { backgroundColor: theme.colors.primary },
              headerTintColor: '#fff',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="light" />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
});