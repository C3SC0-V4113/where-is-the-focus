import { expect, test, type Locator, type Page } from '@playwright/test';

const locales = [
  {
    route: '/',
    skipLink: 'Saltar al contenido',
    languageNames: ['ES (Español)', 'EN (English)'],
    themeGroup: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
  },
  {
    route: '/en/',
    skipLink: 'Skip to content',
    languageNames: ['ES (Español)', 'EN (English)'],
    themeGroup: 'Theme',
    light: 'Light',
    dark: 'Dark',
  },
] as const;

type Theme = 'light' | 'dark';

async function focusFirstThemeItemWithKeyboard(
  page: Page,
  locale: (typeof locales)[number],
  selectedTheme: Theme
) {
  const skipLink = page.getByRole('link', { name: locale.skipLink });
  const brand = page.locator('header').locator(':scope > a');
  const languageLinks = locale.languageNames.map((name) => page.getByRole('link', { name }));
  const group = page.getByRole('group', { name: locale.themeGroup });
  const light = page.getByRole('button', { name: locale.light });
  const dark = page.getByRole('button', { name: locale.dark });

  await expect(group).toHaveRole('group');
  await expect(group).toBeVisible();
  await expect(light).toHaveAttribute('aria-pressed', String(selectedTheme === 'light'));
  await expect(dark).toHaveAttribute('aria-pressed', String(selectedTheme === 'dark'));

  for (const expected of [skipLink, brand, ...languageLinks, light]) {
    await page.keyboard.press('Tab');
    await expect(expected).toBeFocused();
  }

  await expect(light).toBeFocused();
  return { group, light, dark, languageLinks, selectedTheme };
}

async function expectGlobalFocusRing(item: Locator) {
  const styles = await item.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    const style = getComputedStyle(element);
    const colorProbe = document.createElement('span');
    colorProbe.style.color = getComputedStyle(document.documentElement)
      .getPropertyValue('--ring')
      .trim();
    document.body.append(colorProbe);
    const ringColor = getComputedStyle(colorProbe).color;
    colorProbe.remove();

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is unavailable.');
    }
    context.fillStyle = ringColor;
    context.fillRect(0, 0, 1, 1);

    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      boxShadow: style.boxShadow,
      ringColor,
      ringAlpha: context.getImageData(0, 0, 1, 1).data[3] / 255,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('2px');
  expect(styles.outlineColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.outlineOffset).toBe('2px');

  const layers = styles.boxShadow.split(/,(?![^()]*\))/).map((layer) => layer.trim());
  expect(layers).toHaveLength(2);
  expect(styles.ringAlpha).toBe(1);
  expect(layers[1]?.startsWith(styles.ringColor)).toBe(true);
}

async function expectForcedColorsFocusRing(item: Locator) {
  const styles = await item.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      boxShadow: style.boxShadow,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('3px');
  expect(styles.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(styles.boxShadow).toBe('none');
}

for (const locale of locales) {
  for (const theme of ['light', 'dark'] as const) {
    test(`theme toggle focus ring is opaque in ${theme} mode at ${locale.route}`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((storedTheme: Theme) => {
        localStorage.setItem('foco-theme', storedTheme);
      }, theme);
      await page.goto(locale.route);

      expect(
        await page.locator('html').evaluate((element) => element.classList.contains('dark'))
      ).toBe(theme === 'dark');

      const controls = await focusFirstThemeItemWithKeyboard(page, locale, theme);
      await expectGlobalFocusRing(controls.light);

      await page.keyboard.press('ArrowRight');
      await expect(controls.dark).toBeFocused();
      await expect(controls.light).toHaveAttribute('aria-pressed', String(theme === 'light'));
      await expect(controls.dark).toHaveAttribute('aria-pressed', String(theme === 'dark'));
      await expectGlobalFocusRing(controls.dark);

      await page.keyboard.press('Shift+Tab');
      await expect(controls.languageLinks[1]).toBeFocused();
    });
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`theme toggle uses the system focus outline in forced colors with ${theme} theme at ${locale.route}`, async ({
      page,
    }) => {
      await page.emulateMedia({ forcedColors: 'active', colorScheme: theme });
      await page.addInitScript((storedTheme: Theme) => {
        localStorage.setItem('foco-theme', storedTheme);
      }, theme);
      await page.goto(locale.route);

      const forcedColorsActive = await page.evaluate(
        () => window.matchMedia('(forced-colors: active)').matches
      );
      expect(forcedColorsActive).toBe(true);
      expect(
        await page.locator('html').evaluate((element) => element.classList.contains('dark'))
      ).toBe(theme === 'dark');

      const controls = await focusFirstThemeItemWithKeyboard(page, locale, theme);
      await expectForcedColorsFocusRing(controls.light);

      await page.keyboard.press('ArrowRight');
      await expect(controls.dark).toBeFocused();
      await expect(controls.light).toHaveAttribute('aria-pressed', String(theme === 'light'));
      await expect(controls.dark).toHaveAttribute('aria-pressed', String(theme === 'dark'));
      await expectForcedColorsFocusRing(controls.dark);

      await page.keyboard.press('Shift+Tab');
      await expect(controls.languageLinks[1]).toBeFocused();
    });
  }
}
