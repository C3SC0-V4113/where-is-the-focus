export type FocusLanguage = 'css' | 'tw';

const STORAGE_KEY = 'foco-lang';
const CHANGE_EVENT = 'foco-lang-change';
let currentLanguage: FocusLanguage | null = null;

function isFocusLanguage(value: string | null): value is FocusLanguage {
  return value === 'css' || value === 'tw';
}

function readStoredLanguage(): FocusLanguage {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isFocusLanguage(value) ? value : 'css';
  } catch {
    return 'css';
  }
}

export function getFocusLanguage(): FocusLanguage {
  currentLanguage ??= typeof window === 'undefined' ? 'css' : readStoredLanguage();
  return currentLanguage;
}

export function getServerFocusLanguage(): FocusLanguage {
  return 'css';
}

export function subscribeToFocusLanguage(onChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    currentLanguage = isFocusLanguage(event.newValue) ? event.newValue : 'css';
    onChange();
  };

  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', handleStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', handleStorage);
  };
}

export function setFocusLanguage(language: FocusLanguage): void {
  currentLanguage = language;
  try {
    window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage can be unavailable; the in-memory preference still works.
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}
