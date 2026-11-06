import { expect, test, type Locator, type Page } from '@playwright/test';

const locales = [
  {
    route: '/',
    language: 'Lenguaje del ejemplo',
    copy: 'Copiar',
    copied: 'Copiado',
  },
  {
    route: '/en/',
    language: 'Example language',
    copy: 'Copy',
    copied: 'Copied',
  },
] as const;

type Theme = 'light' | 'dark';

async function expectGlobalFocusRing(item: Locator) {
  const styles = await item.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    const computed = getComputedStyle(element);
    const rootStyles = getComputedStyle(document.documentElement);
    const colorProbe = document.createElement('span');
    document.body.append(colorProbe);
    colorProbe.style.color = rootStyles.getPropertyValue('--background').trim();
    const backgroundColor = getComputedStyle(colorProbe).color;
    colorProbe.style.color = rootStyles.getPropertyValue('--ring').trim();
    const ringColor = getComputedStyle(colorProbe).color;
    colorProbe.remove();

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is unavailable.');
    }
    context.fillStyle = ringColor;
    context.fillRect(0, 0, 1, 1);
    const boxShadowLayers = computed.boxShadow
      .split(/,(?![^()]*\))/)
      .map((layer) => layer.trim())
      .filter((layer) => !layer.startsWith('rgba(0, 0, 0, 0)'));

    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      outlineOffset: computed.outlineOffset,
      boxShadowLayers,
      expectedBoxShadowLayers: [
        `${backgroundColor} 0px 0px 0px 2px`,
        `${ringColor} 0px 0px 0px 5px`,
      ],
      ringAlpha: context.getImageData(0, 0, 1, 1).data[3] / 255,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('2px');
  expect(styles.outlineColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.outlineOffset).toBe('2px');
  expect(styles.boxShadowLayers).toEqual(styles.expectedBoxShadowLayers);
  expect(styles.ringAlpha).toBe(1);
}

async function expectScrollableCodeFocusRing(item: Locator) {
  const styles = await item.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    const computed = getComputedStyle(element);
    const rootStyles = getComputedStyle(document.documentElement);
    const colorProbe = document.createElement('span');
    document.body.append(colorProbe);
    colorProbe.style.color = rootStyles.getPropertyValue('--ring').trim();
    const ringColor = getComputedStyle(colorProbe).color;
    colorProbe.style.color = rootStyles.getPropertyValue('--background').trim();
    const backgroundColor = getComputedStyle(colorProbe).color;
    colorProbe.remove();

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is unavailable.');
    }
    context.fillStyle = ringColor;
    context.fillRect(0, 0, 1, 1);
    const boxShadowLayers = computed.boxShadow
      .split(/,(?![^()]*\))/)
      .map((layer) => layer.trim())
      .filter((layer) => !layer.startsWith('rgba(0, 0, 0, 0)'));

    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      outlineOffset: computed.outlineOffset,
      boxShadowLayers,
      expectedRingColor: ringColor,
      expectedInsetShadow: `${backgroundColor} 0px 0px 0px 4px inset`,
      ringAlpha: context.getImageData(0, 0, 1, 1).data[3] / 255,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('2px');
  expect(styles.outlineColor).toBe(styles.expectedRingColor);
  expect(styles.outlineOffset).toBe('-2px');
  expect(styles.boxShadowLayers).toEqual([styles.expectedInsetShadow]);
  expect(styles.ringAlpha).toBe(1);
}

async function expectForcedColorsFocusRing(item: Locator) {
  const styles = await item.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    const computed = getComputedStyle(element);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      boxShadow: computed.boxShadow,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('3px');
  expect(styles.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(styles.boxShadow).toBe('none');
}

async function expectForcedColorsScrollableCodeFocusRing(item: Locator) {
  const styles = await item.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    const computed = getComputedStyle(element);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      boxShadow: computed.boxShadow,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(parseFloat(styles.outlineWidth)).toBeGreaterThanOrEqual(2);
  expect(styles.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(styles.boxShadow).toBe('none');
}

async function expectFocusRingNotClipped(item: Locator) {
  const geometry = await item.evaluate((element) => {
    const ancestors: Array<{ left: number; top: number; right: number; bottom: number }> = [];
    let ancestor = element.parentElement;

    while (ancestor) {
      const style = getComputedStyle(ancestor);
      if (/hidden|clip|auto|scroll/.test(`${style.overflowX} ${style.overflowY}`)) {
        const rect = ancestor.getBoundingClientRect();
        ancestors.push({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
      }
      ancestor = ancestor.parentElement;
    }

    const computed = getComputedStyle(element);
    const outlineIsVisible =
      computed.outlineStyle !== 'none' &&
      computed.outlineColor !== 'transparent' &&
      computed.outlineColor !== 'rgba(0, 0, 0, 0)';
    const outlineExtent = outlineIsVisible
      ? Math.max(0, parseFloat(computed.outlineWidth) + parseFloat(computed.outlineOffset))
      : 0;
    const shadowExtents = computed.boxShadow
      .split(/,(?![^()]*\))/)
      .filter((shadow) => !shadow.includes('inset'))
      .map((shadow) => {
        const lengths = shadow.match(/-?\d*\.?\d+px/g)?.map((length) => parseFloat(length)) ?? [];
        const [x = 0, y = 0, blur = 0, spread = 0] = lengths;
        return Math.max(Math.abs(x) + blur + spread, Math.abs(y) + blur + spread, 0);
      });
    const rect = element.getBoundingClientRect();

    return {
      ancestors,
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
      extent: Math.max(0, outlineExtent, ...shadowExtents),
    };
  });

  for (const ancestor of geometry.ancestors) {
    expect(geometry.rect.left - geometry.extent).toBeGreaterThanOrEqual(ancestor.left);
    expect(geometry.rect.top - geometry.extent).toBeGreaterThanOrEqual(ancestor.top);
    expect(geometry.rect.right + geometry.extent).toBeLessThanOrEqual(ancestor.right);
    expect(geometry.rect.bottom + geometry.extent).toBeLessThanOrEqual(ancestor.bottom);
  }
}

async function verifyCopyWhenClipboardIsSupported(
  page: Page,
  browserName: string,
  section: Locator,
  copiedLabel: string,
  expectedCode: string,
  forcedColors: boolean
) {
  if (browserName !== 'chromium') return;

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.keyboard.press('Enter');

  const copiedButton = section.getByRole('button', { name: copiedLabel, exact: true });
  await expect(copiedButton).toHaveText(copiedLabel);
  await expect(copiedButton).toBeFocused();
  if (forcedColors) {
    await expectForcedColorsFocusRing(copiedButton);
  } else {
    await expectGlobalFocusRing(copiedButton);
  }
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expectedCode);
}

async function verifyCodeBlockKeyboardFocus(
  page: Page,
  browserName: string,
  section: Locator,
  labels: (typeof locales)[number],
  forcedColors: boolean
) {
  const previousLink = section.getByRole('link').last();
  const tablist = section.getByRole('tablist', { name: labels.language, exact: true });
  const cssTab = tablist.getByRole('tab', { name: 'CSS', exact: true });
  const tailwindTab = tablist.getByRole('tab', { name: 'Tailwind', exact: true });
  const copyButton = section.getByRole('button', { name: labels.copy, exact: true });
  const hydratedIsland = section
    .locator('astro-island:not([ssr])')
    .filter({ has: page.locator('[data-slot="code-block"]') });

  await section.locator('[data-slot="code-block"]').first().scrollIntoViewIfNeeded();
  await expect(hydratedIsland).toHaveCount(1);
  await expect(cssTab).toHaveAttribute('aria-selected', 'true');
  await previousLink.focus();
  await page.keyboard.press('Tab');
  await expect(cssTab).toBeFocused();
  await expect(cssTab).toHaveAttribute('aria-selected', 'true');
  if (forcedColors) {
    await expectForcedColorsFocusRing(cssTab);
  } else {
    await expectGlobalFocusRing(cssTab);
  }
  await expectFocusRingNotClipped(cssTab);

  await page.keyboard.press('ArrowRight');
  await expect(tailwindTab).toBeFocused();
  await expect(tailwindTab).toHaveAttribute('aria-selected', 'true');
  if (forcedColors) {
    await expectForcedColorsFocusRing(tailwindTab);
  } else {
    await expectGlobalFocusRing(tailwindTab);
  }
  await expectFocusRingNotClipped(tailwindTab);

  await page.keyboard.press('ArrowLeft');
  await expect(cssTab).toBeFocused();
  await expect(cssTab).toHaveAttribute('aria-selected', 'true');
  if (forcedColors) {
    await expectForcedColorsFocusRing(cssTab);
  } else {
    await expectGlobalFocusRing(cssTab);
  }
  await expectFocusRingNotClipped(cssTab);

  await page.keyboard.press('Tab');
  await expect(copyButton).toBeFocused();
  if (forcedColors) {
    await expectForcedColorsFocusRing(copyButton);
  } else {
    await expectGlobalFocusRing(copyButton);
  }
  await expectFocusRingNotClipped(copyButton);

  const expectedCode = await section
    .getByRole('tabpanel', { name: 'CSS', exact: true })
    .evaluate((panel) => panel.textContent ?? '');
  await verifyCopyWhenClipboardIsSupported(
    page,
    browserName,
    section,
    labels.copied,
    expectedCode,
    forcedColors
  );

  await page.keyboard.press('Shift+Tab');
  await expect(cssTab).toBeFocused();
  await expect(cssTab).toHaveAttribute('aria-selected', 'true');
  if (forcedColors) {
    await expectForcedColorsFocusRing(cssTab);
  } else {
    await expectGlobalFocusRing(cssTab);
  }
  await expectFocusRingNotClipped(cssTab);
}

async function verifyScrollableCodeContentFocus(
  page: Page,
  section: Locator,
  labels: (typeof locales)[number],
  forcedColors: boolean
) {
  const copyButton = section.getByRole('button', { name: labels.copy, exact: true });
  const hydratedIsland = section
    .locator('astro-island:not([ssr])')
    .filter({ has: page.locator('[data-slot="code-block"]') });
  const codeContent = section
    .getByRole('tabpanel', { name: 'CSS', exact: true })
    .locator('[data-slot="code-block-content"]');

  await section.locator('[data-slot="code-block"]').first().scrollIntoViewIfNeeded();
  await expect(hydratedIsland).toHaveCount(1);
  await expect(codeContent).toHaveAttribute('tabindex', '0');
  const overflow = await codeContent.evaluate((element: HTMLPreElement) => {
    return element.scrollWidth > element.clientWidth;
  });
  expect(overflow, 'the narrow viewport must make the code block horizontally scrollable').toBe(
    true
  );

  await copyButton.focus();
  await expect(copyButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(codeContent).toBeFocused();
  await expectFocusRingNotClipped(codeContent);
  if (forcedColors) {
    await expectForcedColorsScrollableCodeFocusRing(codeContent);
  } else {
    await expectScrollableCodeFocusRing(codeContent);
  }
}

for (const locale of locales) {
  for (const theme of ['light', 'dark'] as const) {
    test(`code focus ring: ${theme} ${locale.route}`, async ({ page, browserName }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((storedTheme: Theme) => {
        localStorage.setItem('foco-theme', storedTheme);
      }, theme);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(locale.route);

      expect(
        await page.locator('html').evaluate((element) => element.classList.contains('dark'))
      ).toBe(theme === 'dark');

      await verifyCodeBlockKeyboardFocus(
        page,
        browserName,
        page.locator('#focus-visible'),
        locale,
        false
      );
      await verifyCodeBlockKeyboardFocus(page, browserName, page.locator('#anillo'), locale, false);
    });
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`code focus outline in forced colors: ${theme} ${locale.route}`, async ({
      page,
      browserName,
    }) => {
      await page.emulateMedia({ forcedColors: 'active', colorScheme: theme });
      await page.addInitScript((storedTheme: Theme) => {
        localStorage.setItem('foco-theme', storedTheme);
      }, theme);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(locale.route);

      expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
      expect(
        await page.locator('html').evaluate((element) => element.classList.contains('dark'))
      ).toBe(theme === 'dark');

      await verifyCodeBlockKeyboardFocus(
        page,
        browserName,
        page.locator('#focus-visible'),
        locale,
        true
      );
      await verifyCodeBlockKeyboardFocus(page, browserName, page.locator('#anillo'), locale, true);
    });
  }
}

for (const locale of locales) {
  for (const theme of ['light', 'dark'] as const) {
    test(`scrollable code focus ring: ${theme} ${locale.route}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((storedTheme: Theme) => {
        localStorage.setItem('foco-theme', storedTheme);
      }, theme);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(locale.route);

      expect(
        await page.locator('html').evaluate((element) => element.classList.contains('dark'))
      ).toBe(theme === 'dark');
      await verifyScrollableCodeContentFocus(page, page.locator('#focus-visible'), locale, false);
    });
  }

  for (const theme of ['light', 'dark'] as const) {
    test(`scrollable code system focus outline: ${theme} ${locale.route}`, async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active', colorScheme: theme });
      await page.addInitScript((storedTheme: Theme) => {
        localStorage.setItem('foco-theme', storedTheme);
      }, theme);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(locale.route);

      expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
      expect(
        await page.locator('html').evaluate((element) => element.classList.contains('dark'))
      ).toBe(theme === 'dark');
      await verifyScrollableCodeContentFocus(page, page.locator('#focus-visible'), locale, true);
    });
  }
}
