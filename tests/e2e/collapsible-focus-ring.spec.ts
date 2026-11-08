import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const locales = [
  { route: '/', trigger: 'Ver código', field: 'Correo electrónico' },
  { route: '/en/', trigger: 'View code', field: 'Email' },
] as const;

type Theme = 'light' | 'dark';

async function prepareFirstTrigger(page: Page, route: string, theme: Theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((storedTheme: Theme) => {
    localStorage.setItem('foco-theme', storedTheme);
  }, theme);
  await page.goto(route);
  expect(await page.locator('html').evaluate((element) => element.classList.contains('dark'))).toBe(
    theme === 'dark'
  );

  const card = page.locator('.gallery article.pat').first();
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('astro-island:not([ssr])')).toHaveCount(1);
  const trigger = card.getByRole('button', {
    name: locales.find(({ route: path }) => path === route)!.trigger,
  });
  await expect(trigger).toBeVisible();

  const chips = card.locator('.chips a');
  await expect(chips.last()).toBeVisible();
  await card
    .getByRole('textbox', {
      name: locales.find(({ route: path }) => path === route)!.field,
    })
    .focus();
  for (const chip of await chips.all()) {
    await page.keyboard.press('Tab');
    await expect(chip).toBeFocused();
  }
  await page.keyboard.press('Tab');
  await expect(trigger).toBeFocused();
  await expect
    .poll(() => trigger.evaluate((element) => element.matches(':focus-visible')))
    .toBe(true);
  return { card, trigger };
}

async function expectGlobalFocusRing(trigger: Locator) {
  const styles = await trigger.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    const computed = getComputedStyle(element);
    const root = getComputedStyle(document.documentElement);
    const probe = document.createElement('span');
    document.body.append(probe);
    probe.style.color = root.getPropertyValue('--background').trim();
    const backgroundColor = getComputedStyle(probe).color;
    probe.style.color = root.getPropertyValue('--ring').trim();
    const ringColor = getComputedStyle(probe).color;
    probe.remove();

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context is unavailable.');
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
      ringAlpha: context.getImageData(0, 0, 1, 1).data[3]! / 255,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('2px');
  expect(styles.outlineColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.outlineOffset).toBe('2px');
  expect(styles.boxShadowLayers).toEqual(styles.expectedBoxShadowLayers);
  expect(styles.ringAlpha).toBe(1);
}

async function expectForcedColorsFocusRing(trigger: Locator) {
  const styles = await trigger.evaluate(async (element) => {
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
  expect(styles.outlineColor).not.toBe('transparent');
  expect(styles.boxShadow).toBe('none');
}

async function expectFocusRingNotClipped(trigger: Locator) {
  const geometry = await trigger.evaluate((element) => {
    const clippingAreas: Array<{
      left: number;
      top: number;
      right: number;
      bottom: number;
      clipsX: boolean;
      clipsY: boolean;
      radii: Array<{ x: number; y: number }>;
    }> = [];
    let ancestor = element.parentElement;

    while (ancestor) {
      const style = getComputedStyle(ancestor);
      const clipsX = /hidden|clip|auto|scroll/.test(style.overflowX);
      const clipsY = /hidden|clip|auto|scroll/.test(style.overflowY);
      if (clipsX || clipsY) {
        const rect = ancestor.getBoundingClientRect();
        const radius = (value: string, borderX: string, borderY: string) => {
          const [x = '0', y = x] = value.split(/\s+/);
          return {
            x: Math.max(0, parseFloat(x) - parseFloat(borderX)),
            y: Math.max(0, parseFloat(y) - parseFloat(borderY)),
          };
        };
        clippingAreas.push({
          left: rect.left + ancestor.clientLeft,
          top: rect.top + ancestor.clientTop,
          right: rect.left + ancestor.clientLeft + ancestor.clientWidth,
          bottom: rect.top + ancestor.clientTop + ancestor.clientHeight,
          clipsX,
          clipsY,
          radii: [
            radius(style.borderTopLeftRadius, style.borderLeftWidth, style.borderTopWidth),
            radius(style.borderTopRightRadius, style.borderRightWidth, style.borderTopWidth),
            radius(style.borderBottomRightRadius, style.borderRightWidth, style.borderBottomWidth),
            radius(style.borderBottomLeftRadius, style.borderLeftWidth, style.borderBottomWidth),
          ],
        });
      }
      ancestor = ancestor.parentElement;
    }

    const style = getComputedStyle(element);
    const outlineVisible =
      style.outlineStyle !== 'none' &&
      style.outlineColor !== 'transparent' &&
      style.outlineColor !== 'rgba(0, 0, 0, 0)';
    const outlineExtent = outlineVisible
      ? Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset))
      : 0;
    const shadowExtents = style.boxShadow
      .split(/,(?![^()]*\))/)
      .filter((shadow) => !shadow.includes('inset') && !shadow.startsWith('rgba(0, 0, 0, 0)'))
      .map((shadow) => {
        const lengths = shadow.match(/-?\d*\.?\d+px/g)?.map(Number.parseFloat) ?? [];
        const [x = 0, y = 0, blur = 0, spread = 0] = lengths;
        return Math.max(Math.abs(x) + blur + spread, Math.abs(y) + blur + spread, 0);
      });
    const rect = element.getBoundingClientRect();

    return {
      clippingAreas: [
        ...clippingAreas,
        {
          left: 0,
          top: 0,
          right: innerWidth,
          bottom: innerHeight,
          clipsX: true,
          clipsY: true,
          radii: [],
        },
      ],
      rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
      extent: Math.max(0, outlineExtent, ...shadowExtents),
    };
  });

  for (const area of geometry.clippingAreas) {
    const ringBox = {
      left: geometry.rect.left - geometry.extent,
      top: geometry.rect.top - geometry.extent,
      right: geometry.rect.right + geometry.extent,
      bottom: geometry.rect.bottom + geometry.extent,
    };
    if (area.clipsX) {
      expect(ringBox.left).toBeGreaterThanOrEqual(area.left);
      expect(ringBox.right).toBeLessThanOrEqual(area.right);
    }
    if (area.clipsY) {
      expect(ringBox.top).toBeGreaterThanOrEqual(area.top);
      expect(ringBox.bottom).toBeLessThanOrEqual(area.bottom);
    }
    const ringCorners = [
      { x: ringBox.left, y: ringBox.top },
      { x: ringBox.right, y: ringBox.top },
      { x: ringBox.right, y: ringBox.bottom },
      { x: ringBox.left, y: ringBox.bottom },
    ];
    for (const corner of ringCorners) {
      for (const [index, radius] of area.radii.entries()) {
        if (radius.x === 0 || radius.y === 0) continue;
        const onLeft = index === 0 || index === 3;
        const onTop = index < 2;
        const inCornerZone =
          (onLeft ? corner.x < area.left + radius.x : corner.x > area.right - radius.x) &&
          (onTop ? corner.y < area.top + radius.y : corner.y > area.bottom - radius.y);
        if (!inCornerZone) continue;

        const centerX = onLeft ? area.left + radius.x : area.right - radius.x;
        const centerY = onTop ? area.top + radius.y : area.bottom - radius.y;
        const dx = (corner.x - centerX) / radius.x;
        const dy = (corner.y - centerY) / radius.y;
        expect(dx * dx + dy * dy).toBeLessThanOrEqual(1);
      }
    }
  }
}

async function openAndCloseWithEnter(page: Page, card: Locator, trigger: Locator) {
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(card.getByRole('tabpanel', { name: 'CSS' })).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
}

for (const locale of locales) {
  for (const theme of ['light', 'dark'] as const) {
    test(`collapsible keeps the global focus ring in ${theme} mode at ${locale.route}`, async ({
      page,
    }) => {
      const { card, trigger } = await prepareFirstTrigger(page, locale.route, theme);
      await expectGlobalFocusRing(trigger);
      await expectFocusRingNotClipped(trigger);

      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(card.getByRole('tabpanel', { name: 'CSS' })).toBeVisible();
      await expect(trigger).toBeFocused();
      await expect
        .poll(() => trigger.evaluate((element) => element.matches(':focus-visible')))
        .toBe(true);
      await expectGlobalFocusRing(trigger);
      await expectFocusRingNotClipped(trigger);
      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
    });

    test(`collapsible uses the system focus outline in forced colors with ${theme} theme at ${locale.route}`, async ({
      page,
    }) => {
      await page.emulateMedia({ forcedColors: 'active', colorScheme: theme });
      await page.addInitScript((storedTheme: Theme) => {
        localStorage.setItem('foco-theme', storedTheme);
      }, theme);
      await page.goto(locale.route);
      expect(
        await page.locator('html').evaluate((element) => element.classList.contains('dark'))
      ).toBe(theme === 'dark');

      const card = page.locator('.gallery article.pat').first();
      await card.scrollIntoViewIfNeeded();
      await expect(card.locator('astro-island:not([ssr])')).toHaveCount(1);
      const trigger = card.getByRole('button', { name: locale.trigger });
      await card.getByRole('textbox', { name: locale.field }).focus();
      const chips = card.locator('.chips a');
      for (const chip of await chips.all()) {
        await page.keyboard.press('Tab');
        await expect(chip).toBeFocused();
      }
      await page.keyboard.press('Tab');
      await expect(trigger).toBeFocused();
      await expect
        .poll(() => trigger.evaluate((element) => element.matches(':focus-visible')))
        .toBe(true);
      await expectForcedColorsFocusRing(trigger);
      await expectFocusRingNotClipped(trigger);
      await openAndCloseWithEnter(page, card, trigger);
    });

    test(`open collapsible has no tagged axe violations in ${theme} mode at ${locale.route}`, async ({
      page,
    }) => {
      const { trigger } = await prepareFirstTrigger(page, locale.route, theme);
      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toBeFocused();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }
}
