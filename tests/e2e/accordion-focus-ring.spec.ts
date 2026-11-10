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

async function expectNoFullFocusFrame(trigger: Locator) {
  const styles = await trigger.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      borderColors: [
        computed.borderTopColor,
        computed.borderRightColor,
        computed.borderBottomColor,
        computed.borderLeftColor,
      ],
    };
  });

  expect(styles.outlineStyle === 'none' || styles.outlineColor === 'rgba(0, 0, 0, 0)').toBe(true);
  expect(styles.borderColors).toEqual([
    'rgba(0, 0, 0, 0)',
    'rgba(0, 0, 0, 0)',
    'rgba(0, 0, 0, 0)',
    'rgba(0, 0, 0, 0)',
  ]);
  await expectNoVisibleBoxShadow(trigger);
}

async function expectNoVisibleBoxShadow(trigger: Locator) {
  const invisible = await trigger.evaluate((element) => {
    const boxShadow = getComputedStyle(element).boxShadow;
    if (boxShadow === 'none') return true;

    const layers = boxShadow.split(/,(?![^()]*\))/);
    const context = document.createElement('canvas').getContext('2d');
    if (!context || layers.length === 0) return false;

    return layers.every((layer) => {
      const firstLength = layer.search(/-?\d*\.?\d+px/);
      if (firstLength === -1) return false;
      const color = layer.slice(0, firstLength).trim();
      const lengths = layer.match(/-?\d*\.?\d+px/g)?.map(Number.parseFloat) ?? [];
      if (lengths.length !== 4 || lengths.some((length) => length !== 0)) return false;

      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data[3] === 0;
    });
  });

  expect(invisible).toBe(true);
}

async function expectViewfinderCorners(trigger: Locator, visible: boolean) {
  const result = await trigger.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const probe = document.createElement('span');
    probe.style.color = getComputedStyle(document.documentElement)
      .getPropertyValue('--brand-text')
      .trim();
    document.body.append(probe);
    const brandText = getComputedStyle(probe).color;
    probe.remove();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context is unavailable.');
    const luminance = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const channels = [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)].map((channel) => {
        const value = channel / 255;
        const low = value / 12.92;
        const high = ((value + 0.055) / 1.055) ** 2.4;
        return low + (high - low) * Number(value > 0.04045);
      });
      return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
    };
    const effectiveBackground = (element: Element) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = '#fff';
      context.fillRect(0, 0, 1, 1);
      const backgrounds: string[] = [];
      for (let node = element.parentElement; node; node = node.parentElement) {
        backgrounds.push(getComputedStyle(node).backgroundColor);
      }
      backgrounds.reverse().forEach((color) => {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
      });
      const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
      return `rgb(${red} ${green} ${blue})`;
    };
    const cornerElements = [
      ...element.querySelectorAll<HTMLElement>('[data-slot="accordion-focus-corner"]'),
    ];
    return {
      expectedColor: brandText,
      corners: cornerElements.map((corner) => {
        const style = getComputedStyle(corner);
        const bounds = corner.getBoundingClientRect();
        const borderColors = [
          style.borderTopWidth,
          style.borderRightWidth,
          style.borderBottomWidth,
          style.borderLeftWidth,
        ];
        const borderColor = [
          style.borderTopColor,
          style.borderRightColor,
          style.borderBottomColor,
          style.borderLeftColor,
        ][borderColors.findIndex((width) => width === '3px')]!;
        const background = effectiveBackground(corner);
        return {
          opacity: Number(style.opacity),
          color: borderColor,
          contrast:
            (Math.max(luminance(borderColor), luminance(background)) + 0.05) /
            (Math.min(luminance(borderColor), luminance(background)) + 0.05),
          pointerEvents: style.pointerEvents,
          borders: borderColors,
          hiddenFromAccessibilityTree:
            corner.getAttribute('aria-hidden') === 'true' ||
            corner.closest('[aria-hidden="true"]') !== null,
          bounds: {
            left: bounds.left,
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
            width: bounds.width,
            height: bounds.height,
          },
          position: style.position,
        };
      }),
      trigger: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
    };
  });

  if (!visible && result.corners.length === 0) return;

  expect(result.corners).toHaveLength(4);
  const corners = result.corners;
  for (const corner of corners) {
    expect(corner.position).toBe('absolute');
    expect(corner.bounds.width).toBe(18);
    expect(corner.bounds.height).toBe(18);
    expect(corner.color).toBe(result.expectedColor);
    expect(corner.contrast).toBeGreaterThanOrEqual(3);
    expect(corner.pointerEvents).toBe('none');
    expect(corner.opacity).toBe(visible ? 1 : 0);
    expect(corner.hiddenFromAccessibilityTree).toBe(true);
    expect(corner.borders.filter((width) => width === '3px')).toHaveLength(2);
    expect(corner.borders.filter((width) => width === '0px')).toHaveLength(2);
  }

  if (visible) {
    const positions = corners
      .map((corner) => {
        const leftSide = corner.borders[3] === '3px';
        const topSide = corner.borders[0] === '3px';
        const x = leftSide
          ? corner.bounds.left - result.trigger.left
          : corner.bounds.right - result.trigger.right;
        const y = topSide
          ? corner.bounds.top - result.trigger.top
          : corner.bounds.bottom - result.trigger.bottom;
        return { x, y, quadrant: [x < 0 ? -1 : 1, y < 0 ? -1 : 1] };
      })
      .sort(
        (left, right) =>
          left.quadrant[0]! - right.quadrant[0]! || left.quadrant[1]! - right.quadrant[1]!
      );
    expect(positions.map(({ quadrant }) => quadrant)).toEqual([
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]);
    for (const { x, y } of positions) {
      expect(Math.round(Math.abs(x))).toBeGreaterThanOrEqual(7);
      expect(Math.round(Math.abs(x))).toBeLessThanOrEqual(8);
      expect(Math.round(Math.abs(y))).toBeGreaterThanOrEqual(7);
      expect(Math.round(Math.abs(y))).toBeLessThanOrEqual(8);
    }
  }
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
    const durationInMs = (duration: string) =>
      duration.endsWith('ms') ? Number.parseFloat(duration) : Number.parseFloat(duration) * 1000;
    const corners = [
      ...element.querySelectorAll<HTMLElement>('[data-slot="accordion-focus-corner"]'),
    ].map((corner) => {
      const cornerStyle = getComputedStyle(corner);
      const animationNames = cornerStyle.animationName.split(',').map((name) => name.trim());
      const animationDurations = cornerStyle.animationDuration
        .split(',')
        .map((duration) => durationInMs(duration.trim()));
      return {
        runningAnimations: corner.getAnimations().length,
        hasNonZeroTransitionDuration: cornerStyle.transitionDuration
          .split(',')
          .some((duration) => durationInMs(duration.trim()) !== 0),
        hasNonZeroAnimationDuration:
          animationNames.some((name) => name !== 'none') &&
          animationDurations.some((duration) => duration !== 0),
      };
    });

    return {
      runningTransitions,
      transitionProperties: computed.transitionProperty
        .split(',')
        .map((property) => property.trim()),
      corners,
    };
  });

  expect(result.runningTransitions).toEqual([]);
  expect(result.transitionProperties).not.toContain('all');
  expect(result.transitionProperties).not.toContain('box-shadow');
  expect(result.transitionProperties.some((property) => property.startsWith('outline'))).toBe(
    false
  );
  expect(result.corners).toHaveLength(4);
  for (const corner of result.corners) {
    expect(corner.runningAnimations).toBe(0);
    expect(corner.hasNonZeroTransitionDuration).toBe(false);
    expect(corner.hasNonZeroAnimationDuration).toBe(false);
  }
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
    const cornerBoxes = [
      ...element.querySelectorAll<HTMLElement>('[data-slot="accordion-focus-corner"]'),
    ].map((corner) => {
      const bounds = corner.getBoundingClientRect();
      return { left: bounds.left, top: bounds.top, right: bounds.right, bottom: bounds.bottom };
    });
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
      cornerBoxes,
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
    for (const corner of geometry.cornerBoxes) {
      if (area.clipsX) {
        expect(corner.left).toBeGreaterThanOrEqual(area.left);
        expect(corner.right).toBeLessThanOrEqual(area.right);
      }
      if (area.clipsY) {
        expect(corner.top).toBeGreaterThanOrEqual(area.top);
        expect(corner.bottom).toBeLessThanOrEqual(area.bottom);
      }
    }
  }
}

for (const route of routes) {
  for (const theme of ['light', 'dark'] as const) {
    test(`FAQ accordion at ${route.path} shows ${theme} viewfinder focus corners and keeps keyboard behavior`, async ({
      page,
    }) => {
      const { trigger } = await loadFaq(page, route.path, theme);
      await expect(trigger).not.toBeFocused();
      await expectNoFullFocusFrame(trigger);
      await expectViewfinderCorners(trigger, false);
      await tabToTrigger(page, trigger);
      await expectNoFullFocusFrame(trigger);
      await expectViewfinderCorners(trigger, true);
      await expectNoFocusRingTransition(trigger);
      await expectFocusRingNotClipped(trigger);

      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await expect(trigger).toBeFocused();
      await expectNoFullFocusFrame(trigger);
      await expectViewfinderCorners(trigger, true);
      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      await expect(trigger).toBeFocused();
      await expectNoFullFocusFrame(trigger);
      await expectViewfinderCorners(trigger, true);

      await trigger.evaluate((element) => element.blur());
      await expect(trigger).not.toBeFocused();
      await expectViewfinderCorners(trigger, false);
      await trigger.click();
      await expect(trigger).toBeFocused();
      await expect
        .poll(() => trigger.evaluate((element) => element.matches(':focus-visible')))
        .toBe(false);
      await expectNoFullFocusFrame(trigger);
      await expectViewfinderCorners(trigger, false);
    });

    test(`FAQ accordion at ${route.path} in ${theme} mode uses the forced-colors focus outline`, async ({
      page,
    }) => {
      const { trigger } = await loadFaq(page, route.path, theme);
      await page.emulateMedia({ forcedColors: 'active' });
      expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
      await tabToTrigger(page, trigger);
      const corners = trigger.locator('[data-slot="accordion-focus-corner"]');
      await expect(corners).toHaveCount(4);
      expect(
        await corners.evaluateAll((elements) =>
          elements.map((corner) => getComputedStyle(corner).display)
        )
      ).toEqual(['none', 'none', 'none', 'none']);

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
        };
      });

      expect(styles.outlineStyle).toBe('solid');
      expect(styles.outlineWidth).toBe('3px');
      expect(styles.outlineColor).toBe(styles.highlight);
      await expectNoVisibleBoxShadow(trigger);
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
