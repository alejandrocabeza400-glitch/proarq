import type React from 'react';
import { Text as RNText, type TextProps as RNTextProps, StyleSheet, type TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, type TypographyLevel } from '../../theme/typography';

interface TextProps extends RNTextProps {
  variant?: keyof typeof typography;
  color?: string;
  align?: TextStyle['textAlign'];
  weight?: TextStyle['fontWeight'];
  children?: React.ReactNode;
}

const systemFontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

export default function Text({
  variant = 'bodyMd',
  color = colors.onSurface,
  align,
  weight,
  style,
  children,
  ...props
}: TextProps) {
  const typographyStyle = typography[variant] as TypographyLevel;

  const combinedStyle: TextStyle = {
    fontFamily: systemFontStack,
    fontSize: typographyStyle.fontSize,
    fontWeight: (weight || typographyStyle.fontWeight) as TextStyle['fontWeight'],
    lineHeight: typeof typographyStyle.lineHeight === 'number' ? typographyStyle.lineHeight : undefined,
    letterSpacing: typographyStyle.letterSpacing,
    color: color,
    textAlign: align,
  };

  return (
    <RNText style={[combinedStyle, style]} {...props}>
      {children}
    </RNText>
  );
}
