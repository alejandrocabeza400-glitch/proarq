export interface TypographyLevel {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  lineHeight: number | string;
  letterSpacing?: number;
}

export const typography: Record<string, TypographyLevel> = {
  displayLg: {
    fontFamily: 'Inter',
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 1.1,
    letterSpacing: -0.02,
  },
  displaySm: {
    fontFamily: 'Inter',
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 1.2,
    letterSpacing: -0.02,
  },
  headlineLg: { fontFamily: 'Inter', fontSize: 30, fontWeight: '700', lineHeight: 1.3 },
  headlineSm: { fontFamily: 'Inter', fontSize: 24, fontWeight: '700', lineHeight: 1.3 },
  titleMd: { fontFamily: 'Inter', fontSize: 18, fontWeight: '600', lineHeight: 1.4 },
  titleSm: { fontFamily: 'Inter', fontSize: 16, fontWeight: '600', lineHeight: 1.4 },
  bodyMd: { fontFamily: 'Inter', fontSize: 16, fontWeight: '400', lineHeight: 1.6 },
  bodySm: { fontFamily: 'Inter', fontSize: 14, fontWeight: '400', lineHeight: 1.5 },
  labelMd: { fontFamily: 'Inter', fontSize: 14, fontWeight: '500', lineHeight: 1.4 },
  labelSm: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 1.4,
    letterSpacing: 0.05,
  },
};
