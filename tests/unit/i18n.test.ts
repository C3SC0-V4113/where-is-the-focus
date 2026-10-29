import { describe, expect, it } from 'vitest';

import { en, es } from '../../src/i18n/messages';

describe('localized messages', () => {
  it('uses the same keys in Spanish and English', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });
});
