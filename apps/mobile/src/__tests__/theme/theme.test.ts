import { describe, expect, it } from 'bun:test';

describe('Theme Design Tokens', () => {
  describe('Colors', () => {
    it('should export all required color tokens', async () => {
      const { colors } = await import('../../theme/colors');
      const requiredTokens = [
        'primary',
        'primaryContainer',
        'onPrimaryContainer',
        'primaryFixed',
        'primaryFixedDim',
        'tertiary',
        'tertiaryContainer',
        'onTertiaryContainer',
        'tertiaryFixed',
        'tertiaryFixedDim',
        'surface',
        'surfaceBright',
        'surfaceContainer',
        'surfaceContainerHigh',
        'surfaceContainerHighest',
        'surfaceContainerLow',
        'surfaceContainerLowest',
        'surfaceDim',
        'surfaceTint',
        'surfaceVariant',
        'onSurface',
        'onSurfaceVariant',
        'outline',
        'outlineVariant',
        'error',
        'errorContainer',
        'onError',
        'onErrorContainer',
        'secondary',
        'secondaryContainer',
        'onSecondary',
        'onSecondaryContainer',
      ];

      for (const token of requiredTokens) {
        expect(colors).toHaveProperty(token);
        expect(typeof colors[token as keyof typeof colors]).toBe('string');
      }
    });

    it('should define Navy Blue (#1A2B45) as primaryContainer', async () => {
      const { colors } = await import('../../theme/colors');
      expect(colors.primaryContainer?.toLowerCase()).toBe('#1a2b45');
    });

    it('should define Construction Orange (#F37021) as tertiaryContainer', async () => {
      const { colors } = await import('../../theme/colors');
      expect(colors.tertiaryContainer?.toLowerCase()).toBe('#f37021');
    });

    it('should define error color (#ba1a1a)', async () => {
      const { colors } = await import('../../theme/colors');
      expect(colors.error?.toLowerCase()).toBe('#ba1a1a');
    });

    it('should define surface color (#fbf9fb)', async () => {
      const { colors } = await import('../../theme/colors');
      expect(colors.surface?.toLowerCase()).toBe('#fbf9fb');
    });
  });

  describe('Typography', () => {
    it('should export all typography levels', async () => {
      const { typography } = await import('../../theme/typography');
      const levels = [
        'displayLg',
        'displaySm',
        'headlineLg',
        'headlineSm',
        'titleMd',
        'titleSm',
        'bodyMd',
        'bodySm',
        'labelMd',
        'labelSm',
      ];

      for (const level of levels) {
        expect(typography).toHaveProperty(level);
      }
    });

    it('should use Inter font family for all levels', async () => {
      const { typography } = await import('../../theme/typography');
      for (const key of Object.keys(typography)) {
        const level = typography[key as keyof typeof typography];
        expect(level.fontFamily).toBe('Inter');
      }
    });

    it('should have fontSize values for each level', async () => {
      const { typography } = await import('../../theme/typography');
      const sizes = {
        displayLg: 48,
        displaySm: 36,
        headlineLg: 30,
        headlineSm: 24,
        titleMd: 18,
        titleSm: 16,
        bodyMd: 16,
        bodySm: 14,
        labelMd: 14,
        labelSm: 12,
      };

      for (const [level, size] of Object.entries(sizes)) {
        expect(typography[level as keyof typeof typography].fontSize).toBe(size);
      }
    });

    it('should have fontWeight for each level', async () => {
      const { typography } = await import('../../theme/typography');
      for (const key of Object.keys(typography)) {
        const level = typography[key as keyof typeof typography];
        expect(level.fontWeight).toBeDefined();
      }
    });

    it('should have lineHeight for each level', async () => {
      const { typography } = await import('../../theme/typography');
      for (const key of Object.keys(typography)) {
        const level = typography[key as keyof typeof typography];
        expect(level.lineHeight).toBeDefined();
      }
    });
  });

  describe('Spacing', () => {
    it('should export spacing scale', async () => {
      const { spacing } = await import('../../theme/spacing');
      expect(spacing).toBeDefined();

      const required = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      for (const key of required) {
        expect(spacing).toHaveProperty(key);
      }
    });

    it('should have numeric values for each spacing key', async () => {
      const { spacing } = await import('../../theme/spacing');
      for (const key of Object.keys(spacing)) {
        const value = spacing[key as keyof typeof spacing];
        expect(typeof value === 'number' || typeof value === 'string').toBe(true);
      }
    });
  });

  describe('Shadows', () => {
    it('should export shadow presets', async () => {
      const { shadows } = await import('../../theme/shadows');
      expect(shadows).toBeDefined();

      const required = ['sm', 'md', 'lg'];
      for (const key of required) {
        expect(shadows).toHaveProperty(key);
      }
    });

    it('should not use pure black in shadow colors', async () => {
      const { shadows } = await import('../../theme/shadows');
      for (const key of Object.keys(shadows)) {
        const shadow = shadows[key as keyof typeof shadows] as Record<string, any>;
        if (shadow.shadowColor) {
          expect(shadow.shadowColor).not.toBe('#000000');
        }
      }
    });
  });

  describe('Theme Index', () => {
    it('should re-export all theme tokens from index', async () => {
      const theme = await import('../../theme/index');
      expect(theme).toHaveProperty('colors');
      expect(theme).toHaveProperty('typography');
      expect(theme).toHaveProperty('spacing');
      expect(theme).toHaveProperty('shadows');
    });
  });
});
