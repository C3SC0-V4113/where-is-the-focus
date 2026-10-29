export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'foco-theme';

function isTheme(value: string | null): value is Theme {
  return value === 'light' || value === 'dark';
}

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined' || !isTheme(theme)) {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be disabled or unavailable.
  }
}
