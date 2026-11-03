import { expect, test, type Locator, type Page } from '@playwright/test';

const cases = [
  {
    route: '/',
    field: [
      'Correo electrónico',
      'nombre@empresa.com',
      'Línea que crece bajo el campo',
      'La línea inferior es el único indicador visual del foco: pasa de 1,5 px gris a 3 px de color. En campos de texto también aparece con el clic, porque indica dónde se escribe. Para 2.4.13 tendría que llegar a unos 5 px.',
    ],
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
    criterionPartialStatus: 'cumple AA pero no AAA, o solo en parte de la superficie',
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
      ['2.4.7', '1.4.11', '2.4.13'],
      ['2.4.7', '2.4.13'],
      ['2.4.7', '1.4.11'],
      ['2.4.7', '2.4.13'],
      ['2.4.7', '1.4.11'],
      ['2.4.7', '2.4.13'],
    ],
  },
  {
    route: '/en/',
    field: [
      'Email',
      'name@company.com',
      'Line that grows under the field',
      'The underline is the only visual focus indicator: it goes from 1.5 px gray to 3 px of color. In text fields it also appears on click because it shows where you’re typing. For 2.4.13 it would need to reach about 5 px.',
    ],
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
    criterionPartialStatus: 'meets AA but not AAA, or only on part of the surface',
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
      ['2.4.7', '1.4.11', '2.4.13'],
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
const chipExpectationsByRoute = new Map(
  cases.map((item) => [
    item.route,
    item.chips.map((cardChips, cardIndex) =>
      cardChips.map((criterion) => {
        const partial = cardIndex === 0 && criterion === '2.4.13';
        return {
          criterion,
          href: urls[criterion]!,
          status: partial ? item.criterionPartialStatus : item.criterionStatus,
          badgeClass: partial ? /bg-warning-muted/ : /bg-success-muted/,
          marker: partial ? '◐' : '✓',
        };
      })
    ),
  ])
);
const demoSelectors = ['input', 'button', 'nav a', '.hl', '.vis strong', '.thumb'] as const;

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

function splitShadowList(value: string) {
  const shadows: string[] = [];
  let depth = 0;
  let start = 0;
  for (const [index, character] of [...value].entries()) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      shadows.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  shadows.push(value.slice(start).trim());
  return shadows;
}

function colorAlpha(value: string) {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  const channels =
    match?.[1]
      ?.trim()
      .split(/[\s,/]+/)
      .filter(Boolean) ?? [];
  return channels.length === 4 ? Number(channels[3]) : 1;
}

function hasVisibleBoxShadow(value: string) {
  if (value === 'none') return false;
  return splitShadowList(value).some((shadow) => {
    const color = shadow.match(/rgba?\([^)]*\)/i)?.[0] ?? '';
    const lengths = [...shadow.matchAll(/(-?(?:\d+(?:\.\d*)?|\.\d+))px/g)].map((match) =>
      Number(match[1])
    );
    const [offsetX = Number.NaN, offsetY = Number.NaN, blur = 0, spread = 0] = lengths;
    const geometryIsZero =
      lengths.length >= 2 && offsetX === 0 && offsetY === 0 && blur === 0 && spread === 0;
    return colorAlpha(color) !== 0 && !geometryIsZero;
  });
}

function hasVisibleOutline(style: string, color: string) {
  return style !== 'none' && colorAlpha(color) !== 0;
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

async function renderedOverlayContrasts(overlay: Locator, textInk: number[], focusInk: number[]) {
  return overlay.evaluate<readonly [number, number, number], number[][]>(
    async (link, inks) => {
      const textColor = inks[0]!;
      const focusColor = inks[1]!;
      const svg = link.querySelector('svg') as SVGSVGElement;
      const veil = link.querySelector('.veil') as HTMLElement;
      const bounds = link.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(bounds.width);
      canvas.height = Math.ceil(bounds.height);
      const context = canvas.getContext('2d')!;
      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.setAttribute('width', `${bounds.width}`);
      clone.setAttribute('height', `${bounds.height}`);
      const properties = ['fill', 'fill-opacity', 'opacity', 'stop-color', 'stop-opacity'];
      const sourceNodes = [svg, ...svg.querySelectorAll('*')];
      const cloneNodes = [clone, ...clone.querySelectorAll('*')];
      sourceNodes.forEach((source, index) => {
        const style = getComputedStyle(source);
        properties.forEach((property) =>
          cloneNodes[index]!.setAttribute(property, style.getPropertyValue(property))
        );
      });
      const image = new Image();
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
      await image.decode();
      context.fillStyle = getComputedStyle(link).backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      context.fillStyle = getComputedStyle(veil).backgroundColor;
      context.fillRect(0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      const luminance = (channels: number[]) => {
        const linear = channels.map((channel) => {
          const value = channel / 255;
          return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
      };
      const ratio = (foreground: number, background: number) =>
        (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      const [textLuminance, focusLuminance] = [luminance(textColor!), luminance(focusColor!)];
      let minimumTextContrast = Infinity,
        minimumBorderContrast = Infinity;
      for (let index = 0; index < pixels.length; index += 4) {
        const background = luminance([pixels[index]!, pixels[index + 1]!, pixels[index + 2]!]);
        minimumTextContrast = Math.min(minimumTextContrast, ratio(textLuminance, background));
        minimumBorderContrast = Math.min(minimumBorderContrast, ratio(focusLuminance, background));
      }
      return [minimumTextContrast, minimumBorderContrast, pixels.length / 4] as const;
    },
    [textInk, focusInk]
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

async function expectFieldFocus(page: Page, locator: Locator) {
  await waitForMotion(locator);
  const [labelColor, transform, scale] = await locator.evaluate((node) => {
    const label = node.querySelector('label')!;
    const bar = node.querySelector('.bar')!;
    const css = getComputedStyle(bar);
    return [getComputedStyle(label).color, css.transform, css.scale];
  });
  const mutedForeground = await page
    .locator('html')
    .evaluate((node) => getComputedStyle(node).getPropertyValue('--muted-foreground').trim());
  expect(await colorPixels(page, [labelColor!, mutedForeground])).toEqual(
    await colorPixels(page, [mutedForeground, mutedForeground])
  );
  expect(transform).toBe('none');
  expect(scale).toBe('1');
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
  const borderColor = await locator.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = getComputedStyle(document.documentElement)
      .getPropertyValue('--brand-foreground')
      .trim();
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  expect(styles[0]).toBe('1');
  expect(styles[1]).toContain('inset');
  expect(styles[1]).toContain('3px');
  expect(styles[1]).toContain(borderColor);
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
  const cards = page.locator('#sin-anillo .gallery article');
  const field = cards.nth(0).locator('.fld');
  const input = field.getByRole('textbox', { name: 'Correo electrónico' });
  const fieldChips = await cards.nth(0).locator('.chips a').all();
  const button = cards.nth(1).getByRole('button');
  const buttonChips = await cards.nth(1).locator('.chips a').all();
  const navLink = page.locator('#sin-anillo .gallery-nav a').first();

  await page.locator('#sin-anillo .more a').last().focus();
  for (const target of [input, ...fieldChips, button, ...buttonChips, navLink]) {
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
    await expect(cards).toHaveCount(6);
    const titles = [
      item.field[2],
      item.button[1],
      item.nav[0],
      item.highlight[5],
      item.viewfinder[2],
      item.overlay[2],
    ];
    const descriptions = [
      item.field[3],
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
      const expectedChips = chipExpectationsByRoute.get(item.route)![index]!;
      for (const [position, expectedChip] of expectedChips.entries()) {
        const { criterion } = expectedChip;
        const chip = chips.nth(position);
        await expect(chip).toHaveAttribute('href', expectedChip.href);
        await expect(chip).toHaveAccessibleName(
          `${criterion} ${item.criterionTitles[criterionTitleIndexes[criterion]!]}, ${expectedChip.status}`
        );
        await expect(chip.locator('[data-slot="badge"]')).toContainText(criterion);
        await expect(chip.locator('[data-slot="badge"]')).toHaveClass(expectedChip.badgeClass);
        await expect(chip.locator('[data-slot="badge"]')).toContainText(expectedChip.marker);
      }
    }
    const field = cards.nth(0).locator('.fld');
    const input = field.getByRole('textbox', { name: item.field[0] });
    await expect(input).toHaveAttribute('type', 'email');
    await expect(input).toHaveAttribute('placeholder', item.field[1]);
    await expect(input).toHaveAttribute('id', 'g-mail');
    await expect(field.locator('label')).toHaveAttribute('for', 'g-mail');
    await expect(field.locator('.bar')).toHaveAttribute('aria-hidden', 'true');
    await expect(cards.nth(1).getByRole('button', { name: item.button[0] })).toHaveAttribute(
      'type',
      'button'
    );
    const nav = cards.nth(2).getByRole('navigation', { name: item.navName });
    await expect(nav.getByRole('link')).toHaveText(item.navLinks);
    for (const link of await nav.getByRole('link').all())
      await expect(link).toHaveAttribute('href', '#sin-anillo');
    const text = cards.nth(3).locator('.hl-p');
    await expect(text).toHaveText(item.highlight.slice(0, 5).join(''));
    await expect(text.getByRole('link')).toHaveText([item.highlight[1], item.highlight[3]]);
    for (const link of await text.getByRole('link').all())
      await expect(link).toHaveAttribute('href', '#sin-anillo');
    const viewfinderLink = cards.nth(4).locator('.vis');
    await expect(viewfinderLink).toHaveAttribute('href', '#sin-anillo');
    await expect(viewfinderLink).toHaveAccessibleName(
      `${item.viewfinder[0]} ${item.viewfinder[1]}`
    );
    await expect(viewfinderLink.locator('strong')).toHaveText(item.viewfinder[0]);
    await expect(viewfinderLink.locator('span')).toHaveText(item.viewfinder[1]);
    const overlayLink = cards.nth(5).locator('.thumb');
    await expect(overlayLink).toHaveAttribute('href', '#sin-anillo');
    await expect(overlayLink).toHaveAttribute('aria-label', item.overlay[0]);
    await expect(overlayLink).toHaveAccessibleName(item.overlay[0]);
    const artwork = overlayLink.locator('svg');
    await expect(artwork).toHaveCount(1);
    await expect(artwork).toBeVisible();
    await expect(artwork).toHaveAttribute('aria-hidden', 'true');
    await expect(overlayLink.locator('.veil')).toHaveText(item.overlay[1]);
    await expect(overlayLink.locator('.veil')).toHaveAttribute('aria-hidden', 'true');
    await expect(cards.locator('details')).toHaveCount(0);
  });

  test(`${item.route} keyboard walks demos and chips in order`, async ({ page }) => {
    await page.goto(item.route);
    const cards = page.locator('#sin-anillo .gallery article');
    const checkField = (locator: Locator) => expectFieldFocus(page, locator.locator('..'));
    const checkButton = (locator: Locator) => expectButtonFocus(page, locator);
    const checkNav = (locator: Locator) => expectNavFocus(page, locator);
    const checkHighlighter = (locator: Locator) => expectHighlighterFocus(page, locator);
    const checkViewfinder = (locator: Locator) => expectViewfinderFocus(page, locator);
    const checkOverlay = (locator: Locator) => expectOverlayFocus(locator);
    const sequence = [
      {
        locator: cards.nth(0).getByRole('textbox', { name: item.field[0] }),
        check: checkField,
      },
      ...(await cards.nth(0).locator('.chips a').all()).map((locator) => ({
        locator,
        check: expectChipFocus,
      })),
      { locator: cards.nth(1).getByRole('button'), check: checkButton },
      ...(await cards.nth(1).locator('.chips a').all()).map((locator) => ({
        locator,
        check: expectChipFocus,
      })),
      ...(await cards.nth(2).locator('nav a').all()).map((locator) => ({
        locator,
        check: checkNav,
      })),
      ...(await cards.nth(2).locator('.chips a').all()).map((locator) => ({
        locator,
        check: expectChipFocus,
      })),
      ...(await cards.nth(3).locator('.hl').all()).map((locator) => ({
        locator,
        check: checkHighlighter,
      })),
      ...(await cards.nth(3).locator('.chips a').all()).map((locator) => ({
        locator,
        check: expectChipFocus,
      })),
      { locator: cards.nth(4).locator('.vis'), check: checkViewfinder },
      ...(await cards.nth(4).locator('.chips a').all()).map((locator) => ({
        locator,
        check: expectChipFocus,
      })),
      { locator: cards.nth(5).locator('.thumb'), check: checkOverlay },
      ...(await cards.nth(5).locator('.chips a').all()).map((locator) => ({
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

  test(`${item.route} field keeps a solid focus outline in forced colors`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto(item.route);
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
    const predecessor = page.locator('#sin-anillo .more a').last();
    await predecessor.focus();
    const input = page.locator('#g-mail');
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    expect(await input.evaluate((node) => node.matches(':focus-visible'))).toBe(true);
    const outline = await input.evaluate((node) => {
      const style = getComputedStyle(node);
      return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
    });
    expect(outline.style).toBe('solid');
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });

  test(`${item.route} field shows only the underline on keyboard focus`, async ({ page }) => {
    await page.goto(item.route);
    await page.locator('#sin-anillo .more a').last().focus();
    const field = page.locator('#sin-anillo .gallery article').first().locator('.fld');
    const input = field.locator('input');
    const label = field.locator('label');
    const bar = field.locator('.bar');
    await expect(label).toHaveAttribute('data-slot', 'label');
    expect(await label.evaluate((node) => node.tagName)).toBe('LABEL');
    await expect(label).toHaveAttribute('for', 'g-mail');
    await expect(label).toHaveText(item.field[0]);
    await expect(input).toHaveAccessibleName(item.field[0]);
    const restingLabelColor = await label.evaluate((node) => getComputedStyle(node).color);
    await page.keyboard.press('Tab');
    await expect(input).toBeFocused();
    expect(await input.evaluate((node) => node.matches(':focus-visible'))).toBe(true);
    await expect.poll(() => bar.evaluate((node) => getComputedStyle(node).scale)).toBe('1');
    await expect
      .poll(() => label.evaluate((node) => getComputedStyle(node).color))
      .toBe(restingLabelColor);
    const [fieldBox, barBox] = await Promise.all([field.boundingBox(), bar.boundingBox()]);
    expect(fieldBox).not.toBeNull();
    expect(barBox).not.toBeNull();
    expect(Math.abs(barBox!.width - fieldBox!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(barBox!.height - 3)).toBeLessThanOrEqual(0.5);
    const focusStyle = await input.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        boxShadow: style.boxShadow,
        outlineStyle: style.outlineStyle,
        outlineColor: style.outlineColor,
      };
    });
    expect(hasVisibleBoxShadow(focusStyle.boxShadow)).toBe(false);
    expect(hasVisibleOutline(focusStyle.outlineStyle, focusStyle.outlineColor)).toBe(false);
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
      for (let index = 0; index < 4; index += 1) {
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
      for (let index = 4; index < 6; index += 1) {
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
      const fieldCard = cards.nth(0);
      const field = fieldCard.locator('.fld');
      const fieldInput = field.getByRole('textbox', { name: item.field[0] });
      const fieldPalette = await field.evaluate((node) => {
        const input = node.querySelector('input')!;
        const label = node.querySelector('label')!;
        const demo = node.closest('.pat-demo')!;
        return [
          getComputedStyle(label).color,
          getComputedStyle(input).color,
          getComputedStyle(input, '::placeholder').color,
          getComputedStyle(input).borderBottomColor,
          getComputedStyle(demo).backgroundColor,
        ];
      });
      expect(await contrast(page, fieldPalette[0]!, fieldPalette[4]!)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, fieldPalette[1]!, fieldPalette[4]!)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, fieldPalette[2]!, fieldPalette[4]!)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, fieldPalette[3]!, fieldPalette[4]!)).toBeGreaterThanOrEqual(3);
      const button = cards.nth(1).getByRole('button');
      await page.locator('#sin-anillo .more a').last().focus();
      await page.keyboard.press('Tab');
      await expect(fieldInput).toBeFocused();
      await expectFieldFocus(page, field);
      const focusedLabel = await field
        .locator('label')
        .evaluate((node) => getComputedStyle(node).color);
      expect(await contrast(page, focusedLabel, fieldPalette[4]!)).toBeGreaterThanOrEqual(4.5);
      const barColor = await field
        .locator('.bar')
        .evaluate((node) => getComputedStyle(node).backgroundColor);
      expect(await contrast(page, barColor, fieldPalette[4]!)).toBeGreaterThanOrEqual(3);
      for (const chip of await fieldCard.locator('.chips a').all()) {
        await page.keyboard.press('Tab');
        await expect(chip).toBeFocused();
      }
      await page.keyboard.press('Tab');
      await expect(button).toBeFocused();
      await waitForMotion(button);
      const focused = await colors(button);
      expect(await contrast(page, ...focused)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, focused[1], surfaces[0]!)).toBeGreaterThanOrEqual(3);
      const viewfinder = cards.nth(4).locator('.vis');
      const viewfinderSurface = await viewfinder.evaluate(
        (node) => getComputedStyle(node).backgroundColor
      );
      const [planText] = await colors(viewfinder.locator('strong'));
      const [planDetails] = await colors(viewfinder.locator('span'));
      expect(await contrast(page, planText, viewfinderSurface)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, planDetails, viewfinderSurface)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, surfaces[3]!, surfaces[0]!)).toBeGreaterThanOrEqual(3);
      const overlayLink = cards.nth(5).locator('.thumb');
      const focusOrder = [
        fieldInput,
        ...(await fieldCard.locator('.chips a').all()),
        button,
        ...(await cards.nth(1).locator('.chips a').all()),
        ...(await cards.nth(2).locator('nav a').all()),
        ...(await cards.nth(2).locator('.chips a').all()),
        ...(await cards.nth(3).locator('.hl').all()),
        ...(await cards.nth(3).locator('.chips a').all()),
        cards.nth(4).locator('.vis'),
        ...(await cards.nth(4).locator('.chips a').all()),
        overlayLink,
      ];
      await page.locator('#sin-anillo .more a').last().focus();
      for (const target of focusOrder) {
        await page.keyboard.press('Tab');
        await expect(target).toBeFocused();
      }
      expect(await overlayLink.evaluate((node) => node.matches(':focus-visible'))).toBe(true);
      await waitForMotion(overlayLink);
      const veil = overlayLink.locator('.veil');
      expect(await veil.evaluate((node) => getComputedStyle(node).opacity)).toBe('1');
      const borderColor = await page.locator('html').evaluate((root) => {
        const probe = document.createElement('span');
        probe.style.color = getComputedStyle(root).getPropertyValue('--brand-foreground').trim();
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      });
      const veilText = await veil.evaluate((node) => getComputedStyle(node).color);
      const [textInk, borderInk] = await colorPixels(page, [veilText, borderColor]);
      const [textContrast, borderContrast, sampledPixels] = await renderedOverlayContrasts(
        overlayLink,
        textInk!,
        borderInk!
      );
      expect(sampledPixels).toBeGreaterThan(0);
      expect(textContrast).toBeGreaterThanOrEqual(4.5);
      expect(borderContrast).toBeGreaterThanOrEqual(3);
      expect(await contrast(page, surfaces[2]!, surfaces[1]!)).toBeGreaterThanOrEqual(4.5);
      expect(await contrast(page, surfaces[1]!, surfaces[0]!)).toBeGreaterThanOrEqual(3);
    });
  }

  test(`${item.route} click does not activate focus-visible`, async ({ page }) => {
    await page.goto(item.route);
    const field = page.locator('#sin-anillo .gallery article').first().locator('.fld');
    await field.getByRole('textbox', { name: item.field[0] }).click();
    await expectFieldFocus(page, field);
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
    const field = page.locator('#sin-anillo .gallery article').first().locator('.fld');
    const label = field.locator('label');
    const bar = field.locator('.bar');
    const input = field.locator('input');
    const button = page.locator('#sin-anillo .gallery button');
    const nav = page.locator('#sin-anillo .gallery-nav a').first();
    const hl = page.locator('#sin-anillo .hl').first();
    const viewfinder = page.locator('#sin-anillo .vis');
    const overlay = page.locator('#sin-anillo .thumb');
    await expect(label).toHaveCSS('transition-duration', '0s');
    await expect(bar).toHaveCSS('transition-duration', '0s');
    await expect(input).toHaveCSS('transition-property', 'none');
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
    const normalField = normalPage.locator('#sin-anillo .gallery article').first().locator('.fld');
    const normalLabel = normalField.locator('label');
    const normalBar = normalField.locator('.bar');
    const normalInput = normalField.locator('input');
    const inputTransitionProperty = await normalInput.evaluate(
      (node) => getComputedStyle(node).transitionProperty
    );
    expect(inputTransitionProperty).toContain('color');
    expect(inputTransitionProperty).toContain('background-color');
    expect(
      Number.parseFloat(
        await normalInput.evaluate((node) => getComputedStyle(node).transitionDuration)
      )
    ).toBeGreaterThan(0);
    for (const duration of [
      await normalBar.evaluate((node) => getComputedStyle(node).transitionDuration),
    ]) {
      expect(duration).not.toBe('0s');
      for (const seconds of duration.split(',').map((value) => Number.parseFloat(value))) {
        expect(seconds).toBeGreaterThan(0);
        expect(seconds).toBeLessThanOrEqual(0.15);
      }
    }
    await expect(normalLabel).toHaveCSS('transition-duration', '0s');
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
      await expect(page.locator('#sin-anillo .gallery article')).toHaveCount(6);
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
    const fieldBox = await page.locator('#sin-anillo .gallery article').first().boundingBox();
    expect(fieldBox).not.toBeNull();
    expect(fieldBox!.x + fieldBox!.width).toBeLessThanOrEqual(320);
    const viewBox = await page
      .locator('#sin-anillo .gallery article')
      .nth(4)
      .locator('.vis')
      .boundingBox();
    const demoBox = await page
      .locator('#sin-anillo .gallery article')
      .nth(4)
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
