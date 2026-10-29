import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeToggle } from '../../src/components/common/theme-toggle';

const labels = { label: 'Tema', light: 'Claro', dark: 'Oscuro' };
const unmounts: (() => void)[] = [];

function isFocused(element: HTMLElement) {
  return element.matches(':focus');
}

function renderThemeToggle() {
  const view = render(<ThemeToggle {...labels} />);
  unmounts.push(view.unmount);
  const queries = within(view.container);

  return {
    group: queries.getByRole('group', { name: labels.label }),
    light: queries.getByRole('button', { name: labels.light }),
    dark: queries.getByRole('button', { name: labels.dark }),
  };
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    unmounts.splice(0).forEach((unmount) => unmount());
    vi.restoreAllMocks();
  });

  it('changes theme with clicks, persists it, and keeps one selection', async () => {
    const user = userEvent.setup();
    const { group, light, dark } = renderThemeToggle();

    expect(group.isConnected).toBe(true);
    expect(light.getAttribute('aria-pressed')).toBe('true');
    expect(dark.getAttribute('aria-pressed')).toBe('false');

    await user.click(dark);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(dark.getAttribute('aria-pressed')).toBe('true');
    expect(light.getAttribute('aria-pressed')).toBe('false');
    expect(localStorage.getItem('foco-theme')).toBe('dark');

    await user.click(dark);
    expect(dark.getAttribute('aria-pressed')).toBe('true');

    await user.click(light);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(light.getAttribute('aria-pressed')).toBe('true');
    expect(dark.getAttribute('aria-pressed')).toBe('false');
    expect(localStorage.getItem('foco-theme')).toBe('light');
  });

  it('uses one Tab stop and supports arrow, Space, and Enter selection', async () => {
    const user = userEvent.setup();
    const { light, dark } = renderThemeToggle();

    await user.tab();
    expect(isFocused(light)).toBe(true);
    await user.tab();
    expect(isFocused(light)).toBe(false);
    expect(isFocused(dark)).toBe(false);

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(isFocused(light)).toBe(true);
    await user.keyboard('{ArrowRight}');
    expect(isFocused(dark)).toBe(true);
    expect(dark.getAttribute('aria-pressed')).toBe('false');

    await user.keyboard(' ');
    expect(dark.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.keyboard('{ArrowLeft}');
    expect(isFocused(light)).toBe(true);
    await user.keyboard('{Enter}');
    expect(light.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('reflects dark when the inline script already applied it', () => {
    document.documentElement.classList.add('dark');
    const { light, dark } = renderThemeToggle();

    expect(light.getAttribute('aria-pressed')).toBe('false');
    expect(dark.getAttribute('aria-pressed')).toBe('true');
  });
});
