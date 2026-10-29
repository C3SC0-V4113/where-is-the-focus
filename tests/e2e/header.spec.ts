import { expect, test, type Locator } from '@playwright/test';

const locales = [
  {
    route: '/',
    languageLabel: 'Idioma',
    currentLanguage: 'ES (Español)',
    otherLanguage: 'EN (English)',
    languageTabOrder: ['ES (Español)'],
    light: 'Claro',
    dark: 'Oscuro',
    skipLink: 'Saltar al contenido',
  },
  {
    route: '/en/',
    languageLabel: 'Language',
    currentLanguage: 'EN (English)',
    otherLanguage: 'ES (Español)',
    languageTabOrder: ['ES (Español)', 'EN (English)'],
    light: 'Light',
    dark: 'Dark',
    skipLink: 'Skip to content',
  },
] as const;

const colorModes = [
  { name: '', forcedColors: 'none' as const, isForcedColors: false },
  { name: ' in forced colors', forcedColors: 'active' as const, isForcedColors: true },
];

async function readIndicator(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      borderWidth: Number.parseFloat(style.borderTopWidth),
      borderStyle: style.borderTopStyle,
    };
  });
}

function splitShadowLayers(boxShadow: string) {
  if (boxShadow === 'none') {
    return [];
  }

  const layers: string[] = [];
  let depth = 0;
  let start = 0;

  for (const [index, character] of [...boxShadow].entries()) {
    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
    } else if (character === ',' && depth === 0) {
      layers.push(boxShadow.slice(start, index).trim());
      start = index + 1;
    }
  }

  layers.push(boxShadow.slice(start).trim());
  return layers;
}

async function expectFocusRing(link: Locator, forcedColors: boolean) {
  const focus = await link.evaluate((element) => {
    const style = getComputedStyle(element);
    const colorProbe = document.createElement('span');
    colorProbe.style.color = getComputedStyle(document.documentElement)
      .getPropertyValue('--ring')
      .trim();
    document.body.append(colorProbe);
    const ringColor = getComputedStyle(colorProbe).color;
    colorProbe.remove();

    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      outlineOffset: style.outlineOffset,
      boxShadow: style.boxShadow,
      ringColor,
    };
  });

  expect(focus.outlineStyle).toBe('solid');
  if (forcedColors) {
    expect(focus.outlineWidth).toBe('3px');
    expect(focus.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(focus.boxShadow).toBe('none');
    return;
  }

  expect(focus.outlineWidth).toBe('2px');
  expect(focus.outlineColor).toBe('rgba(0, 0, 0, 0)');
  expect(focus.outlineOffset).toBe('2px');
  const shadowLayers = splitShadowLayers(focus.boxShadow);
  expect(shadowLayers).toHaveLength(2);
  expect(shadowLayers[1]?.startsWith(focus.ringColor)).toBe(true);
}

for (const locale of locales) {
  test(
    'keeps the header controls on one row at mobile widths at ' + locale.route,
    async ({ page }) => {
      const header = page.locator('header');

      for (const width of [320, 375]) {
        await page.setViewportSize({ width, height: 800 });
        await page.goto(locale.route);

        const geometry = await header.evaluate((element) => {
          const headerRect = element.getBoundingClientRect();
          const brandRect = element.querySelector(':scope > a')?.getBoundingClientRect();
          const navRect = element.querySelector('nav')?.getBoundingClientRect();
          const themeRect = element.querySelector('[role="group"]')?.getBoundingClientRect();
          const style = getComputedStyle(element);
          if (!brandRect || !navRect || !themeRect) {
            throw new Error('Header brand or controls are missing.');
          }

          return {
            brandCenter: brandRect.top + brandRect.height / 2,
            navCenter: navRect.top + navRect.height / 2,
            themeCenter: themeRect.top + themeRect.height / 2,
            groupGap: themeRect.left - navRect.right,
            themeRight: themeRect.right,
            contentRight:
              headerRect.right -
              Number.parseFloat(style.borderRightWidth) -
              Number.parseFloat(style.paddingRight),
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
          };
        });

        expect(Math.abs(geometry.brandCenter - geometry.navCenter)).toBeLessThanOrEqual(1);
        expect(Math.abs(geometry.brandCenter - geometry.themeCenter)).toBeLessThanOrEqual(1);
        expect(geometry.groupGap).toBeCloseTo(6, 0);
        expect(Math.abs(geometry.themeRight - geometry.contentRight)).toBeLessThanOrEqual(1);
        expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);

        await expect(page.getByRole('link', { name: locale.currentLanguage })).toBeVisible();
        await expect(page.getByRole('link', { name: locale.otherLanguage })).toBeVisible();
        await expect(page.getByRole('button', { name: locale.light })).toBeVisible();
        await expect(page.getByRole('button', { name: locale.dark })).toBeVisible();

        for (const target of [
          page.getByRole('link', { name: locale.currentLanguage }),
          page.getByRole('link', { name: locale.otherLanguage }),
          page.getByRole('button', { name: locale.light }),
          page.getByRole('button', { name: locale.dark }),
        ]) {
          const box = await target.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.width).toBeGreaterThanOrEqual(24);
          expect(box!.height).toBeGreaterThanOrEqual(24);
        }

        await expect(page.getByRole('link', { name: locale.currentLanguage })).toHaveAttribute(
          'aria-current',
          'page'
        );
        await expect(page.getByRole('button', { name: locale.light })).toHaveAttribute(
          'aria-pressed',
          'true'
        );
      }
    }
  );

  test('shows theme labels only from the small breakpoint at ' + locale.route, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(locale.route);
    await expect(page.getByRole('button', { name: locale.light })).toBeVisible();
    for (const label of [locale.light, locale.dark]) {
      const box = await page.getByText(label, { exact: true }).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeLessThanOrEqual(1);
      expect(box!.height).toBeLessThanOrEqual(1);
    }

    await page.setViewportSize({ width: 1280, height: 800 });
    for (const label of [locale.light, locale.dark]) {
      const box = await page.getByText(label, { exact: true }).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(1);
      expect(box!.height).toBeGreaterThan(1);
    }
    const row = await page.locator('header').evaluate((header) => {
      const brand = header.querySelector(':scope > a')!.getBoundingClientRect();
      const theme = header.querySelector('[role="group"]')!.getBoundingClientRect();
      return Math.abs(brand.top + brand.height / 2 - (theme.top + theme.height / 2));
    });
    expect(row).toBeLessThanOrEqual(1);
  });

  for (const colorMode of colorModes) {
    test(
      'marks selected language and theme without color alone at ' + locale.route + colorMode.name,
      async ({ page }) => {
        await page.emulateMedia({ forcedColors: colorMode.forcedColors });
        await page.goto(locale.route);

        const selectedLanguage = page.getByRole('link', { name: locale.currentLanguage });
        const otherLanguage = page.getByRole('link', { name: locale.otherLanguage });
        const selectedTheme = page.getByRole('button', { name: locale.light });
        const otherTheme = page.getByRole('button', { name: locale.dark });
        const [selectedLanguageStyle, otherLanguageStyle, selectedThemeStyle, otherThemeStyle] =
          await Promise.all([
            readIndicator(selectedLanguage),
            readIndicator(otherLanguage),
            readIndicator(selectedTheme),
            readIndicator(otherTheme),
          ]);

        expect(selectedLanguageStyle.borderWidth).toBeGreaterThan(otherLanguageStyle.borderWidth);
        expect(selectedLanguageStyle.borderStyle).toBe('solid');
        expect(selectedThemeStyle.borderWidth).toBeGreaterThan(otherThemeStyle.borderWidth);
        expect(selectedThemeStyle.borderStyle).toBe('solid');
      }
    );
  }

  for (const colorMode of colorModes) {
    test(
      'keeps the language focus ring' + colorMode.name + ' at ' + locale.route,
      async ({ page }) => {
        await page.emulateMedia({ forcedColors: colorMode.forcedColors });
        await page.goto(locale.route);
        await page.keyboard.press('Tab');
        await expect(page.getByRole('link', { name: locale.skipLink })).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(page.locator('header').locator(':scope > a')).toBeFocused();
        for (const languageName of locale.languageTabOrder) {
          await page.keyboard.press('Tab');
          await expect(page.getByRole('link', { name: languageName })).toBeFocused();
        }
        const selectedLanguage = page.getByRole('link', { name: locale.currentLanguage });
        await expect(selectedLanguage).toBeFocused();
        await expectFocusRing(selectedLanguage, colorMode.isForcedColors);
      }
    );
  }

  test('keeps the documented header tab order at ' + locale.route, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(locale.route);

    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: locale.skipLink })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('header').locator(':scope > a')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'ES (Español)' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'EN (English)' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: locale.light })).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('button', { name: locale.dark })).toBeFocused();
  });
}
