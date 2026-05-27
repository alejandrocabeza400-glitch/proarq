export interface TypographyLevel {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  lineHeight: number | string;
  letterSpacing?: number;
}

const systemFontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

export const typography: Record<string, TypographyLevel> = {
  displayLg: {
    fontFamily: systemFontStack,
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
    letterSpacing: -0.02,
  },
  displaySm: {
    fontFamily: systemFontStack,
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 40,
    letterSpacing: -0.04,
  },
  headlineLg: { fontFamily: systemFontStack, fontSize: 30, fontWeight: '700', lineHeight: 38 },
  headlineSm: { fontFamily: systemFontStack, fontSize: 24, fontWeight: '800', lineHeight: 32 },
  titleMd: { fontFamily: systemFontStack, fontSize: 18, fontWeight: '700', lineHeight: 26 },
  titleSm: { fontFamily: systemFontStack, fontSize: 16, fontWeight: '700', lineHeight: 24 },
  bodyMd: { fontFamily: systemFontStack, fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySm: { fontFamily: systemFontStack, fontSize: 14, fontWeight: '400', lineHeight: 22 },
  labelMd: { fontFamily: systemFontStack, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  labelSm: {
    fontFamily: systemFontStack,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
    letterSpacing: 0.05,
  },
};
