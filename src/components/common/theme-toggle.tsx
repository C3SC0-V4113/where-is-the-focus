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
      className="rounded-md border border-border bg-muted p-0.5"
    >
      <ToggleGroupItem
        value="light"
        className="min-h-7 min-w-7 gap-1.5 rounded-sm border border-transparent px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-background aria-pressed:border-2 aria-pressed:border-border aria-pressed:bg-background aria-pressed:text-foreground"
      >
        <Sun aria-hidden="true" className="size-3.5" />
        <span className="sr-only sm:not-sr-only">{light}</span>
      </ToggleGroupItem>
      <ToggleGroupItem
        value="dark"
        className="min-h-7 min-w-7 gap-1.5 rounded-sm border border-transparent px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-background aria-pressed:border-2 aria-pressed:border-border aria-pressed:bg-background aria-pressed:text-foreground"
      >
        <Moon aria-hidden="true" className="size-3.5" />
        <span className="sr-only sm:not-sr-only">{dark}</span>
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
