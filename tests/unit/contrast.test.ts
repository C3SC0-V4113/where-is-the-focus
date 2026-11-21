import { describe, expect, it } from 'vitest';

import { contrastRatio, relativeLuminance } from '@/lib/focus/contrast';

describe('focus contrast', () => {
  it('calculates white luminance', () => {
    expect(relativeLuminance('#ffffff')).toBe(1);
  });

  it('calculates the exact Lab 2 blue on light ratio', () => {
    expect(contrastRatio('#1d2fd8', '#eef0fb')).toBeCloseTo(7.5466479766, 8);
  });

  it('returns the WCAG maximum for black and white', () => {
    expect(contrastRatio('#000', '#fff')).toBe(21);
  });
});
