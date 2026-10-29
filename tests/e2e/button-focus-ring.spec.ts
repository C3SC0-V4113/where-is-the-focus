import { expect, test, type Locator, type Page } from '@playwright/test';
import { cn } from 'cn';

import { buttonVariants } from '../../src/components/ui/button';

const variants = ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] as const;

async function insertButtons(page: Page) {
  await page.goto('/');
  await page.evaluate(
    (buttons) => {
      const main = document.querySelector('main');
      if (!main) {
        throw new Error('Main content is unavailable.');
      }

      const container = document.createElement('div');
      for (const { variant, className } of buttons) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.slot = 'button';
        button.className = className;
        button.textContent = `${variant} button`;
        container.append(button);
      }
      main.prepend(container);
    },
    variants.map((variant) => ({ variant, className: cn(buttonVariants({ variant })) }))
  );
}

async function focusFirstButtonWithTab(page: Page, button: Locator) {
  for (let tab = 0; tab < 8; tab += 1) {
    await page.keyboard.press('Tab');
    if (await button.evaluate((element) => document.activeElement === element)) {
      return;
    }
  }

  throw new Error('Tab did not reach the first inserted button.');
}

async function expectFocusRing(button: Locator) {
  const styles = await button.evaluate(async (element) => {
    // Button uses transition-all; measure the final state.
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
      boxShadow: computed.boxShadow,
      ringColor,
      ringAlpha: context.getImageData(0, 0, 1, 1).data[3] / 255,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('2px');
  expect(styles.outlineColor).toBe('rgba(0, 0, 0, 0)');

  const layers = styles.boxShadow.split(/,(?![^()]*\))/).map((layer) => layer.trim());
  expect(layers).toHaveLength(2);
  expect(styles.ringAlpha).toBe(1);
  expect(layers[1]?.startsWith(styles.ringColor)).toBe(true);
}

async function expectForcedColorsFocusRing(button: Locator) {
  const styles = await button.evaluate(async (element) => {
    // Button uses transition-all; measure the final state.
    await Promise.all(element.getAnimations().map((animation) => animation.finished));
    const computed = getComputedStyle(element);
    return {
      outlineStyle: computed.outlineStyle,
      outlineWidth: computed.outlineWidth,
      boxShadow: computed.boxShadow,
    };
  });

  expect(styles.outlineStyle).toBe('solid');
  expect(styles.outlineWidth).toBe('3px');
  expect(styles.boxShadow).toBe('none');
}

for (const theme of ['light', 'dark'] as const) {
  test(`button variants keep the opaque focus ring in ${theme} mode`, async ({ page }) => {
    await insertButtons(page);
    await page
      .locator('html')
      .evaluate((element, isDark) => element.classList.toggle('dark', isDark), theme === 'dark');
    const firstButton = page.getByRole('button', { name: `${variants[0]} button` });
    await focusFirstButtonWithTab(page, firstButton);

    for (const variant of variants) {
      const button = page.getByRole('button', { name: `${variant} button` });
      await expect(button).toBeFocused();
      await expectFocusRing(button);
      await page.keyboard.press('Tab');
    }
  });
}

test('button variants use the system focus outline in forced colors', async ({ page }) => {
  await insertButtons(page);
  await page.emulateMedia({ forcedColors: 'active' });
  const firstButton = page.getByRole('button', { name: `${variants[0]} button` });
  await focusFirstButtonWithTab(page, firstButton);

  for (const variant of variants) {
    const button = page.getByRole('button', { name: `${variant} button` });
    await expect(button).toBeFocused();
    await expectForcedColorsFocusRing(button);
    await page.keyboard.press('Tab');
  }
});
