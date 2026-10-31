import { expect, test, type Locator, type Page } from '@playwright/test';

const cases = [
  {
    route: '/',
    button: [
      'Descargar informe',
      'Botón que se invierte',
      'El botón de contorno se rellena con el color del texto. El cambio ocupa toda la superficie y supera el criterio AAA sin añadir nada alrededor.',
    ],
    navName: 'Ejemplo de navegación',
    navLinks: ['Inicio', 'Productos', 'Precios', 'Ayuda'],
    nav: [
      'Subrayado parcial y completo',
      'Con el ratón aparece un trazo corto. Con teclado el subrayado cubre la palabra entera y el texto cambia de color, así hover y foco nunca se confunden.',
    ],
    criterionTitles: [
      'Foco visible',
      'Foco no oculto',
      'Contraste no textual',
      'Apariencia del foco',
    ],
    highlight: [
      'Consulta los ',
      'términos de envío',
      ' o escribe a ',
      'soporte',
      ' si tu pedido no llega.',
      'Subrayador en enlaces de texto',
      'Un fondo de color barre el enlace y el texto pasa a blanco para conservar el contraste. Se lee como un rotulador.',
    ],
    chips: [
      ['2.4.7', '2.4.13'],
      ['2.4.7', '1.4.11'],
      ['2.4.7', '2.4.13'],
    ],
  },
  {
    route: '/en/',
    button: [
      'Download report',
      'Button that inverts',
      'The outline button fills with the text color. The change covers the whole surface and exceeds the AAA criterion without adding anything around it.',
    ],
    navName: 'Navigation example',
    navLinks: ['Home', 'Products', 'Pricing', 'Help'],
    nav: [
      'Partial and full underline',
      'With the mouse a short stroke appears. With the keyboard the underline covers the whole word and the text changes color, so hover and focus are never confused.',
    ],
    criterionTitles: [
      'Focus visible',
      'Focus not obscured',
      'Non-text contrast',
      'Focus appearance',
    ],
    highlight: [
      'Check the ',
      'shipping terms',
      ' or contact ',
      'support',
      ' if your order doesn’t arrive.',
      'Highlighter on text links',
      'A color fill sweeps across the link and the text turns white to keep contrast. It reads like a marker pen.',
    ],
    chips: [
      ['2.4.7', '2.4.13'],
      ['2.4.7', '1.4.11'],
      ['2.4.7', '2.4.13'],
    ],
  },
] as const;
const urls: Record<string, string> = {
  '2.4.7': 'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html',
  '2.4.13': 'https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html',
  '1.4.11': 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html',
};
const criterionTitleIndexes: Record<string, number> = {
  '2.4.7': 0,
  '2.4.11': 1,
  '1.4.11': 2,
  '2.4.13': 3,
};
const demoSelectors = ['button', 'nav a', '.hl'] as const;

async function colors(locator: Locator) {
  return locator.evaluate((node) => {
    const style = getComputedStyle(node);
    return [style.color, style.backgroundColor] as [string, string];
  });
}

async function colorPixels(page: Page, values: string[]) {
  return page.evaluate((colors) => {
    const context = document.createElement('canvas').getContext('2d');
    if (!context) throw new Error('Canvas 2D context is unavailable.');
    return colors.map((color) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    });
  }, values);
}

async function waitForMotion(locator: Locator) {
  await locator.evaluate(async (node) => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await Promise.all(
      node.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {}))
    );
  });
}

async function contrast(page: Page, ink: string, paper: string) {
  return page.evaluate(
    ([foreground, background]) => {
      const context = document.createElement('canvas').getContext('2d');
      if (!context) throw new Error('Canvas 2D context is unavailable.');
      const luminance = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const channels = [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)].map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
      };
      const [a, b] = [luminance(foreground), luminance(background)].sort((x, y) => y - x);
      return (a! + 0.05) / (b! + 0.05);
    },
    [ink, paper]
  );
}

async function expectTransparentOutline(locator: Locator) {
  await waitForMotion(locator);
  const style = await locator.evaluate((node) => {
    const css = getComputedStyle(node);
    return [css.outlineStyle, css.outlineWidth, css.outlineColor, css.boxShadow];
  });
  expect(style).toEqual(['solid', '2px', 'rgba(0, 0, 0, 0)', 'none']);
}

async function expectChipFocus(locator: Locator) {
  const style = await locator.evaluate((node) => {
    const css = getComputedStyle(node);
    return [css.outlineStyle, css.outlineWidth, css.boxShadow];
  });
  expect(style.slice(0, 2)).toEqual(['solid', '2px']);
  expect(style[2]).toContain('2px');
  expect(style[2]).toContain('5px');
}

async function expectButtonFocus(page: Page, locator: Locator) {
  await expectTransparentOutline(locator);
  const actual = await colors(locator);
  const expected = await page.evaluate(() => {
    const css = getComputedStyle(document.documentElement);
    return [
      css.getPropertyValue('--background').trim(),
      css.getPropertyValue('--foreground').trim(),
    ];
  });
  expect(await colorPixels(page, actual)).toEqual(await colorPixels(page, expected));
}

async function expectNavFocus(page: Page, locator: Locator) {
  await expectTransparentOutline(locator);
  const [color, underline] = await locator.evaluate((node) => [
    getComputedStyle(node).color,
    getComputedStyle(node, '::after').transform,
  ]);
  const brandText = await page
    .locator('html')
    .evaluate((node) => getComputedStyle(node).getPropertyValue('--brand-text').trim());
  expect(await colorPixels(page, [color!, brandText])).toEqual(
    await colorPixels(page, [brandText, brandText])
  );
  expect(underline).toBe('matrix(1, 0, 0, 1, 0, 0)');
}

async function expectHighlighterFocus(page: Page, locator: Locator) {
  await expectTransparentOutline(locator);
  const [color, size] = await locator.evaluate((node) => [
    getComputedStyle(node).color,
    getComputedStyle(node).backgroundSize,
  ]);
  const brandForeground = await page
    .locator('html')
    .evaluate((node) => getComputedStyle(node).getPropertyValue('--brand-foreground').trim());
  expect(await colorPixels(page, [color!, brandForeground])).toEqual(
    await colorPixels(page, [brandForeground, brandForeground])
  );
  expect(size).toBe('100% 100%');
}

async function expectHoverState(page: Page) {
  const supportsHover = await page.evaluate(() => matchMedia('(hover: hover)').matches);
  const checks = [
    async () => expect(supportsHover).toBe(false),
    async () => {
      const button = page.locator('#sin-anillo .gallery button');
      await button.hover();
      expect(await button.evaluate((node) => node.matches(':focus-visible'))).toBe(false);
      const [, hoverBackground] = await colors(button);
      const foreground = await page
        .locator('html')
        .evaluate((node) => getComputedStyle(node).getPropertyValue('--foreground').trim());
      expect(hoverBackground).not.toBe(foreground);
      const nav = page.locator('#sin-anillo .gallery-nav a').first();
      await nav.hover();
      await expect
        .poll(() => nav.evaluate((node) => getComputedStyle(node, '::after').transform))
        .toBe('matrix(0.35, 0, 0, 1, 0, 0)');
      const highlighter = page.locator('#sin-anillo .hl').first();
      await highlighter.hover();
      await expect(highlighter).toHaveCSS('background-size', '0% 100%');
    },
  ] as const;
  await checks[Number(supportsHover)]();
}

for (const item of cases) {
  test(`${item.route} gallery renders exact copy, order and criteria`, async ({ page }) => {
    await page.goto(item.route);
    const cards = page.locator('#sin-anillo .gallery article');
    await expect(cards).toHaveCount(3);
    for (const [index, card] of (await cards.all()).entries()) {
      await expect(card.locator('h3')).toHaveText(
        [item.button[1], item.nav[0], item.highlight[5]][index]!
      );
      await expect(card.locator('.pat-info > p')).toHaveText(
        [item.button[2], item.nav[1], item.highlight[6]][index]!
      );
      const chips = card.locator('.chips a');
      await expect(chips).toHaveCount(item.chips[index]!.length);
      for (const [position, criterion] of item.chips[index]!.entries()) {
        const chip = chips.nth(position);
        await expect(chip).toHaveAttribute('href', urls[criterion]!);
        await expect(chip).toHaveAccessibleName(
          `${criterion} ${item.criterionTitles[criterionTitleIndexes[criterion]!]}`
        );
        await expect(chip.locator('[data-slot="badge"]')).toContainText(criterion);
        await expect(chip.locator('[data-slot="badge"]')).toHaveClass(/bg-success-muted/);
      }
    }
    await expect(cards.nth(0).getByRole('button', { name: item.button[0] })).toHaveAttribute(
      'type',
      'button'
    );
    const nav = cards.nth(1).getByRole('navigation', { name: item.navName });
    await expect(nav.getByRole('link')).toHaveText(item.navLinks);
    for (const link of await nav.getByRole('link').all())
      await expect(link).toHaveAttribute('href', '#sin-anillo');
    const text = cards.nth(2).locator('.hl-p');
    await expect(text).toHaveText(item.highlight.slice(0, 5).join(''));
    await expect(text.getByRole('link')).toHaveText([item.highlight[1], item.highlight[3]]);
    for (const link of await text.getByRole('link').all())
      await expect(link).toHaveAttribute('href', '#sin-anillo');
    await expect(cards.locator('details')).toHaveCount(0);
  });

  test(`${item.route} keyboard walks demos and chips in order`, async ({ page }) => {
    await page.goto(item.route);
    const cards = page.locator('#sin-anillo .gallery article');
    const checkButton = (locator: Locator) => expectButtonFocus(page, locator);
    const checkNav = (locator: Locator) => expectNavFocus(page, locator);
    const checkHighlighter = (locator: Locator) => expectHighlighterFocus(page, locator);
    const sequence = [
      { locator: cards.nth(0).getByRole('button'), check: checkButton },
      ...(await cards.nth(0).locator('.chips a').all()).map((locator) => ({
        locator,
        check: expectChipFocus,
      })),
      ...(await cards.nth(1).locator('nav a').all()).map((locator) => ({
        locator,
        check: checkNav,
      })),
      ...(await cards.nth(1).locator('.chips a').all()).map((locator) => ({
        locator,
        check: expectChipFocus,
      })),
      ...(await cards.nth(2).locator('.hl').all()).map((locator) => ({
        locator,
        check: checkHighlighter,
      })),
      ...(await cards.nth(2).locator('.chips a').all()).map((locator) => ({
        locator,
        check: expectChipFocus,
      })),
    ];
    await page.locator('#sin-anillo .more a').last().focus();
    for (const { locator, check } of sequence) {
      await page.keyboard.press('Tab');
      await expect(locator).toBeFocused();
      await check(locator);
    }
  });

  test(`${item.route} gallery text and focus states meet contrast`, async ({ page }) => {
    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((value) => localStorage.setItem('foco-theme', value), theme);
      await page.goto(item.route);
      const cards = page.locator('#sin-anillo .gallery article');
      const surfaces = await page.evaluate(() => {
        const css = getComputedStyle(document.documentElement);
        return [
          css.getPropertyValue('--background').trim(),
          css.getPropertyValue('--brand').trim(),
          css.getPropertyValue('--brand-foreground').trim(),
          css.getPropertyValue('--brand-text').trim(),
        ];
      });
      for (let index = 0; index < 3; index += 1) {
        const card = cards.nth(index);
        const demoInk = await card
          .locator(demoSelectors[index]!)
          .first()
          .evaluate((node) => getComputedStyle(node).color);
        expect(await contrast(page, demoInk, surfaces[0]!)).toBeGreaterThanOrEqual(4.5);
        const [heading] = await colors(card.locator('h3'));
        const [description] = await colors(card.locator('.pat-info > p'));
        const [surface] = await card.evaluate((node) => [getComputedStyle(node).backgroundColor]);
        expect(await contrast(page, heading, surface)).toBeGreaterThanOrEqual(4.5);
        expect(await contrast(page, description, surface)).toBeGreaterThanOrEqual(4.5);
      }
      expect(await contrast(page, surfaces[3]!, surfaces[0]!)).toBeGreaterThanOrEqual(4.5);
      const badge = await colors(cards.nth(0).locator('.chips [data-slot="badge"]').first());
      expect(await contrast(page, ...badge)).toBeGreaterThanOrEqual(4.5);
      const button = cards.nth(0).getByRole('button');
      await page.locator('#sin-anillo .more a').last().focus();
      await page.keyboard.press('Tab');
      await expect(button).toBeFocused();
      await waitForMotion(button);
      const focused = await colors(button);
      expect(await contrast(page, ...focused)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, focused[1], surfaces[0]!)).toBeGreaterThanOrEqual(3);
      const highlighter = cards.nth(2).locator('.hl').first();
      const focusOrder = [
        button,
        ...(await cards.nth(0).locator('.chips a').all()),
        ...(await cards.nth(1).locator('nav a').all()),
        ...(await cards.nth(1).locator('.chips a').all()),
        highlighter,
      ];
      await page.locator('#sin-anillo .more a').last().focus();
      for (const target of focusOrder) {
        await page.keyboard.press('Tab');
        await expect(target).toBeFocused();
      }
      expect(await highlighter.evaluate((node) => node.matches(':focus-visible'))).toBe(true);
      expect(await contrast(page, surfaces[2]!, surfaces[1]!)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, surfaces[1]!, surfaces[0]!)).toBeGreaterThanOrEqual(3);
    }
  });

  test(`${item.route} click does not activate focus-visible`, async ({ page }) => {
    await page.goto(item.route);
    const targets = [
      page.locator('#sin-anillo .gallery button'),
      page.locator('#sin-anillo .gallery-nav a').first(),
      page.locator('#sin-anillo .hl').first(),
    ];
    for (const target of targets) {
      await target.click();
      expect(await target.evaluate((node) => node.matches(':focus-visible'))).toBe(false);
    }
  });

  test(`${item.route} hover differs from keyboard focus`, async ({ page }) => {
    await page.goto(item.route);
    await expect(page.locator('#sin-anillo .gallery')).toBeVisible();
    await expectHoverState(page);
  });

  test(`${item.route} reduced motion removes gallery transitions`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(item.route);
    const button = page.locator('#sin-anillo .gallery button');
    const nav = page.locator('#sin-anillo .gallery-nav a').first();
    const hl = page.locator('#sin-anillo .hl').first();
    await expect(button).toHaveCSS('transition-duration', '0s');
    await expect(nav).toHaveCSS('transition-duration', '0s');
    await expect(hl).toHaveCSS('transition-duration', '0s');
  });

  test(`${item.route} gallery fits narrow and wide viewports`, async ({ page }) => {
    for (const width of [320, 375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(item.route);
      await expect(page.locator('#sin-anillo .gallery article')).toHaveCount(3);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(item.route);
    expect(
      await page
        .locator('#sin-anillo .gallery')
        .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length)
    ).toBe(1);
    for (const card of await page.locator('#sin-anillo .gallery article').all()) {
      const box = await card.boundingBox();
      expect(box?.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(320);
    }
  });
}
