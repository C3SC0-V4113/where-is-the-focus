import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const routes = [
  { path: '/', question: '«El anillo se ve feo»' },
  { path: '/en/', question: '“The ring looks ugly”' },
] as const;

type Theme = 'light' | 'dark';

async function loadFaq(page: Page, path: string, theme: Theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((storedTheme: Theme) => {
    localStorage.setItem('foco-theme', storedTheme);
  }, theme);
  await page.goto(path);

  const section = page.locator('#objeciones');
  await section.scrollIntoViewIfNeeded();
  await expect(page.locator('#objeciones astro-island:not([ssr])')).toHaveCount(1);
  await expect
    .poll(() => page.locator('html').evaluate((element) => element.classList.contains('dark')))
    .toBe(theme === 'dark');

  const trigger = page.getByRole('button', {
    name: routes.find((route) => route.path === path)!.question,
  });
  await expect(trigger).toBeVisible();
  return { section, trigger };
}

async function tabToTrigger(page: Page, trigger: Locator) {
  const maxTabs = await page
    .locator(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]'
    )
    .count();

  for (let tab = 0; tab <= maxTabs; tab += 1) {
    await page.keyboard.press('Tab');
    if (await trigger.evaluate((element) => document.activeElement === element)) {
      await expect(trigger).toBeFocused();
      await expect
        .poll(() => trigger.evaluate((element) => element.matches(':focus-visible')))
        .toBe(true);
      await expectFocusRingNotClipped(trigger);
      await trigger.evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await expect(trigger).toBeFocused();
      await expect
        .poll(() => trigger.evaluate((element) => element.matches(':focus-visible')))
        .toBe(true);
      return;
    }
  }

  throw new Error('Tab did not reach the first FAQ accordion trigger.');
}

async function expectGlobalFocusRing(trigger: Locator) {
  const styles = await trigger.evaluate((element) => {
    const computed = getComputedStyle(element);
    const resolveColor = (token: string) => {
      const probe = document.createElement('span');
      probe.style.color = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    };
    const alpha = (color: string) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas 2D context is unavailable.');
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data[3]! / 255;
    };
    const backgroundColor = resolveColor('--background');
    const ringColor = resolveColor('--ring');

    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      outlineOffset: computed.outlineOffset,
      boxShadow: computed.boxShadow,
      expectedBoxShadow: `${backgroundColor} 0px 0px 0px 2px, ${ringColor} 0px 0px 0px 5px`,
      backgroundAlpha: alpha(backgroundColor),
      ringAlpha: alpha(ringColor),
      shadowAlphas: computed.boxShadow
        .split(/,(?![^()]*\))/)
        .map((layer) => layer.trim())
        .filter((layer) => !layer.startsWith('rgba(0, 0, 0, 0)'))
        .map((layer) => {
          const match = layer.match(/rgba\([^)]*,\s*([\d.]+)\)/);
          return match ? Number(match[1]) : 1;
        }),
    };
  });

  expect(styles.outlineStyle).toBe('none');
  expect(styles.outlineWidth).toBe('2px');
  expect(styles.outlineColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.outlineOffset).toBe('2px');
  expect(styles.boxShadow).toBe(styles.expectedBoxShadow);
  expect(styles.backgroundAlpha).toBe(1);
  expect(styles.ringAlpha).toBe(1);
  expect(styles.shadowAlphas).toEqual([1, 1]);
  expect(styles.boxShadow).not.toContain('rgba(');
}

async function expectNoFocusRingTransition(trigger: Locator) {
  const result = await trigger.evaluate((element) => {
    const computed = getComputedStyle(element);
    const runningTransitions = element
      .getAnimations()
      .filter(
        (animation): animation is CSSTransition =>
          animation instanceof CSSTransition &&
          animation.playState === 'running' &&
          /^(box-shadow|outline(?:-|$))/.test(animation.transitionProperty)
      )
      .map((animation) => animation.transitionProperty);

    return {
      runningTransitions,
      transitionProperties: computed.transitionProperty
        .split(',')
        .map((property) => property.trim()),
    };
  });

  expect(result.runningTransitions).toEqual([]);
  expect(result.transitionProperties).not.toContain('all');
  expect(result.transitionProperties).not.toContain('box-shadow');
  expect(result.transitionProperties.some((property) => property.startsWith('outline'))).toBe(
    false
  );
}

async function expectFocusRingNotClipped(trigger: Locator) {
  const geometry = await trigger.evaluate((element) => {
    const computed = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const outlineExtent =
      computed.outlineStyle !== 'none' && computed.outlineColor !== 'transparent'
        ? Math.max(0, parseFloat(computed.outlineWidth) + parseFloat(computed.outlineOffset))
        : 0;
    const shadowExtent = computed.boxShadow
      .split(/,(?![^()]*\))/)
      .filter((layer) => !layer.includes('inset') && !layer.startsWith('rgba(0, 0, 0, 0)'))
      .map((layer) => {
        const lengths = layer.match(/-?\d*\.?\d+px/g)?.map(Number.parseFloat) ?? [];
        const [x = 0, y = 0, blur = 0, spread = 0] = lengths;
        return Math.max(Math.abs(x) + blur + spread, Math.abs(y) + blur + spread, 0);
      });
    const extent = Math.max(0, outlineExtent, ...shadowExtent);
    const clippingAreas: Array<{
      left: number;
      top: number;
      right: number;
      bottom: number;
      clipsX: boolean;
      clipsY: boolean;
    }> = [];

    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      const clipsX = /hidden|clip|auto|scroll/.test(style.overflowX);
      const clipsY = /hidden|clip|auto|scroll/.test(style.overflowY);
      if (!clipsX && !clipsY) continue;
      const bounds = ancestor.getBoundingClientRect();
      clippingAreas.push({
        left: bounds.left + ancestor.clientLeft,
        top: bounds.top + ancestor.clientTop,
        right: bounds.left + ancestor.clientLeft + ancestor.clientWidth,
        bottom: bounds.top + ancestor.clientTop + ancestor.clientHeight,
        clipsX,
        clipsY,
      });
    }

    clippingAreas.push({
      left: 0,
      top: 0,
      right: innerWidth,
      bottom: innerHeight,
      clipsX: true,
      clipsY: true,
    });

    return {
      clippingAreas,
      ringBox: {
        left: rect.left - extent,
        top: rect.top - extent,
        right: rect.right + extent,
        bottom: rect.bottom + extent,
      },
    };
  });

  for (const area of geometry.clippingAreas) {
    if (area.clipsX) {
      expect(geometry.ringBox.left).toBeGreaterThanOrEqual(area.left);
      expect(geometry.ringBox.right).toBeLessThanOrEqual(area.right);
    }
    if (area.clipsY) {
      expect(geometry.ringBox.top).toBeGreaterThanOrEqual(area.top);
      expect(geometry.ringBox.bottom).toBeLessThanOrEqual(area.bottom);
    }
  }
}

for (const route of routes) {
  for (const theme of ['light', 'dark'] as const) {
    test(`FAQ accordion at ${route.path} has the opaque ${theme} focus ring and keyboard behavior`, async ({
      page,
    }) => {
      const { trigger } = await loadFaq(page, route.path, theme);
      await tabToTrigger(page, trigger);
      await expectGlobalFocusRing(trigger);
      await expectNoFocusRingTransition(trigger);
      await expectFocusRingNotClipped(trigger);

      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toBeFocused();
      await expectGlobalFocusRing(trigger);
      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
      await expectGlobalFocusRing(trigger);
    });

    test(`FAQ accordion at ${route.path} in ${theme} mode uses the forced-colors focus outline`, async ({
      page,
    }) => {
      const { trigger } = await loadFaq(page, route.path, theme);
      await page.emulateMedia({ forcedColors: 'active' });
      expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
      await tabToTrigger(page, trigger);

      const styles = await trigger.evaluate((element) => {
        const computed = getComputedStyle(element);
        const probe = document.createElement('span');
        probe.style.color = 'Highlight';
        document.body.append(probe);
        const highlight = getComputedStyle(probe).color;
        probe.remove();
        return {
          outlineStyle: computed.outlineStyle,
          outlineWidth: computed.outlineWidth,
          outlineColor: computed.outlineColor,
          highlight,
          boxShadow: computed.boxShadow,
        };
      });

      expect(styles.outlineStyle).toBe('solid');
      expect(styles.outlineWidth).toBe('3px');
      expect(styles.outlineColor).toBe(styles.highlight);
      expect(styles.boxShadow).toBe('none');
      await expectFocusRingNotClipped(trigger);
    });

    test(`FAQ accordion at ${route.path} in ${theme} mode has no tagged axe violations while open and focused`, async ({
      page,
    }) => {
      const { trigger } = await loadFaq(page, route.path, theme);
      await tabToTrigger(page, trigger);
      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toBeFocused();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(results.violations, `Axe found tagged violations at ${route.path}`).toHaveLength(0);
    });
  }
}
