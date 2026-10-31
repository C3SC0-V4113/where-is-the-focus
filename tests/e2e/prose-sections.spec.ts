import { expect, test } from '@playwright/test';

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
const plain = (text: string) => text.replace(/`([^`]+)`/g, '$1');

for (const [route, messages, hrefs] of routes) {
  const copy = messages.sections.focusVisible;

  test(`${route} renders the focus-visible prose and inline code`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(route);
    const sections = page.locator('main > section');
    await expect(sections).toHaveCount(4);
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
    expect(headingStyles.slice(2)).toEqual([headingStyles[0], headingStyles[0]]);

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

  const ringHref = 'https://www.sarasoueidan.com/blog/focus-indicators/';

  test(`${route} renders the ring section intro`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(route);
    const sections = page.locator('main > section');
    await expect(sections).toHaveCount(4);
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
    expect(childKinds).toEqual(['head', 'intro', 'more']);
    await expect(section.locator('.intro p')).toHaveText(ring.paragraphs);
    const line = section.locator('.more');
    await expect(line).toHaveText(ring.more.label + ring.more.links[0]!.text + ring.more.after);
    const link = line.getByRole('link');
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAccessibleName(ring.more.links[0]!.text);
    await expect(link).toHaveAttribute('href', ringHref);
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
    expect(headingStyles[3]).toBe(headingStyles[0]);

    await page.locator('#focus-visible .more a').last().focus();
    await page.keyboard.press('Tab');
    await expect(link).toBeFocused();
    const ringStyle = await link.evaluate((node) => {
      const style = getComputedStyle(node);
      return [style.outlineStyle, style.outlineWidth, style.boxShadow];
    });
    expect(ringStyle.slice(0, 2)).toEqual(['solid', '2px']);
    expect(ringStyle[2]).toContain('2px');
    expect(ringStyle[2]).toContain('5px');
    for (const width of [320, 375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
    }
  });
}

for (const [route] of routes)
  for (const theme of ['light', 'dark'] as const)
    test(`${route} prose text meets AA in ${theme} mode`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((value) => localStorage.setItem('foco-theme', value), theme);
      await page.goto(route);
      const ratios = await page
        .locator(
          '#focus-visible p, #focus-visible .more, #focus-visible .more a, #anillo p, #anillo .more, #anillo .more a'
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
