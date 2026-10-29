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

for (const locale of locales) {
  test(`loads the ${locale.route} page with its localized homepage heading`, async ({ page }) => {
    await page.goto(locale.route);

    await expect(page.getByRole('heading', { level: 1, name: locale.title })).toBeVisible();
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`${locale.route} hero ring uses the ${theme} focus token`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript(
        (storedTheme) => localStorage.setItem('foco-theme', storedTheme),
        theme
      );
      await page.goto(locale.route);

      const heading = page.getByRole('heading', { level: 1, name: locale.title });
      const ringedWord = heading.locator('.ringed');
      await expect(ringedWord).toBeVisible();
      await expect(heading).toHaveCount(1);

      const ring = await ringedWord.evaluate((element) => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--ring)';
        document.body.append(probe);
        const tokenColor = getComputedStyle(probe).color;
        probe.remove();

        const pseudo = getComputedStyle(element, '::after');
        return {
          borderStyle: pseudo.borderTopStyle,
          borderColor: pseudo.borderTopColor,
          tokenColor,
          isFocused: document.activeElement === element,
          tabIndex: element.getAttribute('tabindex'),
        };
      });

      expect(ring.borderStyle).toBe('solid');
      expect(ring.borderColor).toBe(ring.tokenColor);
      expect(ring.isFocused).toBe(false);
      expect(ring.tabIndex).toBeNull();
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

    const reduced = await ringedWord.evaluate((element) => {
      const pseudo = getComputedStyle(element, '::after');
      return { animationName: pseudo.animationName, clipPath: pseudo.clipPath };
    });
    expect(reduced.animationName).toBe('none');
    expect(reduced.clipPath).toMatch(/^inset\(0(?:px|%)?(?:\s+0(?:px|%)?){0,3}\)$/);

    await page.addInitScript(() => {
      const target = window as Window & { __drawAnimationEnded?: boolean };
      target.__drawAnimationEnded = false;
      window.addEventListener('animationend', (event) => {
        if (event.animationName === 'draw' && event.pseudoElement === '::after') {
          target.__drawAnimationEnded = true;
        }
      });
    });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.reload();
    await page.waitForFunction(() => {
      const target = window as Window & { __drawAnimationEnded?: boolean };
      return target.__drawAnimationEnded === true;
    });
    const animationState = await ringedWord.evaluate((element) => ({
      animationName: getComputedStyle(element, '::after').animationName,
      clipPath: getComputedStyle(element, '::after').clipPath,
    }));
    expect(animationState.animationName).toBe('draw');
    expect(animationState.clipPath).toMatch(/^inset\(0(?:px|%)?(?:\s+0(?:px|%)?){0,3}\)$/);
  });

  test(`${locale.route} renders the localized hero, index, and landmarks`, async ({ page }) => {
    await page.goto(locale.route);
    const heading = page.getByRole('heading', { level: 1, name: locale.title });
    await expect(heading).toHaveCount(1);
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
    await expect(list.locator('.toc-number')).toHaveText([
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
    ]);

    const structure = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      const toc = document.querySelector('.toc');
      const main = document.querySelector('main#contenido');
      return {
        heroBeforeMain: Boolean(
          hero && main && hero.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING
        ),
        tocBeforeMain: Boolean(
          toc && main && toc.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING
        ),
        outsideMain: Boolean(hero && toc && main && !main.contains(hero) && !main.contains(toc)),
        bannerCount: document.querySelectorAll('header').length,
      };
    });
    expect(structure).toEqual({
      heroBeforeMain: true,
      tocBeforeMain: true,
      outsideMain: true,
      bannerCount: 1,
    });
    await expect(
      page.getByRole('link', {
        name: locale.route === '/' ? 'Saltar al contenido' : 'Skip to content',
      })
    ).toHaveAttribute('href', '#contenido');
  });

  for (const { width, minimumColumns, maximumColumns } of [
    { width: 320, minimumColumns: 1, maximumColumns: 1 },
    { width: 375, minimumColumns: 1, maximumColumns: 1 },
    { width: 1280, minimumColumns: 2, maximumColumns: 4 },
  ]) {
    test(`${locale.route} fits its content at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(locale.route);

      const responsiveState = await page.evaluate(() => {
        const heading = document.querySelector('h1');
        const list = document.querySelector('.toc ol');
        if (!heading || !list) throw new Error('Homepage heading or index is missing');
        const headingBox = heading.getBoundingClientRect();
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        const wordRects: Array<{ left: number; right: number }> = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          const value = node.textContent ?? '';
          for (const match of value.matchAll(/\S+/g)) {
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            const rect = range.getBoundingClientRect();
            wordRects.push({ left: rect.left, right: rect.right });
          }
        }
        return {
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
          headingLeft: headingBox.left,
          headingRight: headingBox.right,
          wordRects,
          columns: getComputedStyle(list).gridTemplateColumns.split(' ').length,
        };
      });

      expect(responsiveState.documentWidth).toBeLessThanOrEqual(responsiveState.viewportWidth);
      expect(
        responsiveState.wordRects.every(
          ({ left, right }) =>
            left >= responsiveState.headingLeft - 1 && right <= responsiveState.headingRight + 1
        )
      ).toBe(true);
      expect(responsiveState.columns).toBeGreaterThanOrEqual(minimumColumns);
      expect(responsiveState.columns).toBeLessThanOrEqual(maximumColumns);
    });
  }
}
