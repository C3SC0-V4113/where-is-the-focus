import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getStoredTheme, setStoredTheme, type Theme } from '@/lib/storage';

interface Props {
  label: string;
  light: string;
  dark: string;
}

const themeChangeEvent = 'foco-theme-change';

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(themeChangeEvent, onChange);
  return () => window.removeEventListener(themeChangeEvent, onChange);
}

function getThemeSnapshot(): Theme {
  return (
    getStoredTheme() ?? (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  );
}

function getServerThemeSnapshot(): Theme {
  return 'light';
}

function isTheme(value: string | undefined): value is Theme {
  return value === 'light' || value === 'dark';
}

export function ThemeToggle({ label, light, dark }: Props) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  function handleValueChange(groupValue: string[]) {
    const selectedTheme = groupValue[0];
    if (!isTheme(selectedTheme)) {
      return;
    }

    document.documentElement.classList.toggle('dark', selectedTheme === 'dark');
    setStoredTheme(selectedTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <ToggleGroup
      aria-label={label}
      multiple={false}
      value={[theme]}
      onValueChange={handleValueChange}
    >
      <ToggleGroupItem value="light">
        <Sun aria-hidden="true" className="size-4" />
        {light}
      </ToggleGroupItem>
      <ToggleGroupItem value="dark">
        <Moon aria-hidden="true" className="size-4" />
        {dark}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
