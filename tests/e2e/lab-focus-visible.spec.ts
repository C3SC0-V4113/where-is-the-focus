import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

const locales = [
  {
    path: '/',
    locale: 'es',
    title: 'Laboratorio 1',
    task: 'Haz clic en los dos botones. Después recórrelos con',
    save: 'Guardar cambios',
    initial: 'Todavía no has interactuado con los botones.',
    statuses: [
      '◐Molesta Botón :focus con el ratón: el anillo se ve.',
      '✓Como se espera Botón :focus-visible con el ratón: el anillo no se ve.',
      '✓Como se espera Botón :focus con el teclado: el anillo se ve.',
      '✓Como se espera Botón :focus-visible con el teclado: el anillo se ve.',
    ],
  },
  {
    path: '/en/',
    locale: 'en',
    title: 'Lab 1',
    task: 'Click both buttons. Then move through them with',
    save: 'Save changes',
    initial: 'You haven’t interacted with the buttons yet.',
    statuses: [
      '◐Distracting Button :focus with the mouse: the ring is visible.',
      '✓As expected Button :focus-visible with the mouse: the ring is hidden.',
      '✓As expected Button :focus with the keyboard: the ring is visible.',
      '✓As expected Button :focus-visible with the keyboard: the ring is visible.',
    ],
  },
] as const;

type Theme = 'light' | 'dark';

async function loadLab(page: Page, path: string, theme: Theme) {
  await page.emulateMedia({ colorScheme: theme });
  await page.addInitScript((value) => localStorage.setItem('foco-theme', value), theme);
  await page.goto(path);

  const section = page.locator('#focus-visible');
  await section.scrollIntoViewIfNeeded();
  await expect
    .poll(() => page.locator('html').evaluate((element) => element.classList.contains('dark')))
    .toBe(theme === 'dark');

  const copy = locales.find((entry) => entry.path === path)!;
  const lab = section.locator('#lab-fv');
  await expect(lab).toBeVisible();
  await expect(lab.locator('.lab-title')).toHaveText(copy.title);
  const task = lab.locator('.lab-task');
  await expect(task).toContainText(copy.task);
  await expect(task.locator('kbd')).toHaveText('Tab');
  const buttons = lab.getByRole('button', { name: copy.save, exact: true });
  await expect(buttons).toHaveCount(2);
  const buttonIsland = buttons.first().locator('xpath=ancestor::astro-island[1]');
  await expect(buttonIsland).toHaveCount(1);
  await expect(buttonIsland).not.toHaveAttribute('ssr');
  const status = lab.locator('[aria-live="polite"]');
  await expect(status).toHaveText(copy.initial);
  return { lab, buttons, status, copy };
}

async function tabToButton(page: Page, button: Locator) {
  const maxTabs = await page
    .locator(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]'
    )
    .count();

  for (let index = 0; index <= maxTabs; index += 1) {
    await page.keyboard.press('Tab');
    if (await button.evaluate((element) => document.activeElement === element)) {
      await expect(button).toBeFocused();
      await expect
        .poll(() => button.evaluate((element) => element.matches(':focus-visible')))
        .toBe(true);
      return;
    }
  }

  throw new Error('Tab did not reach the requested Lab 1 button.');
}

async function buttonMetrics(button: Locator) {
  return button.evaluate((element) => {
    const style = getComputedStyle(element);
    const resolveToken = (token: string) => {
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
      return context.getImageData(0, 0, 1, 1).data[3]!;
    };
    const boxShadow = style.boxShadow;
    const shadowLayers = boxShadow.split(/,(?![^()]*\))/);
    const boxShadowInvisible =
      boxShadow === 'none' ||
      shadowLayers.every((layer) => {
        const firstLength = layer.search(/-?\d*\.?\d+px/);
        const lengths = layer.match(/-?\d*\.?\d+px/g)?.map(Number.parseFloat) ?? [];
        return (
          firstLength >= 0 &&
          lengths.length === 4 &&
          lengths.every((length) => length === 0) &&
          alpha(layer.slice(0, firstLength).trim()) === 0
        );
      });
    const transitions = element
      .getAnimations()
      .filter(
        (animation) =>
          animation instanceof CSSTransition &&
          animation.playState === 'running' &&
          /^(outline(?:-|$)|box-shadow$)/.test(animation.transitionProperty)
      );
    const transitionProperties = style.transitionProperty
      .split(',')
      .map((property) => property.trim());

    return {
      focused: document.activeElement === element,
      focusVisible: element.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
      outlineColor: style.outlineColor,
      expectedDestructive: resolveToken('--destructive-text'),
      expectedRing: resolveToken('--ring'),
      outlineAlpha: alpha(style.outlineColor),
      boxShadowInvisible,
      borderColors: [
        style.borderTopColor,
        style.borderRightColor,
        style.borderBottomColor,
        style.borderLeftColor,
      ],
      noOutlineTransition:
        transitions.length === 0 &&
        !transitionProperties.includes('all') &&
        !transitionProperties.some(
          (property) => property.startsWith('outline') || property === 'box-shadow'
        ),
    };
  });
}

async function expectButtonStyle(
  button: Locator,
  outline: 'destructive' | 'ring' | 'none',
  focusVisible: boolean | null
) {
  const metrics = await buttonMetrics(button);
  expect(metrics.focused).toBe(true);
  if (focusVisible !== null) expect(metrics.focusVisible).toBe(focusVisible);
  expect(metrics.boxShadowInvisible).toBe(true);
  expect(metrics.borderColors).toEqual(Array(4).fill('rgba(0, 0, 0, 0)'));
  expect(metrics.noOutlineTransition).toBe(true);

  if (outline === 'none') {
    expect(metrics.outlineStyle === 'none' || metrics.outlineAlpha === 0).toBe(true);
    return;
  }

  expect(metrics.outlineStyle).toBe('solid');
  expect(metrics.outlineWidth).toBe('3px');
  expect(metrics.outlineOffset).toBe('3px');
  expect(metrics.outlineColor).toBe(
    outline === 'destructive' ? metrics.expectedDestructive : metrics.expectedRing
  );
}

async function outlineContrast(button: Locator) {
  return button.evaluate((element) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context is unavailable.');
    const luminance = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [red, green, blue] = [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)].map(
        (channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        }
      );
      return 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;
    };
    const card = element.closest('.pair > div') ?? element.parentElement;
    if (!card) throw new Error('Lab button has no card background.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, 1, 1);
    const backgrounds: string[] = [];
    for (let node: Element | null = card; node; node = node.parentElement) {
      backgrounds.push(getComputedStyle(node).backgroundColor);
    }
    backgrounds.reverse().forEach((color) => {
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
    });
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
    const background = `rgb(${red} ${green} ${blue})`;
    const [light, dark] = [
      luminance(getComputedStyle(element).outlineColor),
      luminance(background),
    ].sort((a, b) => b - a);
    return (light! + 0.05) / (dark! + 0.05);
  });
}

for (const route of locales) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${route.path} Lab 1 pointer activation distinguishes :focus from :focus-visible in ${theme}`, async ({
      page,
    }) => {
      const { buttons, status, copy } = await loadLab(page, route.path, theme);
      await buttons.nth(0).click();
      await expectButtonStyle(buttons.nth(0), 'destructive', null);
      await expect(status).toHaveText(copy.statuses[0]);
      await buttons.nth(1).click();
      await expectButtonStyle(buttons.nth(1), 'none', false);
      await expect(status).toHaveText(copy.statuses[1]);
    });

    test(`${route.path} Lab 1 keyboard focus has visible, contrasting outlines in ${theme}`, async ({
      page,
    }) => {
      const { buttons, status, copy } = await loadLab(page, route.path, theme);
      await tabToButton(page, buttons.nth(0));
      await expectButtonStyle(buttons.nth(0), 'destructive', true);
      await expect(status).toHaveText(copy.statuses[2]);
      expect(await outlineContrast(buttons.nth(0))).toBeGreaterThanOrEqual(3);
      await page.keyboard.press('Tab');
      await expect(buttons.nth(1)).toBeFocused();
      await expect
        .poll(() => buttons.nth(1).evaluate((element) => element.matches(':focus-visible')))
        .toBe(true);
      await expectButtonStyle(buttons.nth(1), 'ring', true);
      await expect(status).toHaveText(copy.statuses[3]);
      expect(await outlineContrast(buttons.nth(1))).toBeGreaterThanOrEqual(3);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(results.violations).toEqual([]);
    });

    test(`${route.path} Lab 1 buttons retain a system focus outline in forced colors in ${theme}`, async ({
      page,
    }) => {
      const { buttons } = await loadLab(page, route.path, theme);
      await page.emulateMedia({ forcedColors: 'active' });
      expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);

      for (const button of [buttons.nth(0), buttons.nth(1)]) {
        await tabToButton(page, button);
        const outline = await button.evaluate((element) => {
          const style = getComputedStyle(element);
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Canvas 2D context is unavailable.');
          context.fillStyle = style.outlineColor;
          context.fillRect(0, 0, 1, 1);
          return {
            style: style.outlineStyle,
            width: Number.parseFloat(style.outlineWidth),
            alpha: context.getImageData(0, 0, 1, 1).data[3],
            focusVisible: element.matches(':focus-visible'),
          };
        });
        expect(outline.style).toBe('solid');
        expect(outline.width).toBeGreaterThanOrEqual(2);
        expect(outline.alpha).toBeGreaterThan(0);
        expect(outline.focusVisible).toBe(true);
      }
    });
  }

  test(`${route.path} Lab 1 cards stack at 375px without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    const { buttons } = await loadLab(page, route.path, 'light');
    const cards = buttons.locator('..');
    await expect(cards).toHaveCount(2);
    const [first, second] = await Promise.all([
      cards.nth(0).boundingBox(),
      cards.nth(1).boundingBox(),
    ]);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second!.y).toBeGreaterThan(first!.y);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ).toBeLessThanOrEqual(0);
  });
}
