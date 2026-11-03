import { expect, test, type Locator, type Page } from '@playwright/test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { Input } from '../../src/components/ui/input';

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
    colorProbe.style.color = getComputedStyle(document.documentElement)
      .getPropertyValue('--ring')
      .trim();
    document.body.append(colorProbe);
    const ringColor = getComputedStyle(colorProbe).color;
    colorProbe.remove();

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is unavailable.');
    }
    context.fillStyle = ringColor;
    context.fillRect(0, 0, 1, 1);

    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      outlineColor: computed.outlineColor,
      outlineOffset: computed.outlineOffset,
      boxShadow: computed.boxShadow,
      ringColor,
      ringAlpha: context.getImageData(0, 0, 1, 1).data[3] / 255,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('2px');
  expect(styles.outlineColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.outlineOffset).toBe('2px');

  const layers = styles.boxShadow.split(/,(?![^()]*\))/).map((layer) => layer.trim());
  expect(layers).toHaveLength(2);
  expect(styles.ringAlpha).toBe(1);
  expect(layers[1]?.startsWith(styles.ringColor)).toBe(true);
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
