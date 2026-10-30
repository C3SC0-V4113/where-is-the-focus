import { expect, test } from '@playwright/test';

const content = {
  '/': {
    ids: ['01 · El planteamiento', '02 · Qué piden las reglas'],
    titles: ['El problema no es el foco.', 'Es el anillo que nadie diseñó.'],
    soft: 'Es el anillo que nadie diseñó.',
    headings: ['Lo que suele salir mal', 'Lo que funciona'],
    states: ['Cumple', 'Parcial', 'No cumple'],
    intro:
      'Casi todas las quejas sobre el foco tienen el mismo origen: el contorno por defecto del navegador aparece después de cada clic y no combina con nada. La reacción habitual es quitarlo con una línea de CSS. Eso resuelve la queja visual, pero deja sin orientación a quien usa teclado, lector de pantalla o un dispositivo de acceso.',
    lead: 'Hay una salida mejor, y casi siempre cuesta menos que la discusión: mostrar el foco solo cuando hace falta y diseñarlo como un estado más.',
    rules:
      'Ningún criterio de WCAG obliga a usar un recuadro azul. Piden tres cosas: que el foco se vea, que nada lo cubra y que se distinga de lo que lo rodea. La forma es una decisión de diseño.',
    lists: [
      [
        'Se elimina el contorno con outline: none y no se pone nada en su lugar.',
        'El indicador es solo un cambio de color suave, por debajo del contraste 3:1.',
        'Una cabecera fija o un banner tapa el elemento enfocado.',
        'Al cerrar un modal o borrar un elemento, el foco se pierde en el inicio de la página.',
      ],
      [
        ':focus-visible muestra el indicador con teclado y no después de un clic.',
        'Un doble anillo, claro y oscuro, mantiene el contraste sobre cualquier fondo.',
        'scroll-padding reserva el espacio de lo que está fijo.',
        'El foco se mueve a propósito: al título nuevo, al siguiente elemento o al botón de origen.',
      ],
    ],
    criterionTitles: [
      'Foco visible',
      'Foco no oculto',
      'Contraste no textual',
      'Apariencia del foco',
    ],
    criterionText: [
      'Todo lo que se opera con teclado tiene un indicador visible. Quitar el contorno sin sustituto es un fallo directo.',
      'Nuevo en 2.2. El elemento enfocado no puede quedar tapado por completo por cabeceras fijas, banners o chats.',
      'El indicador necesita 3:1 frente a los colores que tiene al lado.',
      'Opcional, pero es buena referencia: un área de al menos 2 px de perímetro y 3:1 entre el estado con foco y sin foco.',
    ],
    legend: 'Cómo leer los resultados de los laboratorios',
    legendText: [
      'cumple el criterio',
      'cumple AA pero no AAA, o solo en parte de la superficie',
      'falla un criterio AA',
    ],
    more: 'Las páginas «Understanding» del W3C explican cada criterio con ejemplos y técnicas. Están enlazadas en el título de cada tarjeta.',
  },
  '/en/': {
    ids: ['01 · The premise', '02 · What the rules ask for'],
    titles: ['The problem isn’t focus.', 'It’s the ring nobody designed.'],
    soft: 'It’s the ring nobody designed.',
    headings: ['What usually goes wrong', 'What works'],
    states: ['Pass', 'Partial', 'Fail'],
    intro:
      'Almost every complaint about focus has the same origin: the browser’s default outline appears after every click and matches nothing. The usual reaction is to remove it with one line of CSS. That solves the visual complaint, but leaves people who use a keyboard, a screen reader or an assistive device without orientation.',
    lead: 'There is a better way out, and it usually costs less than the argument: show focus only when it’s needed and design it as one more state.',
    rules:
      'No WCAG criterion requires a blue box. They ask for three things: that focus can be seen, that nothing covers it and that it stands out from what surrounds it. The shape is a design decision.',
    lists: [
      [
        'The outline is removed with outline: none and nothing replaces it.',
        'The indicator is only a subtle color change, below 3:1 contrast.',
        'A sticky header or a banner covers the focused element.',
        'When a modal closes or an item is deleted, focus is lost at the top of the page.',
      ],
      [
        ':focus-visible shows the indicator for keyboard users, not after a click.',
        'A double ring, light and dark, keeps contrast on any background.',
        'scroll-padding reserves the space taken by fixed elements.',
        'Focus moves on purpose: to the new heading, the next item or the button that opened something.',
      ],
    ],
    criterionTitles: [
      'Focus visible',
      'Focus not obscured',
      'Non-text contrast',
      'Focus appearance',
    ],
    criterionText: [
      'Everything operable by keyboard has a visible indicator. Removing the outline with no replacement is a direct failure.',
      'New in 2.2. The focused element can’t be fully hidden by sticky headers, banners or chat widgets.',
      'The indicator needs 3:1 against the colors next to it.',
      'Optional, but a good benchmark: an area of at least a 2 px perimeter and 3:1 between the focused and unfocused states.',
    ],
    legend: 'How to read the lab results',
    legendText: [
      'meets the criterion',
      'meets AA but not AAA, or only on part of the surface',
      'fails an AA criterion',
    ],
    more: 'The W3C “Understanding” pages explain each criterion with examples and techniques. They’re linked from each card’s title.',
  },
} as const;

const criteria = [
  ['2.4.7', 'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html'],
  ['2.4.11', 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html'],
  ['1.4.11', 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html'],
  ['2.4.13', 'https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html'],
];

for (const [route, copy] of Object.entries(content)) {
  test(`${route} renders the premise and rules sections`, async ({ page }) => {
    await page.goto(route);
    const sections = page.locator('main > section');
    await expect(sections).toHaveCount(2);
    await expect(sections.nth(0)).toHaveAttribute('id', 'planteamiento');
    await expect(sections.nth(1)).toHaveAttribute('id', 'reglas');
    await expect(sections.nth(0)).toHaveAttribute('aria-labelledby', 'premise-title');
    await expect(sections.nth(1)).toHaveAttribute('aria-labelledby', 'rules-title');
    await expect(sections.nth(0).locator('h2')).toHaveAttribute('id', 'premise-title');
    await expect(sections.nth(1).locator('h2')).toHaveAttribute('id', 'rules-title');
    await expect(sections.locator('.num')).toHaveText([...copy.ids]);
    await expect(sections.locator('h2')).toHaveText([
      `${copy.titles[0]} ${copy.titles[1]}`,
      route === '/' ? 'Visible, sin tapar y con contraste' : 'Visible, uncovered and with contrast',
    ]);
    await expect(sections.nth(0).locator('h2 .soft')).toHaveText(copy.soft);
    await expect(sections.nth(0).locator('.prose p')).toHaveText([copy.intro, copy.lead]);
    await expect(sections.locator('.split h3')).toHaveText([...copy.headings]);
    await expect(sections.locator('.split ol')).toHaveCount(2);
    for (const [index, list] of copy.lists.entries()) {
      const items = sections.nth(0).locator('.split ol').nth(index).locator('li');
      await expect(items).toHaveCount(4);
      await expect(items).toHaveText([...list]);
    }
    await expect(sections.nth(0).locator('.split ol code')).toHaveText([
      'outline: none',
      ':focus-visible',
      'scroll-padding',
    ]);
    await expect(sections.nth(1).locator('.prose')).toHaveText(copy.rules);
    await expect(sections.locator('.crit')).toHaveCount(4);
    for (const [id, href] of criteria) {
      const card = sections.locator('.crit').filter({
        has: sections.locator(`.id:text-is("${id}")`),
      });
      await expect(card).toHaveCount(1);
      await expect(card.locator('a')).toHaveAttribute('href', href);
      await expect(card.locator('.lvl')).toHaveText(id === '2.4.13' ? 'AAA' : 'AA');
      const index = criteria.findIndex(([criterion]) => criterion === id);
      await expect(card.locator('h3')).toHaveText(copy.criterionTitles[index]);
      await expect(card.locator('p')).toHaveText(copy.criterionText[index]);
    }
    const legend = page.getByRole('group', {
      name: copy.legend,
    });
    await expect(legend.locator('[data-slot="badge"]')).toHaveCount(3);
    await expect(legend.locator('[data-slot="badge"]')).toContainText([...copy.states]);
    await expect(legend.locator('p')).toHaveText(copy.legendText);
    await expect(sections.locator('.more')).toBeVisible();
    await expect(sections.locator('.more')).toHaveText(copy.more);
  });

  for (const width of [320, 375, 768, 1280]) {
    test(`${route} sections fit and adapt at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const layout = await page
        .locator('.split')
        .first()
        .evaluate((element) => ({
          columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          criteriaBorder: getComputedStyle(document.querySelector('.crit + .crit')!)
            .borderLeftWidth,
        }));
      expect(layout.overflow).toBeLessThanOrEqual(0);
      expect(layout.columns).toBe(width >= 760 ? 2 : 1);
      expect(layout.criteriaBorder).toBe(width >= 540 ? '1px' : '0px');
    });
  }

  test(`${route} keeps inline code in the text flow at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(route);
    const flow = await page.locator('#planteamiento .split li').evaluateAll((items) =>
      items.flatMap((item) => {
        const code = item.querySelector('code');
        if (!code) return [];
        const text = code.previousSibling ?? code.nextSibling;
        const textRange = document.createRange();
        textRange.selectNodeContents(text ?? code);
        const textRect = textRange.getBoundingClientRect();
        const codeRect = code.getBoundingClientRect();
        return [
          {
            codeText: code.textContent,
            inline: textRect.top < codeRect.bottom && textRect.bottom > codeRect.top,
            gap: Math.min(
              Math.abs(textRect.right - codeRect.left),
              Math.abs(codeRect.right - textRect.left)
            ),
            display: getComputedStyle(code).display,
          },
        ];
      })
    );
    expect(flow.map(({ codeText }) => codeText)).toEqual([
      'outline: none',
      ':focus-visible',
      'scroll-padding',
    ]);
    expect(
      flow.every(({ inline, gap, display }) => inline && gap <= 1 && display === 'inline')
    ).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ).toBeLessThanOrEqual(0);
  });
}

for (const [route, copy] of Object.entries(content)) {
  for (const theme of ['light', 'dark'] as const) {
    test(`${route} state and text colors meet AA in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((value) => localStorage.setItem('foco-theme', value), theme);
      await page.goto(route);
      const ratios = await page.evaluate(() => {
        const rgb = (color: string) => {
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d', { willReadFrequently: true })!;
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
        };
        const luminance = (color: string) => {
          const [red, green, blue] = rgb(color);
          return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        };
        const ratio = (foreground: string, background: string) => {
          const [first, second] = [luminance(foreground), luminance(background)].sort(
            (a, b) => b - a
          );
          return Number(((first + 0.05) / (second + 0.05)).toFixed(2));
        };
        const contrast = (element: Element) => {
          const context = document.createElement('canvas').getContext('2d')!;
          context.canvas.width = context.canvas.height = 1;
          const layers: string[] = [];
          let current: Element | null = element;
          while (current) {
            const background = getComputedStyle(current).backgroundColor;
            if (background !== 'rgba(0, 0, 0, 0)') layers.push(background);
            current = current.parentElement;
          }
          layers.reverse().forEach((background) => {
            context.fillStyle = background;
            context.fillRect(0, 0, 1, 1);
          });
          const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
          return ratio(getComputedStyle(element).color, `rgb(${red} ${green} ${blue})`);
        };
        return {
          status: [...document.querySelectorAll('[role="group"] [data-slot="badge"]')].map(
            (badge) => {
              const style = getComputedStyle(badge);
              return ratio(style.color, style.backgroundColor);
            }
          ),
          levels: [...document.querySelectorAll('.lvl')].map(contrast),
          brandText: contrast(document.querySelector('.good')!),
          brandCode: contrast(document.querySelector('.good code')!),
          criterionTitles: [...document.querySelectorAll('.crit h3')].map(contrast),
          criterionText: [...document.querySelectorAll('.crit p')].map(contrast),
        };
      });
      expect(ratios.status).toHaveLength(3);
      expect(ratios.levels).toHaveLength(4);
      expect(ratios.brandText).toBeGreaterThanOrEqual(4.5);
      expect(ratios.brandCode).toBeGreaterThanOrEqual(4.5);
      expect(ratios.status.every((value) => value >= 4.5)).toBe(true);
      expect(ratios.levels.every((value) => value >= 4.5)).toBe(true);
      expect(ratios.criterionTitles.every((value) => value >= 4.5)).toBe(true);
      expect(ratios.criterionText.every((value) => value >= 4.5)).toBe(true);
      await test.info().attach('computed-contrast-ratios.json', {
        body: JSON.stringify({ route, theme, ...ratios }, null, 2),
        contentType: 'application/json',
      });
      expect(copy.states).toHaveLength(3);
    });
  }
}
