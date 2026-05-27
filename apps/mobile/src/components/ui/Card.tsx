import type React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Card({ children, onPress, disabled, style }: CardProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed, hovered }) => [
        styles.card,
        {
          opacity: disabled ? 0.5 : 1,
          transform: [{ translateY: onPress && !disabled && (pressed ? 1 : hovered ? -2 : 0) }],
          backgroundColor: '#ffffff',
          shadowOpacity: onPress && !disabled && (pressed ? 0.04 : hovered ? 0.12 : 0.06),
          shadowRadius: onPress && !disabled && (pressed ? 4 : hovered ? 16 : 8),
          borderColor: hovered && onPress && !disabled ? colors.outline : 'rgba(226, 232, 240, 0.6)',
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    // Shadow properties for cross-platform
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
});
