import { expect, test } from '@playwright/test';

const locales = [
  {
    route: '/',
    title: 'El foco también es diseño',
    eyebrow: 'Foco visible · WCAG 2.2 · CSS y Tailwind',
    indexName: 'Contenido',
    entries: [
      'El planteamiento',
      'Qué piden las reglas',
      'Teclado sí, clic no',
      'Diseñar el indicador',
      'Más allá del anillo',
      'Que nada lo tape',
      'A dónde va el foco',
      'Preguntas frecuentes',
    ],
  },
  {
    route: '/en/',
    title: 'Focus is design too',
    eyebrow: 'Visible focus · WCAG 2.2 · CSS and Tailwind',
    indexName: 'Contents',
    entries: [
      'The premise',
      'What the rules ask for',
      'Keyboard yes, click no',
      'Designing the indicator',
      'Beyond the ring',
      'Nothing should cover it',
      'Where focus goes',
      'Frequent questions',
    ],
  },
] as const;

const fullInset = /^inset\(0(?:px|%)?(?:\s+0(?:px|%)?){0,3}\)$/;

for (const locale of locales) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${locale.route} hero ring uses the ${theme} focus token`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((value) => localStorage.setItem('foco-theme', value), theme);
      await page.goto(locale.route);

      const ringedWord = page
        .getByRole('heading', { level: 1, name: locale.title })
        .locator('.ringed');
      await expect(ringedWord).toBeVisible();
      await expect(ringedWord).not.toHaveAttribute('tabindex');
      await expect(ringedWord).not.toBeFocused();

      const ring = await ringedWord.evaluate((element) => {
        const probe = document.body.appendChild(document.createElement('span'));
        probe.style.color = 'var(--ring)';
        const tokenColor = getComputedStyle(probe).color;
        probe.remove();
        const { borderTopStyle, borderTopColor } = getComputedStyle(element, '::after');
        return { borderTopStyle, borderTopColor, tokenColor };
      });
      expect(ring.borderTopStyle).toBe('solid');
      expect(ring.borderTopColor).toBe(ring.tokenColor);
    });
  }

  test(`${locale.route} respects reduced motion and completes the ring drawing`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(locale.route);
    const ringedWord = page
      .getByRole('heading', { level: 1, name: locale.title })
      .locator('.ringed');
    const ringState = () =>
      ringedWord.evaluate(async (element) => {
        const animations = element.getAnimations({ subtree: true });
        await Promise.all(animations.map(({ finished }) => finished));
        const { animationName, clipPath } = getComputedStyle(element, '::after');
        return { animations: animations.length, animationName, clipPath };
      });

    const reduced = await ringState();
    expect(reduced.animations).toBe(0);
    expect(reduced.animationName).toBe('none');
    expect(reduced.clipPath).toMatch(fullInset);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const drawn = await ringState();
    expect(drawn.animations).toBe(1);
    expect(drawn.animationName).toBe('draw');
    expect(drawn.clipPath).toMatch(fullInset);
  });

  test(`${locale.route} renders the localized hero, index, and landmarks`, async ({ page }) => {
    await page.goto(locale.route);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(locale.title);
    await expect(page.locator('.eyebrow')).toHaveText(locale.eyebrow);
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).not.toBeNull();
    await expect(page.locator('.hero-lede')).toHaveText(metaDescription ?? '');

    const navigation = page.getByRole('navigation', { name: locale.indexName });
    const list = navigation.getByRole('list');
    await expect(list).toHaveAttribute('role', 'list');
    await expect(list.getByRole('listitem')).toHaveCount(8);
    await expect(navigation.locator('a')).toHaveCount(0);
    await expect(list.locator('.toc-label')).toHaveText([...locale.entries]);
    await expect(list.locator('.toc-number')).toHaveText(
      locale.entries.map((_, index) => `0${index + 1}`)
    );

    // Hero and index sit between the only banner and main, outside it.
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('body > header + .hero + nav.toc + main#contenido')).toHaveCount(1);
  });

  for (const [width, minColumns, maxColumns] of [
    [320, 1, 1],
    [375, 1, 1],
    [1280, 2, 4],
  ]) {
    test(`${locale.route} fits its content at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(locale.route);

      const layout = await page.evaluate(() => {
        const heading = document.querySelector('h1')!;
        const bounds = heading.getBoundingClientRect();
        const words = document.createRange();
        words.selectNodeContents(heading);
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          wordsInside: [...words.getClientRects()].every(
            ({ left, right, width }) =>
              width === 0 || (left >= bounds.left - 1 && right <= bounds.right + 1)
          ),
          columns: getComputedStyle(document.querySelector('.toc ol')!).gridTemplateColumns.split(
            ' '
          ).length,
        };
      });

      expect(layout.overflow).toBeLessThanOrEqual(0);
      expect(layout.wordsInside).toBe(true);
      expect(layout.columns).toBeGreaterThanOrEqual(minColumns);
      expect(layout.columns).toBeLessThanOrEqual(maxColumns);
    });
  }
}
