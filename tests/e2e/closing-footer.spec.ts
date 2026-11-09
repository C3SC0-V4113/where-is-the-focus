import { expect, test, type Page } from '@playwright/test';

const referenceHrefs = [
  'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html',
  'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html',
  'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html',
  'https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html',
  'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html',
  'https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html',
  'https://www.sarasoueidan.com/blog/focus-indicators/',
  'https://vercel.com/design/guidelines',
  'https://www.w3.org/WAI/ARIA/apg/patterns/',
  'https://tailwindcss.com/docs/hover-focus-and-other-states',
  'https://ui.shadcn.com/docs/theming',
  'https://developer.mozilla.org/es/docs/Web/CSS/:focus-visible',
] as const;

const locales = [
  {
    route: '/',
    closing: {
      title: '¿Sabes dónde está el foco en tu interfaz ahora mismo?',
      paragraph:
        'Si la respuesta es «depende», pulsa Tab en tu producto y recórrelo de principio a fin. Es la prueba de accesibilidad más rápida que existe, y la que más dice.',
      link: 'Volver al contenido',
    },
    footer: {
      role: 'FrontEnd Web',
      referencesTitle: 'Referencias',
      references: [
        'WCAG 2.4.7 Foco visible',
        'WCAG 2.4.11 Foco no oculto',
        'WCAG 1.4.11 Contraste no textual',
        'WCAG 2.4.13 Apariencia del foco',
        'WCAG 2.4.3 Orden del foco',
        'WCAG 2.4.1 Evitar bloques',
        'Sara Soueidan: indicadores de foco',
        'Vercel: Web Interface Guidelines',
        'W3C: patrones ARIA',
        'Tailwind: estados',
        'shadcn/ui: temas',
        'MDN: :focus-visible',
      ],
      closingLine: 'Ejemplos en CSS y en Tailwind CSS v4.',
    },
  },
  {
    route: '/en/',
    closing: {
      title: 'Do you know where focus is in your interface right now?',
      paragraph:
        'If the answer is “it depends”, press Tab in your product and go through it from start to finish. It’s the fastest accessibility test there is, and the most revealing.',
      link: 'Back to content',
    },
    footer: {
      role: 'FrontEnd Web',
      referencesTitle: 'References',
      references: [
        'WCAG 2.4.7 Focus visible',
        'WCAG 2.4.11 Focus not obscured',
        'WCAG 1.4.11 Non-text contrast',
        'WCAG 2.4.13 Focus appearance',
        'WCAG 2.4.3 Focus order',
        'WCAG 2.4.1 Bypass blocks',
        'Sara Soueidan: focus indicators',
        'Vercel: Web Interface Guidelines',
        'W3C: ARIA patterns',
        'Tailwind: states',
        'shadcn/ui: theming',
        'MDN: :focus-visible',
      ],
      closingLine: 'Examples in CSS and Tailwind CSS v4.',
    },
  },
] as const;

const contrastRatios = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((elements) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    const luminance = (color: string) => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [red, green, blue] = [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)].map(
        (channel) => {
          const value = channel / 255;
          const low = value / 12.92;
          const high = ((value + 0.055) / 1.055) ** 2.4;
          return low + (high - low) * Number(value > 0.04045);
        }
      );
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };
    const effectiveBackground = (element: Element) => {
      context.clearRect(0, 0, 1, 1);
      const backgrounds: string[] = [];
      for (let node: Element | null = element; node; node = node.parentElement) {
        backgrounds.push(getComputedStyle(node).backgroundColor);
      }
      backgrounds.reverse().forEach((color) => {
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
      });
      const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
      return `rgb(${red} ${green} ${blue})`;
    };
    return elements.map((element) => {
      const [light, dark] = [
        luminance(getComputedStyle(element).color),
        luminance(effectiveBackground(element)),
      ].sort((a, b) => b - a);
      return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
    });
  });

for (const locale of locales) {
  test(`${locale.route} renders and activates the closing section and references footer`, async ({
    page,
  }) => {
    await page.goto(locale.route);

    const closing = page.locator('body > main + section[aria-labelledby="h-close"]');
    const footer = page.locator('section[aria-labelledby="h-close"] + footer.foot');
    await expect(closing).toHaveCount(1);
    await expect(footer).toHaveCount(1);
    await expect(closing.locator('h2#h-close')).toHaveText(locale.closing.title);
    await expect(closing.locator('p')).toHaveText(locale.closing.paragraph);
    await expect(closing.locator('kbd')).toHaveCount(1);
    await expect(closing.locator('kbd')).toHaveText('Tab');

    const topLink = closing.getByRole('link');
    await expect(topLink).toHaveAccessibleName(locale.closing.link);
    await expect(topLink).toHaveText(locale.closing.link);
    await expect(topLink).toHaveAttribute('href', '#contenido');
    await expect(topLink).toHaveCSS('text-decoration-line', 'underline');
    await topLink.focus();
    await page.keyboard.press('Enter');
    const main = page.locator('main#contenido');
    await expect(page).toHaveURL(/#contenido$/);
    await expect(main).toBeFocused();
    expect(
      await main.evaluate((element) => element.getBoundingClientRect().top)
    ).toBeLessThanOrEqual(1);

    const social = footer.locator('ul.social');
    const references = footer.locator('ul.refs');
    await expect(social).toHaveAttribute('role', 'list');
    await expect(references).toHaveAttribute('role', 'list');
    const lists = footer.getByRole('list');
    await expect(lists).toHaveCount(2);
    await expect(lists.nth(0).getByRole('listitem')).toHaveCount(2);
    await expect(lists.nth(1).getByRole('listitem')).toHaveCount(12);

    await expect(footer.locator('.who strong')).toHaveText('Francisco Valle');
    await expect(footer.locator('.who span')).toHaveText(locale.footer.role);
    await expect(footer.locator('.social a')).toHaveText(['cescovalle.com', 'GitHub']);
    expect(
      await footer
        .locator('.social a')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    ).toEqual(['https://cescovalle.com', 'https://github.com/Valle-Aracari']);
    await expect(footer.locator('.foot-h')).toHaveText(locale.footer.referencesTitle);
    await expect(footer.locator('.refs a')).toHaveCount(12);
    await expect(footer.locator('.refs a')).toHaveText([...locale.footer.references]);
    expect(
      await footer
        .locator('.refs a')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    ).toEqual([...referenceHrefs]);
    expect(
      await footer
        .locator('a')
        .evaluateAll((links) => links.map((link) => getComputedStyle(link).textDecorationLine))
    ).toEqual(Array(14).fill('underline'));
    await expect(footer.locator('.closing-line')).toHaveText(locale.footer.closingLine);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`${locale.route} closing and footer text meet AA in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((value) => localStorage.setItem('foco-theme', value), theme);
      await page.goto(locale.route);

      const ratios = await contrastRatios(
        page,
        '.close h2, .close p, .close kbd, .close a, .foot .who strong, .foot .who span, .foot .social a, .foot .foot-h, .foot .refs a, .foot .closing-line'
      );
      expect(ratios).toHaveLength(22);
      expect(ratios.every((ratio) => ratio >= 4.5)).toBe(true);
    });
  }

  test(`${locale.route} closing link has the double ring and forced-colors outline`, async ({
    page,
  }) => {
    await page.goto(locale.route);
    const topLink = page.locator('.close a');
    await page.locator('#objeciones [data-slot="accordion-trigger"]').last().focus();
    await page.keyboard.press('Tab');
    await expect(topLink).toBeFocused();

    const focus = await topLink.evaluate((element) => {
      const style = getComputedStyle(element);
      const probe = document.body.appendChild(document.createElement('span'));
      probe.style.color = 'var(--brand)';
      const brandColor = getComputedStyle(probe).color;
      probe.style.color = 'var(--brand-foreground)';
      const brandForeground = getComputedStyle(probe).color;
      probe.remove();
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      const context = canvas.getContext('2d')!;
      const luminance = (color: string) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const [red, green, blue] = [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)].map(
          (channel) => {
            const value = channel / 255;
            const low = value / 12.92;
            const high = ((value + 0.055) / 1.055) ** 2.4;
            return low + (high - low) * Number(value > 0.04045);
          }
        );
        return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
      };
      const [light, dark] = [luminance(brandForeground), luminance(brandColor)].sort(
        (a, b) => b - a
      );
      return {
        focusVisible: element.matches(':focus-visible'),
        boxShadow: style.boxShadow,
        brandColor,
        brandForeground,
        outerContrast: Number(((light + 0.05) / (dark + 0.05)).toFixed(2)),
      };
    });
    expect(focus.focusVisible).toBe(true);
    const layers = focus.boxShadow.split(/,\s*(?=(?:rgba?|oklch|oklab|color|hsla?|hwb)\()/);
    expect(layers).toHaveLength(2);
    expect(layers[0]).toContain(focus.brandColor);
    expect(layers[0]).toContain('0px 0px 0px 2px');
    expect(layers[1]).toContain(focus.brandForeground);
    expect(layers[1]).toContain('0px 0px 0px 5px');
    expect(focus.outerContrast).toBeGreaterThanOrEqual(3);

    await page.emulateMedia({ forcedColors: 'active' });
    await expect(topLink).toHaveCSS('outline-style', 'solid');
    await expect(topLink).toHaveCSS('outline-width', '3px');
    await expect(topLink).toHaveCSS('box-shadow', 'none');
  });

  test(`${locale.route} closing section fits at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(locale.route);
    await expect(page.locator('.close h2')).toHaveCSS('font-size', '44px');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
    ).toBeLessThanOrEqual(0);
  });
}
