import { expect, test, type Page } from '@playwright/test';

type SrgbColor = readonly [number, number, number];

async function insertAndFocusProbe(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    const link = document.createElement('a');
    link.href = '#focus-ring-probe';
    link.textContent = 'Focus ring probe';
    document.querySelector('header')?.before(link);
  });

  const link = page.getByRole('link', { name: 'Focus ring probe' });
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  return link;
}

async function readThemeColors(page: Page) {
  return page.evaluate(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas 2D context is unavailable.');
    }

    const toSrgb = (token: string): SrgbColor => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = rootStyles.getPropertyValue(token).trim();
      context.fillRect(0, 0, 1, 1);
      const { data } = context.getImageData(0, 0, 1, 1);
      return [data[0], data[1], data[2]];
    };

    return {
      ring: toSrgb('--ring'),
      background: toSrgb('--background'),
      mutedForeground: toSrgb('--muted-foreground'),
      muted: toSrgb('--muted'),
    };
  });
}

function relativeLuminance([red, green, blue]: SrgbColor): number {
  const linearize = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * linearize(red) + 0.7152 * linearize(green) + 0.0722 * linearize(blue);
}

function contrastRatio(first: SrgbColor, second: SrgbColor): number {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

function countShadowLayers(boxShadow: string): number {
  if (boxShadow === 'none') {
    return 0;
  }

  let depth = 0;
  let layers = 1;

  for (const character of boxShadow) {
    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth -= 1;
    } else if (character === ',' && depth === 0) {
      layers += 1;
    }
  }

  return layers;
}

test('keyboard focus uses the double focus ring', async ({ page }) => {
  const link = await insertAndFocusProbe(page);
  const styles = await link.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      outlineOffset: computed.outlineOffset,
      boxShadow: computed.boxShadow,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('2px');
  expect(styles.outlineColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.outlineOffset).toBe('2px');
  expect(countShadowLayers(styles.boxShadow)).toBe(2);
  expect(styles.boxShadow).toContain('2px');
  expect(styles.boxShadow).toContain('5px');
});

test('keyboard focus uses a system outline in forced colors', async ({ page }) => {
  const link = await insertAndFocusProbe(page);
  await page.emulateMedia({ forcedColors: 'active' });

  const outline = await link.evaluate((element) => {
    const computed = getComputedStyle(element);
    return {
      style: computed.outlineStyle,
      width: computed.outlineWidth,
      color: computed.outlineColor,
      boxShadow: computed.boxShadow,
    };
  });

  expect(outline.style).toBe('solid');
  expect(outline.width).toBe('3px');
  expect(outline.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(outline.boxShadow).toBe('none');
});

test('focus and muted tokens meet contrast thresholds in light and dark themes', async ({
  page,
}) => {
  await page.goto('/');

  const light = await readThemeColors(page);
  const lightRingContrast = contrastRatio(light.ring, light.background);
  const lightMutedForegroundContrast = contrastRatio(light.mutedForeground, light.background);
  const lightMutedSurfaceContrast = contrastRatio(light.mutedForeground, light.muted);

  expect(
    lightRingContrast,
    `light ring/background measured ${lightRingContrast.toFixed(2)}:1`
  ).toBeGreaterThanOrEqual(3);
  expect(
    lightMutedForegroundContrast,
    `light muted-foreground/background measured ${lightMutedForegroundContrast.toFixed(2)}:1`
  ).toBeGreaterThanOrEqual(4.5);
  expect(
    lightMutedSurfaceContrast,
    `light muted-foreground/muted measured ${lightMutedSurfaceContrast.toFixed(2)}:1`
  ).toBeGreaterThanOrEqual(4.5);

  await page.locator('html').evaluate((element) => element.classList.add('dark'));
  const dark = await readThemeColors(page);
  const darkRingContrast = contrastRatio(dark.ring, dark.background);
  const darkMutedForegroundContrast = contrastRatio(dark.mutedForeground, dark.background);
  const darkMutedSurfaceContrast = contrastRatio(dark.mutedForeground, dark.muted);

  expect(
    darkRingContrast,
    `dark ring/background measured ${darkRingContrast.toFixed(2)}:1`
  ).toBeGreaterThanOrEqual(3);
  expect(
    darkMutedForegroundContrast,
    `dark muted-foreground/background measured ${darkMutedForegroundContrast.toFixed(2)}:1`
  ).toBeGreaterThanOrEqual(4.5);
  expect(
    darkMutedSurfaceContrast,
    `dark muted-foreground/muted measured ${darkMutedSurfaceContrast.toFixed(2)}:1`
  ).toBeGreaterThanOrEqual(4.5);
});
