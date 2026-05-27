import type React from 'react';
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import Text from './Text';

interface LoadingStateProps {
  message?: string;
  variant?: 'skeleton' | 'spinner';
  fullPage?: boolean;
}

export default function LoadingState({
  message,
  variant = 'skeleton',
  fullPage = false,
}: LoadingStateProps) {
  if (variant === 'spinner') {
    return (
      <View style={[styles.container, fullPage && styles.fullPage]}>
        <ActivityIndicator size="large" color={colors.primary} />
        {message && (
          <Text variant="bodySm" color={colors.onSurfaceVariant} style={styles.message}>
            {message}
          </Text>
        )}
      </View>
    );
  }

  // Basic skeleton implementation using a pulsed View
  return (
    <View style={[styles.container, fullPage && styles.fullPage]}>
      <View style={styles.skeleton} />
      {message && (
        <Text variant="bodySm" color={colors.onSurfaceVariant} style={styles.message}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  fullPage: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: colors.surface,
  },
  skeleton: {
    width: '100%',
    height: 80,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 8,
    // Note: React Native doesn't support CSS keyframes for pulse directly, 
    // would need Animated API for true pulse effect. Keeping it simple for now.
    opacity: 0.6,
  },
  message: {
    marginTop: 8,
  },
});
