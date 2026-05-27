import type React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import Text from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  style?: ViewStyle;
  textVariant?: 'labelMd' | 'labelSm' | 'titleSm';
}

export default function Button({
  children,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = false,
  style,
  textVariant = 'labelMd',
}: ButtonProps) {
  const getVariantStyles = (pressed: boolean, hovered: boolean) => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: pressed
            ? colors.primaryContainer
            : hovered
              ? colors.primaryContainer
              : colors.primary,
          color: colors.onPrimary,
          shadowColor: colors.primary,
        };
      case 'secondary':
        return {
          backgroundColor: pressed 
            ? colors.secondary 
            : hovered 
              ? colors.secondary 
              : colors.secondaryContainer,
          color: pressed || hovered ? colors.onSecondary : colors.onSecondaryContainer,
          shadowColor: colors.secondary,
        };
      case 'ghost':
        return {
          backgroundColor: pressed
            ? 'rgba(15, 23, 42, 0.08)'
            : hovered
              ? 'rgba(15, 23, 42, 0.04)'
              : 'transparent',
          color: colors.primary,
          shadowColor: 'transparent',
        };
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed, hovered }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        {
          backgroundColor: getVariantStyles(pressed, hovered).backgroundColor,
          opacity: disabled ? 0.5 : 1,
          transform: [{ translateY: pressed ? 1 : hovered ? -1 : 0 }, { scale: pressed ? 0.98 : 1 }],
          shadowOpacity: variant !== 'ghost' && !disabled ? (pressed ? 0.1 : hovered ? 0.25 : 0.15) : 0,
          shadowRadius: pressed ? 2 : hovered ? 12 : 6,
          shadowColor: getVariantStyles(pressed, hovered).shadowColor,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.primary : '#ffffff'} size="small" />
      ) : typeof children === 'string' ? (
        <Text
          variant={textVariant}
          weight="700"
          color={getVariantStyles(false, false).color}
          style={styles.text}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    textAlign: 'center',
  },
});
