export const colors = {
  // Primary - Deep Professional Blue
  primary: '#0F172A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#1E293B',
  onPrimaryContainer: '#E2E8F0',

  // Secondary - Professional Slate/Gray
  secondary: '#475569',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F1F5F9',
  onSecondaryContainer: '#1E293B',

  // Tertiary - Modern Brand Orange (Accent)
  tertiary: '#F97316',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFEDD5',
  onTertiaryContainer: '#9A3412',

  // Surfaces - Clean and Modern
  surface: '#F8FAFC',
  onSurface: '#0F172A',
  surfaceVariant: '#F1F5F9',
  onSurfaceVariant: '#64748B',
  
  // Containers
  surfaceContainerLow: '#FFFFFF',
  surfaceContainer: '#F8FAFC',
  surfaceContainerHigh: '#F1F5F9',
  surfaceContainerHighest: '#E2E8F0',
  
  // Accents & Outlines
  outline: '#CBD5E1',
  outlineVariant: '#E2E8F0',
  surfaceTint: '#334155',

  // Status
  error: '#EF4444',
  onError: '#FFFFFF',
  errorContainer: '#FEE2E2',
  onErrorContainer: '#991B1B',
  
  success: '#10B981',
  onSuccess: '#FFFFFF',
  successContainer: '#D1FAE5',
  onSuccessContainer: '#065F46',

  warning: '#F59E0B',
  onWarning: '#FFFFFF',
  warningContainer: '#FEF3C7',
  onWarningContainer: '#92400E',
} as const;

export type ColorKey = keyof typeof colors;
