import { expect, test, type Page } from '@playwright/test';

type StoredTheme = 'light' | 'dark' | null;
type ThemeFrame = {
  isDark: boolean;
  bodyBackground: string | null;
  tokenBackground: string | null;
};

const locales = [
  {
    route: '/',
    label: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    finalLanguageLink: 'EN (English)',
  },
  {
    route: '/en/',
    label: 'Theme',
    light: 'Light',
    dark: 'Dark',
    finalLanguageLink: 'EN (English)',
  },
] as const;

async function watchHydrationErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && /hydration/i.test(message.text()))
    ) {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function expectBodyBackgroundToMatchToken(page: Page) {
  const colors = await page.locator('body').evaluate((body) => {
    const tokenProbe = document.createElement('div');
    tokenProbe.style.backgroundColor = 'var(--background)';
    document.body.append(tokenProbe);
    const tokenBackground = getComputedStyle(tokenProbe).backgroundColor;
    const bodyBackground = getComputedStyle(body).backgroundColor;
    tokenProbe.remove();
    return { bodyBackground, tokenBackground };
  });

  expect(colors.bodyBackground).toBe(colors.tokenBackground);
}

async function getFirstFrameTheme(page: Page) {
  return page.evaluate(async () => {
    const win = window as Window & { __themeFirstFrame?: Promise<ThemeFrame> };
    if (!win.__themeFirstFrame) {
      throw new Error('The initial theme frame was not recorded.');
    }
    return win.__themeFirstFrame;
  });
}

const firstFrameCases = [
  { storedTheme: 'dark', systemTheme: 'light', expectedDark: true },
  { storedTheme: 'light', systemTheme: 'dark', expectedDark: false },
  { storedTheme: null, systemTheme: 'dark', expectedDark: true },
  { storedTheme: null, systemTheme: 'light', expectedDark: false },
] as const;

for (const scenario of firstFrameCases) {
  test(`applies ${scenario.storedTheme ?? 'system'} theme before the first frame with ${scenario.systemTheme} preference`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: scenario.systemTheme });
    await page.addInitScript((storedTheme: StoredTheme) => {
      if (storedTheme === null) {
        localStorage.removeItem('foco-theme');
      } else {
        localStorage.setItem('foco-theme', storedTheme);
      }

      const win = window as Window & { __themeFirstFrame?: Promise<ThemeFrame> };
      win.__themeFirstFrame = new Promise((resolve) => {
        requestAnimationFrame(() => {
          const body = document.body;
          if (!body) {
            resolve({
              isDark: document.documentElement.classList.contains('dark'),
              bodyBackground: null,
              tokenBackground: null,
            });
            return;
          }

          const tokenProbe = document.createElement('div');
          tokenProbe.style.backgroundColor = 'var(--background)';
          body.append(tokenProbe);
          const tokenBackground = getComputedStyle(tokenProbe).backgroundColor;
          const bodyBackground = getComputedStyle(body).backgroundColor;
          tokenProbe.remove();
          resolve({
            isDark: document.documentElement.classList.contains('dark'),
            bodyBackground,
            tokenBackground,
          });
        });
      });
    }, scenario.storedTheme);
    await page.route('**/_astro/*.js', (route) => route.abort());

    await page.goto('/');
    const firstFrame = await getFirstFrameTheme(page);

    expect(firstFrame.isDark).toBe(scenario.expectedDark);
    expect(firstFrame.bodyBackground).toBe(firstFrame.tokenBackground);
  });
}

for (const locale of locales) {
  test(`theme toggle persists choices at ${locale.route}`, async ({ page }) => {
    const errors = await watchHydrationErrors(page);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(locale.route);

    const group = page.getByRole('group', { name: locale.label });
    const light = page.getByRole('button', { name: locale.light });
    const dark = page.getByRole('button', { name: locale.dark });

    await expect(group).toBeVisible();
    await expect(light).toHaveAttribute('aria-pressed', 'true');
    await expect(dark).toHaveAttribute('aria-pressed', 'false');

    await dark.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(dark).toHaveAttribute('aria-pressed', 'true');
    await expect(light).toHaveAttribute('aria-pressed', 'false');
    await expectBodyBackgroundToMatchToken(page);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('foco-theme'))).toBe('dark');

    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByRole('button', { name: locale.dark })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expectBodyBackgroundToMatchToken(page);

    await page.getByRole('button', { name: locale.light }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(page.getByRole('button', { name: locale.light })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expectBodyBackgroundToMatchToken(page);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('foco-theme'))).toBe('light');

    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(page.getByRole('button', { name: locale.light })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(errors).toEqual([]);
  });

  test(`theme toggle supports keyboard navigation at ${locale.route}`, async ({ page }) => {
    const errors = await watchHydrationErrors(page);
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(locale.route);

    const languageLink = page.getByRole('link', { name: locale.finalLanguageLink });
    const light = page.getByRole('button', { name: locale.light });
    const dark = page.getByRole('button', { name: locale.dark });
    await languageLink.focus();
    await page.keyboard.press('Tab');
    await expect(light).toBeFocused();

    await page.keyboard.press('ArrowRight');
    await expect(dark).toBeFocused();
    await page.keyboard.press('Space');
    await expect(dark).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.keyboard.press('ArrowLeft');
    await expect(light).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(light).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    expect(errors).toEqual([]);
  });
}
