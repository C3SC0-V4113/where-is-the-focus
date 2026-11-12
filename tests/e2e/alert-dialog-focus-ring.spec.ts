import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const locales = [
  { path: '/', trigger: 'Eliminar proyecto (:focus-visible)', cancel: 'Cancelar' },
  { path: '/en/', trigger: 'Delete project (:focus-visible)', cancel: 'Cancel' },
] as const;

type Theme = 'light' | 'dark';

async function loadDialog(page: Page, path: string, theme: Theme, pausePopupAnimations = false) {
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((value: Theme) => localStorage.setItem('foco-theme', value), theme);
  await page.goto(path);
  await expect
    .poll(() => page.locator('html').evaluate((element) => element.classList.contains('dark')))
    .toBe(theme === 'dark');
  if (pausePopupAnimations) {
    await page.addStyleTag({
      content: '[data-slot="alert-dialog-content"] { animation-play-state: paused !important; }',
    });
  }

  const lab = page.locator('#lab-modal');
  await lab.scrollIntoViewIfNeeded();
  const trigger = lab.getByRole('button', {
    name: locales.find((locale) => locale.path === path)!.trigger,
    exact: true,
  });
  await expect(trigger).toBeVisible();
  const island = trigger.locator('xpath=ancestor::astro-island[1]');
  await expect(island).toHaveCount(1);
  await expect(island).not.toHaveAttribute('ssr');
  const count = await page
    .locator(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]'
    )
    .count();
  for (let index = 0; index <= count; index += 1) {
    await page.keyboard.press('Tab');
    if (await trigger.evaluate((element) => document.activeElement === element)) break;
    if (index === count) throw new Error('Tab did not reach the Lab 5 AlertDialog trigger.');
  }
  await expect(trigger).toBeFocused();
  await expect
    .poll(() => trigger.evaluate((element) => element.matches(':focus-visible')))
    .toBe(true);
  await page.keyboard.press('Enter');
  const popup = page.locator('[data-slot="alert-dialog-content"]');
  await expect(popup).toBeVisible();
  const cancel = popup.getByRole('button', {
    name: locales.find((locale) => locale.path === path)!.cancel,
    exact: true,
  });
  await expect(cancel).toBeFocused();
  return { popup, cancel };
}

async function expectGlobalFocusRing(element: Locator) {
  const styles = await element.evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
    const computed = getComputedStyle(node);
    const probe = document.createElement('span');
    document.body.append(probe);
    const root = getComputedStyle(document.documentElement);
    probe.style.color = root.getPropertyValue('--background').trim();
    const background = getComputedStyle(probe).color;
    probe.style.color = root.getPropertyValue('--ring').trim();
    const ring = getComputedStyle(probe).color;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context is unavailable.');
    const alpha = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return context.getImageData(0, 0, 1, 1).data[3]! / 255;
    };
    const result = {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      outlineOffset: computed.outlineOffset,
      boxShadow: computed.boxShadow,
      background,
      ring,
      backgroundAlpha: alpha(background),
      ringAlpha: alpha(ring),
    };
    probe.remove();
    return result;
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('2px');
  expect(styles.outlineColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.outlineOffset).toBe('2px');
  expect(styles.backgroundAlpha).toBe(1);
  expect(styles.ringAlpha).toBe(1);
  const layers = styles.boxShadow.split(/,(?![^()]*\))/);
  expect(layers).toHaveLength(2);
  expect(layers[0]).toContain(styles.background);
  expect(layers[0]).toMatch(/0px 0px 0px 2px/);
  expect(layers[1]).toContain(styles.ring);
  expect(layers[1]).toMatch(/0px 0px 0px 5px/);
}

async function expectForcedColorsRing(element: Locator) {
  const styles = await element.evaluate(async (node) => {
    await Promise.all(node.getAnimations().map((animation) => animation.finished));
    const computed = getComputedStyle(node);
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

async function waitForDialogAnimations(page: Page, popup: Locator) {
  const overlay = page.locator('[data-slot="alert-dialog-overlay"]');
  await Promise.all(
    [popup, overlay].map((element) =>
      element.evaluate(async (node) => {
        await Promise.all(node.getAnimations().map((animation) => animation.finished));
      })
    )
  );
}

for (const locale of locales) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${locale.path} AlertDialog keeps the global keyboard ring in ${theme}`, async ({
      page,
    }) => {
      const { popup, cancel } = await loadDialog(page, locale.path, theme);
      await expect(cancel).toBeFocused();
      await expect
        .poll(() => cancel.evaluate((element) => element.matches(':focus-visible')))
        .toBe(true);
      await expectGlobalFocusRing(cancel);

      const action = popup.getByRole('button', {
        name: locale.path === '/' ? 'Eliminar' : 'Delete',
        exact: true,
      });
      await page.keyboard.press('Tab');
      await expect(action).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(cancel).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(action).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(cancel).toBeFocused();
      expect(await popup.evaluate((element) => document.activeElement === element)).toBe(false);

      await waitForDialogAnimations(page, popup);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test(`${locale.path} AlertDialog uses the system outline in forced colors`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    const { popup, cancel } = await loadDialog(page, locale.path, 'light');
    await expectForcedColorsRing(cancel);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(cancel).toBeFocused();
    await popup.evaluate((element) => (element as HTMLElement).focus());
    await expect
      .poll(() => popup.evaluate((element) => element.matches(':focus-visible')))
      .toBe(true);
    await expectForcedColorsRing(popup);
    const expectedSystemColor = await popup.evaluate((element) => {
      const probe = document.createElement('span');
      probe.style.color = 'Highlight';
      document.body.append(probe);
      const color = getComputedStyle(probe).color;
      probe.remove();
      return { actual: getComputedStyle(element).outlineColor, expected: color };
    });
    expect(expectedSystemColor.actual).toBe(expectedSystemColor.expected);
    await expect(popup).toBeVisible();
    await page.keyboard.press('Tab');
    expect(await popup.evaluate((element) => document.activeElement === element)).toBe(false);
  });

  test(`${locale.path} AlertDialog reduces scale motion while preserving opacity`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const { popup, cancel } = await loadDialog(page, locale.path, 'light', true);
    const entry = await popup.evaluate((element) => {
      const animations = element.getAnimations();
      if (animations.length === 0) throw new Error('AlertDialog entry animation is unavailable.');
      animations.forEach((animation) => animation.pause());
      animations.forEach((animation) => (animation.currentTime = 0));
      const startTransform = getComputedStyle(element).transform;
      const startOpacity = getComputedStyle(element).opacity;
      const duration = Math.max(
        ...animations.map((animation) => Number(animation.effect?.getComputedTiming().duration))
      );
      animations.forEach((animation) => (animation.currentTime = Math.max(0, duration - 1)));
      return {
        startTransform,
        endTransform: getComputedStyle(element).transform,
        startOpacity,
        endOpacity: getComputedStyle(element).opacity,
      };
    });
    const identity = 'matrix(1, 0, 0, 1, 0, 0)';
    expect(entry.startTransform).toBe(identity);
    expect(entry.endTransform).toBe(identity);
    expect(Number(entry.startOpacity)).toBe(0);
    expect(Number(entry.endOpacity)).toBeGreaterThan(0.99);

    await cancel.click();
    await expect(popup).toHaveAttribute('data-closed', '');
    const exit = await popup.evaluate((element) => {
      const animations = element.getAnimations();
      if (animations.length === 0) throw new Error('AlertDialog exit animation is unavailable.');
      animations.forEach((animation) => animation.pause());
      animations.forEach((animation) => (animation.currentTime = 0));
      const startTransform = getComputedStyle(element).transform;
      const startOpacity = getComputedStyle(element).opacity;
      const duration = Math.max(
        ...animations.map((animation) => Number(animation.effect?.getComputedTiming().duration))
      );
      animations.forEach((animation) => (animation.currentTime = Math.max(0, duration - 1)));
      return {
        startTransform,
        endTransform: getComputedStyle(element).transform,
        startOpacity,
        endOpacity: getComputedStyle(element).opacity,
      };
    });
    expect(exit.startTransform).toBe(identity);
    expect(exit.endTransform).toBe(identity);
    expect(Number(exit.startOpacity)).toBe(1);
    expect(Number(exit.endOpacity)).toBeLessThan(0.01);
  });

  test(`${locale.path} AlertDialog keeps its normal entry scale without reduced motion`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const { popup } = await loadDialog(page, locale.path, 'light', true);
    const animationState = await popup.evaluate((element) => {
      const animation = element.getAnimations()[0];
      if (!animation) throw new Error('AlertDialog entry animation is unavailable.');
      animation.pause();
      animation.currentTime = 0;
      const computed = getComputedStyle(element);
      const value = { transform: computed.transform, opacity: computed.opacity };
      animation.cancel();
      return value;
    });
    expect(animationState.transform).not.toBe('matrix(1, 0, 0, 1, 0, 0)');
    expect(animationState.transform).toContain('0.95');
    expect(animationState.opacity).toBe('0');

    const cancel = popup.getByRole('button', { name: locale.cancel, exact: true });
    await cancel.click();
    await expect(popup).toHaveAttribute('data-closed', '');
    const exitAnimationState = await popup.evaluate((element) => {
      const animations = element.getAnimations();
      if (animations.length === 0) throw new Error('AlertDialog exit animation is unavailable.');
      animations.forEach((animation) => animation.pause());
      animations.forEach((animation) => (animation.currentTime = 0));
      const startTransform = getComputedStyle(element).transform;
      const duration = Math.max(
        ...animations.map((animation) => Number(animation.effect?.getComputedTiming().duration))
      );
      animations.forEach((animation) => (animation.currentTime = Math.max(0, duration - 1)));
      return {
        startTransform,
        endTransform: getComputedStyle(element).transform,
      };
    });
    expect(exitAnimationState.startTransform).toBe('matrix(1, 0, 0, 1, 0, 0)');
    expect(exitAnimationState.endTransform).toContain('0.95');
  });
}
