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
    criterionStatus: 'cumple el criterio',
    highlight: [
      'Consulta los ',
      'términos de envío',
      ' o escribe a ',
      'soporte',
      ' si tu pedido no llega.',
      'Subrayador en enlaces de texto',
      'Un fondo de color barre el enlace y el texto pasa a blanco para conservar el contraste. Se lee como un rotulador.',
    ],
    viewfinder: [
      'Plan Equipo',
      'Hasta 25 personas · anual',
      'Esquinas de visor',
      'Cuatro escuadras, como el enfoque de una cámara, se cierran sobre la tarjeta. Marcan la posición con menos peso que un marco completo.',
    ],
    overlay: [
      'Ver ruta Valle Nevado',
      'Ver ruta →',
      'Capa sobre la imagen',
      'La imagen se cubre con un velo de color y la acción escrita. Con teclado suma un borde interior blanco para distinguirse del hover.',
    ],
    chips: [
      ['2.4.7', '2.4.13'],
      ['2.4.7', '1.4.11'],
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
    criterionStatus: 'meets the criterion',
    highlight: [
      'Check the ',
      'shipping terms',
      ' or contact ',
      'support',
      ' if your order doesn’t arrive.',
      'Highlighter on text links',
      'A color fill sweeps across the link and the text turns white to keep contrast. It reads like a marker pen.',
    ],
    viewfinder: [
      'Team plan',
      'Up to 25 people · yearly',
      'Viewfinder corners',
      'Four brackets, like a camera’s focus, close in on the card. They mark the position with less weight than a full frame.',
    ],
    overlay: [
      'View route: Valle Nevado',
      'View route →',
      'Overlay on the image',
      'The image is covered by a color veil with the action written on it. With the keyboard it adds a white inner border to stand apart from hover.',
    ],
    chips: [
      ['2.4.7', '2.4.13'],
      ['2.4.7', '1.4.11'],
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
const demoSelectors = ['button', 'nav a', '.hl', '.vis strong', '.thumb'] as const;

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

async function compositeColor(page: Page, layer: string, base: string) {
  return page.evaluate(
    ([foreground, background]) => {
      const context = document.createElement('canvas').getContext('2d');
      if (!context) throw new Error('Canvas 2D context is unavailable.');
      context.fillStyle = background;
      context.fillRect(0, 0, 1, 1);
      context.fillStyle = foreground;
      context.fillRect(0, 0, 1, 1);
      const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
      return `rgb(${red}, ${green}, ${blue})`;
    },
    [layer, base]
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

async function expectViewfinderFocus(page: Page, locator: Locator) {
  await expectTransparentOutline(locator);
  const styles = await locator.evaluate((node) => {
    const corners = getComputedStyle(node, '::before');
    return [corners.opacity, corners.transform, corners.backgroundImage];
  });
  const brandText = await page.locator('html').evaluate((root) => {
    const probe = document.createElement('span');
    probe.style.color = getComputedStyle(root).getPropertyValue('--brand-text').trim();
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  expect(styles[0]).toBe('1');
  expect(styles[1]).toBe('none');
  expect(styles[2]).toContain(brandText);
}

async function expectOverlayFocus(locator: Locator) {
  await expectTransparentOutline(locator);
  const styles = await locator.locator('.veil').evaluate((node) => {
    const css = getComputedStyle(node);
    return [css.opacity, css.boxShadow];
  });
  expect(styles[0]).toBe('1');
  expect(styles[1]).toContain('inset');
  expect(styles[1]).toContain('3px');
  expect(styles[1]).toContain('rgb(255, 255, 255)');
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
      const viewfinder = page.locator('#sin-anillo .vis');
      await viewfinder.hover();
      expect(await viewfinder.evaluate((node) => node.matches(':focus-visible'))).toBe(false);
      await expect
        .poll(() => viewfinder.evaluate((node) => getComputedStyle(node, '::before').opacity))
        .toBe('0');
      const overlay = page.locator('#sin-anillo .thumb');
      await overlay.hover();
      expect(await overlay.evaluate((node) => node.matches(':focus-visible'))).toBe(false);
      const veil = overlay.locator('.veil');
      await expect.poll(() => veil.evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
      expect(await veil.evaluate((node) => getComputedStyle(node).boxShadow)).toBe('none');
    },
  ] as const;
  await checks[Number(supportsHover)]();
}

test('navigation focus keeps the full underline while hovered', async ({ page }) => {
  await page.goto('/');
  const firstCard = page.locator('#sin-anillo .gallery article').first();
  const button = firstCard.getByRole('button');
  const buttonChips = await firstCard.locator('.chips a').all();
  const navLink = page.locator('#sin-anillo .gallery-nav a').first();

  await page.locator('#sin-anillo .more a').last().focus();
  for (const target of [button, ...buttonChips, navLink]) {
    await page.keyboard.press('Tab');
    await expect(target).toBeFocused();
  }
  expect(await navLink.evaluate((node) => node.matches(':focus-visible'))).toBe(true);

  await navLink.hover();
  await expect
    .poll(() => navLink.evaluate((node) => getComputedStyle(node, '::after').transform))
    .toBe('matrix(1, 0, 0, 1, 0, 0)');
});

for (const item of cases) {
  test(`${item.route} gallery renders exact copy, order and criteria`, async ({ page }) => {
    await page.goto(item.route);
    const cards = page.locator('#sin-anillo .gallery article');
    await expect(cards).toHaveCount(5);
    const titles = [
      item.button[1],
      item.nav[0],
      item.highlight[5],
      item.viewfinder[2],
      item.overlay[2],
    ];
    const descriptions = [
      item.button[2],
      item.nav[1],
      item.highlight[6],
      item.viewfinder[3],
      item.overlay[3],
    ];
    for (const [index, card] of (await cards.all()).entries()) {
      await expect(card.locator('h3')).toHaveText(titles[index]!);
      await expect(card.locator('.pat-info > p')).toHaveText(descriptions[index]!);
      const chips = card.locator('.chips a');
      await expect(chips).toHaveCount(item.chips[index]!.length);
      for (const [position, criterion] of item.chips[index]!.entries()) {
        const chip = chips.nth(position);
        await expect(chip).toHaveAttribute('href', urls[criterion]!);
        await expect(chip).toHaveAccessibleName(
          `${criterion} ${item.criterionTitles[criterionTitleIndexes[criterion]!]}, ${item.criterionStatus}`
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
    const viewfinderLink = cards.nth(3).locator('.vis');
    await expect(viewfinderLink).toHaveAttribute('href', '#sin-anillo');
    await expect(viewfinderLink).toHaveAccessibleName(
      `${item.viewfinder[0]} ${item.viewfinder[1]}`
    );
    await expect(viewfinderLink.locator('strong')).toHaveText(item.viewfinder[0]);
    await expect(viewfinderLink.locator('span')).toHaveText(item.viewfinder[1]);
    const overlayLink = cards.nth(4).locator('.thumb');
    await expect(overlayLink).toHaveAttribute('href', '#sin-anillo');
    await expect(overlayLink).toHaveAttribute('aria-label', item.overlay[0]);
    await expect(overlayLink).toHaveAccessibleName(item.overlay[0]);
    await expect(overlayLink.locator('.veil')).toHaveText(item.overlay[1]);
    await expect(overlayLink.locator('.veil')).toHaveAttribute('aria-hidden', 'true');
    await expect(cards.locator('details')).toHaveCount(0);
  });

  test(`${item.route} keyboard walks demos and chips in order`, async ({ page }) => {
    await page.goto(item.route);
    const cards = page.locator('#sin-anillo .gallery article');
    const checkButton = (locator: Locator) => expectButtonFocus(page, locator);
    const checkNav = (locator: Locator) => expectNavFocus(page, locator);
    const checkHighlighter = (locator: Locator) => expectHighlighterFocus(page, locator);
    const checkViewfinder = (locator: Locator) => expectViewfinderFocus(page, locator);
    const checkOverlay = (locator: Locator) => expectOverlayFocus(locator);
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
      { locator: cards.nth(3).locator('.vis'), check: checkViewfinder },
      ...(await cards.nth(3).locator('.chips a').all()).map((locator) => ({
        locator,
        check: expectChipFocus,
      })),
      { locator: cards.nth(4).locator('.thumb'), check: checkOverlay },
      ...(await cards.nth(4).locator('.chips a').all()).map((locator) => ({
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

  for (const theme of ['light', 'dark'] as const) {
    test(`${item.route} gallery text and focus states meet contrast in ${theme} mode`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((value) => localStorage.setItem('foco-theme', value), theme);
      await page.goto(item.route);
      expect(await page.locator('html').evaluate((node) => node.classList.contains('dark'))).toBe(
        theme === 'dark'
      );
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
      for (let index = 3; index < 5; index += 1) {
        const card = cards.nth(index);
        const [heading] = await colors(card.locator('h3'));
        const [description] = await colors(card.locator('.pat-info > p'));
        const [surface] = await card.evaluate((node) => [getComputedStyle(node).backgroundColor]);
        expect(await contrast(page, heading, surface)).toBeGreaterThanOrEqual(4.5);
        expect(await contrast(page, description, surface)).toBeGreaterThanOrEqual(4.5);
      }
      expect(await contrast(page, surfaces[3]!, surfaces[0]!)).toBeGreaterThanOrEqual(4.5);
      const badge = await colors(cards.nth(0).locator('.chips [data-slot="badge"]').first());
      expect(await contrast(page, ...badge)).toBeGreaterThanOrEqual(4.5);
      for (const card of await cards.all()) {
        for (const chip of await card.locator('.chips [data-slot="badge"]').all()) {
          const pair = await colors(chip);
          expect(await contrast(page, ...pair)).toBeGreaterThanOrEqual(4.5);
        }
      }
      const button = cards.nth(0).getByRole('button');
      await page.locator('#sin-anillo .more a').last().focus();
      await page.keyboard.press('Tab');
      await expect(button).toBeFocused();
      await waitForMotion(button);
      const focused = await colors(button);
      expect(await contrast(page, ...focused)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, focused[1], surfaces[0]!)).toBeGreaterThanOrEqual(3);
      const viewfinder = cards.nth(3).locator('.vis');
      const viewfinderSurface = await viewfinder.evaluate(
        (node) => getComputedStyle(node).backgroundColor
      );
      const [planText] = await colors(viewfinder.locator('strong'));
      const [planDetails] = await colors(viewfinder.locator('span'));
      expect(await contrast(page, planText, viewfinderSurface)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, planDetails, viewfinderSurface)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, surfaces[3]!, surfaces[0]!)).toBeGreaterThanOrEqual(3);
      const veil = cards.nth(4).locator('.veil');
      const veilLayer = await veil.evaluate((node) => getComputedStyle(node).backgroundColor);
      const veilText = await veil.evaluate((node) => getComputedStyle(node).color);
      const imageTokens = await page.locator('html').evaluate((root) => {
        const css = getComputedStyle(root);
        return [
          css.getPropertyValue('--thumb-cloud').trim(),
          css.getPropertyValue('--thumb-veil-border').trim(),
        ];
      });
      const veilSurface = await compositeColor(page, veilLayer, imageTokens[0]!);
      expect(await contrast(page, veilText, veilSurface)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, imageTokens[1]!, veilSurface)).toBeGreaterThanOrEqual(3);
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
    });
  }

  test(`${item.route} click does not activate focus-visible`, async ({ page }) => {
    await page.goto(item.route);
    const targets = [
      page.locator('#sin-anillo .gallery button'),
      page.locator('#sin-anillo .gallery-nav a').first(),
      page.locator('#sin-anillo .hl').first(),
      page.locator('#sin-anillo .vis'),
      page.locator('#sin-anillo .thumb'),
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
    const viewfinder = page.locator('#sin-anillo .vis');
    const overlay = page.locator('#sin-anillo .thumb');
    await expect(button).toHaveCSS('transition-duration', '0s');
    expect(await nav.evaluate((node) => getComputedStyle(node, '::after').transitionDuration)).toBe(
      '0s'
    );
    await expect(hl).toHaveCSS('transition-duration', '0s');
    expect(
      await viewfinder.evaluate((node) => getComputedStyle(node, '::before').transitionDuration)
    ).toBe('0s');
    await expect(overlay.locator('.veil')).toHaveCSS('transition-duration', '0s');

    const normalPage = await page.context().newPage();
    await normalPage.emulateMedia({ reducedMotion: 'no-preference' });
    await normalPage.goto(item.route);
    const normalNav = normalPage.locator('#sin-anillo .gallery-nav a').first();
    expect(
      await normalNav.evaluate((node) => getComputedStyle(node, '::after').transitionDuration)
    ).toBe('0.2s');
    const viewfinderDuration = await normalPage
      .locator('#sin-anillo .vis')
      .evaluate((node) => getComputedStyle(node, '::before').transitionDuration);
    expect(viewfinderDuration).not.toBe('0s');
    for (const seconds of viewfinderDuration
      .split(',')
      .map((duration) => Number.parseFloat(duration))) {
      expect(seconds).toBeGreaterThan(0);
      expect(seconds).toBeLessThanOrEqual(0.15);
    }
    const overlayDuration = await normalPage
      .locator('#sin-anillo .thumb .veil')
      .evaluate((node) => getComputedStyle(node).transitionDuration);
    expect(overlayDuration).not.toBe('0s');
    for (const seconds of overlayDuration
      .split(',')
      .map((duration) => Number.parseFloat(duration))) {
      expect(seconds).toBeGreaterThan(0);
      expect(seconds).toBeLessThanOrEqual(0.15);
    }
  });

  test(`${item.route} gallery fits narrow and wide viewports`, async ({ page }) => {
    for (const width of [320, 375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(item.route);
      await expect(page.locator('#sin-anillo .gallery article')).toHaveCount(5);
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
    const viewBox = await page
      .locator('#sin-anillo .gallery article')
      .nth(3)
      .locator('.vis')
      .boundingBox();
    const demoBox = await page
      .locator('#sin-anillo .gallery article')
      .nth(3)
      .locator('.pat-demo')
      .boundingBox();
    expect(viewBox).not.toBeNull();
    expect(demoBox).not.toBeNull();
    expect(viewBox!.x - 8).toBeGreaterThanOrEqual(demoBox!.x);
    expect(viewBox!.y - 8).toBeGreaterThanOrEqual(demoBox!.y);
    expect(viewBox!.x + viewBox!.width + 8).toBeLessThanOrEqual(demoBox!.x + demoBox!.width);
    expect(viewBox!.y + viewBox!.height + 8).toBeLessThanOrEqual(demoBox!.y + demoBox!.height);
  });
}
