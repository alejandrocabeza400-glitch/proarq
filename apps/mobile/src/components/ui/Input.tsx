import type React from 'react';
import { useState } from 'react';
import { StyleSheet, TextInput, View, type ViewStyle, type TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import Text from './Text';

interface InputProps {
  placeholder?: string;
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  maxLength?: number;
  'aria-label'?: string;
  editable?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function Input({
  placeholder,
  label,
  value,
  onChangeText,
  error,
  secureTextEntry,
  keyboardType = 'default',
  maxLength,
  editable = true,
  disabled,
  style,
  ...rest
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const isEditable = editable && !disabled;

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text variant="labelMd" style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        maxLength={maxLength}
        editable={isEditable}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          error ? styles.inputError : null,
          isFocused ? styles.inputFocused : null,
          !isEditable ? styles.inputDisabled : null,
        ]}
        aria-label={rest['aria-label']}
      />
      {error && (
        <Text variant="labelSm" color={colors.error} style={styles.errorText}>
          {error}
        </Text>
      )}
      {maxLength && (
        <Text
          variant="labelSm"
          align="right"
          color={colors.onSurfaceVariant}
          style={styles.maxLengthText}
        >
          {value?.length || 0}/{maxLength}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    marginBottom: 16,
    width: '100%',
  },
  label: {
    color: colors.onSurface,
    marginBottom: 6,
  },
  input: {
    fontFamily: 'Inter',
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: colors.onSurface,
    width: '100%',
  },
  inputFocused: {
    borderColor: colors.surfaceTint,
    // Note: RN shadows for focus are limited, on Web we can use shadowColor/Opacity
    shadowColor: colors.surfaceTint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  inputDisabled: {
    backgroundColor: colors.surfaceContainerLow,
    opacity: 0.75,
  },
  errorText: {
    marginTop: 2,
  },
  maxLengthText: {
    marginTop: 2,
  },
});
