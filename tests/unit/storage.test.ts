import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getStoredTheme, setStoredTheme, type Theme } from '../../src/lib/storage';

describe('theme storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['light', 'dark'] as const)('reads the saved %s theme', (theme) => {
    localStorage.setItem('foco-theme', theme);

    expect(getStoredTheme()).toBe(theme);
  });

  it('writes a valid theme to foco-theme', () => {
    setStoredTheme('dark');

    expect(localStorage.getItem('foco-theme')).toBe('dark');
  });

  it('ignores an invalid stored theme', () => {
    localStorage.setItem('foco-theme', 'system');

    expect(getStoredTheme()).toBeNull();
  });

  it('does not save an invalid theme', () => {
    setStoredTheme('system' as Theme);

    expect(localStorage.getItem('foco-theme')).toBeNull();
  });

  it('does not throw when reading storage fails', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage is unavailable.');
    });

    expect(() => getStoredTheme()).not.toThrow();
    expect(getStoredTheme()).toBeNull();
  });

  it('does not throw when writing storage fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage is unavailable.');
    });

    expect(() => setStoredTheme('dark')).not.toThrow();
  });
});
