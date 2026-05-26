export const colors = {
  primary: '#04162f',
  primaryContainer: '#1a2b45',
  onPrimaryContainer: '#8293b2',
  primaryFixed: '#d6e3ff',
  primaryFixedDim: '#b6c7e8',

  tertiary: '#2d0d00',
  tertiaryContainer: '#F37021',
  onTertiaryContainer: '#ed6c1c',
  tertiaryFixed: '#ffdbcb',
  tertiaryFixedDim: '#ffb693',

  surface: '#fbf9fb',
  surfaceBright: '#fbf9fb',
  surfaceContainer: '#efedf0',
  surfaceContainerHigh: '#e9e7ea',
  surfaceContainerHighest: '#e4e2e4',
  surfaceContainerLow: '#f5f3f5',
  surfaceContainerLowest: '#ffffff',
  surfaceDim: '#dbd9dc',
  surfaceTint: '#4e5f7c',
  surfaceVariant: '#e4e2e4',

  onSurface: '#1b1b1e',
  onSurfaceVariant: '#44474d',
  outline: '#75777e',
  outlineVariant: '#c5c6ce',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  secondary: '#5e5e5e',
  secondaryContainer: '#e1dfdf',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#626263',
} as const;

export type ColorKey = keyof typeof colors;
