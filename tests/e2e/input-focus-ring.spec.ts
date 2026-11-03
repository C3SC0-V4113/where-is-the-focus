import { expect, test, type Locator, type Page } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Input } from '../../src/components/ui/input';

function splitShadowLayers(boxShadow: string) {
  const layers: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < boxShadow.length; index += 1) {
    const character = boxShadow[index];
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (depth < 0) throw new Error('Unbalanced box-shadow color function.');
    if (character === ',' && depth === 0) {
      layers.push(boxShadow.slice(start, index).trim());
      start = index + 1;
    }
  }

  if (depth !== 0) throw new Error('Unbalanced box-shadow color function.');
  layers.push(boxShadow.slice(start).trim());
  return layers;
}

function tokenizeShadowLayer(layer: string) {
  const tokens: string[] = [];
  let depth = 0;
  let start = -1;

  for (let index = 0; index < layer.length; index += 1) {
    const character = layer[index];
    if (!/\s/.test(character ?? '') && start === -1) start = index;
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (depth < 0) throw new Error('Unbalanced box-shadow color function.');
    if (/\s/.test(character ?? '') && depth === 0 && start !== -1) {
      tokens.push(layer.slice(start, index));
      start = -1;
    }
  }

  if (depth !== 0) throw new Error('Unbalanced box-shadow color function.');
  if (start !== -1) tokens.push(layer.slice(start));
  return tokens;
}

function parseShadowLayer(layer: string) {
  const tokens = tokenizeShadowLayer(layer);
  const colorIndex = tokens.findIndex(
    (token) => /^[a-z-]+\(/i.test(token) || /^#[\da-f]/i.test(token)
  );
  if (colorIndex === -1) throw new Error(`Could not parse shadow color: ${layer}`);

  const [color] = tokens.splice(colorIndex, 1);
  const inset = tokens.includes('inset');
  const lengths = tokens.filter((token) => token !== 'inset');
  if (lengths.some((token) => !/^-?(?:\d+\.?\d*|\.\d+)px$/.test(token))) {
    throw new Error(`Could not parse shadow lengths: ${layer}`);
  }
  if (lengths.length !== 4) throw new Error(`Expected four shadow lengths: ${layer}`);

  return {
    color,
    offsetX: Number.parseFloat(lengths[0] ?? ''),
    offsetY: Number.parseFloat(lengths[1] ?? ''),
    blur: Number.parseFloat(lengths[2] ?? ''),
    spread: Number.parseFloat(lengths[3] ?? ''),
    inset,
  };
}

const inputMarkup = renderToStaticMarkup(
  createElement(Input, {
    type: 'email',
    'aria-label': 'Input focus probe',
    placeholder: '…',
  })
);

async function insertInput(page: Page) {
  await page.goto('/');
  await page.evaluate((markup) => {
    const main = document.querySelector('main');
    if (!main) {
      throw new Error('Main content is unavailable.');
    }
    main.insertAdjacentHTML('afterbegin', markup);
  }, inputMarkup);
}

async function focusFirstInputWithTab(page: Page, input: Locator) {
  for (let tab = 0; tab < 8; tab += 1) {
    await page.keyboard.press('Tab');
    if (await input.evaluate((element) => document.activeElement === element)) {
      return;
    }
  }

  throw new Error('Tab did not reach the inserted input.');
}

async function expectGlobalFocusRing(input: Locator) {
  const styles = await input.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    const computed = getComputedStyle(element);
    const colorProbe = document.createElement('span');
    document.body.append(colorProbe);
    const rootStyles = getComputedStyle(document.documentElement);
    colorProbe.style.color = rootStyles.getPropertyValue('--background').trim();
    const backgroundColor = getComputedStyle(colorProbe).color;
    colorProbe.style.color = rootStyles.getPropertyValue('--ring').trim();
    const ringColor = getComputedStyle(colorProbe).color;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is unavailable.');
    }
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const backgroundAlpha = context.getImageData(0, 0, 1, 1).data[3] / 255;
    context.fillStyle = ringColor;
    context.fillRect(0, 0, 1, 1);
    colorProbe.remove();

    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      outlineOffset: computed.outlineOffset,
      boxShadow: computed.boxShadow,
      backgroundColor,
      ringColor,
      backgroundAlpha,
      ringAlpha: context.getImageData(0, 0, 1, 1).data[3] / 255,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('2px');
  expect(styles.outlineColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.outlineOffset).toBe('2px');

  const layers = splitShadowLayers(styles.boxShadow).map(parseShadowLayer);
  expect(layers).toHaveLength(2);
  expect(styles.backgroundAlpha).toBe(1);
  expect(styles.ringAlpha).toBe(1);
  expect(layers[0]).toEqual({
    color: styles.backgroundColor,
    offsetX: 0,
    offsetY: 0,
    blur: 0,
    spread: 2,
    inset: false,
  });
  expect(layers[1]).toEqual({
    color: styles.ringColor,
    offsetX: 0,
    offsetY: 0,
    blur: 0,
    spread: 5,
    inset: false,
  });
}

async function expectForcedColorsFocusRing(input: Locator) {
  const styles = await input.evaluate(async (element) => {
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    const computed = getComputedStyle(element);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      boxShadow: computed.boxShadow,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('3px');
  expect(styles.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(styles.boxShadow).toBe('none');
}

for (const theme of ['light', 'dark'] as const) {
  test(`input uses the opaque global focus ring in ${theme} mode`, async ({ page }) => {
    await insertInput(page);
    await page
      .locator('html')
      .evaluate((element, isDark) => element.classList.toggle('dark', isDark), theme === 'dark');
    const input = page.getByRole('textbox', { name: 'Input focus probe' });
    await focusFirstInputWithTab(page, input);

    await expect(input).toBeFocused();
    expect(await input.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
    await expectGlobalFocusRing(input);
  });
}

test('input uses the system focus outline in forced colors', async ({ page }) => {
  await insertInput(page);
  await page.emulateMedia({ forcedColors: 'active' });
  const forcedColorsActive = await page.evaluate(
    () => window.matchMedia('(forced-colors: active)').matches
  );
  expect(forcedColorsActive).toBe(true);

  const input = page.getByRole('textbox', { name: 'Input focus probe' });
  await focusFirstInputWithTab(page, input);
  await expect(input).toBeFocused();
  expect(await input.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
  await expectForcedColorsFocusRing(input);
});
