import { expect, test } from '@playwright/test';

function splitShadowLayers(boxShadow: string) {
  if (boxShadow === 'none') {
    return [];
  }

  const layers: string[] = [];
  let depth = 0;
  let start = 0;

  for (const [index, character] of [...boxShadow].entries()) {
    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
    } else if (character === ',' && depth === 0) {
      layers.push(boxShadow.slice(start, index).trim());
      start = index + 1;
    }
  }

  layers.push(boxShadow.slice(start).trim());
  return layers;
}

for (const locale of [
  { route: '/', label: 'Saltar al contenido' },
  { route: '/en/', label: 'Skip to content' },
]) {
  test(`skip link works at ${locale.route}`, async ({ page }) => {
    await page.goto(locale.route);
    await page.keyboard.press('Tab');

    const skipLink = page.getByRole('link', { name: locale.label });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    const focusStyles = await skipLink.evaluate((link) => {
      const computed = getComputedStyle(link);
      const colorProbe = document.createElement('span');
      colorProbe.style.color = getComputedStyle(document.documentElement)
        .getPropertyValue('--ring')
        .trim();
      document.body.append(colorProbe);
      const ringColor = getComputedStyle(colorProbe).color;
      colorProbe.remove();

      return {
        outlineStyle: computed.outlineStyle,
        outlineWidth: computed.outlineWidth,
        outlineColor: computed.outlineColor,
        boxShadow: computed.boxShadow,
        ringColor,
      };
    });
    expect(focusStyles.outlineStyle).toBe('solid');
    expect(focusStyles.outlineWidth).toBe('2px');
    expect(focusStyles.outlineColor).toBe('rgba(0, 0, 0, 0)');
    const shadowLayers = splitShadowLayers(focusStyles.boxShadow);
    expect(shadowLayers).toHaveLength(2);
    expect(shadowLayers[1]?.startsWith(focusStyles.ringColor)).toBe(true);

    expect(
      await skipLink.evaluate((link) => {
        const { x, y, width, height } = link.getBoundingClientRect();
        return (
          width > 0 &&
          height > 0 &&
          x >= 0 &&
          y >= 0 &&
          x + width <= innerWidth &&
          y + height <= innerHeight
        );
      })
    ).toBe(true);

    await page.keyboard.press('Enter');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('contenido');
  });
}
