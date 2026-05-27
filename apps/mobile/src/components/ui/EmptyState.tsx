import type React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme/colors';
import Button from './Button';
import Text from './Text';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = '🔎',
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>

        <View style={styles.textContainer}>
          <Text variant="titleMd" align="center" color={colors.primary} style={styles.title}>
            {title}
          </Text>

          {description && (
            <Text
              variant="bodySm"
              align="center"
              color={colors.onSurfaceVariant}
              style={styles.description}
            >
              {description}
            </Text>
          )}
        </View>

        {actionLabel && (
          <Button onPress={onAction} style={styles.button} textVariant="labelSm">
            {actionLabel}
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 320,
    width: '100%',
    gap: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  iconText: {
    fontSize: 32,
  },
  textContainer: {
    padding: 50,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    lineHeight: 24,
  },
  description: {
    lineHeight: 20,
    opacity: 0.8,
  },
  button: {
    marginTop: 12,
    minWidth: 160,
  },
});
