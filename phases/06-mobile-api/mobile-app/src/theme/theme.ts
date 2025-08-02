/**
 * SkillMirror Mobile App Theme
 * Consistent design system for the mobile application
 */

import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2563eb',
    primaryContainer: '#dbeafe',
    secondary: '#7c3aed',
    secondaryContainer: '#ede9fe',
    tertiary: '#059669',
    tertiaryContainer: '#d1fae5',
    surface: '#ffffff',
    surfaceVariant: '#f8fafc',
    background: '#f8fafc',
    error: '#dc2626',
    errorContainer: '#fecaca',
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#1e293b',
    onSurfaceVariant: '#64748b',
    onBackground: '#1e293b',
    outline: '#cbd5e1',
    shadow: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  typography: {
    headingLarge: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      lineHeight: 40,
    },
    headingMedium: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      lineHeight: 32,
    },
    headingSmall: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      lineHeight: 24,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: 'normal' as const,
      lineHeight: 20,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: 'normal' as const,
      lineHeight: 16,
    },
    labelLarge: {
      fontSize: 14,
      fontWeight: '500' as const,
      lineHeight: 20,
    },
    labelMedium: {
      fontSize: 12,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
    labelSmall: {
      fontSize: 11,
      fontWeight: '500' as const,
      lineHeight: 16,
    },
  },
  elevation: {
    level0: 0,
    level1: 1,
    level2: 3,
    level3: 6,
    level4: 8,
    level5: 12,
  },
};