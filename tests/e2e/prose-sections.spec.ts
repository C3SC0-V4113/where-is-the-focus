import { expect, test, type Locator, type Page } from '@playwright/test';

import { en, es } from '../../src/i18n/messages';

const routes = [
  [
    '/',
    es,
    [
      'https://developer.mozilla.org/es/docs/Web/CSS/:focus-visible',
      'https://vercel.com/design/guidelines#interactions',
    ],
  ],
  [
    '/en/',
    en,
    [
      'https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible',
      'https://vercel.com/design/guidelines#interactions',
    ],
  ],
] as const;
const plain = (text: string) => text.replace(/`([^`]+)`/g, '$1').replace(/\[\[([^\]]+)\]\]/g, '$1');

async function expectMoreLine(
  line: Locator,
  expected: {
    label: string;
    separator: string;
    links: readonly { text: string; href: string }[];
  }
) {
  await expect(line).toHaveText(
    expected.label + expected.links.map(({ text }) => text).join(expected.separator)
  );
  const links = line.getByRole('link');
  await expect(links).toHaveCount(expected.links.length);
  for (const [index, linkCopy] of expected.links.entries()) {
    await expect(links.nth(index)).toHaveAccessibleName(linkCopy.text);
    await expect(links.nth(index)).toHaveAttribute('href', linkCopy.href);
  }
}

async function tabAcrossCodeContent(
  page: Page,
  section: Locator,
  content: Locator,
  nextLink: Locator
) {
  const hydratedIsland = section
    .locator('astro-island:not([ssr])')
    .filter({ has: page.locator('[data-slot="code-block-content"]') });
  await expect(hydratedIsland).toHaveCount(1);
  await expect
    .poll(() =>
      content.evaluate((node) => {
        const overflows = node.scrollWidth > node.clientWidth + 1;
        return overflows ? node.tabIndex === 0 : node.tabIndex === -1;
      })
    )
    .toBe(true);
  const overflows = await content.evaluate((node) => node.scrollWidth > node.clientWidth + 1);
  await page.keyboard.press('Tab');
  if (overflows) {
    await expect(content).toBeFocused();
    await page.keyboard.press('Tab');
  }
  await expect(nextLink).toBeFocused();
}

async function codeBlockHeight(codeBlock: Locator) {
  const box = await codeBlock.boundingBox();
  expect(box).not.toBeNull();
  return box!.height;
}

const phase12 = [
  {
    route: '/',
    obscured: {
      number: '06 · Que nada lo tape',
      title: 'Visible también significa a la vista',
      paragraphs: [
        'Al pulsar [[Tab]], el navegador solo desplaza la página si el siguiente elemento está fuera de la vista. Una cabecera fija o un banner de cookies están dentro de ella, así que el elemento puede quedar debajo sin que el navegador lo note. `scroll-padding` le dice cuánto espacio está ocupado.',
        'El segundo caso es el modo de alto contraste de Windows: elimina las sombras y los fondos, y un foco hecho solo con `box-shadow` desaparece. Un contorno transparente lo salva, porque el sistema lo pinta con su propio color.',
      ],
      more: {
        label: 'Más: ',
        separator: ' · ',
        links: [
          {
            text: '2.4.11 Foco no oculto (mínimo)',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html',
          },
          {
            text: '2.4.12 (mejorado)',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-enhanced.html',
          },
          {
            text: 'forced-colors en MDN',
            href: 'https://developer.mozilla.org/es/docs/Web/CSS/@media/forced-colors',
          },
        ],
      },
    },
    movement: {
      number: '07 · A dónde va el foco',
      title: 'Cuando la pantalla cambia, el foco se decide',
      paragraphs: [
        'Al abrir un modal, cambiar de vista o borrar un elemento, lo que tenía el foco puede desaparecer. Si nadie decide a dónde va, el navegador lo deja al inicio de la página. Mover el foco es obligatorio (2.4.3); que se vea o no lo decide `:focus-visible`.',
        'En pestañas, menús y barras de herramientas, [[Tab]] entra y sale del componente, y las flechas recorren las opciones. Solo una opción tiene `tabindex="0"` a la vez; las demás tienen `-1`.',
      ],
      pull: 'Al cerrar un modal, el foco vuelve al botón que lo abrió. Con el ratón no se ve el anillo; con [[Esc]], sí.',
      more: {
        label: 'Más: ',
        separator: ' · ',
        links: [
          {
            text: '2.4.3 Orden del foco',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html',
          },
          {
            text: 'W3C, navegación por teclado en componentes',
            href: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/',
          },
          {
            text: 'patrón de pestañas',
            href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
          },
        ],
      },
    },
    objections: {
      number: '08 · Preguntas frecuentes',
      title: 'Lo que suele preguntarse en el equipo',
    },
  },
  {
    route: '/en/',
    obscured: {
      number: '06 · Nothing should cover it',
      title: 'Visible also means in view',
      paragraphs: [
        'When you press [[Tab]], the browser only scrolls if the next element is out of view. A sticky header or a cookie banner are inside the view, so the element can end up underneath without the browser noticing. `scroll-padding` tells it how much space is taken.',
        'The second case is Windows high contrast mode: it removes shadows and backgrounds, and focus made only with `box-shadow` disappears. A transparent outline saves it, because the system paints it with its own color.',
      ],
      more: {
        label: 'More: ',
        separator: ' · ',
        links: [
          {
            text: '2.4.11 Focus not obscured (minimum)',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html',
          },
          {
            text: '2.4.12 (enhanced)',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-enhanced.html',
          },
          {
            text: 'forced-colors on MDN',
            href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors',
          },
        ],
      },
    },
    movement: {
      number: '07 · Where focus goes',
      title: 'When the screen changes, focus is decided',
      paragraphs: [
        'When a modal opens, the view changes or an item is deleted, whatever had focus may disappear. If nobody decides where it goes, the browser leaves it at the top of the page. Moving focus is required (2.4.3); whether it’s visible is decided by `:focus-visible`.',
        'In tabs, menus and toolbars, [[Tab]] enters and leaves the component, and the arrow keys move between options. Only one option has `tabindex="0"` at a time; the rest have `-1`.',
      ],
      pull: 'When a modal closes, focus returns to the button that opened it. With the mouse the ring doesn’t show; with [[Esc]], it does.',
      more: {
        label: 'More: ',
        separator: ' · ',
        links: [
          {
            text: '2.4.3 Focus order',
            href: 'https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html',
          },
          {
            text: 'W3C, keyboard navigation inside components',
            href: 'https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/',
          },
          {
            text: 'tabs pattern',
            href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/',
          },
        ],
      },
    },
    objections: {
      number: '08 · Frequent questions',
      title: 'What teams usually ask',
    },
  },
] as const;

async function expectPrettyWrap(page: Page, pull: Locator) {
  const supportsPretty = await page.evaluate(() => CSS.supports('text-wrap-style', 'pretty'));
  if (supportsPretty) {
    await expect(pull).toHaveCSS('text-wrap-style', 'pretty');
    return;
  }
  const browser = page.context().browser();
  test.info().annotations.push({
    type: 'unsupported',
    description: `text-wrap-style: pretty is unsupported in ${browser?.browserType().name()} ${browser?.version()}`,
  });
}

for (const [route, messages, hrefs] of routes) {
  const copy = messages.sections.focusVisible;

  test(`${route} keeps code example height stable across tabs`, async ({ page }) => {
    await page.goto(route);
    const sections = [page.locator('#focus-visible'), page.locator('#anillo')];
    const codeBlocks = sections.map((section) => section.locator('[data-slot="code-block"]'));

    for (const [index, section] of sections.entries()) {
      await codeBlocks[index]!.scrollIntoViewIfNeeded();
      const hydratedIsland = section
        .locator('astro-island:not([ssr])')
        .filter({ has: page.locator('[data-slot="code-block"]') });
      await expect(hydratedIsland).toHaveCount(1);
    }
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const [focusVisible] = sections;
    await focusVisible!.getByRole('tab', { name: 'CSS', exact: true }).click();
    for (const section of sections) {
      await expect(section.getByRole('tab', { name: 'CSS', exact: true })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    }
    const heightsBefore = await Promise.all(codeBlocks.map(codeBlockHeight));

    await focusVisible!.getByRole('tab', { name: 'Tailwind', exact: true }).click();
    for (const section of sections) {
      await expect(section.getByRole('tab', { name: 'Tailwind', exact: true })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    }
    const heightsAfter = await Promise.all(codeBlocks.map(codeBlockHeight));

    expect(Math.abs(heightsAfter[0]! - heightsBefore[0]!)).toBeLessThanOrEqual(1);
    expect(Math.abs(heightsAfter[1]! - heightsBefore[1]!)).toBeLessThanOrEqual(1);
  });

  test(`${route} renders the focus-visible prose and inline code`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(route);
    const sections = page.locator('main > section');
    await expect(sections).toHaveCount(8);
    const section = sections.nth(2);
    await expect(section).toHaveAttribute('id', 'focus-visible');
    await expect(section).toHaveAttribute('aria-labelledby', 'h-fv');
    await expect(section.locator('h2')).toHaveAttribute('id', 'h-fv');
    await expect(section.locator('.num')).toHaveText(copy.number);
    await expect(section.locator('h2')).toHaveText(copy.title);
    await expect(section.locator('.intro p')).toHaveText(copy.paragraphs.map(plain));
    await expect(section.locator('.intro p code')).toHaveText([':focus', ':focus-visible']);
    const flow = await section.locator('.intro p code').evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        const sharesLine = [node.previousSibling, node.nextSibling].some((sibling) => {
          if (sibling?.nodeType !== Node.TEXT_NODE || !sibling.textContent?.trim()) return false;
          const range = document.createRange();
          range.selectNodeContents(sibling);
          return [...range.getClientRects()].some(
            (rect) => rect.top < box.bottom && rect.bottom > box.top
          );
        });
        return [getComputedStyle(node).display, getComputedStyle(node).marginInline, sharesLine];
      })
    );
    expect(flow).toEqual([
      ['inline', '0px', true],
      ['inline', '0px', true],
    ]);

    const line = section.locator('.more');
    await expect(line).toHaveText(
      copy.more.label + copy.more.links.map(({ text }) => text).join(copy.more.separator)
    );
    const links = line.getByRole('link');
    await expect(links).toHaveCount(2);
    for (const [index, expected] of copy.more.links.entries()) {
      const link = links.nth(index);
      await expect(link).toHaveAccessibleName(expected.text);
      await expect(link).toHaveAttribute('href', hrefs[index]);
      await expect(link).toHaveCSS('text-decoration-line', 'underline');
      await expect(link).toHaveCSS('font-weight', '500');
      const [linkColor, lineColor] = await link.evaluate((node) => [
        getComputedStyle(node).color,
        getComputedStyle(node.parentElement!).color,
      ]);
      expect(linkColor).not.toBe(lineColor);
    }
    const headingStyles = await page.locator('main > section h2').evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return [
          style.fontFamily,
          style.getPropertyValue('font-stretch'),
          style.fontWeight,
          style.textTransform,
          style.textWrap,
        ].join('|');
      })
    );
    expect(headingStyles.slice(2)).toEqual(Array(6).fill(headingStyles[0]));

    await page.locator('#reglas .crit a').last().focus();
    for (const [index] of copy.more.links.entries()) {
      await page.keyboard.press('Tab');
      await expect(links.nth(index)).toBeFocused();
      const ring = await links.nth(index).evaluate((node) => {
        const style = getComputedStyle(node);
        return [style.outlineStyle, style.outlineWidth, style.boxShadow];
      });
      expect(ring.slice(0, 2)).toEqual(['solid', '2px']);
      expect(ring[2]).toContain('2px');
      expect(ring[2]).toContain('5px');
    }
    for (const width of [320, 375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
    }
  });

  const ring = messages.sections.ring;
  const ringHrefs = [
    'https://www.sarasoueidan.com/blog/focus-indicators/',
    'https://ui.shadcn.com/docs/theming',
  ];

  test(`${route} renders the ring section intro`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(route);
    const sections = page.locator('main > section');
    await expect(sections).toHaveCount(8);
    const section = sections.nth(3);
    await expect(section).toHaveAttribute('id', 'anillo');
    await expect(section).toHaveAttribute('aria-labelledby', 'h-anillo');
    await expect(section.locator('h2')).toHaveAttribute('id', 'h-anillo');
    await expect(section.locator('.num')).toHaveText(ring.number);
    await expect(section.locator('h2')).toHaveText(ring.title);
    const childKinds = await section
      .locator(':scope > *')
      .evaluateAll((nodes) =>
        nodes.map((node) => ['head', 'intro', 'more'].find((name) => node.classList.contains(name)))
      );
    expect(childKinds).toEqual(['head', 'intro', 'more', 'intro', 'more']);
    const prose = section.locator(':scope > .intro');
    await expect(prose.nth(0).locator('p')).toHaveText(ring.paragraphs.map(plain));
    await expect(prose.nth(1).locator('p')).toHaveText([
      plain(ring.pull),
      plain(ring.pullParagraph),
    ]);
    await expect(section.locator('.pull code')).toHaveText('--ring');
    await expect(prose.nth(1).locator('p').nth(1).locator('code')).toHaveText([
      '--ring',
      'oklch(0.708 0 0)',
      'ring-ring/50',
    ]);
    const codeFlow = await section.locator('.intro code').evaluateAll((nodes) =>
      nodes.map((node) => {
        const box = node.getBoundingClientRect();
        const sharesLine = [node.previousSibling, node.nextSibling].some((sibling) => {
          if (sibling?.nodeType !== Node.TEXT_NODE || !sibling.textContent?.trim()) return false;
          const range = document.createRange();
          range.selectNodeContents(sibling);
          return [...range.getClientRects()].some(
            (rect) => rect.top < box.bottom && rect.bottom > box.top
          );
        });
        return [getComputedStyle(node).display, getComputedStyle(node).marginInline, sharesLine];
      })
    );
    expect(codeFlow).toEqual(Array(4).fill(['inline', '0px', true]));

    const lines = section.locator(':scope > .more');
    const more = [ring.more, ring.pullMore];
    await expect(lines).toHaveText(
      more.map((copy) => copy.label + copy.links[0]!.text + ('after' in copy ? copy.after : ''))
    );
    for (const [index, copy] of more.entries()) {
      const link = lines.nth(index).getByRole('link');
      await expect(link).toHaveCount(1);
      await expect(link).toHaveAccessibleName(copy.links[0]!.text);
      await expect(link).toHaveAttribute('href', ringHrefs[index]);
      await expect(link).toHaveCSS('text-decoration-line', 'underline');
      await expect(link).toHaveCSS('font-weight', '500');
      const [linkColor, lineColor] = await link.evaluate((node) => [
        getComputedStyle(node).color,
        getComputedStyle(node.parentElement!).color,
      ]);
      expect(linkColor).not.toBe(lineColor);
    }

    const pull = prose.nth(1).locator('.pull');
    const pullStyle = await pull.evaluate((node) => {
      const style = getComputedStyle(node);
      const measure = document.createElement('span');
      measure.textContent = '0'.repeat(28);
      Object.assign(measure.style, {
        position: 'fixed',
        visibility: 'hidden',
        whiteSpace: 'nowrap',
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
      });
      measure.style.setProperty('font-stretch', style.getPropertyValue('font-stretch'));
      document.body.append(measure);
      const ch = measure.getBoundingClientRect().width;
      measure.remove();
      return {
        family: style.fontFamily,
        stretch: style.getPropertyValue('font-stretch'),
        weight: style.fontWeight,
        transform: style.textTransform,
        size: style.fontSize,
        max: parseFloat(style.maxWidth),
        ch,
        marginStart: style.marginBlockStart,
        marginEnd: style.marginBlockEnd,
      };
    });
    expect(pullStyle).toMatchObject({
      family: await section.locator('h2').evaluate((node) => getComputedStyle(node).fontFamily),
      stretch: '75%',
      weight: '700',
      transform: 'none',
      size: '24px',
      marginStart: '6px',
      marginEnd: '6px',
    });
    expect(Math.abs(pullStyle.max - pullStyle.ch)).toBeLessThanOrEqual(0.5);
    await expectPrettyWrap(page, pull);

    const headingStyles = await page.locator('main > section h2').evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return [
          style.fontFamily,
          style.getPropertyValue('font-stretch'),
          style.fontWeight,
          style.textTransform,
          style.textWrap,
        ].join('|');
      })
    );
    expect(headingStyles[3]).toBe(headingStyles[0]);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(route);
    await expect(page.locator('#anillo .pull')).toHaveCSS('font-size', '32px');
    await page.locator('#focus-visible .more a').last().focus();
    const codeExample = page.locator('#focus-visible');
    const cssTab = codeExample.getByRole('tab', { name: 'CSS', exact: true });
    const copyButton = codeExample.getByRole('button', {
      name: messages.codeExample.copy,
      exact: true,
    });
    await page.keyboard.press('Tab');
    await expect(cssTab).toHaveAttribute('aria-selected', 'true');
    await expect(cssTab).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(copyButton).toBeFocused();
    const codeContent = codeExample
      .getByRole('tabpanel', { name: 'CSS' })
      .locator('[data-slot="code-block-content"]');
    const firstLink = lines.nth(0).getByRole('link');
    await tabAcrossCodeContent(page, codeExample, codeContent, firstLink);
    const firstRingStyle = await firstLink.evaluate((node) => {
      const style = getComputedStyle(node);
      return [style.outlineStyle, style.outlineWidth, style.boxShadow];
    });
    expect(firstRingStyle.slice(0, 2)).toEqual(['solid', '2px']);
    expect(firstRingStyle[2]).toContain('2px');
    expect(firstRingStyle[2]).toContain('5px');
    await page.keyboard.press('Tab');
    const secondLink = lines.nth(1).getByRole('link');
    await expect(secondLink).toBeFocused();
    const secondRingStyle = await secondLink.evaluate((node) => {
      const style = getComputedStyle(node);
      return [style.outlineStyle, style.outlineWidth, style.boxShadow];
    });
    expect(secondRingStyle.slice(0, 2)).toEqual(['solid', '2px']);
    expect(secondRingStyle[2]).toContain('2px');
    expect(secondRingStyle[2]).toContain('5px');
    for (const width of [320, 375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
    }
  });

  const beyondRing = messages.sections.beyondRing;
  const beyondRingHref = 'https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html';

  test(`${route} renders the beyond-the-ring prose with an inline Tab key`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(route);
    const sections = page.locator('main > section');
    await expect(sections).toHaveCount(8);
    const section = sections.nth(4);
    await expect(section).toHaveAttribute('id', 'sin-anillo');
    await expect(section).toHaveAttribute('aria-labelledby', 'h-sin');
    await expect(section.locator('h2')).toHaveAttribute('id', 'h-sin');
    await expect(page.locator('#anillo + #sin-anillo')).toHaveCount(1);
    await expect(section.locator('.num')).toHaveText(beyondRing.number);
    await expect(section.locator('h2')).toHaveText(beyondRing.title);
    const paragraphs = section.locator('.intro p');
    await expect(paragraphs).toHaveText(beyondRing.paragraphs.map(plain));

    const key = paragraphs.nth(1).locator('kbd');
    await expect(key).toHaveCount(1);
    await expect(key).toHaveText('Tab');
    const keyFlow = await key.evaluate((node) => {
      const box = node.getBoundingClientRect();
      const adjacentText = [node.previousSibling, node.nextSibling].filter(
        (sibling): sibling is Text => sibling?.nodeType === Node.TEXT_NODE
      );
      const sharesLine = adjacentText.map((sibling) => {
        const range = document.createRange();
        range.selectNodeContents(sibling);
        return [...range.getClientRects()].some(
          (rect) => rect.top < box.bottom && rect.bottom > box.top
        );
      });
      const range = document.createRange();
      range.selectNodeContents(node.closest('p')!);
      const tops = [...range.getClientRects()]
        .map((rect) => rect.top)
        .sort((first, second) => first - second);
      const lineTops = tops.filter((top, index) => index === 0 || top - tops[index - 1]! > 2);
      return {
        display: getComputedStyle(node).display,
        marginInline: getComputedStyle(node).marginInline,
        sharesLine,
        lineCount: lineTops.length,
      };
    });
    expect(keyFlow.display).toBe('inline');
    expect(keyFlow.marginInline).toBe('0px');
    expect(keyFlow.sharesLine).toContain(true);
    expect(keyFlow.lineCount).toBeGreaterThan(1);

    const more = section.locator('.more');
    await expect(more).toHaveText(
      beyondRing.more.label + beyondRing.more.links.map(({ text }) => text).join('')
    );
    const link = more.getByRole('link');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAccessibleName(beyondRing.more.links[0]!.text);
    await expect(link).toHaveAttribute('href', beyondRingHref);
    await expect(link).toHaveCSS('text-decoration-line', 'underline');
    await expect(link).toHaveCSS('font-weight', '500');
    const [linkColor, lineColor] = await link.evaluate((node) => [
      getComputedStyle(node).color,
      getComputedStyle(node.parentElement!).color,
    ]);
    expect(linkColor).not.toBe(lineColor);

    const headingStyles = await page.locator('main > section h2').evaluateAll((nodes) =>
      nodes.map((node) => {
        const style = getComputedStyle(node);
        return [
          style.fontFamily,
          style.getPropertyValue('font-stretch'),
          style.fontWeight,
          style.textTransform,
          style.textWrap,
        ].join('|');
      })
    );
    expect(headingStyles[4]).toBe(headingStyles[0]);

    await page.locator('#anillo .more a').last().focus();
    const codeExample = page.locator('#anillo');
    const cssTab = codeExample.getByRole('tab', { name: 'CSS', exact: true });
    const copyButton = codeExample.getByRole('button', {
      name: route === '/en/' ? en.codeExample.copy : es.codeExample.copy,
      exact: true,
    });
    await page.keyboard.press('Tab');
    await expect(cssTab).toHaveAttribute('aria-selected', 'true');
    await expect(cssTab).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(copyButton).toBeFocused();
    const codeContent = codeExample
      .getByRole('tabpanel', { name: 'CSS' })
      .locator('[data-slot="code-block-content"]');
    await tabAcrossCodeContent(page, codeExample, codeContent, link);
    const focusRing = await link.evaluate((node) => {
      const style = getComputedStyle(node);
      return [style.outlineStyle, style.outlineWidth, style.boxShadow];
    });
    expect(focusRing.slice(0, 2)).toEqual(['solid', '2px']);
    expect(focusRing[2]).toContain('2px');
    expect(focusRing[2]).toContain('5px');

    for (const width of [320, 375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
    }
  });
}

for (const copy of phase12) {
  test(`${copy.route} renders section 06 with exact copy and links`, async ({ page }) => {
    await page.goto(copy.route);
    await expect(page.locator('main > section')).toHaveCount(8);
    const section = page.locator('#tapado');
    await expect(section).toHaveAttribute('aria-labelledby', 'h-tapado');
    await expect(section.locator('h2')).toHaveAttribute('id', 'h-tapado');
    await expect(section.locator('.num')).toHaveText(copy.obscured.number);
    await expect(section.locator('h2')).toHaveText(copy.obscured.title);
    await expect(section.locator('.intro p')).toHaveText(copy.obscured.paragraphs.map(plain));
    await expect(section.locator('code')).toHaveText(['scroll-padding', 'box-shadow']);
    await expect(section.locator('kbd')).toHaveText(['Tab']);
    await expectMoreLine(section.locator('.more'), copy.obscured.more);
  });

  test(`${copy.route} renders section 07 in source order with exact copy and links`, async ({
    page,
  }) => {
    await page.goto(copy.route);
    await expect(page.locator('main > section')).toHaveCount(8);
    const section = page.locator('#movimiento');
    await expect(section).toHaveAttribute('aria-labelledby', 'h-mov');
    await expect(section.locator('h2')).toHaveAttribute('id', 'h-mov');
    await expect(section.locator('.num')).toHaveText(copy.movement.number);
    await expect(section.locator('h2')).toHaveText(copy.movement.title);
    await expect(section.locator('.intro p')).toHaveText([
      plain(copy.movement.paragraphs[0]),
      plain(copy.movement.pull),
      plain(copy.movement.paragraphs[1]),
    ]);
    await expect(section.locator('.pull')).toHaveText(plain(copy.movement.pull));
    await expect(section.locator('code')).toHaveText([':focus-visible', 'tabindex="0"', '-1']);
    await expect(section.locator('kbd')).toHaveText(['Esc', 'Tab']);
    const childKinds = await section
      .locator(':scope > *')
      .evaluateAll((nodes) =>
        nodes.map((node) => ['head', 'intro', 'more'].find((name) => node.classList.contains(name)))
      );
    expect(childKinds).toEqual(['head', 'intro', 'intro', 'more']);
    await expectMoreLine(section.locator('.more'), copy.movement.more);
  });

  test(`${copy.route} renders only the section 08 heading`, async ({ page }) => {
    await page.goto(copy.route);
    const section = page.locator('#objeciones');
    await expect(section).toHaveAttribute('aria-labelledby', 'h-obj');
    await expect(section.locator('h2')).toHaveAttribute('id', 'h-obj');
    await expect(section.locator('.num')).toHaveText(copy.objections.number);
    await expect(section.locator('h2')).toHaveText(copy.objections.title);
    const childKinds = await section
      .locator(':scope > *')
      .evaluateAll((nodes) =>
        nodes.map((node) => ['head'].find((name) => node.classList.contains(name)))
      );
    expect(childKinds).toEqual(['head']);
  });
}

for (const [route] of routes)
  for (const theme of ['light', 'dark'] as const)
    test(`${route} prose text meets AA in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((value) => localStorage.setItem('foco-theme', value), theme);
      await page.goto(route);
      const tapadoText = page.locator('#tapado p, #tapado p code, #tapado .more, #tapado .more a');
      const movementText = page.locator(
        '#movimiento p, #movimiento p code, #movimiento .more, #movimiento .more a'
      );
      await expect(tapadoText).not.toHaveCount(0);
      await expect(movementText).not.toHaveCount(0);
      const ratios = await page
        .locator(
          '#focus-visible p, #focus-visible .more, #focus-visible .more a, #anillo p, #anillo p code, #anillo .more, #anillo .more a, #sin-anillo p, #sin-anillo .more, #sin-anillo .more a, #tapado p, #tapado p code, #tapado .more, #tapado .more a, #movimiento p, #movimiento p code, #movimiento .more, #movimiento .more a'
        )
        .evaluateAll((nodes) => {
          const luminance = (color: string) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d')!;
            context.fillStyle = color;
            context.fillRect(0, 0, 1, 1);
            const [r, g, b] = [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)].map(
              (channel) => {
                const value = channel / 255;
                return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
              }
            );
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          const ratio = (foreground: string, background: string) => {
            const [light, dark] = [luminance(foreground), luminance(background)].sort(
              (a, b) => b - a
            );
            return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
          };
          const effective = (element: Element) => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 1;
            const context = canvas.getContext('2d')!;
            const backgrounds: string[] = [];
            for (let node: Element | null = element; node; node = node.parentElement) {
              const color = getComputedStyle(node).backgroundColor;
              if (color !== 'rgba(0, 0, 0, 0)') backgrounds.push(color);
            }
            backgrounds.reverse().forEach((color) => {
              context.fillStyle = color;
              context.fillRect(0, 0, 1, 1);
            });
            const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
            return ratio(getComputedStyle(element).color, `rgb(${r} ${g} ${b})`);
          };
          return nodes.map(effective);
        });
      expect(ratios.length).toBeGreaterThan(0);
      expect(
        ratios.every((ratio) => ratio >= 4.5),
        JSON.stringify({ route, theme, ratios })
      ).toBe(true);
    });
