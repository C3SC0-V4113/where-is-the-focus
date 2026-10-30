import { expect, test } from '@playwright/test';

import { en, es } from '../../src/i18n/messages';

const criteria = [
  ['2.4.7', 'AA', 'https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html'],
  ['2.4.11', 'AA', 'https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html'],
  ['1.4.11', 'AA', 'https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html'],
  ['2.4.13', 'AAA', 'https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html'],
] as const;
const split = (text: string) => text.split('|');
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const code = 'outline: none|:focus-visible|scroll-padding';
const copy = [
  { route: '/', messages: es },
  { route: '/en/', messages: en },
].map(({ route, messages }) => {
  const { premise, rules } = messages.sections;
  return {
    route,
    text: {
      nums: `${premise.number}|${rules.number}`,
      title: premise.title,
      soft: premise.soft,
      rule: rules.title,
      ruleIntro: rules.intro,
      intro: premise.intro,
      lead: premise.lead,
      headings: `${premise.failTitle}|${premise.goodTitle}`,
      lists: [premise.failures, premise.good].map((list) => list.replace(/`([^`]+)`/g, '$1')),
      code,
      titles: rules.criterionTitles,
      descriptions: rules.criterionText,
      legend: rules.legend,
      states: rules.stateLabels,
      stateText: rules.stateText,
      more: rules.more,
    },
  };
});

for (const { route, text } of copy) {
  test(`${route} renders localized sections, lists, criteria, and legend`, async ({ page }) => {
    await page.goto(route);
    const sections = page.locator('main > section');
    await expect(sections).toHaveCount(3);
    await expect(sections.nth(0)).toHaveAttribute('id', 'planteamiento');
    await expect(sections.nth(1)).toHaveAttribute('id', 'reglas');
    await expect(sections.nth(0)).toHaveAttribute('aria-labelledby', 'h-plan');
    await expect(sections.nth(1)).toHaveAttribute('aria-labelledby', 'h-reglas');
    await expect(sections.nth(0).locator('h2')).toHaveAttribute('id', 'h-plan');
    await expect(sections.nth(1).locator('h2')).toHaveAttribute('id', 'h-reglas');
    await expect(sections.nth(0).locator('.num')).toHaveText(split(text.nums)[0]!);
    await expect(sections.nth(1).locator('.num')).toHaveText(split(text.nums)[1]!);
    await expect(sections.nth(0).locator('h2')).toHaveText(`${text.title} ${text.soft}`);
    await expect(sections.nth(0).locator('.soft')).toHaveText(text.soft);
    await expect(sections.nth(1).locator('h2')).toHaveText(text.rule);
    await expect(sections.nth(0).locator('.intro p')).toHaveText([text.intro, text.lead]);
    await expect(sections.nth(1).locator('.intro')).toHaveText(text.ruleIntro);
    await expect(sections.locator('.split h3')).toHaveText(split(text.headings));
    const lists = sections.nth(0).locator('.split').getByRole('list');
    await expect(lists).toHaveCount(2);
    for (const [index, list] of text.lists.entries()) {
      const column = lists.nth(index);
      await expect.soft(column).toHaveAttribute('role', 'list');
      const items = column.getByRole('listitem');
      await expect(items).toHaveCount(4);
      await expect(items).toHaveText(split(list));
    }
    await expect(sections.nth(0).locator('.split ol code')).toHaveText(split(text.code));
    await expect(sections.locator('.crit')).toHaveCount(4);
    for (const [index, [id, level, href]] of criteria.entries()) {
      const card = sections.locator('.crit').nth(index);
      await expect(card.locator('.id')).toHaveText(new RegExp(`^${escape(id)}\\s*${level}$`), {
        useInnerText: true,
      });
      await expect(card.locator('.lvl')).toHaveText(level);
      await expect(card.locator('h3')).toHaveText(split(text.titles)[index]);
      await expect(card.locator('a')).toHaveAttribute('href', href);
      await expect(card.locator('p')).toHaveText(split(text.descriptions)[index]);
    }
    const legend = page.getByRole('group', { name: text.legend });
    await expect(legend.locator('[data-slot="badge"]')).toHaveCount(3);
    await expect(legend.locator('[data-slot="badge"]')).toContainText(split(text.states));
    await expect(legend.locator('.item')).toContainText(split(text.stateText));
    await expect(sections.nth(1).locator('.more')).toHaveText(text.more);

    const display = await sections.locator('h2').evaluateAll((headings) =>
      headings.map((heading) => {
        const style = getComputedStyle(heading);
        return [
          style.fontFamily.includes('Archivo Variable'),
          style.getPropertyValue('font-stretch'),
          style.fontWeight,
          style.textTransform,
          Number((parseFloat(style.lineHeight) / parseFloat(style.fontSize)).toFixed(2)),
          Number((parseFloat(style.letterSpacing) / parseFloat(style.fontSize)).toFixed(3)),
          style.textWrap,
        ];
      })
    );
    expect
      .soft(display)
      .toEqual(Array(3).fill([true, '66%', '850', 'uppercase', 0.96, -0.005, 'balance']));
    await expect.soft(sections.locator('.split li').first()).toHaveCSS('display', 'grid');
    await expect.soft(sections.locator('.split h3').first()).toHaveCSS('font-stretch', '75%');
    await expect.soft(sections.locator('.intro').first()).toHaveCSS('font-size', '18px');
    await expect.soft(sections.locator('.crit p').first()).toHaveCSS('font-size', '16px');
    await expect
      .soft(legend.locator('[data-slot="badge"]').first())
      .toHaveCSS('text-transform', 'uppercase');
    expect(
      await legend
        .getByText('◐', { exact: true })
        .evaluate((glyph) => glyph.getBoundingClientRect().width)
    ).toBeGreaterThan(0);
  });

  for (const width of [320, 375, 768, 1280]) {
    test(`${route} sections adapt and avoid horizontal overflow at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const layout = await page
        .locator('.split')
        .first()
        .evaluate((element) => ({
          columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
          border: getComputedStyle(document.querySelector('.crit + .crit')!).borderLeftWidth,
          overflow: document.documentElement.scrollWidth - innerWidth,
        }));
      expect(layout.columns).toBe(width >= 768 ? 2 : 1);
      expect(layout.border).toBe(width >= 640 ? '1px' : '0px');
      expect(layout.overflow).toBeLessThanOrEqual(0);
    });
  }

  test(`${route} level badges share the state badge shape`, async ({ page }) => {
    await page.goto(route);
    const shapes = await page
      .locator('.lvl, [role="group"] [data-slot="badge"]')
      .evaluateAll((badges) =>
        badges.map((badge) => {
          const { fontFamily, fontWeight, borderTopLeftRadius } = getComputedStyle(badge);
          return [fontFamily, fontWeight, borderTopLeftRadius];
        })
      );
    expect(shapes).toEqual(Array(7).fill(shapes[0]));
  });

  for (const width of [600, 760, 900]) {
    test(`${route} criteria separators follow the wrapped grid at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      const cards = await page.locator('.criteria').evaluate((grid) =>
        [...grid.children].map((card) => {
          const box = card.getBoundingClientRect();
          const rowStart = Math.round(box.left - grid.getBoundingClientRect().left) === 0;
          const inset = card.querySelector('h3')!.getBoundingClientRect().left - box.left;
          return [rowStart, getComputedStyle(card).borderLeftWidth, Math.round(inset)];
        })
      );
      expect(cards.filter(([rowStart]) => rowStart).length).toBeGreaterThanOrEqual(2);
      expect(cards).toEqual(
        cards.map(([rowStart]) => (rowStart ? [true, '0px', 0] : [false, '1px', 19]))
      );
    });
  }

  test(`${route} renders the three code markers as inline prose at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(route);
    const flow = await page.locator('#planteamiento .split li code').evaluateAll((codes) =>
      codes.map((code) => {
        const adjacentRects = [code.previousSibling, code.nextSibling].flatMap((node, index) => {
          if (node?.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) return [];
          const content = node.textContent;
          const offset = index === 0 ? content.search(/\S(?=\s*$)/) : content.search(/\S/);
          const range = document.createRange();
          range.setStart(node, offset);
          range.setEnd(node, offset + 1);
          return [range.getBoundingClientRect()];
        });
        const box = code.getBoundingClientRect();
        return {
          text: code.textContent,
          display: getComputedStyle(code).display,
          tag: code.parentElement?.tagName,
          sharesLine: adjacentRects.some((text) => text.top < box.bottom && text.bottom > box.top),
          margin: getComputedStyle(code).marginInline,
        };
      })
    );
    expect(flow.map(({ text }) => text)).toEqual(split(text.code));
    expect(
      flow.every(
        ({ display, sharesLine, margin, tag }) =>
          display === 'inline' && sharesLine && margin === '0px' && tag === 'SPAN'
      ),
      JSON.stringify(flow)
    ).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    ).toBeLessThanOrEqual(0);
  });
}

for (const { route } of copy)
  for (const theme of ['light', 'dark'] as const) {
    test(`${route} computed text and state colors meet AA in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((value) => localStorage.setItem('foco-theme', value), theme);
      await page.goto(route);
      const ratios = await page.evaluate(() => {
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
        return {
          states: [...document.querySelectorAll('[role="group"] [data-slot="badge"]')].map(
            (badge) => ratio(getComputedStyle(badge).color, getComputedStyle(badge).backgroundColor)
          ),
          levels: [...document.querySelectorAll('.lvl')].map(effective),
          brand: effective(document.querySelector('.good')!),
          brandCode: effective(document.querySelector('.good code')!),
          criteria: [...document.querySelectorAll('.crit h3, .crit p')].map(effective),
        };
      });
      expect(ratios.states).toHaveLength(3);
      expect(ratios.levels).toHaveLength(4);
      expect(
        [
          ...ratios.states,
          ...ratios.levels,
          ratios.brand,
          ratios.brandCode,
          ...ratios.criteria,
        ].every((value) => value >= 4.5),
        JSON.stringify({ route, theme, ...ratios })
      ).toBe(true);
    });
  }
